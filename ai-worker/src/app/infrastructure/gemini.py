from google import genai
from fastapi import Depends
from src.app.core.config import Settings, get_settings
from src.app.infrastructure.runtime_config import RuntimeConfigProvider

_runtime_config_provider: RuntimeConfigProvider | None = None


def get_runtime_config_provider(settings: Settings) -> RuntimeConfigProvider:
    global _runtime_config_provider
    if _runtime_config_provider is None:
        _runtime_config_provider = RuntimeConfigProvider(settings)
    return _runtime_config_provider


async def create_gemini_client(settings: Settings | None = None) -> genai.Client:
    resolved_settings = settings or get_settings()
    provider = get_runtime_config_provider(resolved_settings)
    api_key = await provider.get_gemini_api_key()
    return genai.Client(api_key=api_key)


# 1. Dependency Provider for the Gemini Client
async def get_gemini_client(settings: Settings = Depends(get_settings)) -> genai.Client:
    """
    Initializes and returns the Google GenAI Client using Redis runtime config first,
    then the environment key as a fallback.
    """
    return await create_gemini_client(settings)
