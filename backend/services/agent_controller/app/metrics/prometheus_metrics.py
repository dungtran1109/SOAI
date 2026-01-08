from prometheus_client import Counter, Histogram

# === COUNTERS ===

# WebSocket connection counters
websocket_connections_total = Counter(
    "agent_controller_websocket_connections_total",
    "Total number of WebSocket connections established"
)
websocket_disconnections_total = Counter(
    "agent_controller_websocket_disconnections_total",
    "Total number of WebSocket disconnections"
)
websocket_errors_total = Counter(
    "agent_controller_websocket_errors_total",
    "Total number of WebSocket errors"
)

# Chat message counters
chat_messages_received_total = Counter(
    "agent_controller_chat_messages_received_total",
    "Total number of chat messages received from clients"
)
chat_messages_sent_total = Counter(
    "agent_controller_chat_messages_sent_total",
    "Total number of chat messages sent to clients"
)

# GenAI interaction counters
genai_requests_total = Counter(
    "agent_controller_genai_requests_total",
    "Total number of requests made to GenAI service"
)
genai_requests_failed_total = Counter(
    "agent_controller_genai_requests_failed_total",
    "Total number of failed requests to GenAI service"
)

# RAG query counters
rag_queries_total = Counter(
    "agent_controller_rag_queries_total",
    "Total number of RAG queries executed"
)
rag_queries_failed_total = Counter(
    "agent_controller_rag_queries_failed_total",
    "Total number of failed RAG queries"
)

# === HISTOGRAMS ===

# Response time histograms
chat_response_time_seconds = Histogram(
    "agent_controller_chat_response_time_seconds",
    "Time taken to generate chat responses",
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0]
)
genai_response_time_seconds = Histogram(
    "agent_controller_genai_response_time_seconds",
    "Time taken for GenAI service to respond",
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0]
)
