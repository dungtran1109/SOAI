from services.qdrant import QdrantDB
from typing import List


class KnowledgeBaseService:
    @staticmethod
    def search(query: str, collection_name: str, embedding_model: str):
        qdrantdb = QdrantDB(collection_name=collection_name)
        return qdrantdb.search(query=query, embedding_model=embedding_model)

    @staticmethod
    def add(texts: List[str], collection_name: str, embedding_model: str):
        qdrantdb = QdrantDB(collection_name=collection_name)
        return qdrantdb.add(texts=texts, embedding_model=embedding_model)

    @staticmethod
    def retrieve(collection_name: str):
        qdrantdb = QdrantDB(collection_name=collection_name)
        return qdrantdb.retrieve()
