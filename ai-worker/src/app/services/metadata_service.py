import logging
import hashlib
import re

from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.ai_config import DEFAULT_GEMINI_MODEL
from src.app.core.exceptions import AIWorkerException
from src.app.schemas.content import MetadataRequest, MetadataResponse
from src.app.services.ai_helpers import handle_genai_error, truncate_input
from src.app.services.ai_usage_service import AiUsageService

logger = logging.getLogger(__name__)

_MODEL = DEFAULT_GEMINI_MODEL


class _MetadataGenerationResult(BaseModel):
    suggested_title: str = Field(..., description="AI-suggested title for the post")
    suggested_tags: list[str] = Field(..., description="AI-suggested list of relevant tags")


def _normalize_markdown_for_hash(markdown: str) -> str:
    """Normalize transport whitespace without changing meaningful Markdown indentation."""
    normalized = markdown.replace("\r\n", "\n").replace("\r", "\n").strip()
    return re.sub(r"\n{3,}", "\n\n", normalized)


def _hash_markdown(markdown: str) -> str:
    normalized = _normalize_markdown_for_hash(markdown)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


class MetadataService:
    """
    F2.1 — Given raw Markdown content, suggest a title and relevant tags.
    Calls Gemini 2.5 Flash with structured JSON output and logs token usage.
    """

    def __init__(self, client: genai.Client, db: AsyncSession) -> None:
        self._client = client
        self._usage = AiUsageService(db)

    async def suggest_metadata(
        self,
        request: MetadataRequest,
        user_id: str | None = None,
    ) -> MetadataResponse:
        logger.info("MetadataService: generating metadata (content_len=%d)", len(request.markdown_content))

        safe_content = truncate_input(request.markdown_content)
        prompt = (
            "You are a technical content editor for a software engineering learning platform. "
            "Analyze the following Markdown post and return:\n"
            "1. A concise, compelling title (max 150 characters)\n"
            "2. A list of 3-5 relevant technical tags (lowercase, no spaces, use hyphens)\n\n"
            "Post content:\n"
            f"```markdown\n{safe_content}\n```"
        )

        try:
            response = await self._client.aio.models.generate_content(
                model=_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=_MetadataGenerationResult,
                    temperature=0.3,
                ),
            )

            generated = _MetadataGenerationResult.model_validate_json(response.text)
            result = MetadataResponse(
                suggested_title=generated.suggested_title,
                suggested_tags=generated.suggested_tags,
            )

            usage_log_id = await self._usage.log_from_response(
                response=response,
                feature_name="content_metadata",
                model_used=_MODEL,
                user_id=user_id,
                input_hash=_hash_markdown(request.markdown_content),
                output_json={
                    "suggested_title": result.suggested_title,
                    "suggested_tags": result.suggested_tags,
                },
                metadata_json={
                    "suggestedTagCount": len(result.suggested_tags),
                    "bodyLength": len(request.markdown_content),
                },
                interaction_status="generated",
                status="success",
            )
            result.usage_log_id = usage_log_id

            return result

        except AIWorkerException:
            raise
        except Exception as exc:
            raise handle_genai_error("MetadataService.suggest_metadata", exc) from exc
