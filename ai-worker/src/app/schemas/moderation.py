from pydantic import BaseModel, Field

class ContentModerationRequest(BaseModel):
    content: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="The text snippet, code, or comment to be analyzed for toxicity."
    )
    user_id: str = Field(
        ...,
        description="The ID of the user who authored the content."
    )

class ContentModerationResponse(BaseModel):
    is_toxic: bool = Field(
        ..., 
        description="True if the AI flagged the content as inappropriate."
    )
    confidence_score: float = Field(
        ..., 
        ge=0.0, 
        le=1.0, 
        description="The AI's confidence score from 0.0 to 1.0."
    )

    flagged_categories: list[str] = Field(default_factory=list)