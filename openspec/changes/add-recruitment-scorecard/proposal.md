# Change: Add Recruitment Scorecard (template upload, grading, transcription)

## Why
Interviewers and hiring managers need a consistent way to capture candidate assessments. The system currently supports CV/JD uploads and interview scheduling but lacks a structured scorecard to store grades, notes, and transcriptions linked to specific interviews and job descriptions.

## What Changes
- Add scorecard capability to Recruitment Agent service under `/api/v1/recruitment/scorecards/*`.
- Upload a reusable scorecard template (form fields and sections) and version it.
- Submit and update grades, notes, and decisions per interview; support linking to the related JD and candidate.
- Store and access interview and JD transcriptions.
- Expose CRUD + search APIs for templates and scorecards; secure endpoints via JWT.
- Persist scorecards and templates; emit OTEL spans and Prometheus metrics; include pagination and basic filtering.

### Auto-Fill Scope (New)
 - Auto-fill a scorecard proposal via a single multipart upload API that accepts multiple artifacts together: JD provided as `jdFile` (TXT/PDF/DOCX) or `jdId` (reference to existing JD in DB), scorecard template (TXT/PDF/DOCX), interview transcription (TXT/PDF/DOCX/VTT, required), and optional grade file (`gradeFile`, JSON). If both `jdFile` and `jdId` are provided, `jdFile` takes precedence.
- Endpoint returns a proposed scorecard with confidence scores in one response; proposal is not persisted until explicitly finalized.
- Finalize endpoint persists the proposal linked to interview/JD/candidate; support manual overrides for low-confidence fields.
 - Authorization: Only USER role may create/update/auto-fill/finalize scorecards; other roles receive 403.
 - Parsing approach: v1 uses existing GenAI Provider `chat` endpoint with schema-constrained prompts; fallback to deterministic extraction when unavailable. A dedicated GenAI extraction endpoint can be proposed separately if needed.

## File Types (Decided)
- Job Description (JD): TXT, PDF, DOCX
- Scorecard Template: TXT, PDF, DOCX (parsed into internal JSON schema)
- Interview Transcript: TXT, PDF, DOCX; Audio transcript: VTT
- Grade payload: JSON (structured rubric values)

All uploads MUST be validated for type, size limits, and safety; unsupported types are rejected with 4xx.

## Impact
- Affected specs: `recruitment` capability.
- Affected code: Recruitment Agent (routers, models, services, Celery tasks), DB schema (new tables for `scorecard`, `scorecard_template`, `transcription`), possibly storage dirs for uploads.
- Frontend: New views/components to upload templates, fill scorecards, and view transcriptions.
- Observability: Additional traces/metrics for scorecard lifecycle.

## Assumptions / Open Questions
1. Terminology: Confirm "core card" = "scorecard" (assessment sheet). If different, specify required fields.
2. Grading schema: Numeric (0–100), categorical (e.g., Strong/Good/Fair), or both? Provide default rubric.
3. Linkage: Scorecard attaches to `interviewId`, `jobDescriptionId`, `candidateId`.
4. Security: JWT required; roles authorized (e.g., ADMIN, RECRUITER, INTERVIEWER). Confirm role list.
5. Storage: Templates versioned; transcriptions stored as text blobs; large files in object storage? Minimal scope: local persistent volume.
