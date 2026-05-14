from sqlalchemy import JSON, Column, DateTime, Integer, String, Text, func
from src.app.models.base import Base


class AiUsageLog(Base):
    """
    Persists every Gemini API call so Admin can monitor token spend (F4.1).

    Columns
    -------
    id              : Auto-increment PK
    feature_name    : Logical feature that triggered the call, e.g. "metadata", "tl_dr"
    model_used      : Gemini model string, e.g. "gemini-2.5-flash-lite"
    input_tokens    : Prompt token count from usage_metadata
    output_tokens   : Completion token count from usage_metadata
    total_tokens    : Derived sum (input + output)
    user_id         : Originating user's ID (from JWT sub claim); nullable for system calls
    input_hash      : Hash of normalized feature input; nullable for legacy/system calls
    output_json     : Structured AI output for feature-level analytics/debugging
    metadata_json   : Small feature-specific analytics payload
    interaction_status : User interaction state, e.g. generated/applied/dismissed/failed
    interacted_at   : Timestamp when user explicitly interacted with generated output
    status          : System execution status, e.g. success/failed
    error_message   : Error details for failed AI calls/logging
    created_at      : UTC timestamp, set automatically by the DB
    """

    __tablename__ = "ai_usage_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    feature_name = Column(String(64), nullable=False, index=True)
    model_used = Column(String(64), nullable=False)
    input_tokens = Column(Integer, nullable=False, default=0)
    output_tokens = Column(Integer, nullable=False, default=0)
    total_tokens = Column(Integer, nullable=False, default=0)
    user_id = Column(String(128), nullable=True, index=True)
    input_hash = Column(String(128), nullable=True, index=True)
    output_json = Column(JSON, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    interaction_status = Column(String(32), nullable=True, index=True)
    interacted_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(32), nullable=True, index=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
