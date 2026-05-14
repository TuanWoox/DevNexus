from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.security import CurrentUser, get_current_user
from src.app.infrastructure.database import get_db_session
from src.app.schemas.ai_usage_log import AiUsageInteractionUpdateRequest
from src.app.services.ai_usage_service import AiUsageService

router = APIRouter(prefix="/ai/usage-logs", tags=["AI Usage Logs"])


@router.patch("/{usage_log_id}/interaction", response_model=bool)
async def update_ai_usage_interaction(
    usage_log_id: int,
    request: AiUsageInteractionUpdateRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user: CurrentUser = Depends(get_current_user),
) -> bool:
    service = AiUsageService(db)
    return await service.update_interaction(
        usage_log_id=usage_log_id,
        request=request,
        user_id=current_user.user_id,
    )
