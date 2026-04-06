from fastapi import APIRouter, Depends
from google import genai

# 1. Import our Schemas, Service, and Infrastructure Dependency
from src.app.schemas.roadmaps import GenerateRoadmapRequest, GenerateRoadmapResponse
from src.app.services.roadmap_service import RoadmapService
from src.app.infrastructure.gemini import get_gemini_client
from src.app.core.security import get_current_user, CurrentUser


# 2. Instantiate the router
router = APIRouter(prefix="/roadmaps", tags=["AI Features"])

# 3. Dependency Provider for the Service
# Equivalent to builder.Services.AddScoped<RoadmapService>()
def get_roadmap_service(
    client: genai.Client = Depends(get_gemini_client)
) -> RoadmapService:
    return RoadmapService(client=client)

@router.post("/generate", response_model=GenerateRoadmapResponse)
async def generate_roadmap(
    request: GenerateRoadmapRequest,
    service: RoadmapService = Depends(get_roadmap_service),
    current_user: CurrentUser = Depends(get_current_user)
) -> GenerateRoadmapResponse:
    return await service.generate_roadmap(request)