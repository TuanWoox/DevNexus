import logging
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.security import verify_internal_api_key
from src.app.infrastructure.database import get_db_session
from src.app.schemas.ai_usage_log import AiUsageLogPageResponse, AiUsageSummaryResponse
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


@router.get(
    "/ai-usage-logs/summary",
    response_model=AiUsageSummaryResponse,
    dependencies=[Depends(verify_internal_api_key)],
)
async def get_ai_usage_summary(
    from_date: date = Query(..., alias="from", description="Inclusive start date (YYYY-MM-DD)"),
    to_date: date = Query(..., alias="to", description="Inclusive end date (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db_session),
) -> AiUsageSummaryResponse:
    """
    Aggregated AI usage summary for the given date range.
    Returns grand totals plus breakdowns by model, feature, and date (daily).
    Internal use only — requires X-Internal-Api-Key header.
    """
    service = AiUsageService(db)
    return await service.get_summary(from_date, to_date)
