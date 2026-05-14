from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import text
from src.app.core.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def create_tables() -> None:
    """Create all ORM-defined tables if they do not already exist."""
    # Import here to avoid circular deps at module load time
    from src.app.models.base import Base
    import src.app.models  # noqa: F401 — registers all mappers

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await _sync_ai_usage_log_columns(conn)


async def _sync_ai_usage_log_columns(conn) -> None:
    """Add nullable analytics columns for existing databases.

    create_all() creates missing tables but does not alter existing ones.
    Keep this sync dialect-aware so PostgreSQL syntax does not break local
    development on other SQLAlchemy-supported databases.
    """
    dialect_name = conn.dialect.name

    if dialect_name == "postgresql":
        statements = [
            "ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS input_hash VARCHAR(128)",
            "ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS output_json JSON",
            "ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS metadata_json JSON",
            "ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS interaction_status VARCHAR(32)",
            "ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS interacted_at TIMESTAMP WITH TIME ZONE",
            "ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS status VARCHAR(32)",
            "ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS error_message TEXT",
            "CREATE INDEX IF NOT EXISTS ix_ai_usage_logs_input_hash ON ai_usage_logs (input_hash)",
            "CREATE INDEX IF NOT EXISTS ix_ai_usage_logs_interaction_status ON ai_usage_logs (interaction_status)",
            "CREATE INDEX IF NOT EXISTS ix_ai_usage_logs_status ON ai_usage_logs (status)",
        ]
        for statement in statements:
            await conn.execute(text(statement))
        return

    if dialect_name == "sqlite":
        existing_columns = {
            row[1]
            for row in (await conn.execute(text("PRAGMA table_info(ai_usage_logs)"))).fetchall()
        }
        sqlite_columns = {
            "input_hash": "VARCHAR(128)",
            "output_json": "JSON",
            "metadata_json": "JSON",
            "interaction_status": "VARCHAR(32)",
            "interacted_at": "DATETIME",
            "status": "VARCHAR(32)",
            "error_message": "TEXT",
        }
        for column_name, column_type in sqlite_columns.items():
            if column_name not in existing_columns:
                await conn.execute(text(f"ALTER TABLE ai_usage_logs ADD COLUMN {column_name} {column_type}"))


async def get_db_session() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
