from fastapi import APIRouter, Depends
from google import genai
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.security import CurrentUser, get_current_user
from src.app.infrastructure.database import get_db_session
from src.app.infrastructure.gemini import get_gemini_client
from src.app.schemas.taxonomy import TaxonomySuggestRequest, TaxonomySuggestResponse
from src.app.services.taxonomy_service import TaxonomyService


router = APIRouter(prefix="/ai/taxonomy", tags=["Taxonomy AI"])


def get_taxonomy_service(
    client: genai.Client = Depends(get_gemini_client),
    db: AsyncSession = Depends(get_db_session),
) -> TaxonomyService:
    return TaxonomyService(client=client, db=db)


@router.post(
    "/suggest-merges",
    response_model=TaxonomySuggestResponse,
    summary="Suggest canonical tag merges for taxonomy cleanup",
)
async def suggest_tag_merges(
    request: TaxonomySuggestRequest,
    service: TaxonomyService = Depends(get_taxonomy_service),
    current_user: CurrentUser = Depends(get_current_user),
) -> TaxonomySuggestResponse:
    """F4.4 — AI analyzes a tag list and returns groups that should be merged under one canonical name."""
    return await service.suggest_merges(request, user_id=current_user.user_id)
