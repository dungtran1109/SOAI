## 0. Approval & Guardrails
- [ ] 0.1 Do not implement code until this proposal is approved (OpenSpec workflow).
- [ ] 0.2 Confirm accepted file types (TXT/PDF/DOCX/VTT), size limits, and USER-only authorization.
- [ ] 0.3 Confirm use of existing GenAI Provider `POST /api/v1/gen-ai/chat` for extraction (no new provider endpoint in v1).

## 1. Implementation
- [ ] 1.1 Define DB schema: `scorecard_templates`, `scorecards`, `transcriptions` with FKs to `interviews`, `job_descriptions`, and `users`.
- [ ] 1.2 Implement template upload API (multipart JSON) and storage; versioning strategy.
- [ ] 1.3 Implement scorecard CRUD APIs: create/update grades, notes, decisions per `interviewId`.
- [ ] 1.4 Implement transcription upload/store APIs for JD and interview artifacts; accept text/PDF initially.
 - [ ] 1.4 Implement transcription upload/store APIs for JD and interview artifacts; accept TXT/PDF/DOCX and VTT (audio transcript). Parse VTT to normalized text with timestamps.
- [ ] 1.5 Add listing/filtering endpoints (by candidate, interview, JD, date) with pagination.
- [ ] 1.6 Wire authorization (JWT) and roles; restrict write operations to authorized roles.
- [ ] 1.7 Add OTEL instrumentation and Prometheus metrics for key operations.
- [ ] 1.8 Update Nginx and web app clients only if new base paths are introduced (target remains `/api/v1/recruitment`).
 - [x] 1.9 Add auto-fill endpoint:
	 - `POST /scorecards/auto-fill` (single multipart upload: `jdFile` TXT/PDF/DOCX, `templateFile` TXT/PDF/DOCX, `transcriptFile` TXT/PDF/DOCX/VTT, optional `gradePayload` JSON)
	 - `POST /scorecards/{interviewId}/finalize` to persist proposed scorecard
 - [ ] 1.10 Implement mapping and confidence scoring; mark low-confidence fields for manual review.
 - [ ] 1.11 Use existing `GenAI` class in `backend/services/recruitment_agent/app/services/genai.py` to call GenAI Provider `POST /api/v1/gen-ai/chat` with schema-constrained prompts; add structured JSON parsing, timeouts, retries, and error handling. Avoid introducing a separate adapter.
 - [ ] 1.12 Implement `SchemaBuilder` to derive internal JSON schema from uploaded template (TXT/PDF/DOCX) and enforce types/required fields.
 - [ ] 1.13 Add `AUTO_FILL_MODE` (`genai`|`deterministic`) and `AUTO_FILL_MODEL` env vars; default `genai`.

## 2. Integration & Optional Async
- [ ] 2.1 Optional: Add Celery tasks for heavy parsing/transcription generation.
- [ ] 2.2 Optional: Integrate GenAI Provider for audio transcription (future scope).
 - [ ] 2.3 Integrate GenAI Provider for field extraction from JD/transcript to template fields (prompted mapping); feature flag.
 - [ ] 2.4 Implement parsers/converters:
	 - DOCX → text, PDF → text (existing libs), TXT passthrough
	 - Template file (TXT/PDF/DOCX) → internal JSON schema
	 - VTT → normalized transcript JSON/text
 - [ ] 2.5 Add deterministic fallback extractor (regex/section heuristics) for key fields when GenAI is unavailable.
 - [ ] 2.6 Add circuit breaker/rate limiting for GenAI calls to prevent cascading failures.

## 3. Testing
- [ ] 3.1 Unit tests for services/models.
- [ ] 3.2 API tests for template upload, scorecard CRUD, and transcription endpoints.
- [ ] 3.3 Auth tests for role-restricted endpoints.
 - [ ] 3.4 Mocked GenAI tests: happy path (valid JSON), timeout/error, and fallback to deterministic.
 - [ ] 3.5 Schema validation tests: required fields, type mismatches, low-confidence handling.

## 4. Docs & Observability
- [ ] 4.1 Update `doc/API_Docs` OpenAPI.
- [ ] 4.2 Add metrics names and OTEL spans to observability docs.
- [ ] 4.3 Update `openspec/project.md` references if needed.
 - [ ] 4.4 Document auto-fill request/response schema and confidence thresholds.
 - [ ] 4.5 Document accepted file types (TXT/PDF/DOCX/VTT), size limits, and validation errors.

## 5. Validation
- [ ] 5.1 Run `openspec validate add-recruitment-scorecard --strict` and fix any issues.
