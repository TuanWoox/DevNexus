import logging
from typing import Any

from google.genai.types import GenerateContentResponse
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.models.ai_usage_log import AiUsageLog

logger = logging.getLogger(__name__)


class AiUsageService:
    """
    Persists a usage log row after every Gemini API call.

    Usage
    -----
    Call `log_from_response()` right after receiving a Gemini response:

        response = await client.aio.models.generate_content(...)
        await usage_service.log_from_response(
            response=response,
            feature_name="metadata",
            model_used="gemini-2.5-flash",
            user_id=current_user.sub,
        )
    """

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def log_from_response(
        self,
        *,
        response: GenerateContentResponse,
        feature_name: str,
        model_used: str,
        user_id: str | None = None,
    ) -> None:
        """
        Extract token counts from `response.usage_metadata` and persist a log row.
        Failures are caught and logged — never raised — so they cannot break the caller.
        """
        try:
            meta = response.usage_metadata
            input_tokens = getattr(meta, "prompt_token_count", 0) or 0
            output_tokens = getattr(meta, "candidates_token_count", 0) or 0
            total_tokens = getattr(meta, "total_token_count", 0) or (input_tokens + output_tokens)

            log_entry = AiUsageLog(
                feature_name=feature_name,
                model_used=model_used,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                total_tokens=total_tokens,
                user_id=user_id,
            )
            self._db.add(log_entry)
            await self._db.commit()

            logger.debug(
                "AI usage logged: feature=%s model=%s tokens=%d/%d/%d user=%s",
                feature_name,
                model_used,
                input_tokens,
                output_tokens,
                total_tokens,
                user_id,
            )
        except Exception as exc:  # noqa: BLE001
            logger.error("Failed to log AI usage (non-fatal): %s", exc)
