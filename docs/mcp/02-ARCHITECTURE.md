# MCP Architecture Deep Dive

## Document Information

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | January 2026 |
| Status | Draft |
| Prerequisites | [01-DESIGN-OVERVIEW.md](01-DESIGN-OVERVIEW.md) |

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          SOAI + MCP System Architecture                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                           PRESENTATION LAYER                               │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │ │
│  │  │ Web UI      │  │ Claude      │  │ IDE Plugin  │  │ API Clients     │   │ │
│  │  │ (React)     │  │ Desktop     │  │ (VSCode)    │  │ (REST/GraphQL)  │   │ │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘   │ │
│  └─────────┼────────────────┼────────────────┼──────────────────┼────────────┘ │
│            │                │                │                  │              │
│            ▼                ▼                ▼                  ▼              │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                            MCP HOST LAYER                                  │ │
│  │  ┌─────────────────────┐  ┌─────────────────────┐  ┌───────────────────┐  │ │
│  │  │ Recruitment Agent   │  │ Agent Controller    │  │ Future Agents     │  │ │
│  │  │ (LangGraph + MCP    │  │ (Pipeline + MCP     │  │ (MCP Client)      │  │ │
│  │  │  Client)            │  │  Client)            │  │                   │  │ │
│  │  └──────────┬──────────┘  └──────────┬──────────┘  └─────────┬─────────┘  │ │
│  └─────────────┼────────────────────────┼───────────────────────┼────────────┘ │
│                │                        │                       │              │
│                └────────────────────────┼───────────────────────┘              │
│                                         ▼                                      │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                           MCP GATEWAY LAYER                                │ │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │ │
│  │  │                         MCP Gateway Service                          │  │ │
│  │  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────────┐ │  │ │
│  │  │  │  Router   │  │   Auth    │  │ Registry  │  │ Load Balancer     │ │  │ │
│  │  │  │           │  │ (OAuth)   │  │           │  │                   │ │  │ │
│  │  │  └───────────┘  └───────────┘  └───────────┘  └───────────────────┘ │  │ │
│  │  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────────┐ │  │ │
│  │  │  │  Metrics  │  │  Tracing  │  │  Caching  │  │ Rate Limiting     │ │  │ │
│  │  │  │  (Prom)   │  │  (OTEL)   │  │  (Redis)  │  │                   │ │  │ │
│  │  │  └───────────┘  └───────────┘  └───────────┘  └───────────────────┘ │  │ │
│  │  └─────────────────────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                         │                                      │
│                                         ▼                                      │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                          MCP SERVER LAYER                                  │ │
│  │                                                                            │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐ │ │
│  │  │ CV Parser MCP    │  │ Knowledge Base   │  │ Database MCP Server      │ │ │
│  │  │ Server           │  │ MCP Server       │  │                          │ │ │
│  │  │                  │  │                  │  │ Resources:               │ │ │
│  │  │ Tools:           │  │ Tools:           │  │ • jobs://                │ │ │
│  │  │ • parse_cv       │  │ • search         │  │ • candidates://          │ │ │
│  │  │ • extract_skills │  │ • add_document   │  │ • interviews://          │ │ │
│  │  │ • score_cv       │  │                  │  │                          │ │ │
│  │  │                  │  │ Resources:       │  │ Tools:                   │ │ │
│  │  │ Prompts:         │  │ • knowledge://   │  │ • query_jobs             │ │ │
│  │  │ • cv_analysis    │  │                  │  │ • update_candidate       │ │ │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────────────┘ │ │
│  │                                                                            │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐ │ │
│  │  │ LLM Provider MCP │  │ Email MCP        │  │ Auth MCP Server          │ │ │
│  │  │ Server           │  │ Server           │  │                          │ │ │
│  │  │                  │  │                  │  │ Tools:                   │ │ │
│  │  │ Sampling:        │  │ Tools:           │  │ • validate_token         │ │ │
│  │  │ • createMessage  │  │ • send_email     │  │ • get_user_info          │ │ │
│  │  │                  │  │ • get_templates  │  │ • check_permission       │ │ │
│  │  │ Tools:           │  │                  │  │                          │ │ │
│  │  │ • get_providers  │  │ Prompts:         │  │ Resources:               │ │ │
│  │  │ • get_embeddings │  │ • interview_inv  │  │ • users://               │ │ │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                         │                                      │
│                                         ▼                                      │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                        INFRASTRUCTURE LAYER                                │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │ │
│  │  │  MySQL  │ │  Redis  │ │ Qdrant  │ │ClickHs  │ │  OTEL   │ │Prometh. │ │ │
│  │  │         │ │  Stack  │ │ Vector  │ │         │ │Collector│ │         │ │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Descriptions

#### 1.2.1 MCP Host Layer

| Component | Role | Technology |
|-----------|------|------------|
| **Recruitment Agent** | AI agent for hiring workflows | LangGraph + MCP Client SDK |
| **Agent Controller** | Pipeline orchestration | FastAPI + MCP Client SDK |
| **Future Agents** | Extensible agent slots | Any framework + MCP Client |

#### 1.2.2 MCP Gateway Layer

| Component | Responsibility | Technology |
|-----------|----------------|------------|
| **Router** | Route requests to appropriate servers | FastAPI + JSON-RPC |
| **Auth** | OAuth 2.0 token validation | JWT + JWKS |
| **Registry** | Dynamic server discovery | Redis + Consul |
| **Load Balancer** | Distribute load across server replicas | Round-robin / weighted |
| **Metrics** | Prometheus metrics export | prometheus_client |
| **Tracing** | Distributed tracing | OpenTelemetry SDK |
| **Caching** | Response caching | Redis |
| **Rate Limiting** | Request throttling | Token bucket algorithm |

#### 1.2.3 MCP Server Layer

| Server | Primitives | Backend |
|--------|------------|---------|
| **CV Parser** | Tools, Prompts | LLM (via sampling) |
| **Knowledge Base** | Tools, Resources | Qdrant |
| **Database** | Tools, Resources | MySQL |
| **LLM Provider** | Sampling, Tools | OpenAI/Claude/Gemini/Ollama |
| **Email** | Tools, Prompts | SMTP |
| **Auth** | Tools, Resources | Authentication Service |

---

## 2. Data Flow Architecture

### 2.1 Request Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          MCP Request Flow                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  1. CLIENT INITIATES REQUEST                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Recruitment Agent                                                       │   │
│  │  │                                                                       │   │
│  │  │  mcp_client.call_tool("parse_cv", {"cv_content": "..."})              │   │
│  │  │                                                                       │   │
│  │  ▼                                                                       │   │
│  │  JSON-RPC Request:                                                       │   │
│  │  {                                                                       │   │
│  │    "jsonrpc": "2.0",                                                     │   │
│  │    "id": "req-123",                                                      │   │
│  │    "method": "tools/call",                                               │   │
│  │    "params": {                                                           │   │
│  │      "name": "parse_cv",                                                 │   │
│  │      "arguments": {"cv_content": "..."}                                  │   │
│  │    }                                                                     │   │
│  │  }                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│                                    ▼                                            │
│  2. GATEWAY PROCESSING                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  MCP Gateway                                                             │   │
│  │  │                                                                       │   │
│  │  ├─► [Auth] Validate OAuth token                                         │   │
│  │  │   └─► Check scope: mcp:tools:execute                                  │   │
│  │  │                                                                       │   │
│  │  ├─► [Registry] Lookup server for "parse_cv"                             │   │
│  │  │   └─► Found: cv-parser-mcp @ http://cv-parser:8000                    │   │
│  │  │                                                                       │   │
│  │  ├─► [Cache] Check response cache                                        │   │
│  │  │   └─► Cache miss                                                      │   │
│  │  │                                                                       │   │
│  │  ├─► [Rate Limit] Check client quota                                     │   │
│  │  │   └─► 45/100 requests used                                            │   │
│  │  │                                                                       │   │
│  │  └─► [Router] Forward to cv-parser-mcp                                   │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│                                    ▼                                            │
│  3. SERVER EXECUTION                                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  CV Parser MCP Server                                                    │   │
│  │  │                                                                       │   │
│  │  ├─► [Validate] Check input against JSON Schema                          │   │
│  │  │                                                                       │   │
│  │  ├─► [Execute] Run parse_cv handler                                      │   │
│  │  │   │                                                                   │   │
│  │  │   ├─► Request LLM completion via sampling                             │   │
│  │  │   │   └─► POST /mcp/sampling/createMessage                            │   │
│  │  │   │                                                                   │   │
│  │  │   └─► Parse LLM response into structured data                         │   │
│  │  │                                                                       │   │
│  │  └─► [Return] Format MCP response                                        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│                                    ▼                                            │
│  4. RESPONSE FLOW                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  JSON-RPC Response:                                                      │   │
│  │  {                                                                       │   │
│  │    "jsonrpc": "2.0",                                                     │   │
│  │    "id": "req-123",                                                      │   │
│  │    "result": {                                                           │   │
│  │      "content": [{                                                       │   │
│  │        "type": "text",                                                   │   │
│  │        "text": "{\"personal_info\": {...}, \"skills\": [...]}"           │   │
│  │      }]                                                                  │   │
│  │    }                                                                     │   │
│  │  }                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Sampling Flow (Server → LLM)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          MCP Sampling Flow                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  MCP SERVER                          LLM PROVIDER MCP                           │
│  (CV Parser)                         SERVER                                     │
│      │                                    │                                     │
│      │ Need LLM completion                │                                     │
│      │                                    │                                     │
│      │────── sampling/createMessage ─────►│                                     │
│      │ {                                  │                                     │
│      │   "messages": [                    │                                     │
│      │     {"role": "user",               │                                     │
│      │      "content": {"type": "text",   │                                     │
│      │                  "text": "..."}}   │                                     │
│      │   ],                               │                                     │
│      │   "modelPreferences": {            │                                     │
│      │     "hints": [                     │                                     │
│      │       {"name": "claude-3-5-sonnet"}│                                     │
│      │     ],                             │                                     │
│      │     "costPriority": 0.3,           │                                     │
│      │     "speedPriority": 0.7           │                                     │
│      │   },                               │                                     │
│      │   "maxTokens": 2000                │                                     │
│      │ }                                  │                                     │
│      │                                    │                                     │
│      │                                    │──── Select Provider ────┐           │
│      │                                    │                         │           │
│      │                                    │     ┌─────────────────┐ │           │
│      │                                    │     │ Provider Router │ │           │
│      │                                    │     │                 │ │           │
│      │                                    │     │ • Check hints   │ │           │
│      │                                    │     │ • Check cost    │ │           │
│      │                                    │     │ • Check speed   │ │           │
│      │                                    │     │ • Check avail.  │ │           │
│      │                                    │     └────────┬────────┘ │           │
│      │                                    │              │          │           │
│      │                                    │              ▼          │           │
│      │                                    │     ┌─────────────────┐ │           │
│      │                                    │     │ Anthropic API   │◄┘           │
│      │                                    │     │ Claude 3.5      │             │
│      │                                    │     └────────┬────────┘             │
│      │                                    │              │                      │
│      │                                    │◄─────────────┘                      │
│      │                                    │                                     │
│      │◄──────── completion ──────────────│                                     │
│      │ {                                  │                                     │
│      │   "role": "assistant",             │                                     │
│      │   "content": {                     │                                     │
│      │     "type": "text",                │                                     │
│      │     "text": "Parsed CV data..."    │                                     │
│      │   },                               │                                     │
│      │   "model": "claude-3-5-sonnet",    │                                     │
│      │   "stopReason": "endTurn"          │                                     │
│      │ }                                  │                                     │
│      │                                    │                                     │
│      ▼                                    │                                     │
│  Continue processing                      │                                     │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Network Architecture

### 3.1 Kubernetes Network Topology

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     Kubernetes Cluster - soai Namespace                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           INGRESS LAYER                                  │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │                    Nginx Ingress Controller                      │    │   │
│  │  │                                                                  │    │   │
│  │  │  mcp.soai.example.com ──────► mcp-gateway:8000                   │    │   │
│  │  │  api.soai.example.com ──────► web:8080                           │    │   │
│  │  │                                                                  │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                         │                                       │
│                                         ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                          SERVICE MESH                                    │   │
│  │                                                                          │   │
│  │  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐   │   │
│  │  │ mcp-gateway      │    │ cv-parser-mcp    │    │ knowledge-base   │   │   │
│  │  │ Service          │    │ Service          │    │ -mcp Service     │   │   │
│  │  │ :8000 (HTTP)     │───►│ :8000            │    │ :8000            │   │   │
│  │  │ :8001 (SSE)      │    └──────────────────┘    └──────────────────┘   │   │
│  │  └──────────────────┘              │                      │              │   │
│  │           │                        │                      │              │   │
│  │           │            ┌───────────┴──────────────────────┘              │   │
│  │           │            │                                                 │   │
│  │           ▼            ▼                                                 │   │
│  │  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐   │   │
│  │  │ database-mcp     │    │ llm-provider-mcp │    │ email-mcp        │   │   │
│  │  │ Service          │    │ Service          │    │ Service          │   │   │
│  │  │ :8000            │    │ :8000            │    │ :8000            │   │   │
│  │  └──────────────────┘    └──────────────────┘    └──────────────────┘   │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                         │                                       │
│                                         ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        BACKEND SERVICES                                  │   │
│  │                                                                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │   │
│  │  │ mysql        │  │ redis        │  │ qdrant       │  │ clickhouse  │  │   │
│  │  │ :3306        │  │ :6379        │  │ :6333/:6334  │  │ :9000/:8123 │  │   │
│  │  │ (StatefulSet)│  │ (Deployment) │  │ (StatefulSet)│  │ (StatefulSt)│  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Port Mapping

| Service | Internal Port | Protocol | Purpose |
|---------|---------------|----------|---------|
| mcp-gateway | 8000 | HTTP | JSON-RPC requests |
| mcp-gateway | 8001 | HTTP/SSE | Server-Sent Events |
| cv-parser-mcp | 8000 | HTTP | MCP server |
| knowledge-base-mcp | 8000 | HTTP | MCP server |
| database-mcp | 8000 | HTTP | MCP server |
| llm-provider-mcp | 8000 | HTTP | MCP server + sampling |
| email-mcp | 8000 | HTTP | MCP server |
| mysql | 3306 | MySQL | Database |
| redis | 6379 | Redis | Cache + queue |
| qdrant | 6333/6334 | HTTP/gRPC | Vector store |
| clickhouse | 9000/8123 | Native/HTTP | Analytics |

---

## 4. Component Architecture

### 4.1 MCP Gateway Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          MCP Gateway Internal Architecture                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         INGRESS (FastAPI)                                │   │
│  │                                                                          │   │
│  │  POST /mcp/initialize         ──► Initialize connection                  │   │
│  │  GET  /mcp/tools/list         ──► List all tools                         │   │
│  │  POST /mcp/tools/call         ──► Execute tool                           │   │
│  │  GET  /mcp/resources/list     ──► List all resources                     │   │
│  │  POST /mcp/resources/read     ──► Read resource                          │   │
│  │  GET  /mcp/prompts/list       ──► List prompts                           │   │
│  │  POST /mcp/prompts/get        ──► Get prompt                             │   │
│  │  POST /mcp/sampling/create    ──► LLM sampling (proxied)                 │   │
│  │                                                                          │   │
│  └────────────────────────────────────┬────────────────────────────────────┘   │
│                                       │                                         │
│                                       ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                       MIDDLEWARE CHAIN                                   │   │
│  │                                                                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │   │
│  │  │   Tracing   │─►│    Auth     │─►│ Rate Limit  │─►│   Validation    │ │   │
│  │  │   (OTEL)    │  │  (OAuth)    │  │  (Redis)    │  │  (JSON Schema)  │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘ │   │
│  │                                                                          │   │
│  └────────────────────────────────────┬────────────────────────────────────┘   │
│                                       │                                         │
│                                       ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         CORE SERVICES                                    │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │                      Server Registry                             │    │   │
│  │  │                                                                  │    │   │
│  │  │  ┌─────────────────────────────────────────────────────────┐    │    │   │
│  │  │  │  servers: {                                              │    │    │   │
│  │  │  │    "cv-parser-mcp": {                                    │    │    │   │
│  │  │  │      url: "http://cv-parser-mcp:8000",                   │    │    │   │
│  │  │  │      tools: ["parse_cv", "extract_skills", "score_cv"],  │    │    │   │
│  │  │  │      health: "healthy"                                   │    │    │   │
│  │  │  │    },                                                    │    │    │   │
│  │  │  │    "knowledge-base-mcp": {...},                          │    │    │   │
│  │  │  │    "database-mcp": {...}                                 │    │    │   │
│  │  │  │  }                                                       │    │    │   │
│  │  │  └─────────────────────────────────────────────────────────┘    │    │   │
│  │  │                                                                  │    │   │
│  │  │  Methods:                                                        │    │   │
│  │  │  • register_server(info) - Add server to registry                │    │   │
│  │  │  • unregister_server(name) - Remove server                       │    │   │
│  │  │  • get_server_for_tool(tool) - Lookup by tool name               │    │   │
│  │  │  • health_check() - Verify all servers                           │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │                         Router                                   │    │   │
│  │  │                                                                  │    │   │
│  │  │  route_tool_call(name, args):                                    │    │   │
│  │  │    1. Lookup server in registry                                  │    │   │
│  │  │    2. Forward request via HTTP                                   │    │   │
│  │  │    3. Return response                                            │    │   │
│  │  │                                                                  │    │   │
│  │  │  route_resource_read(uri):                                       │    │   │
│  │  │    1. Parse URI scheme (jobs://, knowledge://)                   │    │   │
│  │  │    2. Lookup server by scheme                                    │    │   │
│  │  │    3. Forward request                                            │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │                      Aggregator                                  │    │   │
│  │  │                                                                  │    │   │
│  │  │  aggregate_tools():                                              │    │   │
│  │  │    1. Query all servers for tools/list                           │    │   │
│  │  │    2. Merge results                                              │    │   │
│  │  │    3. Add _server metadata                                       │    │   │
│  │  │                                                                  │    │   │
│  │  │  aggregate_resources():                                          │    │   │
│  │  │    1. Query all servers for resources/list                       │    │   │
│  │  │    2. Merge and deduplicate                                      │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 MCP Server Architecture (Generic)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       Generic MCP Server Architecture                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         BASE MCP SERVER                                  │   │
│  │                                                                          │   │
│  │  class BaseMCPServer:                                                    │   │
│  │      """Abstract base class for all MCP servers"""                       │   │
│  │                                                                          │   │
│  │      # Core attributes                                                   │   │
│  │      name: str                                                           │   │
│  │      version: str                                                        │   │
│  │      capabilities: dict                                                  │   │
│  │                                                                          │   │
│  │      # Registries                                                        │   │
│  │      _tools: Dict[str, ToolDefinition]                                   │   │
│  │      _resources: List[ResourceDefinition]                                │   │
│  │      _prompts: List[PromptDefinition]                                    │   │
│  │                                                                          │   │
│  │      # Required endpoints                                                │   │
│  │      POST /mcp/initialize      → get_server_info()                       │   │
│  │      GET  /mcp/tools/list      → list_tools()                            │   │
│  │      POST /mcp/tools/call      → call_tool(name, args)                   │   │
│  │      GET  /mcp/resources/list  → list_resources()                        │   │
│  │      POST /mcp/resources/read  → read_resource(uri)                      │   │
│  │      GET  /mcp/prompts/list    → list_prompts()                          │   │
│  │      POST /mcp/prompts/get     → get_prompt(name, args)                  │   │
│  │      GET  /health              → health_check()                          │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                         │
│                    ┌──────────────────┼──────────────────┐                     │
│                    │                  │                  │                     │
│                    ▼                  ▼                  ▼                     │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐       │
│  │   Tool Handler     │  │  Resource Handler  │  │  Prompt Handler    │       │
│  │                    │  │                    │  │                    │       │
│  │  register_tool(    │  │  register_resource(│  │  register_prompt(  │       │
│  │    name,           │  │    uri,            │  │    name,           │       │
│  │    description,    │  │    name,           │  │    description,    │       │
│  │    input_schema,   │  │    mime_type       │  │    arguments       │       │
│  │    handler_func    │  │  )                 │  │  )                 │       │
│  │  )                 │  │                    │  │                    │       │
│  │                    │  │  read_resource(    │  │  get_prompt(       │       │
│  │  call_tool(        │  │    uri             │  │    name,           │       │
│  │    name,           │  │  ) → contents      │  │    arguments       │       │
│  │    arguments       │  │                    │  │  ) → messages      │       │
│  │  ) → result        │  │                    │  │                    │       │
│  └────────────────────┘  └────────────────────┘  └────────────────────┘       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Sequence Diagrams

### 5.1 Complete CV Processing Workflow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    CV Processing Sequence Diagram                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  User    Web UI    Recruitment   MCP       CV Parser   LLM Provider   Database │
│   │        │        Agent       Gateway    MCP Server   MCP Server    MCP Srv  │
│   │        │          │           │            │            │            │      │
│   │──upload CV──►│    │           │            │            │            │      │
│   │        │          │           │            │            │            │      │
│   │        │──POST /process──►    │            │            │            │      │
│   │        │          │           │            │            │            │      │
│   │        │          │──tools/call: parse_cv──►           │            │      │
│   │        │          │           │            │            │            │      │
│   │        │          │           │──forward──►│            │            │      │
│   │        │          │           │            │            │            │      │
│   │        │          │           │            │──sampling/createMessage──►     │
│   │        │          │           │            │            │            │      │
│   │        │          │           │            │            │──call LLM──►      │
│   │        │          │           │            │            │  (Claude)  │      │
│   │        │          │           │            │            │◄─response──│      │
│   │        │          │           │            │            │            │      │
│   │        │          │           │            │◄──completion───│        │      │
│   │        │          │           │            │            │            │      │
│   │        │          │           │◄──parsed CV──│          │            │      │
│   │        │          │           │            │            │            │      │
│   │        │          │◄──result───│           │            │            │      │
│   │        │          │           │            │            │            │      │
│   │        │          │──resources/read: jobs://open──────────────────────►     │
│   │        │          │           │            │            │            │      │
│   │        │          │           │────────────────────────forward──────►│      │
│   │        │          │           │            │            │            │      │
│   │        │          │◄──jobs list──────────────────────────────────────│      │
│   │        │          │           │            │            │            │      │
│   │        │          │──tools/call: score_cv──►           │            │      │
│   │        │          │           │            │            │            │      │
│   │        │          │           │  [scoring via LLM sampling]         │      │
│   │        │          │           │            │            │            │      │
│   │        │          │◄──scores───│           │            │            │      │
│   │        │          │           │            │            │            │      │
│   │        │◄──results───│        │            │            │            │      │
│   │        │          │           │            │            │            │      │
│   │◄──display──│      │           │            │            │            │      │
│   │        │          │           │            │            │            │      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Error Handling Architecture

### 6.1 Error Categories

| Category | Code Range | Example |
|----------|------------|---------|
| **Protocol Errors** | -32700 to -32600 | Parse error, invalid request |
| **Server Errors** | -32603 | Internal server error |
| **Application Errors** | 1-999 | Tool not found, resource unavailable |
| **Gateway Errors** | 1000-1999 | Auth failed, rate limited |

### 6.2 Error Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          Error Handling Flow                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  CLIENT                  GATEWAY                    SERVER                      │
│     │                       │                          │                        │
│     │──── request ─────────►│                          │                        │
│     │                       │                          │                        │
│     │                       │──── forward ────────────►│                        │
│     │                       │                          │                        │
│     │                       │                          │ ╔═══════════════════╗  │
│     │                       │                          │ ║  Error Occurs:    ║  │
│     │                       │                          │ ║  • Validation     ║  │
│     │                       │                          │ ║  • Execution      ║  │
│     │                       │                          │ ║  • Timeout        ║  │
│     │                       │                          │ ╚═══════════════════╝  │
│     │                       │                          │                        │
│     │                       │◄─── MCP error ──────────│                        │
│     │                       │  {                       │                        │
│     │                       │    "error": {            │                        │
│     │                       │      "code": -32603,     │                        │
│     │                       │      "message": "...",   │                        │
│     │                       │      "data": {...}       │                        │
│     │                       │    }                     │                        │
│     │                       │  }                       │                        │
│     │                       │                          │                        │
│     │                       │ ╔═══════════════════╗    │                        │
│     │                       │ ║ Gateway Actions:  ║    │                        │
│     │                       │ ║ • Log error       ║    │                        │
│     │                       │ ║ • Record metric   ║    │                        │
│     │                       │ ║ • Retry if able   ║    │                        │
│     │                       │ ║ • Circuit break   ║    │                        │
│     │                       │ ╚═══════════════════╝    │                        │
│     │                       │                          │                        │
│     │◄─── error response ───│                          │                        │
│     │                       │                          │                        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Caching Architecture

### 7.1 Cache Layers

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          Caching Architecture                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         CACHE LAYERS                                     │   │
│  │                                                                          │   │
│  │  Layer 1: Client-Side Cache                                              │   │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │   │
│  │  │  • tools/list response (TTL: 5 min)                               │  │   │
│  │  │  • resources/list response (TTL: 5 min)                           │  │   │
│  │  │  • Server capabilities (TTL: 10 min)                              │  │   │
│  │  └───────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                          │   │
│  │  Layer 2: Gateway Cache (Redis)                                          │   │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │   │
│  │  │  • Tool call results (idempotent tools only)                      │  │   │
│  │  │  • Resource reads (static resources, TTL: configurable)           │  │   │
│  │  │  • Server registry (TTL: 30 sec)                                  │  │   │
│  │  │                                                                   │  │   │
│  │  │  Cache Keys:                                                      │  │   │
│  │  │  • mcp:tool:{tool_name}:{hash(args)}                              │  │   │
│  │  │  • mcp:resource:{uri}                                             │  │   │
│  │  │  • mcp:registry:servers                                           │  │   │
│  │  └───────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                          │   │
│  │  Layer 3: Server-Side Cache                                              │   │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │   │
│  │  │  • LLM responses (embedding cache)                                │  │   │
│  │  │  • Database query results                                         │  │   │
│  │  │  • Computed analytics                                             │  │   │
│  │  └───────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                       CACHE INVALIDATION                                 │   │
│  │                                                                          │   │
│  │  Strategy: Event-Driven Invalidation                                     │   │
│  │                                                                          │   │
│  │  1. Server registers tools/resources → Invalidate registry cache         │   │
│  │  2. Resource modified → Publish event → Invalidate resource cache        │   │
│  │  3. Config change → Clear all caches                                     │   │
│  │                                                                          │   │
│  │  MCP Notifications:                                                      │   │
│  │  • notifications/tools/list_changed                                      │   │
│  │  • notifications/resources/list_changed                                  │   │
│  │  • notifications/resources/updated                                       │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

*Next: [03-IMPLEMENTATION.md](03-IMPLEMENTATION.md) - MCP Implementation Guide*
