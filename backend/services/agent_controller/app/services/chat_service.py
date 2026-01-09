from services.user_history_store import UserHistoryStore
from services.genai import GenAI, get_http_client
from services.cv_link_service import build_cv_preview_url
from config.constants import (
    DEFAULT_MODEL,
    RAG_ENABLED,
    RAG_TOP_K,
    KNOWLEDGE_BASE_HOST,
    EMBEDDING_MODEL,
    QDRANT_COLLECTION,
    SCHEMA,
)
from config.log_config import AppLogger

logger = AppLogger(__file__)


class ChatService:
    def __init__(
        self,
        model=DEFAULT_MODEL,
        user_id=None,
        conversation_id=None,
        auth_token: str | None = None,
    ):
        self.model = model
        self.conversation_id = conversation_id
        self.user_id = user_id
        self.auth_token = auth_token
        self.history_store = UserHistoryStore(
            user_id=user_id, conversation_id=conversation_id
        )
        self.ai_service = GenAI(model=model)

    async def ask(self, user_input):
        # STEP 1: Attempt RAG directly via Knowledge Base (async HTTP)
        if RAG_ENABLED:
            try:
                kb_body = {
                    "query": user_input,
                    "collection_name": QDRANT_COLLECTION,
                    "embedding_model": EMBEDDING_MODEL,
                    "top_k": RAG_TOP_K,
                    "filters": None,
                }
                url = f"{SCHEMA}://{KNOWLEDGE_BASE_HOST}/api/v1/knowledge-base/documents/search/"
                headers = {"Content-Type": "application/json"}

                # Use async httpx client
                client = await get_http_client()
                resp = await client.post(url, json=kb_body, headers=headers)
                if resp.status_code == 200:
                    kb_data = resp.json().get("data", [])
                    # Build grounded prompt with CV metadata and preview links
                    contexts = []
                    for item in kb_data:
                        text = item.get("page_content", "")
                        payload = item.get("payload", {})
                        candidate_name = payload.get("candidate_name", "Unknown")
                        candidate_id = payload.get("candidate_id")
                        position = payload.get("position", "N/A")

                        if text:
                            # Build context with CV metadata
                            context_parts = [f"**Candidate: {candidate_name}** (Position: {position})"]
                            if candidate_id:
                                preview_url = build_cv_preview_url(candidate_id)
                                context_parts.append(f"CV Preview: {preview_url}")
                            context_parts.append(f"Content:\n{text}")
                            contexts.append("\n".join(context_parts))

                    system_prompt = (
                        "You are a recruitment assistant with access to CV information. "
                        "When answering questions about candidates, use the provided CV excerpts. "
                        "Each context includes the candidate's name, position, CV preview link, and relevant content. "
                        "If a user asks for a CV link or wants to view/download a CV, provide the CV Preview URL from the context. "
                        "If no relevant context is found, let the user know you don't have information about that candidate."
                    )
                    context_block = "\n\n---\n\n".join(contexts)
                    messages = [
                        {"role": "system", "content": system_prompt},
                        {"role": "system", "content": f"CV Information:\n\n{context_block}"},
                        {"role": "user", "content": user_input},
                    ]
                    logger.info(f"RAG messages: {messages}")
                    # Invoke GenAI provider for grounded completion
                    answer = await self.ai_service.invoke(messages)
                    if answer:
                        self.history_store.add_history_messages(
                            [
                                {"role": "user", "content": user_input},
                                {"role": "assistant", "content": answer},
                            ]
                        )
                        return {"text": answer}
                else:
                    logger.warn(
                        f"KB search failed status={resp.status_code}: {resp.text}"
                    )
            except Exception as e:
                logger.error(f"RAG flow error: {e}")

        # Ungrounded chat as default or fallback
        instructions = (
            "You are a friendly and professional assistant helping someone on recruitment. "
            "You should sound warm, conversational, and helpful."
        )
        messages = [{"role": "system", "content": instructions}]
        messages += self.history_store.get_history()
        messages.append({"role": "user", "content": user_input})
        ai_response = await self.ai_service.invoke(messages)
        logger.info(f"AI response: {ai_response}")
        self.history_store.add_history_messages(
            [
                {"role": "user", "content": user_input},
                {"role": "assistant", "content": ai_response},
            ],
        )
        return {"text": ai_response}
