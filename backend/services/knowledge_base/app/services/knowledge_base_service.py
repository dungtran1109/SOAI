from services.qdrant import QdrantDB
from typing import List, Optional, Dict


class KnowledgeBaseService:
    @staticmethod
    def search(query: str, collection_name: str, embedding_model: str, filters: Optional[Dict] = None, top_k: int = 3):
        qdrantdb = QdrantDB(collection_name=collection_name)
        return qdrantdb.search(query=query, embedding_model=embedding_model, top_k=top_k, filters=filters)

    @staticmethod
    def add(texts: List[str], collection_name: str, embedding_model: str, payloads: Optional[List[Dict]] = None):
        qdrantdb = QdrantDB(collection_name=collection_name)
        return qdrantdb.add(texts=texts, embedding_model=embedding_model, payloads=payloads)

    @staticmethod
    def retrieve(collection_name: str):
        qdrantdb = QdrantDB(collection_name=collection_name)
        return qdrantdb.retrieve()
