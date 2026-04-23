from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.infrastructure.database import get_db_session
from src.app.services.ai_usage_service import AiUsageService


def get_ai_usage_service(db: AsyncSession = Depends(get_db_session)) -> AiUsageService:
    """FastAPI dependency — injects AiUsageService with an async DB session."""
    return AiUsageService(db=db)
