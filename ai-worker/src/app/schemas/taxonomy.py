from pydantic import BaseModel, Field


class MergeSuggestion(BaseModel):
    canonical: str = Field(..., description="The canonical (preferred) tag name")
    aliases: list[str] = Field(..., description="Duplicate/variant tags to merge into the canonical")


class TaxonomySuggestRequest(BaseModel):
    tags: list[str] = Field(..., min_length=2, description="List of tags to analyze for possible merges")


class TaxonomySuggestResponse(BaseModel):
    merge_suggestions: list[MergeSuggestion] = Field(
        ..., description="Groups of tags that should be unified under one canonical name"
    )
