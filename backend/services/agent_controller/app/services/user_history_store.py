import logging
import uuid
from typing import Any, Dict, List
from utils.redis_client import RedisClient

logger = logging.getLogger(__name__)


class UserHistoryStore:
    def __init__(self, user_id, conversation_id):
        self.user_id = user_id
        self.conversation_id = conversation_id
        self.redis_key = f"user:{user_id}:conversation:{conversation_id}"
        self.redis = RedisClient()

    def _load_all(self) -> Dict[str, Any]:
        # Return the full stored JSON; empty dict if not set
        return self.redis.json_get(self.redis_key) or {}

    def _save_all(self, data: Dict[str, Any]) -> None:
        # Overwrite the full JSON atomically
        self.redis.json_set(key=self.redis_key, data=data)

    @staticmethod
    def create_new_conversation(user_id) -> str:
        """
        Create a new conversation ID for the user.
        """
        new_conversation_id = str(uuid.uuid4())
        redis_key = f"user:{user_id}:conversation:{new_conversation_id}"
        # Initialize empty history
        RedisClient().json_set(key=redis_key, data={"history": []})
        return new_conversation_id

    @staticmethod
    def delete_conversation(conversation_id) -> None:
        """
        Delete the conversation history for the current conversation ID.
        """
        RedisClient().delete(conversation_id)

    @staticmethod
    def get_conversation_history_by_id(
        user_id, conversation_id
    ) -> List[Dict[str, Any]]:
        """
        Get conversation history for the current conversation ID.
        """
        redis_key = f"user:{user_id}:conversation:{conversation_id}"
        return RedisClient().json_get(redis_key).get("history", []) or []

    @staticmethod
    def list_conversations(user_id) -> List[str]:
        """
        List all conversation IDs for the user.
        """
        pattern_key = f"user:{user_id}:conversation:*"
        keys = RedisClient().keys(prefix_key=pattern_key)
        conversation_ids = []
        for key in keys:
            key_str = key.decode("utf-8") if isinstance(key, bytes) else key
            parts = key_str.split(":")
            if len(parts) >= 4:
                conversation_ids.append(parts[3])
        return conversation_ids

    def get_history(self) -> List[Dict[str, Any]]:
        """
        Return the entire conversation history list, defaulting to [].
        Structure: [ { ...message... }, ... ]
        """
        data = self._load_all()
        hist = data.get("history")
        return hist if isinstance(hist, list) else []

    def set_history(self, messages: List[Dict[str, Any]]) -> None:
        """
        Replace the entire conversation history list. Other fields are preserved.
        """
        if not isinstance(messages, list):
            raise ValueError("messages must be a list of dicts")
        cleaned: List[Dict[str, Any]] = [m for m in messages if isinstance(m, dict)]
        data = self._load_all()
        data["history"] = cleaned
        self._save_all(data)
        logger.info(
            "Saved conversation history for %s (messages=%d)",
            self.conversation_id,
            len(cleaned),
        )

    def add_history_messages(self, messages: List[Dict[str, Any]]) -> None:
        """
        Append a list of messages to the conversation history.
        Each item must be a dict; non-dict items are ignored.
        """
        if not isinstance(messages, list):
            raise ValueError("messages must be a list of dicts")

        data = self._load_all()
        hist = data.get("history")
        if not isinstance(hist, list):
            hist = []

        cleaned = [m for m in messages if isinstance(m, dict)]
        hist.extend(cleaned)
        data["history"] = hist
        self._save_all(data)
        logger.info(
            "Appended %d messages to history: conversation=%s total_messages=%d",
            len(cleaned),
            self.conversation_id,
            len(hist),
        )
