from fastapi import APIRouter, Depends
from google import genai
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.security import CurrentUser, get_current_user
from src.app.infrastructure.database import get_db_session
from src.app.infrastructure.gemini import get_gemini_client
from src.app.schemas.recommendations import EmbeddingRequest, EmbeddingResponse
from src.app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/ai/recommendations", tags=["Recommendations AI"])


def get_recommendation_service(
    client: genai.Client = Depends(get_gemini_client),
    db: AsyncSession = Depends(get_db_session),
) -> RecommendationService:
    return RecommendationService(client=client, db=db)


@router.post("/embedding", response_model=EmbeddingResponse, summary="Generate semantic embedding")
async def generate_embedding(
    request: EmbeddingRequest,
    service: RecommendationService = Depends(get_recommendation_service),
    current_user: CurrentUser = Depends(get_current_user),
) -> EmbeddingResponse:
    return await service.embed_content(request, user_id=current_user.user_id)
