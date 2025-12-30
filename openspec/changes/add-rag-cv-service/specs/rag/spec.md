## ADDED Requirements

### Requirement: CV Ingestion with Embeddings
The system SHALL parse uploaded CVs (PDF), chunk text, generate embeddings, and upsert to a Qdrant collection with minimal payload metadata.

#### Scenario: Ingest CV and index
- **WHEN** a user uploads a CV via `POST /cvs/upload`
- **THEN** a background task SHALL parse and chunk the CV
- **AND** generate embeddings using the configured provider
- **AND** upsert chunks to Qdrant under collection `cv_embeddings`
- **AND** store payload fields: `candidate_id`, `candidate_name`, `email`, `position`, `source_doc`

### Requirement: CV RAG Query API
The system SHALL provide a query endpoint to answer questions grounded in indexed CV content, returning citations and metadata.

#### Scenario: Query CV with question
- **WHEN** a caller `POST /rag/query` provides `question` and optional `filters` (e.g., `position`, `candidate_name`)
- **THEN** the system SHALL perform vector search over `cv_embeddings`
- **AND** construct an answer with top-k chunk contexts
- **AND** return `answer`, `citations` (chunk ids + text), and `metadata` (candidate, position)

### Requirement: Access Control
The system MUST restrict RAG query access to authorized roles.

#### Scenario: Authorized roles only
- **WHEN** a user with role `ADMIN` or `RECRUITER` calls `/rag/query`
- **THEN** the request SHALL be authorized
- **WHEN** a user without these roles calls `/rag/query`
- **THEN** the request SHALL be rejected with `403`

### Requirement: Observability and Metrics
The system SHALL instrument ingestion and query flows with traces and metrics.

#### Scenario: Trace and metrics exported
- **WHEN** ingestion or query executes
- **THEN** OTEL spans SHALL be emitted for parse/chunk/embed/upsert and search/answer
- **AND** Prometheus counters/histograms SHALL record success/failure counts and latency

### Requirement: Configurability via Helm
The system SHALL expose Helm values to configure embedding model/provider, Qdrant settings, and worker scaling.

#### Scenario: Helm values control RAG behavior
- **WHEN** operators set `server.recruitment.rag.enabled`, `server.recruitment.rag.workers`, `rag.embedding.provider`, `rag.embedding.model`, and `qdrant.collection`
- **THEN** the deployment SHALL scale workers and use the configured provider/model and collection
