from fastapi import APIRouter, Depends
from google import genai
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.security import CurrentUser, get_current_user
from src.app.infrastructure.database import get_db_session
from src.app.infrastructure.gemini import get_gemini_client
from src.app.schemas.roadmaps import GenerateRoadmapRequest, GenerateRoadmapResponse
from src.app.services.roadmap_service import RoadmapService


router = APIRouter(prefix="/ai/roadmaps", tags=["Roadmap AI"])


def get_roadmap_service(
    client: genai.Client = Depends(get_gemini_client),
    db: AsyncSession = Depends(get_db_session),
) -> RoadmapService:
    return RoadmapService(client=client, db=db)


@router.post("/generate", response_model=GenerateRoadmapResponse, summary="Generate a structured learning roadmap for a topic")
async def generate_roadmap(
    request: GenerateRoadmapRequest,
    service: RoadmapService = Depends(get_roadmap_service),
    current_user: CurrentUser = Depends(get_current_user),
) -> GenerateRoadmapResponse:
    """AI generates a sequential, skill-level-appropriate learning roadmap for a given software topic."""
    return await service.generate_roadmap(request, user_id=current_user.user_id)