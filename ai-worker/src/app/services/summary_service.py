import logging
import math

from google import genai
from google.genai import types
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.exceptions import AIWorkerException
from src.app.schemas.content import SummarizeRequest, SummarizeResponse
from src.app.services.ai_helpers import handle_genai_error, truncate_input
from src.app.services.ai_usage_service import AiUsageService

logger = logging.getLogger(__name__)

_MODEL = "gemini-2.5-flash"
# Average adult reading speed (words per minute)
_WORDS_PER_MINUTE = 200


class SummaryService:
    """
    F3.4 — Summarize long posts into 3-5 bullet points and estimate read time.
    Calls Gemini 2.5 Flash with structured JSON output and logs token usage.
    """

    def __init__(self, client: genai.Client, db: AsyncSession) -> None:
        self._client = client
        self._usage = AiUsageService(db)

    async def summarize(
        self,
        request: SummarizeRequest,
        user_id: str | None = None,
    ) -> SummarizeResponse:
        word_count = len(request.content.split())
        read_time_seconds = max(30, math.ceil(word_count / _WORDS_PER_MINUTE * 60))

        logger.info(
            "SummaryService: summarizing content (words=%d, est_read=%ds, lang=%s)",
            word_count,
            read_time_seconds,
            request.language,
        )

        lang_instruction = (
            "in Vietnamese (vi)"
            if request.language.lower() == "vi"
            else f"in {request.language}"
        )

        safe_content = truncate_input(request.content)
        prompt = (
            f"You are a senior technical writer. Read the following post and produce exactly 3 to 5 "
            f"concise bullet-point takeaways {lang_instruction}. "
            "Each point must start with an action verb and be at most 20 words.\n\n"
            f"Post content:\n{safe_content}"
        )

        try:
            response = await self._client.aio.models.generate_content(
                model=_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=SummarizeResponse,
                    temperature=0.2,
                ),
            )

            result = SummarizeResponse.model_validate_json(response.text)
            # Always use our calculated read time — more reliable than asking the LLM
            result = SummarizeResponse(
                summary_points=result.summary_points,
                estimated_read_time_seconds=read_time_seconds,
            )

            await self._usage.log_from_response(
                response=response,
                feature_name="tl_dr",
                model_used=_MODEL,
                user_id=user_id,
            )

            return result

        except AIWorkerException:
            raise
        except Exception as exc:
            raise handle_genai_error("SummaryService.summarize", exc) from exc
