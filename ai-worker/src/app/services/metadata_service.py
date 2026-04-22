import logging

from google import genai
from google.genai import types
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.exceptions import AIWorkerException
from src.app.schemas.content import MetadataRequest, MetadataResponse
from src.app.services.ai_helpers import handle_genai_error, truncate_input
from src.app.services.ai_usage_service import AiUsageService

logger = logging.getLogger(__name__)

_MODEL = "gemini-2.5-flash-lite"


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
            "1. A concise, compelling title (max 80 characters)\n"
            "2. A list of 3-7 relevant technical tags (lowercase, no spaces, use hyphens)\n\n"
            "Post content:\n"
            f"```markdown\n{safe_content}\n```"
        )

        try:
            response = await self._client.aio.models.generate_content(
                model=_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=MetadataResponse,
                    temperature=0.3,
                ),
            )

            result = MetadataResponse.model_validate_json(response.text)

            await self._usage.log_from_response(
                response=response,
                feature_name="metadata",
                model_used=_MODEL,
                user_id=user_id,
            )

            return result

        except AIWorkerException:
            raise
        except Exception as exc:
            raise handle_genai_error("MetadataService.suggest_metadata", exc) from exc
