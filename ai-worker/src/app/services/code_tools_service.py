import logging

from google import genai
from google.genai import types
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.ai_config import DEFAULT_GEMINI_MODEL
from src.app.core.exceptions import AIWorkerException
from src.app.schemas.code_tools import (
    CodeExplainRequest,
    CodeExplainResponse,
    DiagramRequest,
    DiagramResponse,
    FirstResponderRequest,
    FirstResponderResponse,
)
from src.app.services.ai_helpers import handle_genai_error, truncate_input
from src.app.services.ai_usage_service import AiUsageService

logger = logging.getLogger(__name__)

_MODEL = DEFAULT_GEMINI_MODEL


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
        language = self._normalize_language(request.language)
        logger.info("CodeToolsService: explain_code for language %s", language)

        safe_code = truncate_input(request.code)
        language_instruction = (
            "Infer the programming language from the snippet before explaining it."
            if language == "auto"
            else f"The snippet is written in {language}."
        )

        prompt = (
            "You are an AI code helper inside a developer post detail page. "
            f"{language_instruction} Explain for a developer quickly reading the post. "
            "Use simple Vietnamese.\n\n"
            "Rules:\n"
            "- Keep it concise and scannable.\n"
            "- Do not over-explain basic syntax.\n"
            "- Do not produce long documentation.\n"
            "- Prefer practical understanding over exhaustive explanation.\n"
            "- Summary: 1-2 short sentences.\n"
            "- key_flow: maximum 5 bullets, main execution flow only.\n"
            "- watch_out: maximum 3 bullets, only relevant bugs, edge cases, missing persistence, security, or performance concerns.\n"
            "- details.important_details: maximum 4 short bullets.\n"
            "- details.suggested_improvements: maximum 3 short bullets.\n"
            "- details.concepts: maximum 5 short concepts.\n"
            "- Return JSON matching the response schema only.\n\n"
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
            raise handle_genai_error("CodeToolsService.explain_code", exc) from exc

    async def generate_diagram(
        self,
        request: DiagramRequest,
        user_id: str | None = None,
    ) -> DiagramResponse:
        diagram_type = self._normalize_diagram_type(request.diagram_type)
        language = self._normalize_language(request.language)
        logger.info("CodeToolsService: generate_diagram format %s", diagram_type)

        safe_code = truncate_input(request.code)
        diagram_instruction = (
            "Choose either a flowchart or sequence diagram, whichever best represents the code."
            if diagram_type == "auto"
            else f"Generate a {diagram_type} diagram."
        )
        language_instruction = (
            "Infer the programming language from the snippet."
            if language == "auto"
            else f"The snippet is written in {language}."
        )

        prompt = (
            f"Generate a Mermaid diagram for this code. {language_instruction} {diagram_instruction}\n\n"
            "Rules:\n"
            "- Create a high-level developer-friendly diagram, not a line-by-line trace.\n"
            "- Limit the diagram to 5-8 meaningful nodes.\n"
            "- Merge repetitive assignments or simple statements into a single node.\n"
            "- Prefer readability over completeness.\n"
            "- For loops, use one node that summarizes the repeated operation.\n"
            "- For conditionals, show only meaningful branches.\n"
            "- Avoid very tall diagrams unless the code truly requires it.\n"
            "- Use short node labels.\n"
            "- Return valid Mermaid only in mermaid_syntax.\n\n"
            "For flowchart:\n"
            "- Use flowchart TD unless there is a strong reason otherwise.\n"
            "- Keep node labels short.\n"
            "- Avoid unnecessary intermediate nodes.\n\n"
            "For sequence diagram:\n"
            "- Include only key actors/components.\n"
            "- Avoid one message per line of code.\n"
            "- Show the main interaction flow only.\n\n"
            "Return JSON containing mermaid_syntax and diagram_type. "
            "diagram_type MUST be either flowchart or sequence. mermaid_syntax MUST contain valid Mermaid.js syntax only, without markdown fences.\n\n"
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
            result.mermaid_syntax = self._strip_mermaid_fence(result.mermaid_syntax)

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
            raise handle_genai_error("CodeToolsService.generate_diagram", exc) from exc

    @staticmethod
    def _normalize_language(language: str | None) -> str:
        normalized = (language or "auto").strip().lower()
        return normalized or "auto"

    @staticmethod
    def _normalize_diagram_type(diagram_type: str | None) -> str:
        normalized = (diagram_type or "auto").strip().lower()
        return normalized if normalized in {"auto", "flowchart", "sequence"} else "auto"

    @staticmethod
    def _strip_mermaid_fence(value: str) -> str:
        lines = value.strip().splitlines()
        if not lines:
            return ""

        first_line = lines[0].strip().lower()
        if first_line in {"```", "```mermaid"}:
            lines = lines[1:]

        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]

        return "\n".join(lines).strip()

    async def generate_first_response(
        self,
        request: FirstResponderRequest,
        user_id: str | None = None,
    ) -> FirstResponderResponse:
        logger.info("CodeToolsService: generate_first_response for post %s", request.postId)

        safe_content = truncate_input(request.content)
        tags_str = ", ".join(request.tags) if request.tags else "None"

        prompt = (
            f"You are an expert Senior Software Engineer and DevOps specialist. "
            f"A user '{request.authorDisplayName}' has posted a Q&A question asking for help with a bug/error. "
            f"Analyze the following post title, tags, and content to identify the error, stacktrace, or bug. "
            f"If you find an error/bug, write a helpful first comment (in Vietnamese) providing a root cause analysis and suggesting actionable steps to fix it. "
            f"Format your response as a friendly, markdown-formatted comment.\n\n"
            f"CRITICAL RULES:\n"
            f"1. If there is a bug/error: Return success=true, your comment in generatedComment, and errorMessage=null.\n"
            f"2. If there is NO bug or error in the post: Return success=false, generatedComment=null, and errorMessage='No bug found'.\n\n"
            f"Post Title: {request.title}\n"
            f"Tags: {tags_str}\n"
            f"Content:\n```\n{safe_content}\n```"
        )

        try:
            response = await self._client.aio.models.generate_content(
                model=_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=FirstResponderResponse,
                    temperature=0.7,
                ),
            )

            result = FirstResponderResponse.model_validate_json(response.text)

            await self._usage.log_from_response(
                response=response,
                feature_name="first_responder",
                model_used=_MODEL,
                user_id=user_id,
            )

            return result

        except AIWorkerException:
            raise
        except Exception as exc:
            raise handle_genai_error("CodeToolsService.generate_first_response", exc) from exc
