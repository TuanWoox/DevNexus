import asyncio
import logging

import httpx
from google import genai
from google.genai import types
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.core.ai_config import DEFAULT_GEMINI_MODEL
from src.app.core.exceptions import AIWorkerException
from src.app.infrastructure.model_manager import AIModelManager
from pydantic import BaseModel, Field

from src.app.schemas.moderation import (
    ModerationDecision,
    ModerationStatus,
    ModerationTaskResult,
    TierOneResult,
    TierThreeResult,
    TierTwoResult,
)
from src.app.services.ai_usage_service import AiUsageService

logger = logging.getLogger(__name__)

# -----------------------------------------------------------------------
# Tier boundaries
# -----------------------------------------------------------------------
_SAFE_THRESHOLD = 0.2
_TOXIC_THRESHOLD = 0.6
_T2_CONFIDENCE_THRESHOLD = 0.8

_MODEL = DEFAULT_GEMINI_MODEL
_MAX_INPUT_CHARS = 15_000


# Gemini's response_schema must not contain Literal[int] — use a flat model
class _GeminiT2Response(BaseModel):
    decision: ModerationDecision
    confidence: float = Field(..., ge=0.0, le=1.0)
    reasoning: str


def _truncate_input(text: str, max_chars: int = _MAX_INPUT_CHARS) -> str:
    """Keep head and tail, drop the middle for oversized inputs."""
    if len(text) <= max_chars:
        return text
    half = max_chars // 2
    return text[:half] + "\n\n...[TRUNCATED FOR LENGTH]...\n\n" + text[-half:]


class ModerationService:
    """
    Orchestrates the 3-tier async moderation pipeline.

    Tier 1 — Local models (XLM-RoBERTa + CLIP): coarse filter, early exit.
    Tier 2 — Gemini 2.5 Flash: fine-grained LLM judgment for gray zone.
    Tier 3 — Human review queue: escalation via C# backend callback.
    """

    def __init__(
        self,
        gemini_client: genai.Client,
        db: AsyncSession,
        platform_core_url: str,
        internal_api_key: str = "",
    ) -> None:
        self._gemini = gemini_client
        self._db = db
        self._platform_core_url = platform_core_url
        self._internal_api_key = internal_api_key
        self._usage_service = AiUsageService(db=db)

    # ------------------------------------------------------------------
    # Public entry point
    # ------------------------------------------------------------------

    async def process_post(
        self,
        *,
        post_id: str,
        text_content: str,
        image_bytes: bytes | None = None,
        image_mime_type: str | None = None,
    ) -> ModerationTaskResult:
        """Full 3-tier pipeline. Called from BackgroundTask."""
        logger.info("[Moderation] Starting pipeline for post_id=%s", post_id)

        # ------- Tier 1 -------
        t1 = await self._run_tier_one(text_content, image_bytes)
        logger.info(
            "[Moderation][T1] post=%s text=%.3f image=%.3f combined=%.3f",
            post_id, t1.text_score, t1.image_score, t1.combined_score,
        )

        if t1.combined_score < _SAFE_THRESHOLD:
            logger.info("[Moderation][T1] AUTO APPROVED — post=%s", post_id)
            await self._notify_platform(post_id, ModerationDecision.APPROVE, t1=t1)
            return ModerationTaskResult(
                post_id=post_id,
                final_status=ModerationStatus.APPROVED,
                decision=ModerationDecision.APPROVE,
                tier_reached=1,
                tier_one=t1,
            )

        if t1.combined_score > _TOXIC_THRESHOLD:
            logger.info("[Moderation][T1] AUTO FLAGGED — post=%s", post_id)
            await self._notify_platform(post_id, ModerationDecision.FLAG, t1=t1)
            return ModerationTaskResult(
                post_id=post_id,
                final_status=ModerationStatus.FLAGGED,
                decision=ModerationDecision.FLAG,
                tier_reached=1,
                tier_one=t1,
            )

        # ------- Tier 2 (gray zone) -------
        logger.info(
            "[Moderation][T2] Gray zone — escalating to Gemini. post=%s has_image=%s",
            post_id, image_bytes is not None,
        )
        t2 = await self._run_tier_two(text_content, post_id, image_bytes, image_mime_type)
        logger.info(
            "[Moderation][T2] decision=%s confidence=%.3f post=%s",
            t2.decision, t2.confidence, post_id,
        )

        if t2.confidence > _T2_CONFIDENCE_THRESHOLD:
            status = (
                ModerationStatus.APPROVED if t2.decision == ModerationDecision.APPROVE
                else ModerationStatus.FLAGGED
            )
            await self._notify_platform(post_id, t2.decision, t1=t1, t2=t2)
            return ModerationTaskResult(
                post_id=post_id,
                final_status=status,
                decision=t2.decision,
                tier_reached=2,
                tier_one=t1,
                tier_two=t2,
            )

        # ------- Tier 3 (still uncertain) -------
        logger.info("[Moderation][T3] Low confidence — escalating to human queue. post=%s", post_id)
        t3 = await self._run_tier_three(post_id, t1, t2)
        await self._notify_platform(post_id, ModerationDecision.ESCALATE, t1=t1, t2=t2)
        return ModerationTaskResult(
            post_id=post_id,
            final_status=ModerationStatus.IN_REVIEW,
            decision=ModerationDecision.ESCALATE,
            tier_reached=3,
            tier_one=t1,
            tier_two=t2,
            tier_three=t3,
        )

    # ------------------------------------------------------------------
    # Tier 1 — Local Models
    # ------------------------------------------------------------------

    async def _run_tier_one(
        self, text_content: str, image_bytes: bytes | None
    ) -> TierOneResult:
        model_manager = AIModelManager.get_instance()

        text_result = await asyncio.to_thread(model_manager.analyze_text, text_content)
        text_score = text_result.score

        image_score = 0.0
        flagged_concepts: list[str] = []
        if image_bytes:
            image_result = await asyncio.to_thread(model_manager.analyze_image, image_bytes)
            image_score = image_result.score
            flagged_concepts = image_result.flagged_concepts

        combined_score = max(text_score, image_score)
        return TierOneResult(
            text_score=round(text_score, 4),
            image_score=round(image_score, 4),
            combined_score=round(combined_score, 4),
            flagged_concepts=flagged_concepts,
        )

    # ------------------------------------------------------------------
    # Tier 2 — Gemini LLM
    # ------------------------------------------------------------------

    async def _run_tier_two(
        self,
        text_content: str,
        post_id: str,
        image_bytes: bytes | None,
        image_mime_type: str | None = None,
    ) -> TierTwoResult:
        """
        Send a multimodal request to Gemini when image is present.
        This prevents the gray-zone bypass where clean text hides an
        inappropriate image: Gemini evaluates BOTH signals independently.
        """
        system_prompt = (
            "You are a content moderation AI for a professional software engineering "
            "learning platform. Analyze ALL submitted content (text AND image if provided). "
            "Flag content that violates community standards: toxicity, harassment, "
            "hate speech, spam, nudity, graphic violence, or otherwise inappropriate material. "
            "A post passes only if BOTH text AND image are acceptable. "
            "Return your decision, your confidence score (0.0–1.0), and a one-sentence reasoning."
        )
        safe_text = _truncate_input(text_content)
        user_parts = [
            types.Part.from_text(text=f"Text content to evaluate:\n```\n{safe_text}\n```")
        ]

        if image_bytes:
            # Multimodal: include the raw image bytes inline so Gemini can see the image
            mime = image_mime_type or "image/jpeg"
            user_parts.append(types.Part.from_text(text="Attached image to evaluate:"))
            user_parts.append(types.Part.from_bytes(data=image_bytes, mime_type=mime))
            logger.info("[Moderation][T2] Sending multimodal request (text+image) for post=%s", post_id)
        else:
            logger.info("[Moderation][T2] Sending text-only request for post=%s", post_id)
        user_content = types.Content(
            role="user",
            parts=user_parts
        )
        
        response = await self._gemini.aio.models.generate_content(
            model=_MODEL,
            contents=user_content,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=_GeminiT2Response,
                temperature=0.1,
                system_instruction=system_prompt,
            ),
        )

        await self._usage_service.log_from_response(
            response=response,
            feature_name="moderation_tier2",
            model_used=_MODEL,
        )

        if not response.text:
            logger.error(
                "[Moderation][T2] Gemini returned empty response for post=%s — possibly blocked by safety filters.",
                post_id,
            )
            raise AIWorkerException("Gemini returned empty response text.", status_code=502)

        parsed = _GeminiT2Response.model_validate_json(response.text)
        return TierTwoResult(
            decision=parsed.decision,
            confidence=parsed.confidence,
            reasoning=parsed.reasoning,
        )

    # ------------------------------------------------------------------
    # Tier 3 — Human Queue via C# backend
    # ------------------------------------------------------------------

    async def _run_tier_three(
        self, post_id: str, t1: TierOneResult, t2: TierTwoResult
    ) -> TierThreeResult:
        payload = {
            "postId": post_id,
            "reason": "AI inconclusive — requires human review",
            "tier1Score": t1.combined_score,
            "tier2Reasoning": t2.reasoning,
        }

        queue_entry_id = f"manual-{post_id}"
        try:
            headers = {"X-Internal-Api-Key": self._internal_api_key}
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    f"{self._platform_core_url}/internal/moderation/queue",
                    json=payload,
                    headers=headers,
                )
                resp.raise_for_status()
                data = resp.json()
                queue_entry_id = data.get("id", queue_entry_id)
                logger.info("[Moderation][T3] Queue entry created: %s", queue_entry_id)
        except Exception as exc:
            logger.error("[Moderation][T3] Failed to notify C# backend: %s", exc)

        return TierThreeResult(queue_entry_id=queue_entry_id)

    # ------------------------------------------------------------------
    # Helper — notify platform on auto-flag
    # ------------------------------------------------------------------

    async def _notify_platform(
        self, 
        post_id: str, 
        decision: ModerationDecision,
        t1: TierOneResult | None = None,
        t2: TierTwoResult | None = None
    ) -> None:
        payload = {"postId": post_id, "decision": decision.value}
        if t1:
            payload["textScore"] = t1.text_score
            payload["imageScore"] = t1.image_score
            payload["combinedScore"] = t1.combined_score
        if t2:
            payload["reasoning"] = t2.reasoning

        try:
            headers = {"X-Internal-Api-Key": self._internal_api_key}
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(
                    f"{self._platform_core_url}/internal/moderation/callback",
                    json=payload,
                    headers=headers,
                )
        except Exception as exc:
            logger.warning("[Moderation] Platform notify failed (non-fatal): %s", exc)