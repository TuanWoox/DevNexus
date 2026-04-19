import logging

from google import genai
from google.genai import errors as genai_errors
from google.genai import types
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.exceptions import AIWorkerException
from src.app.schemas.code_tools import (
    CodeExplainRequest,
    CodeExplainResponse,
    DiagramRequest,
    DiagramResponse,
    FirstResponderRequest,
    FirstResponderResponse,
)
from src.app.services.ai_usage_service import AiUsageService

logger = logging.getLogger(__name__)

_MODEL = "gemini-2.5-flash"
_MAX_INPUT_CHARS = 15_000


def _truncate_input(text: str, max_chars: int = _MAX_INPUT_CHARS) -> str:
    """Keep the head and tail of large inputs, drop the middle to protect RAM and token quota."""
    if len(text) <= max_chars:
        return text
    half = max_chars // 2
    return text[:half] + "\n\n...[TRUNCATED FOR LENGTH]...\n\n" + text[-half:]


def _strip_mermaid_fences(text: str) -> str:
    """Remove markdown code fences that Gemini occasionally injects inside JSON string fields."""
    return (
        text.replace("```mermaid\n", "")
            .replace("```mermaid", "")
            .replace("```\n", "")
            .replace("```", "")
            .strip()
    )


def _handle_genai_error(context: str, exc: Exception) -> AIWorkerException:
    """
    Map google.genai SDK errors to meaningful HTTP status codes.

    - ClientError (4xx): surface the upstream code directly.
    - ServerError (5xx): treat as 503 – upstream is down, not our fault.
    - Anything else:     generic 500.
    """
    if isinstance(exc, genai_errors.ClientError):
        upstream_code = getattr(exc, "code", 400)
        logger.warning("%s – Gemini ClientError %s: %s", context, upstream_code, exc)
        return AIWorkerException(
            f"{context}: Gemini rejected the request (code={upstream_code}): {exc}",
            status_code=upstream_code,
        )

    if isinstance(exc, genai_errors.ServerError):
        logger.error("%s – Gemini ServerError: %s", context, exc)
        return AIWorkerException(
            f"{context}: Gemini API is temporarily unavailable: {exc}",
            status_code=503,
        )

    logger.exception("%s – unexpected error: %s", context, exc)
    return AIWorkerException(
        f"{context}: unexpected error: {exc}",
        status_code=500,
    )


class CodeToolsService:
    """
    Phase 4 — Code Intelligence Services
    Contains: Code Explainer (F3.2), Code-to-Diagram (F3.2), First-Responder (F3.1)
    """

    def __init__(self, client: genai.Client, db: AsyncSession) -> None:
        self._client = client
        self._usage = AiUsageService(db)

    async def explain_code(
        self,
        request: CodeExplainRequest,
        user_id: str | None = None,
    ) -> CodeExplainResponse:
        logger.info("CodeToolsService: explain_code for language %s", request.language)

        safe_code = _truncate_input(request.code)

        prompt = (
            f"You are an expert Senior Software Engineer and technical mentor. "
            f"Explain the following {request.language} code step-by-step in simple Vietnamese for a junior developer.\n\n"
            f"Code:\n```\n{safe_code}\n```"
        )

        try:
            response = await self._client.aio.models.generate_content(
                model=_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=CodeExplainResponse,
                    temperature=0.2,
                ),
            )

            result = CodeExplainResponse.model_validate_json(response.text)

            await self._usage.log_from_response(
                response=response,
                feature_name="code_explain",
                model_used=_MODEL,
                user_id=user_id,
            )

            return result

        except AIWorkerException:
            raise
        except Exception as exc:
            raise _handle_genai_error("CodeToolsService.explain_code", exc) from exc

    async def generate_diagram(
        self,
        request: DiagramRequest,
        user_id: str | None = None,
    ) -> DiagramResponse:
        logger.info("CodeToolsService: generate_diagram format %s", request.diagram_type)

        safe_code = _truncate_input(request.code)

        prompt = (
            f"You are an expert software architect. Analyze the the provided code and generate a {request.diagram_type} "
            f"representing its logic using Mermaid.js syntax.\n"
            f"Output MUST be valid Mermaid.js syntax ONLY. Do not wrap it in markdown block. Just pure mermaid code.\n\n"
            f"Code:\n```\n{safe_code}\n```"
        )

        try:
            response = await self._client.aio.models.generate_content(
                model=_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=DiagramResponse,
                    temperature=0.1,
                ),
            )

            result = DiagramResponse.model_validate_json(response.text)

            # Sanitize: Gemini occasionally wraps the syntax in markdown fences even when asked not to.
            result.mermaid_syntax = _strip_mermaid_fences(result.mermaid_syntax)

            await self._usage.log_from_response(
                response=response,
                feature_name="code_diagram",
                model_used=_MODEL,
                user_id=user_id,
            )

            return result

        except AIWorkerException:
            raise
        except Exception as exc:
            raise _handle_genai_error("CodeToolsService.generate_diagram", exc) from exc

    async def analyze_error(
        self,
        request: FirstResponderRequest,
        user_id: str | None = None,
    ) -> FirstResponderResponse:
        logger.info("CodeToolsService: analyze_error for language %s", request.language)

        safe_stacktrace = _truncate_input(request.stacktrace)

        prompt = (
            f"You are an expert DevOps and Senior Backend Engineer. Analyze the following {request.language} stacktrace.\n"
            f"Provide a root cause in ONE sentence. Suggest up to 3 highly actionable steps to fix the issue. "
            f"If applicable, link to official documentation.\n\n"
            f"Stacktrace:\n```\n{safe_stacktrace}\n```"
        )

        try:
            response = await self._client.aio.models.generate_content(
                model=_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=FirstResponderResponse,
                    temperature=0.2,
                ),
            )

            result = FirstResponderResponse.model_validate_json(response.text)

            await self._usage.log_from_response(
                response=response,
                feature_name="analyze_error",
                model_used=_MODEL,
                user_id=user_id,
            )

            return result

        except AIWorkerException:
            raise
        except Exception as exc:
            raise _handle_genai_error("CodeToolsService.analyze_error", exc) from exc
