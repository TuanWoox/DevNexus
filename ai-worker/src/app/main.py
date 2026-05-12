import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.app.api.routers import health, moderation, roadmaps, content, taxonomy, code_tools, admin
from src.app.core.config import get_settings
from src.app.core.exceptions import AIWorkerException
from src.app.infrastructure.database import create_tables, engine
from src.app.infrastructure.model_manager import AIModelManager
from src.app.infrastructure.rabbitmq import setup_rabbitmq_topology, close_rabbitmq_connection, setup_task_queue
from src.app.workers.first_responder_consumer import FirstResponderConsumer

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AI Worker Microservice is initializing…")

    # 1. Ensure DB tables exist (idempotent, safe to run every startup)
    logger.info("Running DB table creation…")
    await create_tables()
    logger.info("DB tables ready ✓")

    # 2. Load local ML models into RAM
    model_manager = AIModelManager.get_instance()
    await model_manager.load_models()

    # 3. Setup RabbitMQ Topology & Consumer
    logger.info("Setting up RabbitMQ topology…")
    await setup_rabbitmq_topology()
    
    # Setup queues dynamically and start consumers
    first_responder_consumer = FirstResponderConsumer()
    await setup_task_queue(first_responder_consumer.queue_name, first_responder_consumer.routing_key)
    await first_responder_consumer.start()

    yield

    # Shutdown: release model memory, stop consumer, close DB pool
    logger.info("AI Worker Microservice is shutting down…")
    await first_responder_consumer.stop()
    await close_rabbitmq_connection()
    await model_manager.unload_models()
    await engine.dispose()
    logger.info("Shutdown complete.")

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
app.include_router(content.router)
app.include_router(taxonomy.router)
app.include_router(code_tools.router)
app.include_router(admin.router)