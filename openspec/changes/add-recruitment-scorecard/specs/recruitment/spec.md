## ADDED Requirements

### Requirement: Scorecard Template Upload
The system SHALL allow authorized users to upload and version reusable scorecard templates from TXT, PDF, or DOCX and parse them into an internal JSON schema.

#### Scenario: Upload template (TXT/PDF/DOCX) success
- **WHEN** a recruiter uploads a valid template file (TXT/PDF/DOCX) via `POST /api/v1/recruitment/scorecards/templates/upload`
- **THEN** the raw file and parsed schema are stored with a version and metadata, returning template ID

#### Scenario: Invalid template rejected
- **WHEN** the payload is missing required fields, exceeds size limits, or the file type is not TXT/PDF/DOCX
- **THEN** the API returns validation error and does not store the template

### Requirement: Scorecard Create/Update
The system SHALL allow creating and updating a scorecard for a specific interview, linked to JD and candidate.

#### Scenario: Create scorecard for interview
- **WHEN** an interviewer submits grades, notes, and decision to `POST /api/v1/recruitment/scorecards/{interviewId}`
- **THEN** the scorecard is stored and linked to the interview and JD

#### Scenario: Update scorecard
- **WHEN** an authorized user sends `PUT /api/v1/recruitment/scorecards/{scorecardId}` with changes
- **THEN** the scorecard is updated and version history recorded

### Requirement: Scorecard Retrieval & Listing
The system SHALL provide secure retrieval and listing of scorecards with filters and pagination.

#### Scenario: Get scorecard by interview
- **WHEN** a user requests `GET /api/v1/recruitment/scorecards/by-interview/{interviewId}`
- **THEN** the API returns the associated scorecard data

#### Scenario: List scorecards with filters
- **WHEN** a recruiter calls `GET /api/v1/recruitment/scorecards?candidateId=&jdId=&dateFrom=&dateTo=`
- **THEN** the API returns paginated results matching filters

### Requirement: Transcription Upload & Storage
The system SHALL accept transcriptions for interviews and job descriptions in TXT, PDF, DOCX, and audio transcripts in VTT format, and store them for retrieval.

#### Scenario: Upload transcription (TXT/PDF/DOCX/VTT)
- **WHEN** a user uploads a transcription file (TXT/PDF/DOCX/VTT) to `POST /api/v1/recruitment/transcriptions/upload`
- **THEN** the transcription is stored (and parsed if VTT) and linked to the target entity (interview/JD)

#### Scenario: Retrieve transcription
- **WHEN** a user requests `GET /api/v1/recruitment/transcriptions/{entityType}/{entityId}`
- **THEN** the API returns stored transcription content

### Requirement: Authorization & Roles
The system MUST enforce JWT authentication. Only the USER role is allowed to create/update/auto-fill/finalize scorecards; all other roles are forbidden for these operations.

#### Scenario: Unauthorized access blocked
- **WHEN** a request lacks a valid JWT
- **THEN** the API returns 401 and does not process the operation

#### Scenario: Non-USER role forbidden
- **WHEN** an ADMIN/RECRUITER/INTERVIEWER attempts to create/update/auto-fill/finalize a scorecard
- **THEN** the API returns 403 and does not change state

### Requirement: Observability for Scorecard Lifecycle
The system SHALL emit traces and metrics for template upload, scorecard create/update, and transcription operations.

#### Scenario: Metrics and traces emitted
- **WHEN** endpoints are exercised under normal operation
- **THEN** Prometheus counters/histograms and OTEL traces are available for dashboards

### Requirement: Scorecard Auto-Fill From Artifacts
The system SHALL auto-fill a scorecard by processing uploaded artifacts: job description (TXT/PDF/DOCX), scorecard template (TXT/PDF/DOCX), interview transcription (TXT/PDF/DOCX/VTT), and optional grade input.

#### Scenario: Auto-fill with uploaded files
 **WHEN** a user sends `POST /api/v1/recruitment/scorecards/auto-fill` with a single multipart payload containing `jdFile` (TXT/PDF/DOCX), `templateFile` (TXT/PDF/DOCX), `transcriptFile` (TXT/PDF/DOCX/VTT), and optional `gradePayload` (JSON), and may specify `mode=genai|deterministic` (default `genai`)
 **THEN** the system extracts relevant information and returns a proposed scorecard mapped to the template fields with confidence scores; the proposal is not persisted until confirmation

 (Deprecated) The ID-based auto-fill variant is removed in favor of the single upload API.
#### Scenario: GenAI unavailable — fallback
 **WHEN** the request uses `mode=genai` but the GenAI Provider times out or returns an error
 **THEN** the system falls back to deterministic extraction where possible and flags low-confidence or unavailable fields for manual entry

#### Scenario: Finalize proposed scorecard
- **WHEN** a user confirms a proposal via `POST /api/v1/recruitment/scorecards/{interviewId}/finalize` with `proposalId` (or the proposal body)
- **THEN** the system persists the scorecard linked to the `interviewId` and associated `jdId`/candidate, recording version/history

#### Scenario: Partial fill with manual review
- **WHEN** the system cannot confidently populate some fields (below threshold)
- **THEN** those fields are marked as pending and returned for manual entry; the user may override values before finalizing

#### Scenario: Validation errors on artifacts
- **WHEN** the template schema does not match expected format, or files are invalid/too large
- **THEN** the API returns 4xx with details and does not proceed to auto-fill
