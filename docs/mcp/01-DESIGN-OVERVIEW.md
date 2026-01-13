# MCP Design Overview for SOAI

## Document Information

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | January 2026 |
| Status | Draft |
| Author | SOAI Architecture Team |

---

## 1. Executive Summary

### 1.1 Purpose

This document provides a comprehensive design plan for integrating **Model Context Protocol (MCP)** into the SOAI multi-agent AI platform. MCP will serve as the standardized communication layer between AI agents and external tools, data sources, and services.

### 1.2 Scope

The MCP integration covers:
- All AI agent services (Recruitment Agent, Agent Controller, future agents)
- External tool integrations (CV parsing, email, calendar)
- Data source access (MySQL, Qdrant, Redis)
- LLM provider routing (OpenAI, Claude, Gemini, Ollama)
- Observability and security infrastructure

### 1.3 Goals

| Goal | Description | Success Metric |
|------|-------------|----------------|
| **Standardization** | Unified protocol for all AI-tool interactions | 100% of tool calls via MCP |
| **Extensibility** | Easy addition of new tools/resources | New tool deployment < 1 day |
| **Security** | Enterprise-grade access control | OAuth 2.0 + RBAC implemented |
| **Observability** | Full visibility into AI operations | All MCP calls traced in OTEL |
| **Performance** | Minimal overhead | < 20ms added latency P95 |

---

## 2. What is MCP?

### 2.1 Definition

**Model Context Protocol (MCP)** is an open standard developed by Anthropic that enables seamless, standardized communication between AI/LLM applications and external systems. It provides a universal interface for:

- **Tools**: Executable functions that AI can invoke
- **Resources**: Data sources that AI can read
- **Prompts**: Reusable prompt templates
- **Sampling**: LLM completion requests

### 2.2 Protocol Specification

```
┌─────────────────────────────────────────────────────────────────────┐
│                      MCP Protocol Stack                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    APPLICATION LAYER                         │   │
│  │  Tools | Resources | Prompts | Sampling | Logging | Roots    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    PROTOCOL LAYER                            │   │
│  │              JSON-RPC 2.0 Message Format                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    TRANSPORT LAYER                           │   │
│  │         Stdio | HTTP + SSE | WebSocket | Custom              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 Core Concepts

#### 2.3.1 MCP Roles

| Role | Description | Example in SOAI |
|------|-------------|-----------------|
| **Host** | Application that initiates MCP connections | Claude Desktop, IDE extensions |
| **Client** | Protocol handler within the host | MCP SDK in Recruitment Agent |
| **Server** | Service that exposes tools/resources | CV Parser MCP Server |

#### 2.3.2 MCP Primitives

```
┌─────────────────────────────────────────────────────────────────────┐
│                       MCP Primitives                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  Server-controlled, expose capabilities to LLMs   │
│  │   TOOLS     │  • Executable functions                           │
│  │             │  • Input/output schemas                           │
│  │             │  • Example: parse_cv(), search_knowledge()        │
│  └─────────────┘                                                   │
│                                                                     │
│  ┌─────────────┐  Server-controlled, provide context to LLMs       │
│  │  RESOURCES  │  • Data with URI identifiers                      │
│  │             │  • Can be static or dynamic                       │
│  │             │  • Example: jobs://list, candidates://123         │
│  └─────────────┘                                                   │
│                                                                     │
│  ┌─────────────┐  Server-controlled, reusable templates            │
│  │   PROMPTS   │  • Pre-defined prompt structures                  │
│  │             │  • Accept arguments                               │
│  │             │  • Example: cv_analysis, skill_matching           │
│  └─────────────┘                                                   │
│                                                                     │
│  ┌─────────────┐  Client-controlled, LLM access for servers        │
│  │  SAMPLING   │  • Request completions from LLM                   │
│  │             │  • Enables "agentic" server behavior              │
│  │             │  • Example: LLM Provider MCP Server               │
│  └─────────────┘                                                   │
│                                                                     │
│  ┌─────────────┐  Client-controlled, filesystem boundaries         │
│  │    ROOTS    │  • Allowed directories for file access            │
│  │             │  • Security boundary                              │
│  │             │  • Example: /app/uploads, /app/data               │
│  └─────────────┘                                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.4 Communication Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MCP Communication Sequence                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CLIENT                                              SERVER         │
│     │                                                   │           │
│     │──────────── initialize ──────────────────────────►│           │
│     │              {protocolVersion, capabilities}      │           │
│     │◄───────────── initialized ────────────────────────│           │
│     │              {protocolVersion, serverInfo, caps}  │           │
│     │                                                   │           │
│     │──────────── tools/list ──────────────────────────►│           │
│     │◄───────────── tools ──────────────────────────────│           │
│     │              [{name, description, inputSchema}]   │           │
│     │                                                   │           │
│     │──────────── resources/list ──────────────────────►│           │
│     │◄───────────── resources ──────────────────────────│           │
│     │              [{uri, name, mimeType}]              │           │
│     │                                                   │           │
│     │──────────── tools/call ──────────────────────────►│           │
│     │              {name: "parse_cv", arguments: {...}} │           │
│     │◄───────────── result ─────────────────────────────│           │
│     │              {content: [{type, text}]}            │           │
│     │                                                   │           │
│     │──────────── resources/read ──────────────────────►│           │
│     │              {uri: "jobs://123"}                  │           │
│     │◄───────────── contents ───────────────────────────│           │
│     │              [{uri, mimeType, text}]              │           │
│     │                                                   │           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Why MCP for SOAI?

### 3.1 Current Architecture Challenges

```
┌─────────────────────────────────────────────────────────────────────┐
│                 Current SOAI Pain Points                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CHALLENGE 1: Tight Coupling                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Recruitment Agent has hardcoded HTTP calls to:              │   │
│  │  • gen_ai_provider (specific endpoints)                      │   │
│  │  • knowledge_base (specific API contracts)                   │   │
│  │  • MySQL (direct ORM queries)                                │   │
│  │                                                              │   │
│  │  Impact: Changing any service requires agent code changes    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  CHALLENGE 2: No Dynamic Discovery                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Agents must know about tools at compile time                │   │
│  │  • New tools require code deployment                         │   │
│  │  • No runtime capability negotiation                         │   │
│  │  • Difficult to add/remove features dynamically              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  CHALLENGE 3: Inconsistent Interfaces                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Each service has its own API contract:                      │   │
│  │  • gen_ai_provider: POST /api/v1/chat                        │   │
│  │  • knowledge_base: POST /api/v1/search                       │   │
│  │  • Different error formats, auth mechanisms                  │   │
│  │                                                              │   │
│  │  Impact: Complex integration code, inconsistent handling     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  CHALLENGE 4: Limited Reusability                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Tools built for Recruitment Agent can't be used by:         │   │
│  │  • Other agents in the system                                │   │
│  │  • External clients (Claude Desktop, IDE plugins)            │   │
│  │  • Third-party integrations                                  │   │
│  │                                                              │   │
│  │  Impact: Code duplication, maintenance burden                │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 How MCP Solves These Challenges

| Challenge | MCP Solution | Implementation |
|-----------|--------------|----------------|
| **Tight Coupling** | Standardized protocol | All tools accessed via MCP interface |
| **No Discovery** | Dynamic capability negotiation | tools/list, resources/list at runtime |
| **Inconsistent APIs** | Unified JSON-RPC format | Same request/response structure everywhere |
| **Limited Reusability** | Server-based architecture | Tools exposed to any MCP client |

### 3.3 Benefits for SOAI

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SOAI + MCP Benefits Matrix                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  BENEFIT                    │ BEFORE MCP      │ AFTER MCP          │
│  ───────────────────────────┼─────────────────┼──────────────────  │
│  Add new tool               │ 2-3 days        │ 2-4 hours          │
│  Switch LLM provider        │ Code changes    │ Config change      │
│  Share tools across agents  │ Copy-paste      │ Automatic          │
│  External client access     │ Custom API      │ MCP standard       │
│  Security audit             │ Per-service     │ Centralized        │
│  Debug AI interactions      │ Multiple logs   │ Unified tracing    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Pros and Cons Analysis

### 4.1 Advantages

| Category | Advantage | Details |
|----------|-----------|---------|
| **Standardization** | Universal protocol | One interface for all AI-tool interactions |
| **Dynamic Discovery** | Runtime capabilities | Agents discover tools without redeployment |
| **Loose Coupling** | Independent services | Change tools without modifying agents |
| **Provider Agnostic** | Multi-LLM support | Switch between OpenAI/Claude/Gemini easily |
| **Security** | Built-in auth model | OAuth 2.0, capability-based permissions |
| **Ecosystem** | Growing community | Pre-built servers for common integrations |
| **Observability** | Standard logging | OTEL-compatible tracing hooks |
| **Composability** | Mix and match | Combine servers for complex workflows |

### 4.2 Disadvantages

| Category | Disadvantage | Mitigation |
|----------|--------------|------------|
| **Complexity** | Additional layer | Start with essential servers only |
| **Learning Curve** | New concepts | Team training, documentation |
| **Latency** | Gateway overhead | Optimize routing, caching |
| **Maturity** | New protocol (2024) | Follow best practices, contribute back |
| **Migration** | Refactoring needed | Incremental adoption approach |
| **Infrastructure** | More services | Containerize, use Helm charts |
| **Debugging** | Abstraction layer | Comprehensive tracing, logging |

### 4.3 Decision Matrix

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MCP Adoption Decision Matrix                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  CRITERIA                    │ WEIGHT │ SCORE │ WEIGHTED           │
│  ────────────────────────────┼────────┼───────┼──────────────────  │
│  Multi-agent support         │  0.20  │  9/10 │  1.80              │
│  Multi-LLM providers         │  0.20  │  9/10 │  1.80              │
│  Security requirements       │  0.15  │  8/10 │  1.20              │
│  Observability needs         │  0.15  │  8/10 │  1.20              │
│  Extensibility               │  0.15  │  9/10 │  1.35              │
│  Migration effort            │  0.10  │  5/10 │  0.50              │
│  Team expertise              │  0.05  │  6/10 │  0.30              │
│  ────────────────────────────┼────────┼───────┼──────────────────  │
│  TOTAL                       │  1.00  │       │  8.15/10           │
│                                                                     │
│  RECOMMENDATION: PROCEED with MCP integration                       │
│  Score > 7.0 indicates strong fit for the project                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Use Cases for SOAI

### 5.1 Primary Use Cases

#### Use Case 1: CV Processing Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│              CV Processing via MCP                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  USER                                                               │
│    │                                                                │
│    │ Upload CV                                                      │
│    ▼                                                                │
│  ┌─────────────────┐                                               │
│  │ Recruitment     │                                               │
│  │ Agent (Host)    │                                               │
│  └────────┬────────┘                                               │
│           │                                                         │
│           │ MCP: tools/call {name: "parse_cv"}                      │
│           ▼                                                         │
│  ┌─────────────────┐       ┌─────────────────┐                     │
│  │   MCP Gateway   │──────►│ CV Parser MCP   │                     │
│  └────────┬────────┘       │ Server          │                     │
│           │                └────────┬────────┘                     │
│           │                         │                               │
│           │ MCP: resources/read {uri: "jobs://open"}               │
│           ▼                         │                               │
│  ┌─────────────────┐                │ LLM call via                  │
│  │ Database MCP    │                │ sampling                      │
│  │ Server          │                ▼                               │
│  └─────────────────┘       ┌─────────────────┐                     │
│                            │ LLM Provider    │                     │
│                            │ MCP Server      │                     │
│                            └─────────────────┘                     │
│                                                                     │
│  RESULT: Parsed CV, matched jobs, scoring - all via MCP            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Use Case 2: Knowledge Base RAG

```
┌─────────────────────────────────────────────────────────────────────┐
│              RAG Query via MCP                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  AGENT                                                              │
│    │                                                                │
│    │ Need context about company policies                            │
│    │                                                                │
│    │ MCP: tools/call {name: "search_knowledge",                     │
│    │                  arguments: {query: "hiring policy"}}          │
│    ▼                                                                │
│  ┌─────────────────┐       ┌─────────────────┐                     │
│  │   MCP Gateway   │──────►│ Knowledge Base  │                     │
│  └─────────────────┘       │ MCP Server      │                     │
│                            └────────┬────────┘                     │
│                                     │                               │
│                                     │ 1. Generate embedding         │
│                                     │ 2. Query Qdrant               │
│                                     │ 3. Return top-k results       │
│                                     ▼                               │
│                            ┌─────────────────┐                     │
│                            │     Qdrant      │                     │
│                            │  Vector Store   │                     │
│                            └─────────────────┘                     │
│                                                                     │
│  RESULT: Relevant documents with semantic similarity scores         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Use Case 3: Multi-Provider LLM Routing

```
┌─────────────────────────────────────────────────────────────────────┐
│              LLM Provider Selection via MCP Sampling                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  MCP SERVER (e.g., CV Parser)                                       │
│    │                                                                │
│    │ Need LLM completion for CV analysis                            │
│    │                                                                │
│    │ MCP: sampling/createMessage {                                  │
│    │   messages: [...],                                             │
│    │   modelPreferences: {                                          │
│    │     hints: [{name: "claude-3-5-sonnet"}],                      │
│    │     costPriority: 0.3,                                         │
│    │     speedPriority: 0.7                                         │
│    │   }                                                            │
│    │ }                                                              │
│    ▼                                                                │
│  ┌─────────────────┐                                               │
│  │ LLM Provider    │──── Route based on preferences ────┐          │
│  │ MCP Server      │                                    │          │
│  └─────────────────┘                                    │          │
│           │                                              │          │
│           ▼                                              ▼          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐   │
│  │   OpenAI   │  │  Anthropic  │  │   Google    │  │  Ollama │   │
│  │   GPT-4o   │  │   Claude    │  │   Gemini    │  │  Llama  │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘   │
│                                                                     │
│  RESULT: Optimal LLM selected based on cost/speed/capability       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Secondary Use Cases

| Use Case | MCP Components | Description |
|----------|---------------|-------------|
| **External IDE Integration** | Tools + Resources | Claude Code/Cursor accessing SOAI tools |
| **Audit Trail** | Logging | All AI operations logged via MCP |
| **A/B Testing** | Sampling | Route to different LLMs for comparison |
| **Rate Limiting** | Gateway | Centralized throttling per client |
| **Feature Flags** | Resources | Dynamic configuration via MCP resources |

---

## 6. Success Criteria

### 6.1 Functional Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-01 | Tool discovery | Agents can list available tools at runtime |
| FR-02 | Tool execution | Tools execute and return results via MCP |
| FR-03 | Resource access | Resources readable via URI scheme |
| FR-04 | LLM routing | Sampling requests routed to appropriate provider |
| FR-05 | Authentication | OAuth 2.0 tokens validated at gateway |
| FR-06 | Authorization | Capability-based access control enforced |

### 6.2 Non-Functional Requirements

| ID | Requirement | Target | Measurement |
|----|-------------|--------|-------------|
| NFR-01 | Latency overhead | < 20ms P95 | Gateway routing time |
| NFR-02 | Availability | 99.9% | MCP gateway uptime |
| NFR-03 | Throughput | 1000 req/s | Concurrent tool calls |
| NFR-04 | Scalability | Horizontal | Auto-scaling pods |
| NFR-05 | Observability | 100% coverage | All calls traced |

---

## 7. Document References

| Document | Path | Description |
|----------|------|-------------|
| Architecture Deep Dive | [02-ARCHITECTURE.md](02-ARCHITECTURE.md) | Detailed system architecture |
| Implementation Guide | [03-IMPLEMENTATION.md](03-IMPLEMENTATION.md) | Step-by-step implementation |
| API Specification | [04-API-SPECIFICATION.md](04-API-SPECIFICATION.md) | MCP endpoint definitions |
| Security Design | [05-SECURITY.md](05-SECURITY.md) | Authentication & authorization |
| Deployment Guide | [06-DEPLOYMENT.md](06-DEPLOYMENT.md) | Kubernetes/Helm deployment |

---

*Next: [02-ARCHITECTURE.md](02-ARCHITECTURE.md) - MCP Architecture Deep Dive*
