import logging

from google.genai import errors as genai_errors

from src.app.core.exceptions import AIWorkerException

logger = logging.getLogger(__name__)

_MAX_INPUT_CHARS = 15_000


def truncate_input(text: str, max_chars: int = _MAX_INPUT_CHARS) -> str:
    """Keep head and tail, drop the middle for oversized inputs."""
    if len(text) <= max_chars:
        return text
    half = max_chars // 2
    return text[:half] + "\n\n...[TRUNCATED FOR LENGTH]...\n\n" + text[-half:]


def handle_genai_error(context: str, exc: Exception) -> AIWorkerException:
    """Map google.genai SDK errors to meaningful HTTP status codes."""
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
