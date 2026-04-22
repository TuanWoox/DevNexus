# project_context.md — DevNexus AI Worker
## Unified Context Rules (Staff Engineer Edition)

> **Status:** DRAFT — Awaiting APPROVE  
> **Scope:** All files under `src/`  
> **Authority:** These rules take precedence over any individual file comment or previous convention.

---

## 1. Architecture & Layered Boundaries

### 1.1 Layer Responsibilities (STRICT — NO EXCEPTIONS)

| Layer | Directory | Responsibility | What It CANNOT Do |
|---|---|---|---|
| **Router** | `api/routers/` | Validate HTTP input → call Service → return Response | ❌ No business logic, ❌ No direct DB access, ❌ No AI calls |
| **Service** | `services/` | Orchestrate business logic, call external APIs (Gemini, httpx) | ❌ No HTTP framework imports (FastAPI, Request, Response) |
| **Schema** | `schemas/` | Pydantic v2 models for request/response contracts | ❌ No logic, ❌ No imports from services or infrastructure |
| **Infrastructure** | `infrastructure/` | Dependency providers (DB session, Gemini client, Model Manager) | ❌ No business logic |
| **Workers** | `workers/` | BackgroundTask entry points — thin wrappers around Services | ❌ No business logic beyond error logging + fallback notify |
| **Models** | `models/` | SQLAlchemy ORM table definitions | ❌ No Pydantic, ❌ No logic |
| **Core** | `core/` | Config, security, custom exceptions | ❌ No external API calls |

### 1.2 Dependency Direction (One-Way, No Circular Imports)

```
Router → Service → Infrastructure (Gemini, DB)
Router → Schema
Service → Schema
Service → Core (exceptions)
Worker → Service
Worker → Core (config, via function arg — NOT direct import)
```

> **Rule:** A lower layer (e.g., `infrastructure/`) MUST NEVER import from a higher layer (e.g., `services/`).

### 1.3 Gemini Client — No Re-initialization Per Request

- The `get_gemini_client()` DI provider creates a new `genai.Client` on every request. This is acceptable for the current scale — the client object is cheap to create (it is just an API key wrapper), so no caching is required.
- **NEVER** call `genai.Client(api_key=...)` directly inside a Service or Worker. Always inject via `Depends(get_gemini_client)`.

### 1.4 Module-Level Constants

All service-level constants (model IDs, thresholds, limits) MUST be declared as **module-level constants** at the top of the file, not inline in method calls.

```python
# CORRECT
_MODEL = "gemini-2.5-flash-lite"
_MAX_INPUT_CHARS = 15_000
_SAFE_THRESHOLD = 0.3

# WRONG — inline magic string
response = await client.aio.models.generate_content(model="gemini-2.5-flash-lite", ...)
```

---

## 2. Typing & Validation

### 2.1 Explicit Return Types on ALL Public Functions

Every `def` and `async def` in `services/`, `infrastructure/`, and `workers/` MUST declare an explicit return type.

```python
# CORRECT
async def suggest_metadata(self, request: MetadataRequest, user_id: str | None = None) -> MetadataResponse:

# WRONG — no return type
async def suggest_metadata(self, request, user_id=None):
```

### 2.2 No `from typing import Any`

`Any` is forbidden. Use specific types or `object` if truly unknown. Untyped imports must be removed from files that do not use them.

### 2.3 Pydantic v2 Standards

- All request/response models inherit from `pydantic.BaseModel`.
- Use `Field(...)` with `description=` on every field — these descriptions are read by Gemini as schema hints.
- Input constraints (`min_length`, `max_length`, `ge`, `le`) MUST be applied on the request schema, not in service code.
- **No mutable defaults**: use `default_factory=list` not `default=[]`.

```python
# CORRECT
suggested_tags: list[str] = Field(..., description="AI-suggested relevant tags")
flagged_concepts: list[str] = Field(default_factory=list)

# WRONG
suggested_tags: list = []
```

### 2.4 `__init__` Return Type

All `__init__` methods MUST explicitly declare `-> None`:

```python
def __init__(self, client: genai.Client, db: AsyncSession) -> None:
```

---

## 3. Async / Await Standards

### 3.1 `asyncio.to_thread()` for ALL Synchronous Blocking Calls

Any call to a synchronous library (e.g., `torch`, PyTorch inference, `PIL`) inside an `async` function MUST be wrapped with `asyncio.to_thread()` to avoid blocking the event loop.

```python
# CORRECT (already applied in moderation_service.py)
text_result = await asyncio.to_thread(model_manager.analyze_text, text_content)

# WRONG — blocks the event loop
text_result = model_manager.analyze_text(text_content)
```

### 3.2 `httpx.AsyncClient` — Always Use as Async Context Manager

Never reuse a single `httpx.AsyncClient` instance across requests. Always open/close per-call:

```python
# CORRECT
async with httpx.AsyncClient(timeout=10.0) as client:
    resp = await client.post(url, json=payload)
```

### 3.3 Top-Level `import httpx` — Move Out of Method Bodies

`import httpx` statements inside method bodies are legal Python but indicate the import was forgotten at the module level. All imports MUST be at the top of the file.

```python
# CORRECT — top of file
import httpx

# WRONG — buried in method body  
async def _run_tier_three(self, ...):
    import httpx  # violation
```

### 3.4 BackgroundTasks — Thin Wrappers Only

Worker functions in `workers/` accept injected dependencies (db, gemini_client) as parameters and delegate immediately to the Service layer. They MUST NOT receive `Depends()` — dependencies are resolved in the Router and passed as plain arguments.

### 3.5 Settings in Workers — Pass via Argument, Not Direct Import

Workers run in a BackgroundTask context (outside the DI graph). Configuration MUST be passed as a function argument resolved at call time by the router, not fetched directly in the worker body.

```python
# CORRECT — router resolves settings and passes as arg
background_tasks.add_task(run_moderation, ..., platform_core_url=settings.platform_core_service_url)

# WRONG — settings fetched inside worker
async def run_moderation(...):
    settings = get_settings()  # violation
```

> **Note:** This is a Phase 3 target for `moderation_worker.py`. Current implementation works but violates clean DI principles.

---

## 4. Error Handling

### 4.1 FORBIDDEN: Naked `except Exception` in Service Methods

Catching `Exception` generically and re-raising as a plain `AIWorkerException(502)` hides the root cause and prevents proper HTTP status code mapping.

```python
# STRICTLY FORBIDDEN in services
except Exception as exc:
    raise AIWorkerException(f"Service failed: {exc}", status_code=502) from exc
```

### 4.2 REQUIRED: Granular Gemini Error Handling via `_handle_genai_error`

The **canonical error handler** is `_handle_genai_error()` as implemented in `code_tools_service.py`. All services calling `client.aio.models.generate_content()` MUST adopt this pattern.

The helper maps errors as follows:

- `genai_errors.ClientError` → surface the upstream HTTP code (e.g., 429, 400)
- `genai_errors.ServerError` → 503
- Anything else → 500

**Re-raise guard**: Always re-raise `AIWorkerException` first before the generic handler:

```python
# CORRECT pattern
try:
    ...
except AIWorkerException:
    raise  # already handled, do not double-wrap
except Exception as exc:
    raise _handle_genai_error("ServiceName.method_name", exc) from exc
```

### 4.3 `except Exception` IS Allowed — In These Specific Places Only

| Location | Reason | Required Action |
|---|---|---|
| `AiUsageService.log_from_response()` | Logging must never crash the caller | Log with `logger.error()`, swallow silently |
| `ModerationService._notify_platform()` | Best-effort — platform notify failure is non-fatal | Log with `logger.warning()`, swallow |
| `ModerationService._run_tier_three()` | HTTP call to C# may fail | Log with `logger.error()`, swallow and return fallback |
| `moderation_worker.run_moderation()` | Top-level background safety net | Log with `logger.exception()`, attempt fallback escalate |

### 4.4 `AIWorkerException` Status Code Mapping

| Scenario | HTTP Status |
|---|---|
| Gemini ClientError (rate limit 429) | `429` — pass upstream code through |
| Gemini ClientError (safety 400) | `400` — pass upstream code through |
| Gemini ServerError (5xx) | `503` |
| Unexpected / unknown error | `500` |
| External service (C# backend) unavailable | Non-fatal, log only |

---

## 5. LLM / AI Standards

### 5.1 Input Truncation — MANDATORY for ALL User-Supplied Text

Every service method that sends user-supplied content to Gemini MUST truncate the input before building the prompt. This protects token quota and prevents unexpected behavior with oversized payloads.

**Standard helper** (copy from `code_tools_service.py`, or import from a shared util):

```python
_MAX_INPUT_CHARS = 15_000

def _truncate_input(text: str, max_chars: int = _MAX_INPUT_CHARS) -> str:
    """Keep head and tail, drop the middle for oversized inputs."""
    if len(text) <= max_chars:
        return text
    half = max_chars // 2
    return text[:half] + "\n\n...[TRUNCATED FOR LENGTH]...\n\n" + text[-half:]
```

**Which fields to truncate, per service:**

| Service | Field | Required |
|---|---|---|
| `MetadataService` | `request.markdown_content` | Yes |
| `SummaryService` | `request.content` | Yes |
| `TaxonomyService` | joined tags string | Low risk, skip if < 50 tags |
| `RoadmapService` | `request.topic` | No (short string) |
| `ModerationService._run_tier_two()` | `text_content` | Yes |
| `CodeToolsService` | `request.code`, `request.stacktrace` | Already done |

### 5.2 Structured Output — Always Use `response_schema`

All Gemini calls MUST use:
```python
config=types.GenerateContentConfig(
    response_mime_type="application/json",
    response_schema=SomePydanticModel,
    temperature=...,
)
```

Never parse raw unstructured text from Gemini. Use `Model.model_validate_json(response.text)`.

### 5.3 Mermaid Fence Sanitization — Diagram Service Only

Only `CodeToolsService.generate_diagram()` needs `_strip_mermaid_fences()`. Do not apply globally.

### 5.4 Model ID Constant — Single Source of Truth Per File

The model string `"gemini-2.5-flash-lite"` MUST be defined as `_MODEL` at module level in each service file. It MUST NOT appear as an inline string literal in method calls.

### 5.5 Usage Logging — After Successful Response, Before Return

`await self._usage.log_from_response(...)` MUST be called after every successful Gemini response, using keyword-only arguments. It MUST be placed after `model_validate_json()` but before `return result`.

---

## 6. Logging Standards

### 6.1 Logger Initialization

Every module that logs MUST declare its logger as the first module-level statement after imports:

```python
logger = logging.getLogger(__name__)
```

### 6.2 No f-strings in Logging Calls

Use `%s` formatting parameters — f-strings eagerly evaluate even when the log level is disabled:

```python
# CORRECT
logger.info("Generating roadmap for topic: %s", request.topic)

# WRONG — f-string is evaluated regardless of log level
logger.info(f"Generating roadmap for topic: {request.topic}")
```

### 6.3 Log Level Guidelines

| Level | Use case |
|---|---|
| `DEBUG` | Fine-grained diagnostics (token counts, scores) |
| `INFO` | Normal operation milestones (pipeline start/end, tier decisions) |
| `WARNING` | Recoverable issues (platform notify failed, model already loaded) |
| `ERROR` | Failures that are caught and handled (T3 queue insert failed) |
| `EXCEPTION` | Unhandled errors caught by worker safety net — includes traceback |

---

## 7. Code Style

### 7.1 Import Ordering

Follow the standard block order:
1. Standard library (`import logging`, `import asyncio`)
2. Third-party (`from google import genai`, `import httpx`)
3. Local (`from src.app.core.exceptions import AIWorkerException`)

Each block separated by one blank line.

### 7.2 Blank Lines Between Logical Sections

- 2 blank lines between top-level class and function definitions.
- 1 blank line between `router = APIRouter(...)` and the first route decorator.
- Section comments are encouraged inside long classes.

### 7.3 Docstrings

- Class docstrings: REQUIRED. One-line summary describing the service's purpose.
- Public method docstrings: REQUIRED if the method signature is non-obvious.
- Private methods (`_`): Optional, only if algorithm is complex.
- No autogenerated boilerplate: "This method does X" docstrings are noise.

---

## 8. Security

### 8.1 JWT on All Endpoints (Except `/health`)

Every route that handles user data MUST include:
```python
current_user: CurrentUser = Depends(get_current_user)
```

### 8.2 No Secrets in Source Code

`gemini_api_key`, `jwt_secret_key` are loaded exclusively from `.env` via `Settings`. Never hardcode keys in any source file.

### 8.3 File Upload Validation

For `UploadFile` in the moderation router:
- Use `image.content_type` (from the MIME header) — never use the deprecated `imghdr` library.
- Always read bytes with `await image.read()` before passing to BackgroundTask.

---

## 9. Files Reference Map

| File | Violations Present | Key Rules to Apply |
|---|---|---|
| `services/roadmap_service.py` | Naked except, f-string logging, missing `_MODEL` constant, missing `-> None` | R4.1, R4.2, R5.1, R6.2, R2.4 |
| `services/metadata_service.py` | Naked except, no input truncation | R4.1, R4.2, R5.1 |
| `services/summary_service.py` | Naked except, no input truncation | R4.1, R4.2, R5.1 |
| `services/taxonomy_service.py` | Naked except | R4.1, R4.2 |
| `services/moderation_service.py` | `import httpx` in method body, `_MODEL` inline string, missing input truncation in T2 | R3.3, R1.4, R5.1 |
| `services/ai_usage_service.py` | Unused `from typing import Any` import | R2.2 |
| `workers/moderation_worker.py` | `get_settings()` called inside worker | R3.5 |
| `infrastructure/database.py` | Bare `except Exception` in `get_db_session` | R4.3 (allowed, but add explicit log) |
| `api/routers/moderation.py` | Missing blank line between router def and first route | R7.2 |
| `api/routers/roadmaps.py` | Missing blank line after logger, crowded imports | R7.1 |
| `services/code_tools_service.py` | **GOLD STANDARD** — fully compliant | Reference implementation |

---

## 10. Refactoring Priority Order

```
P0 — Error Handling (R4.1, R4.2):   metadata_service, summary_service, taxonomy_service, roadmap_service
P1 — Input Truncation (R5.1):        metadata_service, summary_service, moderation_service (T2)
P2 — Import Hygiene (R3.3, R2.2):   moderation_service, ai_usage_service
P3 — Constants & Logging (R1.4, R6.2): roadmap_service, moderation_service
P4 — DI Purity (R3.5):              moderation_worker
P5 — Minor Style (R7.2, R2.4):      routers, __init__ return types
```
