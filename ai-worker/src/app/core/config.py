from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

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

    model_config =  SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

@lru_cache
def get_settings() -> Settings:
    return Settings()