import logging
from google import genai
from google.genai import types

# 1. Import our strict Pydantic DTOs
from src.app.schemas.roadmaps import GenerateRoadmapRequest, GenerateRoadmapResponse
from src.app.core.exceptions import AIWorkerException
logger = logging.getLogger(__name__)
class RoadmapService:
    
    def __init__(self, client: genai.Client):
        self._client = client
        
    async def generate_roadmap(self, request: GenerateRoadmapRequest) -> GenerateRoadmapResponse:
        logger.info(f"Generating roadmap for topic: {request.topic}")
        
        prompt = (
            f"You are an expert Senior Software Engineer and technical mentor. "
            f"Create a highly structured, sequential learning roadmap for a {request.experience_level} "
            f"developer who wants to master '{request.topic}'. "
            f"Ensure the nodes represent a logical, step-by-step progression. "
            f"Crucially, all output (including titles, node labels, and descriptions) must be written "
            f"in professional English to maintain standard software engineering documentation practices."
        )
        
        try:
            response = await self._client.aio.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=GenerateRoadmapResponse,
                    temperature=0.2, 
                ),
            )
            
            return GenerateRoadmapResponse.model_validate_json(response.text)
            
        except Exception as e:
            raise AIWorkerException(f"Failed to generate roadmap: {str(e)}", status_code=502)