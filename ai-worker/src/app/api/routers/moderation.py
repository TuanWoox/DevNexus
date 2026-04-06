from fastapi import APIRouter, Depends
from google import genai

from src.app.schemas.moderation import ContentModerationRequest, ContentModerationResponse
from src.app.services.moderation_service import ModerationService
from src.app.infrastructure.gemini import get_gemini_client

router = APIRouter(prefix="/moderation", tags=["AI Features"])

def get_moderation_service(client: genai.Client = Depends(get_gemini_client)) -> ModerationService:
    return ModerationService(client=client)

@router.post("/analyze", response_model=ContentModerationResponse)
async def analyze_content(
    request: ContentModerationRequest,
    service: ModerationService = Depends(get_moderation_service)
    ) -> ContentModerationResponse:
    
    
    return await service.analyze_text(request.content)