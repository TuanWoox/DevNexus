from pydantic import BaseModel, Field

# 1. The Request DTO
class GenerateRoadmapRequest(BaseModel):
    topic: str = Field(
        ..., 
        min_length=2, 
        max_length=100, 
        description="The subject the user wants to learn (e.g., 'React', 'Docker')."
    )
    experience_level: str = Field(
        default="Beginner", 
        description="The user's current level: 'Beginner', 'Intermediate', or 'Advanced'."
    )

# 2. The Nested DTOs (These mirror React Flow's required data structure)
class RoadmapNode(BaseModel):
    id: str = Field(
        ..., 
        description="A unique, short, string identifier for this node (e.g., '1', 'node_react')."
    )
    label: str = Field(
        ..., 
        description="The short title of the concept to learn (e.g., 'Understanding Hooks')."
    )
    description: str = Field(
        ..., 
        description="A detailed 2-3 sentence explanation of what this concept is and why it is important. This will be shown in the UI when the user clicks the node."
    )
    resource_links: list[str] = Field(
        default_factory=list,
        description="A list of 1-3 valid URLs to official documentation or highly reputable tutorials for this specific concept."
    )

class RoadmapEdge(BaseModel):
    source: str = Field(
        ..., 
        description="The ID of the parent node."
    )
    target: str = Field(
        ..., 
        description="The ID of the child node that logically follows the parent."
    )

# 3. The Master Response DTO
class GenerateRoadmapResponse(BaseModel):
    title: str = Field(
        ..., 
        description="A catchy, professional title for this learning roadmap."
    )
    nodes: list[RoadmapNode] = Field(
        ..., 
        description="A comprehensive list of sequential steps to master the topic."
    )
    edges: list[RoadmapEdge] = Field(
        ..., 
        description="The lines connecting the nodes. Every node except the first must have an incoming edge."
    )