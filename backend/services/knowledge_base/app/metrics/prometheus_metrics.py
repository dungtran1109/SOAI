from prometheus_client import Counter, Histogram

# === COUNTERS ===

# Document operations counters
documents_added_total = Counter(
    "knowledge_base_documents_added_total",
    "Total number of documents added to knowledge base"
)
documents_deleted_total = Counter(
    "knowledge_base_documents_deleted_total",
    "Total number of documents deleted from knowledge base"
)
documents_updated_total = Counter(
    "knowledge_base_documents_updated_total",
    "Total number of documents updated in knowledge base"
)

# Query counters
queries_total = Counter(
    "knowledge_base_queries_total",
    "Total number of queries executed against knowledge base"
)
queries_failed_total = Counter(
    "knowledge_base_queries_failed_total",
    "Total number of failed queries"
)

# Embedding counters
embeddings_generated_total = Counter(
    "knowledge_base_embeddings_generated_total",
    "Total number of embeddings generated"
)
embeddings_failed_total = Counter(
    "knowledge_base_embeddings_failed_total",
    "Total number of failed embedding generations"
)

# Qdrant operations counters
qdrant_upserts_total = Counter(
    "knowledge_base_qdrant_upserts_total",
    "Total number of upsert operations to Qdrant"
)
qdrant_searches_total = Counter(
    "knowledge_base_qdrant_searches_total",
    "Total number of search operations in Qdrant"
)
qdrant_errors_total = Counter(
    "knowledge_base_qdrant_errors_total",
    "Total number of Qdrant errors"
)

# === HISTOGRAMS ===

# Response time histograms
query_response_time_seconds = Histogram(
    "knowledge_base_query_response_time_seconds",
    "Time taken to execute queries",
    buckets=[0.1, 0.25, 0.5, 1.0, 2.0, 5.0, 10.0]
)
embedding_generation_time_seconds = Histogram(
    "knowledge_base_embedding_generation_time_seconds",
    "Time taken to generate embeddings",
    buckets=[0.1, 0.25, 0.5, 1.0, 2.0, 5.0, 10.0]
)
document_processing_time_seconds = Histogram(
    "knowledge_base_document_processing_time_seconds",
    "Time taken to process and store documents",
    buckets=[0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0]
)
