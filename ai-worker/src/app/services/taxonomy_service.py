import logging

from google import genai
from google.genai import types
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.exceptions import AIWorkerException
from src.app.schemas.taxonomy import TaxonomySuggestRequest, TaxonomySuggestResponse
from src.app.services.ai_helpers import handle_genai_error
from src.app.services.ai_usage_service import AiUsageService

logger = logging.getLogger(__name__)

_MODEL = "gemini-2.5-flash-lite"


class TaxonomyService:
    """
    F4.4 — Analyze a list of tags and suggest canonical merges to clean up the taxonomy.
    Calls Gemini 2.5 Flash with structured JSON output and logs token usage.
    """

    def __init__(self, client: genai.Client, db: AsyncSession) -> None:
        self._client = client
        self._usage = AiUsageService(db)

    async def suggest_merges(
        self,
        request: TaxonomySuggestRequest,
        user_id: str | None = None,
    ) -> TaxonomySuggestResponse:
        logger.info("TaxonomyService: analyzing %d tags for merges", len(request.tags))

        tags_str = ", ".join(f'"{t}"' for t in request.tags)
        prompt = (
            "You are a technical content taxonomist for a software engineering platform. "
            "Analyze the following list of tags and identify groups that represent the same concept "
            "(e.g. 'ReactJS', 'react', 'React.js' → canonical: 'react'). "
            "Return only groups where at least 2 tags should be merged. "
            "Canonical names must be lowercase, use hyphens instead of spaces, and follow common developer conventions.\n\n"
            f"Tags to analyze: [{tags_str}]"
        )

        try:
            response = await self._client.aio.models.generate_content(
                model=_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=TaxonomySuggestResponse,
                    temperature=0.1,
                ),
            )

            result = TaxonomySuggestResponse.model_validate_json(response.text)

            await self._usage.log_from_response(
                response=response,
                feature_name="taxonomy_merge",
                model_used=_MODEL,
                user_id=user_id,
            )

            return result

        except AIWorkerException:
            raise
        except Exception as exc:
            raise handle_genai_error("TaxonomyService.suggest_merges", exc) from exc
