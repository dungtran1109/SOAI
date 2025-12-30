## Context
We are adding RAG over CVs to support semantic queries and grounded answers. The system already includes FastAPI services (`recruitment_agent`, `knowledge_base`, `gen_ai_provider`) and Qdrant. We will index CVs into Qdrant and expose a query API returning answers with citations.

## Goals / Non-Goals
- Goals: Reliable ingestion, configurable embedding provider, fast retrieval, clear citations, role-based access, observability, Helm-configurable.
- Non-Goals: Full-document summarization of all CVs; multi-tenant isolation beyond current auth model; long-term analytics (handled by ClickHouse/other).

## Decisions
- Storage: Use Qdrant collection `cv_embeddings` with vector size based on provider; payload stores candidate metadata.
- Chunking: Start with 800–1200 character windows, 200–300 overlap; revisit based on empirical results.
- Embeddings: Default OpenAI `text-embedding-3-small`; allow Anthropic/Google; optionally local `@xenova/transformers` as fallback.
- Top-K: Default 5; configurable via Helm.
- Answering: Use `gen_ai_provider` completion with concatenated contexts and simple prompt; add guardrails to cap context length.
- Observability: OTEL spans for each phase; Prometheus counters/histograms for throughput/latency.
- Security: Restrict `/rag/query` to ADMIN/RECRUITER; sanitize payload; avoid storing raw PII beyond name/email.

## Risks / Trade-offs
- Cost & latency for external embeddings → Mitigate with batching, caching, and local embedding option.
- PII exposure in payload → Limit fields and enforce access control; consider hashing emails if not needed.
- Relevance drift if chunking poorly tuned → Monitor feedback, adjust chunk size/overlap.
- Qdrant resource limits → Configure replicas/resources in Helm; monitor vector index size.

## Migration Plan
1. Create collection and index.
2. Implement ingestion path triggered on CV upload.
3. Implement query endpoint; integrate provider.
4. Add metrics and tracing.
5. Helm values; deploy staging and backfill existing CVs.
6. Validate performance; tune top-k and chunking.
7. Roll out to production.

## Open Questions
- Do we require multi-language support for CVs? If yes, detect language and embed per language-specific model.
- Should recruiters be able to filter by JD ID to contextualize answers further?
- Do we need result deduplication across near-identical chunks?
