import logging
import requests
from services.user_history_store import UserHistoryStore
from services.genai import GenAI
from services.cv_link_service import CVLinkIntentDetector, CVLinkService
from config.constants import (
    DEFAULT_MODEL,
    RAG_ENABLED,
    RAG_UNGROUNDED_CONTINUATION,
    RAG_TOP_K,
    RECRUITMENT_HOST,
    KNOWLEDGE_BASE_HOST,
    EMBEDDING_MODEL,
    QDRANT_COLLECTION,
    SCHEMA,
    TLS_ENABLED,
    CA_PATH,
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
        # STEP 1: Check for CV link intent FIRST
        is_cv_request, candidate_name = CVLinkIntentDetector.detect_cv_link_intent(user_input)
        if is_cv_request and candidate_name:
            logger.info(f"CV link request detected for candidate: {candidate_name}")
            cv_link_service = CVLinkService(auth_token=self.auth_token)
            cv_data = cv_link_service.get_cv_link(candidate_name)
            response_text = CVLinkService.format_response(cv_data)
            self.history_store.add_history_messages([
                {"role": "user", "content": user_input},
                {"role": "assistant", "content": response_text},
            ])
            return {"text": response_text}

        # STEP 2: Attempt RAG directly via Knowledge Base (no extra HTTP API)
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
                kwargs = {"url": url, "json": kb_body, "headers": headers}
                if TLS_ENABLED and CA_PATH:
                    kwargs["verify"] = CA_PATH
                resp = requests.post(**kwargs)
                if resp.status_code == 200:
                    kb_data = resp.json().get("data", [])
                    # Build grounded prompt with citations
                    contexts = []
                    for item in kb_data:
                        text = item.get("page_content", "")
                        cid = str(item.get("id", ""))
                        if text:
                            contexts.append(f"[Chunk {cid}]\n{text}")

                    system_prompt = (
                        "You are an assistant answering recruitment questions grounded in provided CV excerpts. "
                        "Cite chunk IDs (e.g., [Chunk abc]) when you use information. If no relevant context, say so."
                    )
                    context_block = "\n\n".join(contexts)
                    messages = [
                        {"role": "system", "content": system_prompt},
                        {"role": "system", "content": f"Context:\n{context_block}"},
                        {"role": "user", "content": user_input},
                    ]
                    logger.info(f"RAG messages: {messages}")
                    # Invoke GenAI provider for grounded completion
                    answer = await self.ai_service.invoke(messages)
                    if answer:
                        # Return AI's response - it will indicate if no context was found
                        # based on the system prompt instructions
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
        logger.info("AI response from GenAI: %s", ai_response)
        self.history_store.add_history_messages(
            [
                {"role": "user", "content": user_input},
                {"role": "assistant", "content": ai_response},
            ],
        )
        return {"text": ai_response}
