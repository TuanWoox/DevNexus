from google import genai
from google.genai import types
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.exceptions import AIWorkerException
from src.app.schemas.moderation import ContentModerationResponse


class ModerationService:
    def __init__(self, client: genai.Client, db: AsyncSession):
        self._client = client
        self._db = db

    async def analyze_text(self, text_content: str, user_id: str) -> ContentModerationResponse:
        print(f"Sending to Gemini: {text_content}")
        if text_content.lower() == "crash test":
            raise AIWorkerException("Simulated AI Provider failure.", status_code=503)
        prompt = (
            f"Analyze the following user-submitted content for toxicity, harassment, "
            f"or inappropriate material in a professional software engineering learning network. "
            f"Content to analyze: '{text_content}'"
        )
        response = await self._client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ContentModerationResponse,
                temperature=0.1,
            ),
        )
        return ContentModerationResponse.model_validate_json(response.text)