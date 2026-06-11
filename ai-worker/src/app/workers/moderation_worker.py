"""
moderation_worker.py
--------------------
BackgroundTask entry point that wraps ModerationService.proceed_content().

Usage (from router):
    background_tasks.add_task(
        run_moderation,
        target_id=..., text_content=...,
        image_bytes=..., image_mime_type=...,
        db=..., gemini_client=...,
        platform_core_url=settings.platform_core_service_url,
        internal_api_key=settings.internal_api_key,
    )
"""

import logging

from google import genai
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.schemas.moderation import ModerationDecision, ModerationMediaManifestItem
from src.app.services.moderation_service import ModerationService

logger = logging.getLogger(__name__)


async def run_moderation(
    *,
    moderation_version: int,
    content_hash: str,
    text_content: str,
    target_id: str,
    target_type: str = "Post",
    media_manifest: list[ModerationMediaManifestItem] | None = None,
    image_bytes: bytes | None,
    image_mime_type: str | None,
    db: AsyncSession,
    gemini_client: genai.Client,
    platform_core_url: str,
    internal_api_key: str = "",
) -> None:
    """
    Primary BackgroundTask function. Called by the router after returning 202.

    Return type is None — FastAPI BackgroundTasks discards any return value,
    so the service is responsible for persisting results and notifying the
    C# backend directly via _notify_platform().
    """
    service = ModerationService(
        gemini_client=gemini_client,
        db=db,
        platform_core_url=platform_core_url,
        internal_api_key=internal_api_key,
    )

    try:
        result = await service.proceed_content(
            target_type=target_type,
            target_id=target_id,
            moderation_version=moderation_version,
            content_hash=content_hash,
            text_content=text_content,
            media_manifest=media_manifest or [],
            image_bytes=image_bytes,
            image_mime_type=image_mime_type,
        )
        logger.info(
            "[Worker] Moderation complete: target=%s/%s status=%s tier=%d",
            target_type, target_id, result.final_status.value, result.tier_reached,
        )

    except Exception as exc:
        logger.exception("[Worker] Unhandled error for %s=%s: %s", target_type, target_id, exc)
        # Best-effort: notify C# to escalate rather than leaving post stuck in PROCESSING
        await service._notify_platform(
            moderation_version,
            content_hash,
            ModerationDecision.ESCALATE,
            target_type=target_type,
            target_id=target_id,
        )
