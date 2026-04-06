from google import genai
from fastapi import Depends
from src.app.core.config import Settings, get_settings

# 1. Dependency Provider for the Gemini Client
def get_gemini_client(settings: Settings = Depends(get_settings)) -> genai.Client:
    """
    Initializes and returns the Google GenAI Client using the API key from our strictly typed Settings.
    """
    if not settings.gemini_api_key:
        raise ValueError("GEMINI_API_KEY is not set in the environment variables.")
        
    return genai.Client(api_key=settings.gemini_api_key)