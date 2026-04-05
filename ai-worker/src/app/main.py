import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from src.app.api.routers import health, moderation, roadmaps
from src.app.core.exceptions import AIWorkerException
from src.app.infrastructure.database import engine
from src.app.core.config import get_settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AI Worker Microservice is initializing...")
    
    yield
    
    logger.info("AI Worker Microservice is shutting down...")
    
    await engine.dispose() 
    logger.info("Database connections closed cleanly.")

app = FastAPI(
    title="AI Worker Microservice",
    description="AI integration and content moderation for the Social Learning Network",
    version="0.1.0",
    lifespan=lifespan
)

settings = get_settings()

origins = [origin.strip() for origin in settings.cors_origins.split(",")] if settings.cors_origins else []

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        
    allow_credentials=True,       
    allow_methods=["*"],          
    allow_headers=["*"],          
)

@app.exception_handler(AIWorkerException)
async def ai_worker_exception_handler(request: Request, exc: AIWorkerException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.message,
            "path": request.url.path
        }
    )

app.include_router(health.router)
app.include_router(moderation.router)
app.include_router(roadmaps.router)