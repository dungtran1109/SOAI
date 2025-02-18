import os
import logging
from langchain_qdrant import Qdrant
from langchain_huggingface import HuggingFaceEmbeddings
from services.ollama_service import OllamaService

os.environ["HF_HOME"] = "/.cache/huggingface"

logger = logging.getLogger(__file__)


class RAGService:
    """Handles Qdrant vector database operations."""

    def __init__(
        self,
        model_name: str,
        collection_name: str = "knowledge_base",
        embedding_model=None,  # Default: HuggingFaceEmbeddings
        host: str = "qdrant",
        port: int = 6333,
        embedding_model_name: str = "hkunlp/instructor-large",
    ):
        self.collection_name = collection_name
        self.model_name = model_name

        # Default to HuggingFace if no model is provided
        self.embedding_model = embedding_model or HuggingFaceEmbeddings(
            model_name=embedding_model_name
        )
        logger.debug(f"Initializing RAGService with model: {embedding_model_name}")
        # Initialize vector store
        self.vector_store = Qdrant.from_existing_collection(
            embedding=self.embedding_model,
            collection_name=self.collection_name,
            url=f"http://{host}:{port}",
        )
        # Create a retriever
        self.retriever = self.vector_store.as_retriever(
            search_type="similarity", search_kwargs={"k": 5}  # Retrieve top 5 matches
        )
        logger.debug(f"RAGService initialized with collection: {collection_name}")

    def retrieve_documents(self, query: str):
        """Retrieves relevant documents from Qdrant."""
        try:
            retrieved_docs = self.retriever.invoke(query)

            # Debug: Print retrieved documents
            logger.debug(f"Retrieved {retrieved_docs} documents.")

            # Validate documents before returning
            valid_docs = [
                doc.page_content.strip()
                for doc in retrieved_docs
                if doc.page_content.strip() != ""
            ]
            logger.debug(f"Valid documents: {valid_docs}")
            return valid_docs  # Only return valid documents
        except Exception as e:
            logger.debug(f"Error retrieving documents: {e}")
            return []

    async def query(self, query: str):
        """Retrieves relevant documents and generates an answer using the Ollama API."""
        retrieved_docs = self.retrieve_documents(query)
        context = " ".join([doc for doc in retrieved_docs])
        logger.debug(f"Context: {context}")
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": f"Context: {context}"},
                {"role": "user", "content": query},
            ],
            "temperature": 0.7,
        }
        logger.debug(f"payload: {payload}")
        ollama_service = OllamaService()
        async for chunk in ollama_service.query(
            messages=payload["messages"], model=payload["model"]
        ):
            yield chunk
