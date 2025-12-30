# Project Context

## Purpose
SOAI is an AI-powered, microservices-based application that automates recruitment workflows and provides a pluggable GenAI layer and knowledge base. It includes:
- An Authentication service (Java Spring Boot) for user management and JWT security.
- A Recruitment Agent (Python FastAPI + Celery) to ingest CVs/JDs, orchestrate approvals, and schedule interviews.
- A Gen AI Provider (Python FastAPI) to unify LLM access (OpenAI, Anthropic, Google GenAI).
- A Knowledge Base service (Python FastAPI + Qdrant) for embeddings, retrieval, and document management.
- Web frontends (React) for user and recruiter experiences.

## Tech Stack
- Backend:
	- Java: Spring Boot 3 (Authentication), Java 17, Spring Security, JJWT, Micrometer/Actuator.
	- Python: FastAPI (Recruitment Agent, GenAI Provider, Knowledge Base), Uvicorn, SQLAlchemy, Celery + Redis for background jobs.
	- Data: MySQL (primary relational store), Qdrant (vector DB for embeddings), optional ClickHouse (analytics/TSDB).
	- Observability: OpenTelemetry SDK/instrumentations, Prometheus client; Grafana dashboards; Micrometer → Prometheus in the Java service.
- Frontend:
	- `web/main-app`: React (CRA), JavaScript.
	- `web/recruitment-app`: React + TypeScript on Vite.
- Platform & Deployment:
	- Docker images per service; Kubernetes via Helm charts (`helm/soai-application`), optional subcharts for Grafana, Prometheus, ClickHouse, and OTEL Collector.
	- Config via environment variables and Helm values; optional TLS and issuer settings.
	- Consul (optional) for service discovery/config, exposed by Helm values.

## Project Conventions

### Code Style
- Python:
	- Follow PEP 8; prefer `black` for formatting and `ruff`/`flake8` for linting.
	- Use `pydantic v2` models for request/response schemas; keep routers modular per domain (`cvs`, `jds`, `interviews`).
- Java:
	- Spring Boot conventions, layered structure (controller → service → repository); Lombok for boilerplate.
	- Prefer constructor injection; expose Actuator and Prometheus metrics; secure endpoints via Spring Security roles.
- Frontend:
	- `recruitment-app` uses ESLint + TypeScript strict mode; Vite build; colocate components and hooks by feature.
	- `main-app` (CRA) uses React Testing Library and app-level ESLint config; prefer functional components and hooks.
- Naming:
	- Branches: `feature/<service>-<short-topic>`, `fix/<service>-<issue>`, `chore/...`.
	- Env vars: SCREAMING_SNAKE_CASE; secrets are injected via Kubernetes secrets/Helm values.
	- Containers: `soai/<service>:<semver>`; Helm `appVersion` mirrors release version.

### Architecture Patterns
- Microservices: independent services with REST APIs; each service has its own Dockerfile and Helm deployment.
- Event/Async processing: Celery workers consume tasks via Redis (e.g., CV parsing, embedding jobs).
- Data segregation: MySQL for transactional data; Qdrant for vector similarity; optional ClickHouse for logs/analytics.
- Observability-first: OTEL tracing/instrumentation on FastAPI and SQLAlchemy; Micrometer in Spring Boot; scrape via Prometheus; visualize via Grafana.
- 12-Factor config: environment-driven configuration; secrets via Kubernetes; health/readiness probes configured in Helm values.

### Testing Strategy
- Python services:
	- Unit/integration tests using `unittest` or `pytest`; recruitment service includes API tests (`backend/services/recruitment_agent/tests`).
	- Test setup waits for dependent services (auth, recruitment) before running API scenarios.
- Java service:
	- Spring Boot starter tests and `spring-security-test` for auth flows; prefer slice tests for controllers/services.
- Frontend:
	- React Testing Library for components; minimal DOM coupling; use MSW for API mocking when needed.
- CI recommendations:
	- Lint → unit tests → integration tests; container build; Helm template lint; optional kind cluster E2E.

### Git Workflow
- Branching: Trunk-based with short-lived feature branches; protect `main`.
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`); squash merge to keep history concise.
- Releases: Semantic versioning; update Helm `Chart.yaml` `version` and `appVersion` on release; tag Docker images accordingly.
- PRs: Require review; include a brief design/testing note; link to affected service(s) and Helm values.

## Domain Context
- Recruitment flow:
	- Admin uploads a JD, users upload CVs (PDF parsed via PyMuPDF). CVs move through states (pending → approved → interviewed → completed).
	- Interviews are scheduled and cleaned via API flows; tests exercise the full path.
- Authentication:
	- JWT-based auth with roles (ADMIN, USER); Spring Security config gates endpoints; tokens are extracted via login flows.
- GenAI usage:
	- Provider abstracts LLM calls (OpenAI, Anthropic, Google) for classification/extraction/summarization.
- Knowledge Base:
	- Stores embeddings/vectors in Qdrant; supports ingest/search; can integrate with GenAI provider for RAG.

## Important Constraints
- Java 17 for Spring Boot 3; ensure container base images match JDK requirements.
- Secrets (e.g., `OPENAI_API_KEY`) must be provided via environment/Helm and never committed.
- Optional TLS via Helm values; test SSL artifacts/scripts are under `test/ssl/`.
- Kubernetes resource requests/limits defined in `helm/soai-application/values.yaml` must be respected.
- Health/readiness probes for all services are configured; services should expose `/health` or Actuator endpoints.

## External Dependencies
- MySQL (transactional DB) and Redis (Celery broker) provisioned via Helm values.
- Qdrant (vector DB) for embeddings and similarity search.
- OpenAI/Anthropic/Google GenAI APIs (keys required).
- Prometheus + Grafana for metrics/visualization; OTEL Collector for traces.
- Optional ClickHouse for high-volume analytics/TSDB.
- Consul (optional) for service discovery/config if enabled.
