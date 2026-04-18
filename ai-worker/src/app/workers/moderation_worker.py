"""
moderation_worker.py
--------------------
BackgroundTask entry point that wraps ModerationService.process_post().

Usage (from router):
    background_tasks.add_task(
        run_moderation,
        post_id=..., text_content=...,
        image_bytes=..., image_mime_type=...,
        db=..., gemini_client=...,
    )
"""

import logging

from google import genai
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.config import get_settings
from src.app.schemas.moderation import ModerationDecision, ModerationStatus, ModerationTaskResult
from src.app.services.moderation_service import ModerationService

logger = logging.getLogger(__name__)


async def run_moderation(
    *,
    post_id: str,
    text_content: str,
    image_bytes: bytes | None,
    image_mime_type: str | None,
    db: AsyncSession,
    gemini_client: genai.Client,
) -> None:
    """
    Primary BackgroundTask function. Called by the router after returning 202.

    Return type is None — FastAPI BackgroundTasks discards any return value,
    so the service is responsible for persisting results and notifying the
    C# backend directly via _notify_platform().
    """
    settings = get_settings()
    service = ModerationService(
        gemini_client=gemini_client,
        db=db,
        platform_core_url=settings.platform_core_service_url,
    )

    try:
        result = await service.process_post(
            post_id=post_id,
            text_content=text_content,
            image_bytes=image_bytes,
            image_mime_type=image_mime_type,
        )
        logger.info(
            "[Worker] Moderation complete: post=%s status=%s tier=%d",
            post_id, result.final_status.value, result.tier_reached,
        )

    except Exception as exc:
        logger.exception("[Worker] Unhandled error for post=%s: %s", post_id, exc)
        # Best-effort: notify C# to escalate rather than leaving post stuck in PROCESSING
        fallback_service = ModerationService(
            gemini_client=gemini_client,
            db=db,
            platform_core_url=settings.platform_core_service_url,
        )
        await fallback_service._notify_platform(post_id, ModerationDecision.ESCALATE)
