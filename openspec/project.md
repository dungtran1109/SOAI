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

## Architecture Overview

### Service Map (ports, base paths, roles)
- Authentication (Spring Boot):
	- Port: `9090`; Base path: `/api/v1/authentications`
	- Responsibilities: Accounts/Users CRUD, JWT issuance/validation; Actuator and Prometheus metrics enabled.
- Recruitment Agent (FastAPI + Celery):
	- Port: `8003`; Base path: `/api/v1/recruitment`
	- Responsibilities: CV/JD uploads and parsing, interview scheduling, matching; background tasks via Celery + Redis; persists to MySQL.
- GenAI Provider (FastAPI):
	- Port: `8004`; Base path: `/api/v1/gen-ai`
	- Responsibilities: Unified LLM chat and model enumeration; providers via env (OpenAI/Gemini/Ollama); exposes `/metrics`.
- Agent Controller (FastAPI):
	- Port: `8005`; Base path: `/api/v1/agent-controller`
	- Responsibilities: Conversation orchestration, chat session lifecycle, real‑time WebSocket endpoint at `/conversations/realtime`.
- Knowledge Base (FastAPI):
	- Port: `8006`; Base path: `/api/v1/knowledge-base`
	- Responsibilities: Document ingestion, embeddings and retrieval (Qdrant), RAG support; integrates with GenAI Provider for embeddings.
- Qdrant (Vector DB):
	- Ports: `6333` (HTTP), `6334` (gRPC); collection defaults (e.g., `cv_embeddings`).
- Infra components: Redis (broker for Celery), MySQL (transactional DB), OTEL Collector, Prometheus, Grafana, ClickHouse (optional traces TSDB), Consul (service registry).

### Frontend & Edge
- `web/nginx.conf` reverse‑proxies frontend requests to services under unified paths:
	- `/api/v1/recruitment/ → recruitment:8003`
	- `/api/v1/authentications/ → authentication:9090`
	- `/api/v1/gen-ai/ → genai:8004`
	- `/api/v1/agent-controller/ → controller:8005` (supports WebSocket Upgrade)
	- `/api/v1/knowledge_base/ → knowledge_base:8006`
- `web/main-app` (CRA) targets `/api/v1` via Nginx in container; local dev can switch to `localhost` ports.
- `web/recruitment-app` (Vite + TS) computes base URLs at runtime from `window.location` and targets the above paths; WebSocket endpoint is `ws(s)://<host>/api/v1/agent-controller/conversations/realtime`.

### Inter‑Service Interactions
- Recruitment Agent:
	- Reads/writes MySQL; offloads heavy work to Celery workers via Redis.
	- Calls GenAI Provider for extraction/summarization and Knowledge Base for RAG queries.
- Agent Controller:
	- Manages chat sessions and history; streams responses over WebSocket.
	- Calls GenAI Provider for model outputs; may call Recruitment Agent domain APIs as needed.
- Knowledge Base:
	- Uses GenAI Provider to generate embeddings; stores/queries vectors in Qdrant.
- Authentication:
	- Issues JWTs consumed by frontends and (optionally) by backend services for protected routes.

### Service Discovery & Health
- Consul used for service registration/health checks when enabled:
	- Python services call Consul `v1/agent/service/register` with health checks pointing to their HTTP(S) health endpoints.
	- Health endpoints: FastAPI apps expose `.../health` and `/metrics`; Spring Boot exposes Actuator endpoints (health, prometheus).

### Observability
- Traces: FastAPI services initialize OTEL (`OTLP gRPC` to `otel-collector:4317`); Java uses Micrometer/Actuator with Prometheus.
- Metrics: `/metrics` exposed on Python services; Spring Boot exports Prometheus via Micrometer.
- Dashboards: Grafana dashboards are provided under `helm/grafana/dashboards/*`.
- Storage: OTEL Collector can forward to ClickHouse (compose + helm values include ClickHouse knobs).

### Data Stores
- MySQL: Primary transactional store for recruitment (entity models created on startup).
- Qdrant: Vector store for embeddings and similarity search (default collection configurable via env/Helm).
- Redis: Celery broker and result backend for async processing.

### Local Compose Topology (docker-compose)
- Exposed ports: `8080` (web), `9090` (auth), `8003` (recruitment), `8004` (genai), `8005` (controller), `8006` (knowledge-base), `3306` (mysql), `6379` (redis), `8500` (consul), `6333` (qdrant HTTP).
- Service dependencies and health checks are encoded (e.g., auth waits for MySQL healthy).

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
