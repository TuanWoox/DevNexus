import logging

from google import genai
from google.genai import types
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.exceptions import AIWorkerException
from src.app.schemas.roadmaps import GenerateRoadmapRequest, GenerateRoadmapResponse
from src.app.services.ai_helpers import handle_genai_error
from src.app.services.ai_usage_service import AiUsageService

logger = logging.getLogger(__name__)

_MODEL = "gemini-2.5-flash"


class RoadmapService:
    """Generate a structured learning roadmap for a given topic and experience level."""

    def __init__(self, client: genai.Client, db: AsyncSession) -> None:
        self._client = client
        self._usage = AiUsageService(db)

    async def generate_roadmap(
        self,
        request: GenerateRoadmapRequest,
        user_id: str | None = None,
    ) -> GenerateRoadmapResponse:
        logger.info("Generating roadmap for topic: %s", request.topic)

        prompt = (
            f"You are an expert Senior Software Engineer and technical mentor. "
            f"Create a highly structured, sequential learning roadmap for a {request.experience_level} "
            f"developer who wants to master '{request.topic}'. "
            f"Ensure the nodes represent a logical, step-by-step progression. "
            f"Crucially, all output (including titles, node labels, and descriptions) must be written "
            f"in professional English to maintain standard software engineering documentation practices."
        )

        try:
            response = await self._client.aio.models.generate_content(
                model=_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=GenerateRoadmapResponse,
                    temperature=0.2,
                ),
            )

            result = GenerateRoadmapResponse.model_validate_json(response.text)

            await self._usage.log_from_response(
                response=response,
                feature_name="roadmap",
                model_used=_MODEL,
                user_id=user_id,
            )

            return result

        except AIWorkerException:
            raise
        except Exception as exc:
            raise handle_genai_error("RoadmapService.generate_roadmap", exc) from exc
