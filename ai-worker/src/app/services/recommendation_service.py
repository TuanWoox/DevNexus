import logging

from google import genai
from google.genai import types
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.exceptions import AIWorkerException
from src.app.schemas.recommendations import (
    BatchEmbeddingRequest,
    BatchEmbeddingResponse,
    EmbeddingItemResponse,
)
from src.app.services.ai_helpers import handle_genai_error, truncate_input
from src.app.services.ai_usage_service import AiUsageService

logger = logging.getLogger(__name__)

_MODEL = "gemini-embedding-001"

class RecommendationService:
    """AI helpers used by platform-core recommendation ranking."""

    def __init__(self, client: genai.Client, db: AsyncSession) -> None:
        self._client = client
        self._usage = AiUsageService(db)

    async def embed_content_batch(
        self,
        request: BatchEmbeddingRequest,
        user_id: str | None = None,
    ) -> BatchEmbeddingResponse:
        safe_items = [
            (item.id, truncate_input(item.text, max_chars=8_000))
            for item in request.items
        ]

        try:
            response = await self._client.aio.models.embed_content(
                model=_MODEL,
                contents=[text for _, text in safe_items],
                config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT"),
            )

            embeddings: list[EmbeddingItemResponse] = []
            for index, embedding in enumerate(response.embeddings or []):
                if index >= len(safe_items):
                    break

                content_id, _ = safe_items[index]
                embeddings.append(
                    EmbeddingItemResponse(
                        id=content_id,
                        embedding=[float(value) for value in embedding.values],
                    )
                )

            await self._usage.log_from_response(
                response=response,
                feature_name="recommendation_embedding_batch",
                model_used=_MODEL,
                user_id=user_id,
            )

            return BatchEmbeddingResponse(items=embeddings)

        except AIWorkerException:
            raise
        except Exception as exc:
            raise handle_genai_error("RecommendationService.embed_content_batch", exc) from exc
