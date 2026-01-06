## Context
We are adding RAG over CVs to support semantic queries and grounded answers. The system already includes FastAPI services (`recruitment_agent`, `knowledge_base`, `gen_ai_provider`) and Qdrant. We will index CVs into Qdrant and expose a query API returning answers with citations.

## Goals / Non-Goals
- Goals: Reliable ingestion, configurable embedding provider, fast retrieval, clear citations, role-based access, observability, Helm-configurable.
- Non-Goals: Full-document summarization of all CVs; multi-tenant isolation beyond current auth model; long-term analytics (handled by ClickHouse/other).

## Decisions
- Storage: Use Qdrant collection `cv_embeddings` with vector size based on provider; payload stores candidate metadata.
- Chunking: Start with 800–1200 character windows, 200–300 overlap; revisit based on empirical results.
- Embeddings: Default OpenAI `text-embedding-3-large`; allow Anthropic/Google;
- Top-K: Default 5; configurable via Helm.
- Answering: Use `gen_ai_provider` completion with concatenated contexts and simple prompt; add guardrails to cap context length.
- Observability: OTEL spans for each phase; Prometheus counters/histograms for throughput/latency.
- Agent Controller flow: On each user message from WebSocket `/api/v1/agent-controller/conversations/realtime`, invoke local RAG logic (no new HTTP endpoint). This logic calls `knowledge_base` `/api/v1/knowledge-base/documents/search/` directly for top‑k chunks, builds grounded prompt with chunk IDs, and invokes `gen_ai_provider` to reply. If citations are empty or an error occurs, send a clear fallback message (e.g., "No relevant context found; please provide more details.") and optionally proceed with ungrounded LLM response.

## Risks / Trade-offs
- Cost & latency for external embeddings → Mitigate with batching, caching, and local embedding option.
- PII exposure in payload → Limit fields and enforce access control; consider hashing emails if not needed.
- Relevance drift if chunking poorly tuned → Monitor feedback, adjust chunk size/overlap.
- Qdrant resource limits → Configure replicas/resources in Helm; monitor vector index size.
 - User experience on empty retrieval → Provide explicit message and avoid misleading answers; consider enabling ungrounded continuation behind a feature flag.

## Migration Plan
1. Create collection and index.
2. Implement ingestion path triggered on CV upload.
3. Implement RAG logic within `agent_controller` ChatService/WebSocket (no new HTTP endpoint); integrate provider and KB search.
4. Update Agent Controller WebSocket to use the internal RAG logic and handle fallback messaging.
5. Add metrics and tracing.
6. Helm values; deploy staging and backfill existing CVs.
7. Validate performance; tune top-k and chunking.
8. Roll out to production.

## Open Questions
- Do we require multi-language support for CVs? If yes, detect language and embed per language-specific model.
- Should recruiters be able to filter by JD ID to contextualize answers further?
- Do we need result deduplication across near-identical chunks?
 - What score threshold defines "no valid information" for fallback messaging?
