import logging
from services.user_history_store import UserHistoryStore
from services.genai import GenAI
from config.constants import DEFAULT_MODEL
from config.log_config import AppLogger

logger = AppLogger(__file__)


class ChatService:
    def __init__(
        self,
        model=DEFAULT_MODEL,
        user_id=None,
        conversation_id=None,
    ):
        self.model = model
        self.conversation_id = conversation_id
        self.user_id = user_id
        self.history_store = UserHistoryStore(
            user_id=user_id, conversation_id=conversation_id
        )
        self.ai_service = GenAI(model=model)

    async def ask(self, user_input):
        instructions = f"""
            You are a friendly and professional assistant helping someone on recruitment. You should sound warm, conversational, and helpful.
"""
        messages = [{"role": "system", "content": instructions}]
        messages += self.history_store.get_history()
        messages.append({"role": "user", "content": user_input})
        ai_response = await self.ai_service.invoke(messages)
        logger.info(f"AI response: {ai_response}")
        logger.info("AI response from GenAI: %s", ai_response)
        self.history_store.add_history_messages(
            [
                {"role": "user", "content": user_input},
                {"role": "assistant", "content": ai_response},
            ],
        )
        return {
            "text": ai_response,
        }
