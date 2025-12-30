# Change: Add CV Retrieval-Augmented Generation (RAG) Service

## Why
Recruiters and agents need semantic search and grounded answers across uploaded CVs and job descriptions. Current flows focus on CV/JD ingestion and interview orchestration but lack retrieval over embeddings with citations.

## What Changes
- Introduce a CV RAG capability that indexes CVs as chunks with embeddings in Qdrant and exposes a query API.
- Extend `recruitment_agent` to:
  - Ingest CVs → parse → chunk → embed → upsert to Qdrant via Celery worker.
  - Expose `/rag/query` endpoint to answer questions with citations.
- Extend `knowledge_base` to provide embedding storage/retrieval helpers and collection/schema management.
- Update `agent_controller` with updating on endpoint `/conversations/realtime` to call `/rag/query` to answer questions  
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
- Security:
  - Enforce role-based access (ADMIN/RECRUITER) for `/rag/query`.
  - Keys provided via env/Helm secrets. PII protected; payload stores minimal metadata and SHALL NOT include `candidate_name`.
  - Stored payload fields: `candidate_id`, `email` (optional), `position`, `source_doc`. Consider hashing or omitting `email` if not required.
- Observability:
  - Add OTEL spans for parse/chunk/embed/upsert and query; Prometheus counters/histograms for latency and throughput.
