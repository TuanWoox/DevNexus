import logging
from typing import Any

from src.app.infrastructure.database import AsyncSessionLocal
from src.app.infrastructure.gemini import create_gemini_client
from src.app.schemas.code_tools import FirstResponderRequest
from src.app.services.code_tools_service import CodeToolsService
from src.app.workers.base_consumer import BaseAITaskConsumer

logger = logging.getLogger(__name__)

# MessageBusEntityEnum mapping for AIFirstResponder (from C# enum)
AI_FIRST_RESPONDER_ENUM = 4

class FirstResponderConsumer(BaseAITaskConsumer):
    def __init__(self):
        super().__init__(
            queue_name="ai_first_responder_queue",
            routing_key="ai.task.firstresponder.#"
        )

    @property
    def response_routing_key(self) -> str:
        return "ai.response.firstresponder"

    async def process_payload(self, payload: dict[str, Any]) -> dict[str, Any] | None:
        # Verify MessageBusEntityEnum
        entity_enum = payload.get("MessageBusEntityEnum")
        if entity_enum != AI_FIRST_RESPONDER_ENUM:
            raise ValueError(f"Skipping message with non-first-responder enum: {entity_enum}")

        # Extract the FirstResponderRequest
        entity_dict = payload.get("Entity", {})
        if not entity_dict:
            raise ValueError("Message 'Entity' is empty.")

        request_obj = FirstResponderRequest(**entity_dict)

        # Initialize Gemini Client from Redis runtime config, with env fallback.
        gemini_client = await create_gemini_client(self.settings)

        # Execute LLM logic
        async with AsyncSessionLocal() as db_session:
            service = CodeToolsService(client=gemini_client, db=db_session)
            
            # Gọi AI
            result = await service.generate_first_response(request_obj, user_id=request_obj.authorId)
            
            # Đóng gói gửi về .NET
            response_payload = {
                "PostId": request_obj.postId,
                "Success": result.success,
                "GeneratedComment": result.generatedComment,
                "ErrorMessage": result.errorMessage
            }

            return response_payload
