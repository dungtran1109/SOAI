## Context
Recruitment Agent requires a first-class scorecard feature to capture interview assessments. It spans uploads (templates), structured grading, notes, and transcriptions, linked to interviews and job descriptions. Security and observability must remain consistent with existing patterns.

## Goals / Non-Goals
- Goals: Minimal, secure APIs for templates, scorecards, transcriptions; linkage to interviews/JDs; persistence; metrics/traces.
- Non-Goals: Full audio transcription pipeline, complex templating engines, advanced analytics UI.

## Decisions
- Endpoints live under `/api/v1/recruitment/scorecards/*` for scorecards and `/api/v1/recruitment/transcriptions/*` for transcriptions; templates at `/api/v1/recruitment/scorecards/templates/*`.
 - Template format: Accept TXT/PDF/DOCX uploads; parse to an internal JSON schema with sections/fields; store raw file and parsed schema + metadata.
- Grading: Support numeric and categorical values; accept free-form notes; decisions captured as enum (`Accepted/Rejected/Pending`).
 - Storage: Use MySQL tables; large file blobs stored in filesystem/PV path `UPLOAD_DIR` when necessary; references kept in DB. Persist original uploads (TXT/PDF/DOCX/VTT) and parsed artifacts.
 - Security: JWT required; for this feature (scorecard create/update/auto-fill/finalize), only the USER role is authorized. Non-USER roles (ADMIN/RECRUITER/INTERVIEWER) are forbidden (403). Read access rules for other entities remain unchanged.
- Observability: OTEL spans around upload/CRUD; Prometheus counters/histograms for latency and volume.
 - Auto-Fill: Single upload endpoint. The system constructs a proposed scorecard by extracting fields from JD (TXT/PDF/DOCX), transcript (TXT/PDF/DOCX/VTT), and merging provided grades, all provided together in one multipart request.
 - Parsing & Extraction: Recruitment uses existing GenAI Provider `chat` endpoint to perform schema-guided extraction. Pipeline (triggered by single upload endpoint):
	 1) Normalize uploads: DOCX/PDF → text; VTT → normalized text; TXT passthrough.
	 2) Build JSON schema from the parsed scorecard template (sections/fields with types/options).
	 3) Call GenAI Provider with a system prompt instructing strict JSON output matching the schema; include JD/transcription text.
	 4) Validate JSON (types, required fields), compute confidence; mark low-confidence for review.
	 5) If GenAI fails or times out, fall back to deterministic extraction (regex/section heuristics) where feasible.
## Request/Response (Auto-Fill Upload)
- Request: `POST /api/v1/recruitment/scorecards/auto-fill` (`multipart/form-data`)
- Parts: `jdFile` (TXT/PDF/DOCX) OR `jdId` (int), `templateFile` (TXT/PDF/DOCX), `transcriptFile` (TXT/PDF/DOCX/VTT, required), `gradeFile` (JSON file, optional); optional fields `mode=genai|deterministic` (default `genai`) and `model`
- Rules: At least one of `jdFile` or `jdId` is required. If both are provided, `jdFile` is used.
- Response: Proposed scorecard object with `grades`, `notes`, and `confidence` per field; not persisted

### JD Retrieval by ID
- When `jdFile` is not provided and `jdId` is present, load JD content from the database (table `job_description`) or via the service layer and normalize it to text before extraction.
- Authorization must ensure the requester has read access to the referenced JD; return 404/403 appropriately.
 - Mode selection: Request can specify `mode=genai|deterministic` (default `genai`) and optional `model` to hint provider model; recruiter service remains decoupled from provider details.
 - Resilience: Timeouts and retries for GenAI calls; idempotent finalize; circuit breaker to avoid cascading failures.

## Alternatives Considered
- Storing templates only as PDFs/DOCX (hard to compute and diff) → Prefer structured JSON for machine readability.
- Embedding transcriptions in GenAI Provider → Keep in Recruitment for ownership and linkability.
 - Deterministic regex-only extraction → Include GenAI Provider prompted extraction (with feature flag) for flexibility; fallback to deterministic rules where possible.
 - New GenAI "extract" endpoint → Defer; v1 leverages existing `chat` with schema-constrained prompts. Can propose a separate change if dedicated endpoint becomes necessary.
 - Accepting only JSON templates → Allow TXT/PDF/DOCX templates and parse to internal JSON for usability and compatibility with common authoring tools.

## Risks / Trade-offs
- Parsing PDFs/DOCX is brittle; start with JSON and plain text.
- Expanded DB schema increases migration complexity; mitigate with clear migration scripts.
 - LLM extraction may yield low-confidence values; mitigate with confidence thresholds and manual review/override paths.
 - VTT parsing variability (speaker labels, timestamps) may affect mapping quality; mitigate with normalization and unit tests.

## Migration Plan
- Create tables and migrations.
- Deploy APIs guarded behind feature flag (env `SCORECARD_ENABLED=true`).
- Rollout in staging with sample templates and interviews.
 - Enable `AUTO_FILL_ENABLED` separately; measure and tune confidence thresholds via dashboard.
 - Default `AUTO_FILL_MODE=genai`; provide config to force deterministic mode for offline environments.

## Open Questions
- Confirm accepted file types and maximum sizes.
- Confirm role mappings and permissions matrix.
- Confirm whether transcription generation (audio) is required in v1.
