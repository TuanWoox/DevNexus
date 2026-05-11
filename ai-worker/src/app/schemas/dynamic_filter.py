from typing import Literal, Optional

from pydantic import BaseModel, Field


class FilterMapping(BaseModel):
    prop: str = Field(..., description="Column name on the model (e.g. 'feature_name', 'user_id')")
    filter_type: str = Field(..., description="Data type hint: Text | Number | DateTime | Boolean")
    filter_operator: str = Field(
        ...,
        description="Operator string matching C# FilterOperator enums: Contains, IsEqualTo, IsGreaterThan, etc.",
    )
    value: Optional[str] = Field(
        default=None,
        description="Filter value as string; the builder casts to the correct type based on filter_type",
    )


class OrderMapping(BaseModel):
    sort: str = Field(..., description="Column name to sort by (e.g. 'created_at')")
    sort_dir: Literal["asc", "desc"] = Field(
        default="desc",
        description="Sort direction: 'asc' or 'desc'",
    )


class PageRequest(BaseModel):
    page_number: int = Field(default=1, ge=1, description="1-based page number")
    size: int = Field(default=20, ge=1, le=100, description="Page size; clamped server-side to 100")
    filters: list[FilterMapping] = Field(
        default_factory=list,
        description="Dynamic filter conditions, mirroring C# Page<T>.Filter[]",
    )
    orders: list[OrderMapping] = Field(
        default_factory=list,
        description="Sort conditions, mirroring C# Page<T>.Orders[]",
    )
