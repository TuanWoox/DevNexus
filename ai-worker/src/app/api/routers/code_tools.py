from fastapi import APIRouter, Depends
from google import genai
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.security import CurrentUser, get_current_user
from src.app.infrastructure.database import get_db_session
from src.app.infrastructure.gemini import get_gemini_client
from src.app.schemas.code_tools import (
    CodeExplainRequest,
    CodeExplainResponse,
    DiagramRequest,
    DiagramResponse,
    FirstResponderRequest,
    FirstResponderResponse,
)
from src.app.services.code_tools_service import CodeToolsService


router = APIRouter(prefix="/ai/code", tags=["Code Tools AI"])


def get_code_tools_service(
    client: genai.Client = Depends(get_gemini_client),
    db: AsyncSession = Depends(get_db_session),
) -> CodeToolsService:
    return CodeToolsService(client=client, db=db)


@router.post("/explain", response_model=CodeExplainResponse, summary="Explain code step-by-step")
async def explain_code(
    request: CodeExplainRequest,
    service: CodeToolsService = Depends(get_code_tools_service),
    current_user: CurrentUser = Depends(get_current_user),
) -> CodeExplainResponse:
    """AI explains the provided code snippet in natural language."""
    return await service.explain_code(request, user_id=current_user.user_id)


@router.post("/diagram", response_model=DiagramResponse, summary="Convert complex logic to Mermaid.js diagram")
async def generate_diagram(
    request: DiagramRequest,
    service: CodeToolsService = Depends(get_code_tools_service),
    current_user: CurrentUser = Depends(get_current_user),
) -> DiagramResponse:
    """AI generates a flowchart or sequence diagram from the provided code snippet."""
    return await service.generate_diagram(request, user_id=current_user.user_id)


@router.post("/first-responder", response_model=FirstResponderResponse, summary="Analyze error stacktrace")
async def analyze_error(
    request: FirstResponderRequest,
    service: CodeToolsService = Depends(get_code_tools_service),
    current_user: CurrentUser = Depends(get_current_user),
) -> FirstResponderResponse:
    """AI root-causes a stacktrace and suggests actionable fixes."""
    return await service.analyze_error(request, user_id=current_user.user_id)
