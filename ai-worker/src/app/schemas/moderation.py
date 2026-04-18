from enum import Enum

from typing import Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class ModerationStatus(str, Enum):
    SAFE = "safe"
    PENDING = "pending"       # flagged by T1 > 0.7, awaiting C# moderator
    IN_REVIEW = "in_review"   # escalated to human queue (Tier 3)
    PROCESSING = "processing"  # background task still running


class ModerationDecision(str, Enum):
    APPROVE = "approve"
    FLAG = "flag"
    ESCALATE = "escalate"


# ---------------------------------------------------------------------------
# Request
# ---------------------------------------------------------------------------

class ModerationSubmitRequest(BaseModel):
    """Body sent to the submit endpoint (used internally by the worker)."""
    post_id: str = Field(..., description="UUID of the post being moderated.")
    text_content: str = Field(..., min_length=1, max_length=50000)
    image_url: str | None = Field(None, description="Optional URL of the post image.")


# ---------------------------------------------------------------------------
# Tier result schemas
# ---------------------------------------------------------------------------

class TierOneResult(BaseModel):
    text_score: float = Field(..., ge=0.0, le=1.0, description="XLM-RoBERTa toxicity score.")
    image_score: float = Field(0.0, ge=0.0, le=1.0, description="CLIP inappropriateness score; 0 if no image.")
    combined_score: float = Field(..., ge=0.0, le=1.0, description="max(text_score, image_score).")
    flagged_concepts: list[str] = Field(default_factory=list)
    tier: Literal[1] = 1


class TierTwoResult(BaseModel):
    decision: ModerationDecision
    confidence: float = Field(..., ge=0.0, le=1.0)
    reasoning: str = Field(..., description="One-sentence rationale from the LLM.")
    tier: Literal[2] = 2


class TierThreeResult(BaseModel):
    queue_entry_id: str = Field(..., description="ID returned by C# mod-queue endpoint.")
    tier: Literal[3] = 3


# ---------------------------------------------------------------------------
# Final aggregate result
# ---------------------------------------------------------------------------

class ModerationTaskResult(BaseModel):
    post_id: str
    final_status: ModerationStatus
    decision: ModerationDecision
    tier_reached: int = Field(..., ge=1, le=3, description="Highest tier that ran.")
    tier_one: TierOneResult | None = None
    tier_two: TierTwoResult | None = None
    tier_three: TierThreeResult | None = None
    error: str | None = None


# ---------------------------------------------------------------------------
# HTTP response (immediate 202 to the caller)
# ---------------------------------------------------------------------------

class ModerationSubmitResponse(BaseModel):
    task_id: str = Field(..., description="Correlation ID to poll status later.")
    status: str = Field("queued", description="Always 'queued' on the initial 202.")
    message: str = Field("Content submitted for moderation. Processing in background.")