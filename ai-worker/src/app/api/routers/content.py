from fastapi import APIRouter, Depends
from google import genai
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.security import CurrentUser, get_current_user
from src.app.infrastructure.database import get_db_session
from src.app.infrastructure.gemini import get_gemini_client
from src.app.schemas.content import (
    MetadataRequest,
    MetadataResponse,
    SummarizeRequest,
    SummarizeResponse,
)
from src.app.services.metadata_service import MetadataService
from src.app.services.summary_service import SummaryService

router = APIRouter(prefix="/ai/content", tags=["Content AI"])


def get_metadata_service(
    client: genai.Client = Depends(get_gemini_client),
    db: AsyncSession = Depends(get_db_session),
) -> MetadataService:
    return MetadataService(client=client, db=db)


def get_summary_service(
    client: genai.Client = Depends(get_gemini_client),
    db: AsyncSession = Depends(get_db_session),
) -> SummaryService:
    return SummaryService(client=client, db=db)


@router.post("/metadata", response_model=MetadataResponse, summary="Suggest title & tags from Markdown content")
async def suggest_metadata(
    request: MetadataRequest,
    service: MetadataService = Depends(get_metadata_service),
    current_user: CurrentUser = Depends(get_current_user),
) -> MetadataResponse:
    """F2.1 — AI suggests a post title and relevant tags from its Markdown body."""
    return await service.suggest_metadata(request, user_id=current_user.user_id)


@router.post("/summarize", response_model=SummarizeResponse, summary="Generate TL;DR bullet-point summary")
async def summarize_content(
    request: SummarizeRequest,
    service: SummaryService = Depends(get_summary_service),
    current_user: CurrentUser = Depends(get_current_user),
) -> SummarizeResponse:
    """F3.4 — AI condenses long posts into 3-5 bullet points with estimated read time."""
    return await service.summarize(request, user_id=current_user.user_id)
