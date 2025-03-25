import aiohttp
from qdrant_client import QdrantClient
from langchain_community.llms import Ollama
from langchain_community.vectorstores import Qdrant
from config.constants import *

# Constants
COLLECTION_NAME = "rag_collection"
VECTOR_DIM = 384  # Ensure this matches the embedding model output size

class QdrantDB:
    """Handles Qdrant vector database operations."""

    def __init__(self, collection_name: str = COLLECTION_NAME):
        self.collection_name = collection_name
        self.client = QdrantClient("qdrant", port=6333)


class RAGPipeline:
    """Implements a RAG (Retrieval-Augmented Generation) pipeline using Ollama."""

    def __init__(
        self,
        vector_db: QdrantDB,
        embedding_model: EmbeddingModel,
        model: str = {DEFAULT_MODEL_NAME},
    ):
        self.vector_db = vector_db
        self.embedding_model = embedding_model
        self.llm = Ollama(model=model)  # Change model if needed
        self.vector_store = Qdrant(
            client=self.vector_db.client,
            collection_name=COLLECTION_NAME,
            embeddings=self.embedding_model.model,
        )
        self.retriever = self.vector_store.as_retriever()
    #     self.qa_chain = self._initialize_qa_chain()

    # def _initialize_qa_chain(self):
    #     """Creates a custom prompt and initializes the QA retrieval chain."""
    #     prompt_template = PromptTemplate(
    #         input_variables=["context", "question"],
    #         template="Context: {context}\n\nQuestion: {question}\n\nAnswer:",
    #     )
    #     return load_qa_chain(self.llm, chain_type="stuff", prompt=prompt_template)

    # def add_documents(self, texts: List[str]):
    #     """Embeds and stores documents in Qdrant."""
    #     embeddings = self.embedding_model.generate_embeddings(texts)
    #     self.vector_db.insert_documents(texts, embeddings)

    async def ask_question(self, query: str):
        """Retrieves relevant documents and generates an answer using the Ollama API."""
        retrieved_docs = self.vector_db.retrieve_documents(query, self.retriever)
        context = " ".join([doc["text"] for doc in retrieved_docs])

        payload = {
            "model": "gpt-4o-mini",  # Replace with your model name
            "messages": [
                {"role": "system", "content": f"Context: {context}"},
                {"role": "user", "content": query}
            ],
            "temperature": 0.7
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.ollama_url}/api/chat", json=payload) as response:
                if response.status != 200:
                    return "Failed to retrieve answer from Ollama API"
                data = await response.json()
                return data.get("message", {}).get("content", "No answer found")


# # ✅ Step 1: Initialize Components
# vector_db = QdrantDB()
# embedding_model = EmbeddingModel()
# rag_pipeline = RAGPipeline(vector_db, embedding_model)

# # ✅ Step 2: Add Documents to Qdrant
# documents = [
#     "LangChain simplifies AI application development.",
#     "Qdrant is a powerful vector database for semantic search.",
#     "Ollama is an offline LLM framework for running models locally."
# ]
# rag_pipeline.add_documents(documents)
# print("✅ Documents added successfully!")

# # ✅ Step 3: Ask a Question (RAG in Action)
# question = "What is LangChain?"
# response = rag_pipeline.ask_question(question)

# print("\n🧠 RAG Response:")
# print(response)
