import uuid
import logging
import qdrant_client
from qdrant_client.http.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
)
from services.embedding import Embedding
from config.constants import DEFAULT_COLLECTION_NAME

logger = logging.getLogger(__name__)


class QdrantDB:
    """Handles Qdrant operations for vector database storage and retrieval."""

    def __init__(self, collection_name: str = DEFAULT_COLLECTION_NAME):
        self.collection_name = collection_name
        self.client, self.collection_info = self.get_or_create_qdrant_collection(
            collection_name=collection_name
        )

    def retrieve(self, limit=100, offset=0):
        """Retrieves stored documents with manual pagination."""
        documents = []
        current_offset = 0

        try:
            while len(documents) < limit:
                points, next_offset = self.client.scroll(
                    collection_name=self.collection_name,
                    with_payload=True,
                    limit=100,  # Retrieve in chunks
                )

                for point in points:
                    if current_offset >= offset:
                        documents.append(
                            point.payload.get("page_content", "No text found")
                        )

                    current_offset += 1

                    # Stop when limit is reached
                    if len(documents) >= limit:
                        return {"documents": documents, "next_offset": next_offset}

                if not next_offset:
                    break  # Stop if no more data

        except Exception as e:
            logger.error(f"Error retrieving documents: {e}")

        return {"documents": documents, "next_offset": None}

    def search(self, query: str, embedding_model: str, top_k=3, filters=None):
        """Performs a similarity search in Qdrant with optional payload filters."""
        try:
            embedding = Embedding(embedding_model).get_embedding_model()
            query_embedding = embedding.embed_query(query)

            query_filter = None
            if isinstance(filters, dict) and filters:
                must_conditions = []
                for key, value in filters.items():
                    if value is None:
                        continue
                    try:
                        must_conditions.append(
                            FieldCondition(key=key, match=MatchValue(value=value))
                        )
                    except Exception:
                        continue
                if must_conditions:
                    query_filter = Filter(must=must_conditions)

            search_results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                limit=top_k,
                with_payload=True,
                query_filter=query_filter,
            )
            results = []
            for point in search_results:
                results.append(
                    {
                        "id": point.id,
                        "page_content": point.payload.get("page_content", ""),
                        "score": point.score,
                        "payload": {k: v for k, v in point.payload.items() if k != "page_content"},
                    }
                )
            return results

        except Exception as e:
            logger.error(f"Error searching Qdrant: {e}")
            return []

    def add(self, texts: list[str], embedding_model: str, payloads: list[dict] | None = None):
        """Adds multiple documents into Qdrant with embeddings and optional payloads per text."""
        if not texts or not any(text.strip() for text in texts):
            logger.error("No text found in the request.")
            return False

        try:
            embedding = Embedding(embedding_model).get_embedding_model()
            embeddings = embedding.embed_documents(texts)
            points = []
            for idx, (text, embedding_vector) in enumerate(zip(texts, embeddings)):
                payload = {"page_content": text}
                if payloads and idx < len(payloads) and isinstance(payloads[idx], dict):
                    # Merge metadata while keeping page_content separate
                    payload.update(payloads[idx])
                points.append(
                    PointStruct(
                        id=str(uuid.uuid4()),
                        vector=embedding_vector,
                        payload=payload,
                    )
                )

            self.client.upsert(collection_name=self.collection_name, points=points)
            return True

        except Exception as e:
            logger.exception(f"Error adding documents to Qdrant: {e}")
            return False

    @staticmethod
    def get_or_create_qdrant_collection(
        qdrant_host="qdrant",
        qdrant_port=6333,
        vector_dimension=3072,
        collection_name=DEFAULT_COLLECTION_NAME,
    ):
        """Gets or creates a Qdrant collection."""

        try:
            client = qdrant_client.QdrantClient(qdrant_host, port=qdrant_port)

            if not client.collection_exists(collection_name):
                logger.error(f"Creating new Qdrant collection: {collection_name}")
                client.create_collection(
                    collection_name=collection_name,
                    vectors_config=VectorParams(
                        size=vector_dimension, distance=Distance.COSINE
                    ),
                )

            return client, client.get_collection(collection_name)

        except Exception as e:
            logger.error(f"Failed to connect to Qdrant: {e}")
            raise
