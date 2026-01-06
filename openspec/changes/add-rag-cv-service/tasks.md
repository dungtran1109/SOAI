## 1. Implementation
- [ ] 1.1 Add Qdrant collection `cv_embeddings` with payload schema (candidate_id, candidate_name, email, position, source_doc)
- [ ] 1.2 In `recruitment_agent`, create Celery task: parse PDF (PyMuPDF) → chunk (token/char-based) → embed → upsert to Qdrant
- [ ] 1.3 Implement RAG logic inside `agent_controller` ChatService/WebSocket (no new HTTP endpoint); enforce role guard (ADMIN/RECRUITER) via WebSocket auth.
- [ ] 1.4 Implement `knowledge_base` helpers: upsert/search wrappers; collection management
- [ ] 1.5 Integrate `gen_ai_provider` for embedding provider selection (OpenAI/Anthropic/Google or local transformers)
- [ ] 1.6 Observability: OTEL spans and Prometheus metrics for ingestion and query
- [ ] 1.7 Helm: add values and templates for `server.recruitment.rag.*`, embedding provider/model, and worker scaling
- [ ] 1.8 Tests: unit tests for chunking; integration tests for ingest → query (use test fixtures)
- [ ] 1.9 Docs: update `doc/recruitment-user_guide.md` and API docs; link in `openspec/project.md`
 - [ ] 1.10 Agent Controller integration: in `agent_controller` ChatService and WebSocket router, invoke internal RAG logic to call Knowledge Base `/api/v1/knowledge-base/documents/search/` directly and include citations/metadata in chat response (no new HTTP API)
 - [ ] 1.11 Knowledge Base search: return payload metadata with results and add optional filters (e.g., `position`, `collection`) using Qdrant conditions (exclude `candidate_name`)
 - [ ] 1.12 Prompt building: construct grounded prompt from top‑k chunks with identifiers; cap context length; fallback messaging: if `/rag/query` returns no valid info (empty citations/error/low score), reply "No relevant context found; please provide more details." and optionally continue with ungrounded chat if enabled
 - [ ] 1.13 Response schema: define `answer`, `citations[{id,text,score}]`, and `metadata{filters_applied}` for `/rag/query` and ChatService output (no `candidate_name` in payload)

## 2. Rollout
- [ ] 2.1 Deploy in staging; backfill existing CVs via batch task
- [ ] 2.2 Monitor metrics (latency, error rate); tune top-k and thresholds
- [ ] 2.3 Enable in production; gradual worker scaling
- [ ] 2.4 Add alerts on ingestion failures and query errors
 - [ ] 2.5 Rate limiting within ChatService RAG path to protect resources; add simple quota per minute per user/conversation
 - [ ] 2.6 Migration: purge/remove `candidate_name` from existing Qdrant payloads in `cv_embeddings` (one-off script/task)
 - [ ] 2.7 Feature flag: control whether ungrounded continuation is allowed after fallback; default disabled

## 3. Security & Compliance
- [ ] 3.1 Validate PII storage; limit payload to necessary fields
 - [ ] 3.2 Ensure authorization and audit logs on ChatService RAG flow in `agent_controller` (WebSocket authenticated, audit key events)
- [ ] 3.3 Key management via Kubernetes secrets/Helm; no keys in repo
 - [ ] 3.4 Restrict advanced filters to `ADMIN/RECRUITER` roles where appropriate; enforce JWT on Agent Controller chat
 - [ ] 3.5 Verify that `candidate_name` is not stored in payloads; add a unit test/assertion for KB add path
 - [ ] 3.6 Ensure Agent Controller only forwards minimal filters to Knowledge Base search and does not log sensitive text; mask email if present; remove coupling to `recruitment_agent` for RAG queries
