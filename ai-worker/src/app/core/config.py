from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
import os
from pathlib import Path

def get_env_file() -> str:
    """Determine which .env file to load based on ENVIRONMENT variable."""
    environment = os.getenv("ENVIRONMENT", "development")
    env_file = f".env.{environment}"
    if Path(env_file).exists():
        return env_file
    return ".env"

class Settings(BaseSettings):
    project_name: str = "AI Worker"
    environment: str = "development"
    gemini_api_key: str | None = None
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres"
    jwt_secret_key: str 
    jwt_algorithm: str = "HS256"
    jwt_issuer: str
    jwt_audience: str
    cors_origins: str = ""
    platform_core_service_url: str = "http://localhost:5105"
    internal_api_key: str = ""
    rabbitmq_url: str = "amqp://guest:guest@localhost:5672/"

    model_config = SettingsConfigDict(
        env_file=get_env_file(),
        env_file_encoding="utf-8",
        extra="ignore"
    )

@lru_cache
def get_settings() -> Settings:
    return Settings()