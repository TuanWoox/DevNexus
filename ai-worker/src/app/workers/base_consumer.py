import abc
import json
import logging
from typing import Any

import aio_pika

from src.app.core.config import get_settings
from src.app.infrastructure.rabbitmq import get_rabbitmq_connection, setup_task_queue

logger = logging.getLogger(__name__)

class BaseAITaskConsumer(abc.ABC):
    def __init__(self, queue_name: str, routing_key: str):
        self.settings = get_settings()
        self.queue_name = queue_name
        self.routing_key = routing_key
        self.response_exchange = "devnexus_ai_responses"
        self.consumer_tag = None
        self._channel = None

    @property
    @abc.abstractmethod
    def response_routing_key(self) -> str:
        """The routing key to publish the response to (e.g., 'ai.response.firstresponder')."""
        pass

    async def start(self):
        """Starts the RabbitMQ consumer loop."""
        await setup_task_queue(self.queue_name, self.routing_key)
        connection = await get_rabbitmq_connection()
        self._channel = await connection.channel()
        
        # QoS - process one message at a time
        await self._channel.set_qos(prefetch_count=1)

        # Get queue (should already be declared by topology setup)
        queue = await self._channel.get_queue(self.queue_name)

        logger.info(f"Starting consumer for {self.queue_name}...")
        self.consumer_tag = await queue.consume(self._process_message)

    async def stop(self):
        """Stops the consumer."""
        if self._channel and self.consumer_tag:
            try:
                queue = await self._channel.get_queue(self.queue_name)
                await queue.cancel(self.consumer_tag)
                await self._channel.close()
                logger.info(f"Stopped consumer for {self.queue_name}.")
            except Exception as e:
                logger.error(f"Error stopping consumer for {self.queue_name}: {e}")

    async def _process_message(self, message: aio_pika.IncomingMessage):
        """Process incoming RabbitMQ message with explicit Manual ACK/NACK."""
        try:
            body = message.body.decode("utf-8")
            logger.info(f"Received message on {self.queue_name}")

            payload = json.loads(body)

            # Delegate to child class for specific processing
            response_payload = await self.process_payload(payload)

            if response_payload is not None:
                await self._publish_response(response_payload)
                logger.info(f"Successfully processed and published response for {self.queue_name}")
            
            # Everything succeeded -> ACK
            await message.ack()
                
        except json.JSONDecodeError as je:
            logger.error(f"Malformed JSON in RabbitMQ message on {self.queue_name}: {je}")
            # Invalid format, cannot recover -> Reject to DLX
            await message.reject(requeue=False)
            
        except ValueError as ve:
            logger.warning(f"Validation error processing message on {self.queue_name}: {ve}")
            # Pure validation errors (like wrong enum) should just be discarded
            await message.ack()

        except Exception as e:
            logger.error(f"Error processing AI task on {self.queue_name}: {str(e)}")
            # API Error (Timeout, LLM down) -> Reject to DLX for retries
            await message.reject(requeue=False)

    @abc.abstractmethod
    async def process_payload(self, payload: dict[str, Any]) -> dict[str, Any] | None:
        """
        Process the payload and return the response dictionary to publish.
        If None is returned, no response is published.
        Raises ValueError if the payload is invalid (will be ACKed and ignored).
        Raises Exception if processing fails (will be sent to DLX).
        """
        pass

    async def _publish_response(self, response_payload: dict[str, Any]):
        """Publish the generated response back to .NET backend via topic exchange."""
        exchange = await self._channel.get_exchange(self.response_exchange)
        
        payload_bytes = json.dumps(response_payload).encode("utf-8")
        
        message = aio_pika.Message(
            body=payload_bytes,
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            content_type="application/json"
        )
        
        await exchange.publish(
            message,
            routing_key=self.response_routing_key
        )
