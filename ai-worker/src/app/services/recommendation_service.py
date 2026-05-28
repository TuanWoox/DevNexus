import logging

from google import genai
from google.genai import types
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.exceptions import AIWorkerException
from src.app.schemas.recommendations import EmbeddingRequest, EmbeddingResponse
from src.app.services.ai_helpers import handle_genai_error, truncate_input
from src.app.services.ai_usage_service import AiUsageService

logger = logging.getLogger(__name__)

_MODEL = "text-embedding-004"


class RecommendationService:
    """AI helpers used by platform-core recommendation ranking."""

    def __init__(self, client: genai.Client, db: AsyncSession) -> None:
        self._client = client
        self._usage = AiUsageService(db)

    async def embed_content(
        self,
        request: EmbeddingRequest,
        user_id: str | None = None,
    ) -> EmbeddingResponse:
        safe_text = truncate_input(request.text, max_chars=8_000)
        try:
            response = await self._client.aio.models.embed_content(
                model=_MODEL,
                contents=safe_text,
                config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
            )

            values = []
            if response.embeddings:
                values = [float(value) for value in response.embeddings[0].values]

            await self._usage.log_from_response(
                response=response,
                feature_name="recommendation_embedding",
                model_used=_MODEL,
                user_id=user_id,
            )

            return EmbeddingResponse(embedding=values)

        except AIWorkerException:
            raise
        except Exception as exc:
            raise handle_genai_error("RecommendationService.embed_content", exc) from exc
