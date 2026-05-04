import logging
from datetime import date, timedelta

from google.genai.types import GenerateContentResponse
from sqlalchemy import Date, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.app.models.ai_usage_log import AiUsageLog
from src.app.schemas.ai_usage_log import (
    AiUsageByDateDTO,
    AiUsageByFeatureDTO,
    AiUsageByModelDTO,
    AiUsageLogDTO,
    AiUsageLogPageResponse,
    AiUsageSummaryResponse,
)
from src.app.schemas.dynamic_filter import PageRequest
from src.app.utils.query_builder import build_filters, build_orders

logger = logging.getLogger(__name__)

_MAX_PAGE_SIZE = 100


class AiUsageService:
    """
    Owns all interactions with the ai_usage_logs table.

    Write path: call log_from_response() after every Gemini API call to persist
    token usage. Failures are swallowed so they never disrupt the caller.

    Read path: call get_paged_logs() to return a filtered, sorted page of logs
    for the internal Admin endpoint.
    """

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    # ── Write ────────────────────────────────────────────────────────────────

    async def log_from_response(
        self,
        *,
        response: GenerateContentResponse,
        feature_name: str,
        model_used: str,
        user_id: str | None = None,
    ) -> None:
        """
        Extract token counts from response.usage_metadata and persist a log row.
        Failures are caught and logged — never raised — so they cannot break the caller.
        """
        try:
            meta = response.usage_metadata
            input_tokens = getattr(meta, "prompt_token_count", 0) or 0
            output_tokens = getattr(meta, "candidates_token_count", 0) or 0
            total_tokens = getattr(meta, "total_token_count", 0) or (input_tokens + output_tokens)

            log_entry = AiUsageLog(
                feature_name=feature_name,
                model_used=model_used,
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                total_tokens=total_tokens,
                user_id=user_id,
            )
            self._db.add(log_entry)
            await self._db.commit()

            logger.debug(
                "AI usage logged: feature=%s model=%s tokens=%d/%d/%d user=%s",
                feature_name,
                model_used,
                input_tokens,
                output_tokens,
                total_tokens,
                user_id,
            )
        except Exception as exc:  # noqa: BLE001 — must never crash the caller
            logger.error("Failed to log AI usage (non-fatal): %s", exc)

    # ── Read ─────────────────────────────────────────────────────────────────

    async def get_paged_logs(self, request: PageRequest) -> AiUsageLogPageResponse:
        """Return a filtered, sorted, paged view of ai_usage_logs."""
        page_size = min(request.size, _MAX_PAGE_SIZE)
        page = max(request.page_number, 1)
        offset = (page - 1) * page_size

        filters = build_filters(AiUsageLog, request.filters)
        orders = build_orders(AiUsageLog, request.orders)

        if not orders:
            orders = [AiUsageLog.created_at.desc()]  # Default: newest first

        # Count total matching rows
        count_stmt = select(func.count()).select_from(AiUsageLog)
        if filters:
            count_stmt = count_stmt.where(*filters)
        total: int = (await self._db.execute(count_stmt)).scalar_one()

        # Fetch page data
        data_stmt = (
            select(AiUsageLog)
            .where(*filters)
            .order_by(*orders)
            .offset(offset)
            .limit(page_size)
        )
        rows = (await self._db.execute(data_stmt)).scalars().all()

        logger.debug(
            "AiUsageService.get_paged_logs: page=%d size=%d total=%d",
            page, page_size, total,
        )

        return AiUsageLogPageResponse(
            data=[AiUsageLogDTO.model_validate(r) for r in rows],
            total=total,
            page=page,
            page_size=page_size,
        )

    # ── Summary ───────────────────────────────────────────────────────────────

    async def get_summary(
        self,
        from_date: date,
        to_date: date,
    ) -> AiUsageSummaryResponse:
        """
        Return aggregated token usage for the given inclusive date range.
        Runs four sequential queries (grand totals + three GROUP BY breakdowns).
        """
        # Exclusive upper bound: created_at < to_date + 1 day
        upper_bound = to_date + timedelta(days=1)

        # ── Grand totals ──────────────────────────────────────────────────────
        totals_stmt = select(
            func.count().label("total_calls"),
            func.coalesce(func.sum(AiUsageLog.input_tokens), 0).label("total_input_tokens"),
            func.coalesce(func.sum(AiUsageLog.output_tokens), 0).label("total_output_tokens"),
            func.coalesce(func.sum(AiUsageLog.total_tokens), 0).label("total_tokens"),
        ).where(
            AiUsageLog.created_at >= from_date,
            AiUsageLog.created_at < upper_bound,
        )
        totals_row = (await self._db.execute(totals_stmt)).one()

        # ── By model ──────────────────────────────────────────────────────────
        by_model_stmt = (
            select(
                AiUsageLog.model_used.label("model"),
                func.count().label("call_count"),
                func.coalesce(func.sum(AiUsageLog.input_tokens), 0).label("input_tokens"),
                func.coalesce(func.sum(AiUsageLog.output_tokens), 0).label("output_tokens"),
                func.coalesce(func.sum(AiUsageLog.total_tokens), 0).label("total_tokens"),
            )
            .where(
                AiUsageLog.created_at >= from_date,
                AiUsageLog.created_at < upper_bound,
            )
            .group_by(AiUsageLog.model_used)
            .order_by(func.count().desc())
        )
        by_model_rows = (await self._db.execute(by_model_stmt)).all()

        # ── By feature ────────────────────────────────────────────────────────
        by_feature_stmt = (
            select(
                AiUsageLog.feature_name.label("feature"),
                func.count().label("call_count"),
                func.coalesce(func.sum(AiUsageLog.input_tokens), 0).label("input_tokens"),
                func.coalesce(func.sum(AiUsageLog.output_tokens), 0).label("output_tokens"),
                func.coalesce(func.sum(AiUsageLog.total_tokens), 0).label("total_tokens"),
            )
            .where(
                AiUsageLog.created_at >= from_date,
                AiUsageLog.created_at < upper_bound,
            )
            .group_by(AiUsageLog.feature_name)
            .order_by(func.count().desc())
        )
        by_feature_rows = (await self._db.execute(by_feature_stmt)).all()

        # ── By date (daily) ───────────────────────────────────────────────────
        by_date_stmt = (
            select(
                cast(AiUsageLog.created_at, Date).label("date"),
                func.count().label("call_count"),
                func.coalesce(func.sum(AiUsageLog.input_tokens), 0).label("input_tokens"),
                func.coalesce(func.sum(AiUsageLog.output_tokens), 0).label("output_tokens"),
                func.coalesce(func.sum(AiUsageLog.total_tokens), 0).label("total_tokens"),
            )
            .where(
                AiUsageLog.created_at >= from_date,
                AiUsageLog.created_at < upper_bound,
            )
            .group_by(cast(AiUsageLog.created_at, Date))
            .order_by(cast(AiUsageLog.created_at, Date).asc())
        )
        by_date_rows = (await self._db.execute(by_date_stmt)).all()

        logger.debug(
            "AiUsageService.get_summary: from=%s to=%s total_calls=%d",
            from_date,
            to_date,
            totals_row.total_calls,
        )

        return AiUsageSummaryResponse(
            total_calls=totals_row.total_calls,
            total_input_tokens=totals_row.total_input_tokens,
            total_output_tokens=totals_row.total_output_tokens,
            total_tokens=totals_row.total_tokens,
            by_model=[
                AiUsageByModelDTO(
                    model=r.model,
                    call_count=r.call_count,
                    input_tokens=r.input_tokens,
                    output_tokens=r.output_tokens,
                    total_tokens=r.total_tokens,
                )
                for r in by_model_rows
            ],
            by_feature=[
                AiUsageByFeatureDTO(
                    feature=r.feature,
                    call_count=r.call_count,
                    input_tokens=r.input_tokens,
                    output_tokens=r.output_tokens,
                    total_tokens=r.total_tokens,
                )
                for r in by_feature_rows
            ],
            by_date=[
                AiUsageByDateDTO(
                    date=str(r.date),
                    call_count=r.call_count,
                    input_tokens=r.input_tokens,
                    output_tokens=r.output_tokens,
                    total_tokens=r.total_tokens,
                )
                for r in by_date_rows
            ],
        )
