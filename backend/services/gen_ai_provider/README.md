# GenAI Provider

## RAG Endpoint

POST `/api/v1/gen-ai/rag/query`

Request body:
```json
{
  "query": "How do we deploy the app?",
  "model": "llama3.2",
  "temperature": 0.5,
  "top_k": 3,
  "collection_name": "knowledge_base",
  "embedding_model": "text-embedding-3-large",
  "stream": false
}
```

Response (non-stream):
```json
{
  "status": "success",
  "data": {
    "answer": "...",
    "citations": [
      {"doc_id": null, "chunk_index": 0, "score": 0.92, "text": "...", "metadata": null, "uri": null}
    ],
    "usage": null
  }
}
```

Streaming: set `"stream": true` to receive chunked text followed by a JSON frame with `citations`.

## Configuration
- `KB_HOST` (default `knowledge_base_service:8006`)
- `RAG_DEFAULT_TOP_K` (default `3`)
- `RAG_DEFAULT_STREAM` (default `false`)
