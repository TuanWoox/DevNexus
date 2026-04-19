import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, UploadFile
from fastapi import status as http_status
from google import genai
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.config import get_settings
from src.app.core.security import CurrentUser, get_current_user
from src.app.infrastructure.database import get_db_session
from src.app.infrastructure.gemini import get_gemini_client
from src.app.schemas.moderation import ModerationSubmitResponse
from src.app.workers.moderation_worker import run_moderation

router = APIRouter(prefix="/ai/moderation", tags=["Moderation AI"])


@router.post(
    "/submit",
    response_model=ModerationSubmitResponse,
    status_code=http_status.HTTP_202_ACCEPTED,
    summary="Submit content for async 3-tier moderation",
    description=(
        "Accepts text content and an optional image, immediately returns 202 Accepted, "
        "then runs the 3-tier moderation pipeline (XLM-RoBERTa → Gemini → Human Queue) "
        "as a background task."
    ),
)
async def submit_content(
    background_tasks: BackgroundTasks,
    post_id: str = Form(..., description="UUID of the post being submitted."),
    text_content: str = Form(..., min_length=1, max_length=50000),
    image: UploadFile | None = File(None, description="Optional image file to moderate."),
    db: AsyncSession = Depends(get_db_session),
    gemini_client: genai.Client = Depends(get_gemini_client),
    current_user: CurrentUser = Depends(get_current_user),
) -> ModerationSubmitResponse:
    """
    Fire-and-forget endpoint.

    - Returns 202 immediately so the HTTP response doesn't block on ML inference.
    - The moderation pipeline runs via FastAPI BackgroundTasks.
    - Result is written to DB logs and can be polled or pushed via webhook later.
    """
    image_bytes: bytes | None = None
    image_mime_type: str | None = None
    if image:
        image_bytes = await image.read()
        image_mime_type = image.content_type  # e.g. "image/jpeg", "image/png"

    settings = get_settings()
    task_id = str(uuid.uuid4())

    background_tasks.add_task(
        run_moderation,
        post_id=post_id,
        text_content=text_content,
        image_bytes=image_bytes,
        image_mime_type=image_mime_type,
        db=db,
        gemini_client=gemini_client,
        platform_core_url=settings.platform_core_service_url,
        internal_api_key=settings.internal_api_key,
    )

    return ModerationSubmitResponse(
        task_id=task_id,
        status="queued",
        message="Content submitted for moderation. Processing in background.",
    )
