from pydantic import BaseModel, Field


class EmbeddingItemRequest(BaseModel):
    id: str = Field(..., min_length=1, description="Caller-owned content id.")
    text: str = Field(..., min_length=1, description="Text to embed for semantic recommendation ranking.")


class BatchEmbeddingRequest(BaseModel):
    items: list[EmbeddingItemRequest] = Field(
        ...,
        min_length=1,
        max_length=64,
        description="Content items to embed in one AI worker request.",
    )


class EmbeddingItemResponse(BaseModel):
    id: str = Field(..., description="Caller-owned content id.")
    embedding: list[float] = Field(..., description="Dense vector embedding for this content item.")


class BatchEmbeddingResponse(BaseModel):
    items: list[EmbeddingItemResponse] = Field(..., description="Embeddings mapped to caller-owned content ids.")
