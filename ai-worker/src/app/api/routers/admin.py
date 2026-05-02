import logging

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.security import verify_internal_api_key
from src.app.infrastructure.database import get_db_session
from src.app.schemas.ai_usage_log import AiUsageLogPageResponse
from src.app.schemas.dynamic_filter import PageRequest
from src.app.services.ai_usage_service import AiUsageService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/internal", tags=["internal-admin"])


@router.post(
    "/ai-usage-logs/search",
    response_model=AiUsageLogPageResponse,
    dependencies=[Depends(verify_internal_api_key)],
)
async def search_ai_usage_logs(
    request: PageRequest,
    db: AsyncSession = Depends(get_db_session),
) -> AiUsageLogPageResponse:
    """
    Paged, filterable search of ai_usage_logs.
    Internal use only — requires X-Internal-Api-Key header.
    Accepts the same Page<T> JSON contract that C# sends for all paging operations.
    """
    service = AiUsageService(db)
    return await service.get_paged_logs(request)
