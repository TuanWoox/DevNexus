import logging
import re
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import asc, desc
from sqlalchemy.sql.elements import ColumnElement

from src.app.schemas.dynamic_filter import FilterMapping, OrderMapping

if TYPE_CHECKING:
    from sqlalchemy.orm import DeclarativeBase

logger = logging.getLogger(__name__)

def camel_to_snake(name: str) -> str:
    # Chuyển "FeatureName" hoặc "featureName" thành "feature_name"
    if not name:
        return name
    name = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', name).lower()

def build_filters(model_class: type, filters: list[FilterMapping]) -> list[ColumnElement[bool]]:
    """
    Translate a list of FilterMapping objects into SQLAlchemy WHERE expressions.

    Uses parameterized column expressions — never string concatenation — so
    all values are passed through the DB driver's safe binding layer.
    Unknown column names and unsupported operators are skipped with a warning.
    """
    conditions: list[ColumnElement[bool]] = []

    for f in filters:
        snake_prop = camel_to_snake(f.prop)
        column = getattr(model_class, snake_prop, None)
        if column is None:
            logger.warning("build_filters: unknown column '%s' on %s — skipped", f.prop, model_class.__name__)
            continue

        op = f.filter_operator
        val = f.value

        if val is None and op not in ("IsEmpty", "IsNotEmpty"):
            continue

        try:
            # ── Text ─────────────────────────────────────────────────────────
            if f.filter_type == "Text":
                if op == "Contains":
                    conditions.append(column.ilike(f"%{val}%"))
                elif op == "DoesNotContains":
                    conditions.append(~column.ilike(f"%{val}%"))
                elif op == "StartsWith":
                    conditions.append(column.ilike(f"{val}%"))
                elif op == "EndsWith":
                    conditions.append(column.ilike(f"%{val}"))
                elif op == "IsEqualTo":
                    conditions.append(column == val)
                elif op == "IsNotEqualTo":
                    conditions.append(column != val)

            # ── Number ───────────────────────────────────────────────────────
            elif f.filter_type == "Number":
                num = float(val)  # type: ignore[arg-type]
                if op == "IsEqualTo":
                    conditions.append(column == num)
                elif op == "IsNotEqualTo":
                    conditions.append(column != num)
                elif op == "IsGreaterThan":
                    conditions.append(column > num)
                elif op == "IsGreaterThanOrEqualTo":
                    conditions.append(column >= num)
                elif op == "IsLessThan":
                    conditions.append(column < num)
                elif op == "IsLessThanOrEqualTo":
                    conditions.append(column <= num)

            # ── DateTime ─────────────────────────────────────────────────────
            elif f.filter_type in ("DateTime", "Date"):
                dt = datetime.fromisoformat(val)  # type: ignore[arg-type]
                if op in ("IsEqualTo", "IsAfterOrEqual"):
                    conditions.append(column >= dt)
                elif op == "IsAfter":
                    conditions.append(column > dt)
                elif op in ("IsBeforeOrEqual", "IsBefore"):
                    conditions.append(column <= dt)
                elif op == "IsNotEqualTo":
                    conditions.append(column != dt)

            # ── Boolean ──────────────────────────────────────────────────────
            elif f.filter_type == "Boolean":
                bool_val = str(val).lower() == "true"
                if op in ("IsEqualTo", "Contains"):
                    conditions.append(column == bool_val)
                elif op in ("IsNotEqualTo", "DoesNotContains"):
                    conditions.append(column != bool_val)

            # ── Null / Not-null (all types) ───────────────────────────────
            if op == "IsEmpty":
                conditions.append(column.is_(None))
            elif op == "IsNotEmpty":
                conditions.append(column.is_not(None))

        except (ValueError, TypeError) as exc:
            logger.warning(
                "build_filters: could not apply filter prop='%s' op='%s' val='%s' — %s",
                f.prop, op, val, exc,
            )

    return conditions


def build_orders(model_class: type, orders: list[OrderMapping]) -> list[ColumnElement]:
    """
    Translate a list of OrderMapping objects into SQLAlchemy ORDER BY expressions.

    Unknown column names are skipped with a warning.
    """
    order_exprs: list[ColumnElement] = []

    for o in orders:
        column = getattr(model_class, o.sort, None)
        if column is None:
            logger.warning("build_orders: unknown column '%s' on %s — skipped", o.sort, model_class.__name__)
            continue
        order_exprs.append(asc(column) if o.sort_dir == "asc" else desc(column))

    return order_exprs
