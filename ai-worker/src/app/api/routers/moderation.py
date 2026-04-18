from fastapi import APIRouter, Depends
from google import genai
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.security import CurrentUser, get_current_user
from src.app.infrastructure.database import get_db_session
from src.app.infrastructure.gemini import get_gemini_client
from src.app.schemas.moderation import ContentModerationRequest, ContentModerationResponse
from src.app.services.moderation_service import ModerationService

router = APIRouter(prefix="/ai/moderation", tags=["Moderation AI"])


def get_moderation_service(
    client: genai.Client = Depends(get_gemini_client),
    db: AsyncSession = Depends(get_db_session),
) -> ModerationService:
    return ModerationService(client=client, db=db)


@router.post("/analyze", response_model=ContentModerationResponse, summary="Analyze content for toxicity and policy violations")
async def analyze_content(
    request: ContentModerationRequest,
    service: ModerationService = Depends(get_moderation_service),
    current_user: CurrentUser = Depends(get_current_user),
) -> ContentModerationResponse:
    """AI analyzes user-submitted content for toxicity, harassment, or inappropriate material."""
    return await service.analyze_text(request.content, user_id=current_user.user_id)