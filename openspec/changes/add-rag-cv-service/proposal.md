# Change: Add CV Retrieval-Augmented Generation (RAG) Service

## Why
Recruiters and agents need semantic search and grounded answers across uploaded CVs and job descriptions. Current flows focus on CV/JD ingestion and interview orchestration but lack retrieval over embeddings with citations.

## What Changes
- Introduce a CV RAG capability that indexes CVs as chunks with embeddings in Qdrant and exposes a query API.
- Extend `recruitment_agent` to:
  - Ingest CVs → parse → chunk → embed → upsert to Qdrant via Celery worker.
  - Do NOT host the RAG query API.
    
- Extend `agent_controller` to:
  - Do NOT create a new HTTP API for RAG. Implement the RAG logic inside the WebSocket conversation flow (`/api/v1/agent-controller/conversations/realtime`).
  - Call `knowledge_base` directly for retrieval (Qdrant search) and `gen_ai_provider` for grounded completion.
- Extend `knowledge_base` to provide embedding storage/retrieval helpers and collection/schema management.
- Update `agent_controller` with updating on endpoint `/conversations/realtime` to answer questions via direct KB + GenAI calls (no new HTTP API)  
  - Agent Controller WebSocket endpoint (`/api/v1/agent-controller/conversations/realtime`) SHALL forward user text and optional filters to the internal RAG logic, which queries Knowledge Base `/api/v1/knowledge-base/documents/search/` and invokes GenAI provider to produce grounded answers with citations.
  - Fallback behavior: If `/api/v1/knowledge-base/documents/search/` returns no valid information (empty citations, retrieval error, or below threshold), respond clearly with "No relevant context found; please provide more details." and optionally continue with ungrounded chat if configured.
- Use `gen_ai_provider` to abstract embedding and completion models (OpenAI/Anthropic/Google, or local transformer).
- Add Helm values to enable/scale RAG workers and configure embedding model + Qdrant collection names.
- Instrument ingestion/query with OpenTelemetry and Prometheus metrics.

## Impact
- Affected services:
  - Python: `backend/services/recruitment_agent`, `backend/services/knowledge_base`, `backend/services/gen_ai_provider`
  - Data: `qdrant` collection `cv_embeddings`
  - Helm: `helm/soai-application/values.yaml` (new `server.recruitment.rag.*` and `knowledgeBase.rag.*` knobs)
- Backward compatibility:
  - Non-breaking additions (new endpoints and jobs). Existing CV/JD flows remain unchanged.
- Observability:
  - Add OTEL spans for parse/chunk/embed/upsert and query; Prometheus counters/histograms for latency and throughput.
