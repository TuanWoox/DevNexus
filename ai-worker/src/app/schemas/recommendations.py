from pydantic import BaseModel, Field


class EmbeddingRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Text to embed for semantic recommendation ranking.")


class EmbeddingResponse(BaseModel):
    embedding: list[float] = Field(..., description="Dense vector embedding for the supplied text.")
