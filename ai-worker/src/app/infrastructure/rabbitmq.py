import logging
import aio_pika
from typing import Optional

from src.app.core.config import get_settings

logger = logging.getLogger(__name__)

# Global connection to be reused
_connection: Optional[aio_pika.RobustConnection] = None


async def get_rabbitmq_connection() -> aio_pika.RobustConnection:
    """Gets or creates the RabbitMQ robust connection."""
    global _connection
    if _connection is None or _connection.is_closed:
        settings = get_settings()
        logger.info("Connecting to RabbitMQ at %s", settings.rabbitmq_url)
        _connection = await aio_pika.connect_robust(settings.rabbitmq_url)
    return _connection


async def setup_rabbitmq_topology() -> None:
    """Declares all necessary exchanges, queues, and bindings including DLX."""
    connection = await get_rabbitmq_connection()
    channel = await connection.channel()

    # 1. Setup DLX (Universal DLQ)
    dlx_exchange_name = "devnexus_ai_tasks_dlx"
    dlx_queue_name = "ai_universal_dlq"
    
    dlx_exchange = await channel.declare_exchange(
        dlx_exchange_name, 
        aio_pika.ExchangeType.DIRECT, 
        durable=True
    )
    dlx_queue = await channel.declare_queue(
        dlx_queue_name, 
        durable=True
    )
    # Bind with a catch-all routing key for DLQ (though direct exchange usually uses exact match, 
    # we can use a generic dlq routing key for everything, or we can change DLX to Topic).
    # Since it's DIRECT, we'll just bind "dlq.ai.tasks.universal" and point all dead-letters there.
    await dlx_queue.bind(dlx_exchange, routing_key="dlq.ai.tasks.universal")

    # 2. Setup Main Task Exchange
    tasks_exchange_name = "devnexus_ai_tasks"
    await channel.declare_exchange(
        tasks_exchange_name, 
        aio_pika.ExchangeType.TOPIC, 
        durable=True
    )

    # 3. Setup Publisher Topology (Responses back to .NET)
    responses_exchange_name = "devnexus_ai_responses"
    await channel.declare_exchange(
        responses_exchange_name, 
        aio_pika.ExchangeType.TOPIC, 
        durable=True
    )

    logger.info("RabbitMQ base topology setup complete.")

async def setup_task_queue(queue_name: str, routing_key: str) -> None:
    """Dynamically declares a queue and binds it to the tasks exchange with DLX configured."""
    connection = await get_rabbitmq_connection()
    channel = await connection.channel()

    tasks_exchange_name = "devnexus_ai_tasks"
    dlx_exchange_name = "devnexus_ai_tasks_dlx"
    
    tasks_exchange = await channel.get_exchange(tasks_exchange_name)
    
    queue_args = {
        "x-dead-letter-exchange": dlx_exchange_name,
        "x-dead-letter-routing-key": "dlq.ai.tasks.universal"
    }
    
    tasks_queue = await channel.declare_queue(
        queue_name, 
        durable=True, 
        arguments=queue_args
    )
    
    await tasks_queue.bind(tasks_exchange, routing_key=routing_key)
    logger.info(f"Declared queue '{queue_name}' bound to '{routing_key}'.")


async def close_rabbitmq_connection() -> None:
    """Closes the RabbitMQ connection gracefully."""
    global _connection
    if _connection and not _connection.is_closed:
        await _connection.close()
        _connection = None
        logger.info("RabbitMQ connection closed.")
