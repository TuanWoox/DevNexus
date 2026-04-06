from fastapi import APIRouter, Depends
from src.app.core.config import Settings, get_settings
router = APIRouter(prefix="/health", tags=["System"])

@router.get("")
async def health_check(settings: Settings = Depends(get_settings)) -> dict[str, str]: 
    return {
        "status": "healthy", 
        "service": settings.project_name,
        "environment": settings.environment
    }