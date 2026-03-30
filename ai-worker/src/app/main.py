
from fastapi import FastAPI
from src.app.api.routers import health
# 1. Instantiate the FastAPI application (Equivalent to builder.Build() in .NET)
app = FastAPI(
    title="AI Worker Microservice",
    description="AI integration and content moderation for the Social Learning Network",
    version="0.1.0",
)

app.include_router(health.router)