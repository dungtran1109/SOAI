# MCP (Model Context Protocol) Implementation Plan for SOAI

## Executive Summary

This document provides a comprehensive plan for integrating **Model Context Protocol (MCP)** into the SOAI multi-agent AI platform. MCP is an open protocol developed by Anthropic that standardizes how AI applications connect to external data sources, tools, and services.

---

## Table of Contents

1. [What is MCP?](#1-what-is-mcp)
2. [Why MCP for SOAI?](#2-why-mcp-for-soai)
3. [Current SOAI Architecture Analysis](#3-current-soai-architecture-analysis)
4. [MCP Architecture Design](#4-mcp-architecture-design)
5. [Implementation Phases](#5-implementation-phases)
6. [Detailed Component Specifications](#6-detailed-component-specifications)
7. [MCP Server Implementations](#7-mcp-server-implementations)
8. [Security Considerations](#8-security-considerations)
9. [Deployment Strategy](#9-deployment-strategy)
10. [Testing Strategy](#10-testing-strategy)
11. [Monitoring & Observability](#11-monitoring--observability)
12. [Timeline & Milestones](#12-timeline--milestones)

---

## 1. What is MCP?

### 1.1 Definition

**Model Context Protocol (MCP)** is an open standard that enables seamless integration between AI/LLM applications and external data sources. It provides a universal, open protocol for connecting AI systems with the context they need.

### 1.2 Core Concepts

```
┌─────────────────────────────────────────────────────────────────┐
│                        MCP Architecture                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐         ┌─────────────┐         ┌──────────┐  │
│   │  MCP Host   │◄───────►│  MCP Client │◄───────►│MCP Server│  │
│   │ (AI Agent)  │         │ (Protocol)  │         │ (Tools)  │  │
│   └─────────────┘         └─────────────┘         └──────────┘  │
│                                                                 │
│   Examples:                                                     │
│   - Claude Desktop        - JSON-RPC 2.0          - File System │
│   - Custom Agent          - Stdio/HTTP/SSE        - Database    │
│   - SOAI Recruitment      - Capability Nego.      - API Tools   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 MCP Primitives

| Primitive | Description | Direction | Example |
|-----------|-------------|-----------|---------|
| **Resources** | Contextual data exposed to LLMs | Server → Client | Files, DB records, API responses |
| **Prompts** | Reusable prompt templates | Server → Client | CV analysis template, JD matching prompt |
| **Tools** | Executable functions for LLMs | Server → Client | `parse_cv()`, `search_knowledge_base()` |
| **Sampling** | LLM completion requests | Client → Server | Request Claude to generate text |
| **Roots** | Filesystem boundaries | Client → Server | Allowed directories for file access |

### 1.4 Transport Mechanisms

| Transport | Use Case | Protocol |
|-----------|----------|----------|
| **Stdio** | Local processes | stdin/stdout pipes |
| **HTTP + SSE** | Remote services | HTTP POST + Server-Sent Events |
| **WebSocket** | Bidirectional streaming | WS frames |

---

## 2. Why MCP for SOAI?

### 2.1 Current Challenges in SOAI

| Challenge | Current State | Impact |
|-----------|---------------|--------|
| **Tool Integration** | Each agent has hardcoded tool calls | Difficult to add/modify tools |
| **Context Management** | Manual context passing between agents | Context loss, inconsistent data |
| **Provider Lock-in** | Tight coupling to specific LLM providers | Hard to switch providers |
| **Reusability** | Agent capabilities not reusable | Code duplication |
| **Standardization** | Custom API contracts per service | Integration complexity |

### 2.2 Benefits of MCP Integration

```
┌────────────────────────────────────────────────────────────────────┐
│                     SOAI + MCP Benefits                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ✅ STANDARDIZED TOOL INTERFACE                                    |
│     └─ One protocol for all external integrations                  │
│                                                                    │
│  ✅ DYNAMIC CAPABILITY DISCOVERY                                   │
│     └─ Agents discover available tools at runtime                  │
│                                                                    │
│  ✅ CONTEXT PRESERVATION                                           │
│     └─ Resources maintain context across agent transitions         │
│                                                                    │
│  ✅ PROVIDER AGNOSTIC                                              │
│     └─ Same tools work with OpenAI, Claude, Gemini, etc.           │
│                                                                    │
│  ✅ COMPOSABLE ARCHITECTURE                                        │
│     └─ Mix and match MCP servers for different capabilities        │
│                                                                    │
│  ✅ ENTERPRISE-READY SECURITY                                      │
│     └─ OAuth 2.0, capability-based permissions                     │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 2.3 SOAI-Specific Use Cases

| Use Case | MCP Solution |
|----------|--------------|
| CV Parsing | MCP Tool: `parse_cv` with structured output schema |
| Knowledge Base Search | MCP Resource: Dynamic RAG context retrieval |
| Email Notifications | MCP Tool: `send_email` with template support |
| Interview Scheduling | MCP Tool: `schedule_interview` with calendar integration |
| JD Management | MCP Resource: Job descriptions as queryable resources |
| Multi-LLM Routing | MCP Sampling: Route requests to appropriate LLM |

---

## 3. Current SOAI Architecture Analysis

### 3.1 Service Inventory

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Current SOAI Services                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │  Authentication  │  │  Gen AI Provider │  │ Recruitment Agent│   │
│  │  (Spring Boot)   │  │    (FastAPI)     │  │   (LangGraph)    │   │
│  │     :9090        │  │      :8004       │  │      :8003       │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘   │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │ Agent Controller │  │  Knowledge Base  │  │    Web Frontend  │   │
│  │    (FastAPI)     │  │    (FastAPI)     │  │     (React)      │   │
│  │      :8005       │  │      :8006       │  │      :8080       │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘   │
│                                                                     │
│  Infrastructure:                                                    │
│  MySQL | Redis | Qdrant | ClickHouse | Consul | OTEL | Prometheus   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Current Integration Points

| Service | Current Integrations | MCP Opportunity |
|---------|---------------------|-----------------|
| `gen_ai_provider` | Direct OpenAI/Claude API calls | MCP Sampling interface |
| `recruitment_agent` | HTTP calls to gen_ai_provider | MCP Client consuming tools |
| `knowledge_base` | Direct Qdrant queries | MCP Resource server |
| `agent_controller` | YAML pipeline orchestration | MCP-aware orchestration |
| `authentication` | JWT token validation | MCP OAuth 2.0 provider |

### 3.3 Data Flow Mapping

```
Current Flow:
┌──────────┐    HTTP     ┌───────────────┐    HTTP    ┌──────────────┐
│  Agent   │────────────►│ Agent Control │───────────►│  Recruitment │
│Controller│             │    (YAML)     │            │    Agent     │
└──────────┘             └───────────────┘            └──────┬───────┘
                                                             │
                              ┌───────────────────────────────┤
                              ▼                               ▼
                    ┌──────────────────┐           ┌──────────────────┐
                    │  Gen AI Provider │           │  Knowledge Base  │
                    │   (LLM Calls)    │           │     (RAG)        │
                    └──────────────────┘           └──────────────────┘

Proposed MCP Flow:
┌──────────┐   MCP    ┌───────────────┐   MCP     ┌──────────────────┐
│   MCP    │◄────────►│  MCP Gateway  │◄─────────►│   MCP Servers    │
│  Host    │          │  (Routing)    │           │  (Tools/Res)     │
└──────────┘          └───────────────┘           └──────────────────┘
     │                                                    │
     │                 Capability                         │
     └────────────────Discovery───────────────────────────┘
```

---

## 4. MCP Architecture Design

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SOAI + MCP Architecture                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         MCP HOST LAYER                              │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │    │
│  │  │ Recruitment     │  │ Custom AI       │  │ External Clients    │  │    │
│  │  │ Agent (Host)    │  │ Agents (Hosts)  │  │ (Claude Desktop)    │  │    │
│  │  └────────┬────────┘  └────────┬────────┘  └──────────┬──────────┘  │    │
│  └───────────┼────────────────────┼───────────────────────┼────────────┘    │
│              │                    │                       │                 │
│              ▼                    ▼                       ▼                 │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      MCP GATEWAY SERVICE                            │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │    │
│  │  │   Router    │  │   Auth      │  │  Registry   │  │   Metrics  │  │    │
│  │  │  (JSON-RPC) │  │  (OAuth)    │  │ (Discovery) │  │   (OTEL)   │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│              │                    │                       │                 │
│              ▼                    ▼                       ▼                 │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                       MCP SERVER LAYER                              │    │
│  │                                                                     │    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐  │    │
│  │  │ CV Parser    │ │ Knowledge    │ │ Email        │ │ Calendar   │  │    │
│  │  │ MCP Server   │ │ Base Server  │ │ MCP Server   │ │ MCP Server │  │    │
│  │  │              │ │              │ │              │ │            │  │    │
│  │  │ Tools:       │ │ Resources:   │ │ Tools:       │ │ Tools:     │  │    │
│  │  │ - parse_cv   │ │ - documents  │ │ - send_email │ │ - schedule │  │    │
│  │  │ - extract_*  │ │ - knowledge  │ │ - templates  │ │ - check    │  │    │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘  │    │
│  │                                                                     │    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐  │    │
│  │  │ Database     │ │ LLM Provider │ │ Recruitment  │ │ Auth       │  │    │
│  │  │ MCP Server   │ │ MCP Server   │ │ MCP Server   │ │ MCP Server │  │    │
│  │  │              │ │              │ │              │ │            │  │    │
│  │  │ Resources:   │ │ Sampling:    │ │ Tools:       │ │ Tools:     │  │    │
│  │  │ - jobs       │ │ - complete   │ │ - score_cv   │ │ - validate │  │    │
│  │  │ - candidates │ │ - embed      │ │ - match_jd   │ │ - get_user │  │    │
│  │  └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘  │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     INFRASTRUCTURE LAYER                            │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │    │
│  │  │ MySQL  │ │ Redis  │ │ Qdrant │ │ClickHs │ │  OTEL  │ │Prometh │  │    │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Component Responsibilities

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| **MCP Host** | AI agent that consumes MCP services | LangGraph + MCP Client SDK |
| **MCP Gateway** | Central routing, auth, discovery | FastAPI + MCP Protocol |
| **MCP Servers** | Expose tools/resources via MCP | Python MCP SDK |
| **Registry** | Dynamic server discovery | Redis + Consul |

### 4.3 Communication Patterns

```
┌─────────────────────────────────────────────────────────────────┐
│                   MCP Communication Flow                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. INITIALIZATION (Capability Negotiation)                     │
│  ┌──────────┐                              ┌──────────┐         │
│  │  Client  │──── initialize ─────────────►│  Server  │         │
│  │          │◄─── serverInfo + caps ───────│          │         │
│  └──────────┘                              └──────────┘         │
│                                                                 │
│  2. TOOL DISCOVERY                                              │
│  ┌──────────┐                              ┌──────────┐         │
│  │  Client  │──── tools/list ─────────────►│  Server  │         │
│  │          │◄─── [tool definitions] ──────│          │         │
│  └──────────┘                              └──────────┘         │
│                                                                 │
│  3. TOOL EXECUTION                                              │
│  ┌──────────┐                              ┌──────────┐         │
│  │  Client  │──── tools/call {name, args} ►│  Server  │         │
│  │          │◄─── {result} ────────────────│          │         │
│  └──────────┘                              └──────────┘         │
│                                                                 │
│  4. RESOURCE ACCESS                                             │
│  ┌──────────┐                              ┌──────────┐         │
│  │  Client  │──── resources/read {uri} ───►│  Server  │         │
│  │          │◄─── {contents} ──────────────│          │         │
│  └──────────┘                              └──────────┘         │
│                                                                 │
│  5. SAMPLING (LLM Request)                                      │
│  ┌──────────┐                              ┌──────────┐         │
│  │  Server  │──── sampling/createMessage ─►│  Client  │         │
│  │          │◄─── {completion} ────────────│  (Host)  │         │
│  └──────────┘                              └──────────┘         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

```
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 1: FOUNDATION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Objectives:                                                    │
│  ├── Set up MCP SDK and dependencies                           │
│  ├── Create base MCP server template                           │
│  ├── Implement first MCP server (Knowledge Base)               │
│  └── Establish testing framework                               │
│                                                                 │
│  Deliverables:                                                  │
│  ├── mcp-sdk-python integration                                │
│  ├── MCP server skeleton with health checks                    │
│  ├── Knowledge Base MCP server (resources + tools)             │
│  ├── Unit tests for MCP protocol handling                      │
│  └── Local development setup with stdio transport              │
│                                                                 │
│  Files to Create:                                               │
│  ├── backend/services/mcp_gateway/                             │
│  ├── backend/services/knowledge_base/mcp_server.py             │
│  ├── requirements-mcp.txt                                      │
│  └── tests/mcp/                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 2: Core MCP Servers (Weeks 3-4)

```
┌─────────────────────────────────────────────────────────────────┐
│                 PHASE 2: CORE MCP SERVERS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Objectives:                                                    │
│  ├── Implement CV Parser MCP Server                            │
│  ├── Implement Database MCP Server                             │
│  ├── Implement LLM Provider MCP Server (Sampling)              │
│  └── Create MCP Gateway for routing                            │
│                                                                 │
│  Deliverables:                                                  │
│  ├── CV Parser MCP Server                                      │
│  │   └── Tools: parse_cv, extract_skills, extract_experience   │
│  ├── Database MCP Server                                       │
│  │   └── Resources: jobs://, candidates://, interviews://      │
│  ├── LLM Provider MCP Server                                   │
│  │   └── Sampling: multi-provider routing                      │
│  └── MCP Gateway Service                                       │
│      └── HTTP+SSE transport, routing, logging                  │
│                                                                 │
│  Files to Create:                                               │
│  ├── backend/services/cv_parser_mcp/                           │
│  ├── backend/services/database_mcp/                            │
│  ├── backend/services/llm_provider_mcp/                        │
│  └── backend/services/mcp_gateway/                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 3: Agent Integration (Weeks 5-6)

```
┌─────────────────────────────────────────────────────────────────┐
│                PHASE 3: AGENT INTEGRATION                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Objectives:                                                    │
│  ├── Refactor Recruitment Agent to use MCP Client              │
│  ├── Dynamic tool discovery in LangGraph                       │
│  ├── Implement MCP-aware Agent Controller                      │
│  └── Create Recruitment Workflow MCP Server                    │
│                                                                 │
│  Deliverables:                                                  │
│  ├── Recruitment Agent with MCP Client integration             │
│  ├── LangGraph nodes that call MCP tools dynamically           │
│  ├── Agent Controller with MCP server registration             │
│  └── Recruitment MCP Server                                    │
│      └── Tools: score_cv, match_jd, approve_candidate          │
│                                                                 │
│  Refactored Files:                                              │
│  ├── backend/services/recruitment_agent/agents/                │
│  ├── backend/services/agent_controller/                        │
│  └── backend/services/recruitment_mcp/                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 4: Security & Production (Weeks 7-8)

```
┌─────────────────────────────────────────────────────────────────┐
│              PHASE 4: SECURITY & PRODUCTION                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Objectives:                                                    │
│  ├── Implement OAuth 2.0 authentication for MCP                 │
│  ├── Add capability-based authorization                         │
│  ├── Kubernetes deployment with Helm                            │
│  └── Observability integration                                  │
│                                                                 │
│  Deliverables:                                                  │
│  ├── Auth MCP Server (OAuth 2.0 + JWT)                          │
│  ├── Permission policies for MCP capabilities                   │
│  ├── Helm charts for MCP services                               │
│  ├── OTEL instrumentation for MCP calls                         │
│  └── Grafana dashboards for MCP metrics                         │
│                                                                 │
│  Files to Create:                                               │
│  ├── helm/mcp-gateway/                                          │
│  ├── helm/mcp-servers/                                          │
│  ├── backend/services/auth_mcp/                                 │
│  └── helm/grafana/dashboards/mcp-observability.json             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Detailed Component Specifications

### 6.1 MCP Gateway Service

```python
# backend/services/mcp_gateway/main.py

"""
MCP Gateway Service
-------------------
Central routing and orchestration for all MCP servers in SOAI.

Features:
- Dynamic server discovery via Redis/Consul
- Request routing based on tool/resource namespace
- OAuth 2.0 authentication integration
- Request/response logging and tracing
- Rate limiting and circuit breaker
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import httpx
import json

app = FastAPI(title="SOAI MCP Gateway", version="1.0.0")

# MCP Server Registry
class MCPServerInfo(BaseModel):
    name: str
    url: str
    transport: str  # "stdio" | "http+sse" | "websocket"
    capabilities: Dict[str, bool]
    tools: List[str]
    resources: List[str]
    health_status: str

class MCPRegistry:
    """Dynamic registry for MCP servers"""

    def __init__(self):
        self.servers: Dict[str, MCPServerInfo] = {}

    async def register(self, server: MCPServerInfo):
        self.servers[server.name] = server

    async def discover_tools(self) -> Dict[str, str]:
        """Returns mapping of tool_name -> server_name"""
        tool_map = {}
        for name, server in self.servers.items():
            for tool in server.tools:
                tool_map[tool] = name
        return tool_map

    async def route_tool_call(self, tool_name: str) -> Optional[MCPServerInfo]:
        tool_map = await self.discover_tools()
        if tool_name in tool_map:
            return self.servers[tool_map[tool_name]]
        return None

registry = MCPRegistry()

# MCP Protocol Endpoints
@app.post("/mcp/initialize")
async def mcp_initialize():
    """Initialize MCP connection and return gateway capabilities"""
    return {
        "protocolVersion": "2024-11-05",
        "serverInfo": {
            "name": "soai-mcp-gateway",
            "version": "1.0.0"
        },
        "capabilities": {
            "tools": {"listChanged": True},
            "resources": {"subscribe": True, "listChanged": True},
            "prompts": {"listChanged": True},
            "logging": {}
        }
    }

@app.get("/mcp/tools/list")
async def list_tools():
    """Aggregate tools from all registered MCP servers"""
    all_tools = []
    for server in registry.servers.values():
        # Fetch tools from each server
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(f"{server.url}/mcp/tools/list")
                tools = resp.json().get("tools", [])
                # Namespace tools with server prefix
                for tool in tools:
                    tool["_server"] = server.name
                all_tools.extend(tools)
            except Exception as e:
                # Log error, continue with other servers
                pass
    return {"tools": all_tools}

@app.post("/mcp/tools/call")
async def call_tool(request: dict):
    """Route tool call to appropriate MCP server"""
    tool_name = request.get("name")
    arguments = request.get("arguments", {})

    server = await registry.route_tool_call(tool_name)
    if not server:
        raise HTTPException(404, f"Tool '{tool_name}' not found")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{server.url}/mcp/tools/call",
            json={"name": tool_name, "arguments": arguments}
        )
        return resp.json()

@app.get("/mcp/resources/list")
async def list_resources():
    """Aggregate resources from all registered MCP servers"""
    all_resources = []
    for server in registry.servers.values():
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(f"{server.url}/mcp/resources/list")
                resources = resp.json().get("resources", [])
                all_resources.extend(resources)
            except Exception:
                pass
    return {"resources": all_resources}

@app.post("/mcp/resources/read")
async def read_resource(request: dict):
    """Route resource read to appropriate MCP server based on URI scheme"""
    uri = request.get("uri")
    # Parse URI to determine server (e.g., "knowledge://doc/123" -> knowledge_base server)
    scheme = uri.split("://")[0] if "://" in uri else None

    for server in registry.servers.values():
        if scheme and any(r.startswith(f"{scheme}://") for r in server.resources):
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{server.url}/mcp/resources/read",
                    json={"uri": uri}
                )
                return resp.json()

    raise HTTPException(404, f"Resource '{uri}' not found")

# Server Registration
@app.post("/registry/register")
async def register_server(server: MCPServerInfo):
    """Register a new MCP server with the gateway"""
    await registry.register(server)
    return {"status": "registered", "server": server.name}

@app.get("/registry/servers")
async def list_servers():
    """List all registered MCP servers"""
    return {"servers": list(registry.servers.values())}

# Health Check
@app.get("/health")
async def health():
    return {"status": "healthy", "servers_count": len(registry.servers)}
```

### 6.2 Base MCP Server Template

```python
# backend/services/mcp_common/base_server.py

"""
Base MCP Server Template
------------------------
Provides common functionality for all SOAI MCP servers.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
from pydantic import BaseModel
from fastapi import FastAPI
import json

class MCPTool(BaseModel):
    name: str
    description: str
    inputSchema: Dict[str, Any]

class MCPResource(BaseModel):
    uri: str
    name: str
    description: Optional[str] = None
    mimeType: Optional[str] = None

class MCPPrompt(BaseModel):
    name: str
    description: Optional[str] = None
    arguments: Optional[List[Dict[str, Any]]] = None

class BaseMCPServer(ABC):
    """Base class for all MCP servers in SOAI"""

    def __init__(self, name: str, version: str = "1.0.0"):
        self.name = name
        self.version = version
        self.app = FastAPI(title=f"SOAI MCP Server: {name}")
        self._setup_routes()
        self._tools: Dict[str, callable] = {}
        self._resources: List[MCPResource] = []
        self._prompts: List[MCPPrompt] = []

    def _setup_routes(self):
        @self.app.post("/mcp/initialize")
        async def initialize():
            return self.get_server_info()

        @self.app.get("/mcp/tools/list")
        async def list_tools():
            return {"tools": self.list_tools()}

        @self.app.post("/mcp/tools/call")
        async def call_tool(request: dict):
            return await self.call_tool(
                request.get("name"),
                request.get("arguments", {})
            )

        @self.app.get("/mcp/resources/list")
        async def list_resources():
            return {"resources": [r.dict() for r in self._resources]}

        @self.app.post("/mcp/resources/read")
        async def read_resource(request: dict):
            return await self.read_resource(request.get("uri"))

        @self.app.get("/mcp/prompts/list")
        async def list_prompts():
            return {"prompts": [p.dict() for p in self._prompts]}

        @self.app.get("/mcp/prompts/get")
        async def get_prompt(request: dict):
            return await self.get_prompt(
                request.get("name"),
                request.get("arguments", {})
            )

        @self.app.get("/health")
        async def health():
            return {"status": "healthy", "server": self.name}

    def get_server_info(self) -> dict:
        return {
            "protocolVersion": "2024-11-05",
            "serverInfo": {
                "name": self.name,
                "version": self.version
            },
            "capabilities": self.get_capabilities()
        }

    @abstractmethod
    def get_capabilities(self) -> dict:
        """Return server capabilities"""
        pass

    def register_tool(self, name: str, description: str,
                      input_schema: dict, handler: callable):
        """Register a tool with the server"""
        self._tools[name] = {
            "definition": MCPTool(
                name=name,
                description=description,
                inputSchema=input_schema
            ),
            "handler": handler
        }

    def list_tools(self) -> List[dict]:
        return [t["definition"].dict() for t in self._tools.values()]

    async def call_tool(self, name: str, arguments: dict) -> dict:
        if name not in self._tools:
            return {"error": f"Tool '{name}' not found"}

        handler = self._tools[name]["handler"]
        try:
            result = await handler(**arguments) if asyncio.iscoroutinefunction(handler) else handler(**arguments)
            return {"content": [{"type": "text", "text": json.dumps(result)}]}
        except Exception as e:
            return {"error": str(e), "isError": True}

    def register_resource(self, uri: str, name: str,
                          description: str = None, mime_type: str = None):
        """Register a resource with the server"""
        self._resources.append(MCPResource(
            uri=uri,
            name=name,
            description=description,
            mimeType=mime_type
        ))

    @abstractmethod
    async def read_resource(self, uri: str) -> dict:
        """Read a resource by URI"""
        pass

    def register_prompt(self, name: str, description: str = None,
                        arguments: List[dict] = None):
        """Register a prompt template"""
        self._prompts.append(MCPPrompt(
            name=name,
            description=description,
            arguments=arguments
        ))

    async def get_prompt(self, name: str, arguments: dict) -> dict:
        """Get a prompt by name with arguments substituted"""
        # Override in subclass for custom prompt handling
        return {"messages": []}
```

---

## 7. MCP Server Implementations

### 7.1 Knowledge Base MCP Server

```python
# backend/services/knowledge_base/mcp_server.py

"""
Knowledge Base MCP Server
-------------------------
Exposes RAG capabilities via MCP protocol.

Resources:
- knowledge://documents/{id} - Individual documents
- knowledge://collections/{name} - Document collections

Tools:
- search_knowledge: Semantic search across knowledge base
- add_document: Add new document to knowledge base
- get_document: Retrieve specific document
"""

from mcp_common.base_server import BaseMCPServer
from qdrant_client import QdrantClient
from typing import List, Optional
import os

class KnowledgeBaseMCPServer(BaseMCPServer):
    def __init__(self):
        super().__init__("knowledge-base-mcp", "1.0.0")
        self.qdrant = QdrantClient(
            host=os.getenv("QDRANT_HOST", "localhost"),
            port=int(os.getenv("QDRANT_PORT", 6333))
        )
        self._register_tools()
        self._register_resources()

    def get_capabilities(self) -> dict:
        return {
            "tools": {},
            "resources": {"subscribe": True, "listChanged": True}
        }

    def _register_tools(self):
        # Search Knowledge Tool
        self.register_tool(
            name="search_knowledge",
            description="Perform semantic search across the knowledge base to find relevant documents",
            input_schema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query"
                    },
                    "collection": {
                        "type": "string",
                        "description": "Optional collection to search in"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of results",
                        "default": 5
                    },
                    "filters": {
                        "type": "object",
                        "description": "Optional metadata filters"
                    }
                },
                "required": ["query"]
            },
            handler=self._search_knowledge
        )

        # Add Document Tool
        self.register_tool(
            name="add_document",
            description="Add a new document to the knowledge base",
            input_schema={
                "type": "object",
                "properties": {
                    "content": {
                        "type": "string",
                        "description": "Document content"
                    },
                    "metadata": {
                        "type": "object",
                        "description": "Document metadata"
                    },
                    "collection": {
                        "type": "string",
                        "description": "Target collection"
                    }
                },
                "required": ["content"]
            },
            handler=self._add_document
        )

        # Get Document Tool
        self.register_tool(
            name="get_document",
            description="Retrieve a specific document by ID",
            input_schema={
                "type": "object",
                "properties": {
                    "document_id": {
                        "type": "string",
                        "description": "Document ID"
                    },
                    "collection": {
                        "type": "string",
                        "description": "Collection name"
                    }
                },
                "required": ["document_id"]
            },
            handler=self._get_document
        )

    def _register_resources(self):
        self.register_resource(
            uri="knowledge://documents",
            name="All Documents",
            description="All documents in the knowledge base",
            mime_type="application/json"
        )
        self.register_resource(
            uri="knowledge://collections",
            name="Collections",
            description="Available document collections",
            mime_type="application/json"
        )

    async def _search_knowledge(self, query: str, collection: str = "default",
                                 limit: int = 5, filters: dict = None) -> dict:
        """Perform semantic search"""
        # Get embedding for query
        embedding = await self._get_embedding(query)

        # Search Qdrant
        results = self.qdrant.search(
            collection_name=collection,
            query_vector=embedding,
            limit=limit,
            query_filter=filters
        )

        return {
            "results": [
                {
                    "id": str(r.id),
                    "score": r.score,
                    "content": r.payload.get("content"),
                    "metadata": r.payload
                }
                for r in results
            ]
        }

    async def _add_document(self, content: str, metadata: dict = None,
                            collection: str = "default") -> dict:
        """Add document to knowledge base"""
        import uuid

        doc_id = str(uuid.uuid4())
        embedding = await self._get_embedding(content)

        self.qdrant.upsert(
            collection_name=collection,
            points=[{
                "id": doc_id,
                "vector": embedding,
                "payload": {
                    "content": content,
                    **(metadata or {})
                }
            }]
        )

        return {"document_id": doc_id, "status": "added"}

    async def _get_document(self, document_id: str,
                            collection: str = "default") -> dict:
        """Retrieve document by ID"""
        result = self.qdrant.retrieve(
            collection_name=collection,
            ids=[document_id]
        )

        if result:
            return {
                "id": str(result[0].id),
                "content": result[0].payload.get("content"),
                "metadata": result[0].payload
            }
        return {"error": "Document not found"}

    async def _get_embedding(self, text: str) -> List[float]:
        """Get embedding from gen_ai_provider"""
        import httpx
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{os.getenv('GEN_AI_URL')}/api/v1/embeddings",
                json={"text": text}
            )
            return resp.json()["embedding"]

    async def read_resource(self, uri: str) -> dict:
        """Read resource by URI"""
        if uri == "knowledge://collections":
            collections = self.qdrant.get_collections()
            return {
                "contents": [{
                    "uri": uri,
                    "mimeType": "application/json",
                    "text": json.dumps([c.name for c in collections.collections])
                }]
            }

        if uri.startswith("knowledge://documents/"):
            doc_id = uri.split("/")[-1]
            doc = await self._get_document(doc_id)
            return {
                "contents": [{
                    "uri": uri,
                    "mimeType": "application/json",
                    "text": json.dumps(doc)
                }]
            }

        return {"contents": []}

# Create server instance
server = KnowledgeBaseMCPServer()
app = server.app
```

### 7.2 CV Parser MCP Server

```python
# backend/services/cv_parser_mcp/main.py

"""
CV Parser MCP Server
--------------------
Specialized MCP server for CV/Resume parsing and analysis.

Tools:
- parse_cv: Parse CV file and extract structured data
- extract_skills: Extract skills from CV text
- extract_experience: Extract work experience
- extract_education: Extract education details
- score_cv: Score CV against job requirements

Prompts:
- cv_analysis: Template for comprehensive CV analysis
- skill_matching: Template for matching skills to job requirements
"""

from mcp_common.base_server import BaseMCPServer
import httpx
import os
from typing import Dict, Any

class CVParserMCPServer(BaseMCPServer):
    def __init__(self):
        super().__init__("cv-parser-mcp", "1.0.0")
        self.gen_ai_url = os.getenv("GEN_AI_URL", "http://gen-ai-provider:8004")
        self._register_tools()
        self._register_prompts()

    def get_capabilities(self) -> dict:
        return {
            "tools": {},
            "prompts": {"listChanged": True}
        }

    def _register_tools(self):
        self.register_tool(
            name="parse_cv",
            description="Parse a CV file and extract structured information including personal details, skills, experience, and education",
            input_schema={
                "type": "object",
                "properties": {
                    "cv_content": {
                        "type": "string",
                        "description": "Raw text content of the CV"
                    },
                    "file_path": {
                        "type": "string",
                        "description": "Path to CV file (PDF, DOCX, TXT)"
                    }
                },
                "oneOf": [
                    {"required": ["cv_content"]},
                    {"required": ["file_path"]}
                ]
            },
            handler=self._parse_cv
        )

        self.register_tool(
            name="extract_skills",
            description="Extract and categorize skills from CV text",
            input_schema={
                "type": "object",
                "properties": {
                    "cv_content": {
                        "type": "string",
                        "description": "CV text content"
                    },
                    "skill_categories": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Categories to extract (e.g., ['programming', 'soft_skills'])"
                    }
                },
                "required": ["cv_content"]
            },
            handler=self._extract_skills
        )

        self.register_tool(
            name="extract_experience",
            description="Extract work experience details from CV",
            input_schema={
                "type": "object",
                "properties": {
                    "cv_content": {
                        "type": "string",
                        "description": "CV text content"
                    }
                },
                "required": ["cv_content"]
            },
            handler=self._extract_experience
        )

        self.register_tool(
            name="extract_education",
            description="Extract education details from CV including degrees, institutions, and dates",
            input_schema={
                "type": "object",
                "properties": {
                    "cv_content": {
                        "type": "string",
                        "description": "CV text content"
                    }
                },
                "required": ["cv_content"]
            },
            handler=self._extract_education
        )

        self.register_tool(
            name="score_cv",
            description="Score a CV against job requirements and return a match percentage with detailed breakdown",
            input_schema={
                "type": "object",
                "properties": {
                    "parsed_cv": {
                        "type": "object",
                        "description": "Parsed CV data from parse_cv tool"
                    },
                    "job_requirements": {
                        "type": "object",
                        "description": "Job requirements to match against",
                        "properties": {
                            "required_skills": {"type": "array", "items": {"type": "string"}},
                            "preferred_skills": {"type": "array", "items": {"type": "string"}},
                            "min_experience_years": {"type": "integer"},
                            "education_requirements": {"type": "string"}
                        }
                    }
                },
                "required": ["parsed_cv", "job_requirements"]
            },
            handler=self._score_cv
        )

    def _register_prompts(self):
        self.register_prompt(
            name="cv_analysis",
            description="Comprehensive CV analysis prompt template",
            arguments=[
                {"name": "cv_content", "description": "Raw CV text", "required": True},
                {"name": "focus_areas", "description": "Areas to focus on", "required": False}
            ]
        )

        self.register_prompt(
            name="skill_matching",
            description="Skill matching prompt for comparing CV to job requirements",
            arguments=[
                {"name": "cv_skills", "description": "Skills from CV", "required": True},
                {"name": "job_skills", "description": "Required job skills", "required": True}
            ]
        )

    async def _call_llm(self, prompt: str, system_prompt: str = None) -> str:
        """Call LLM via gen_ai_provider"""
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.gen_ai_url}/api/v1/chat",
                json={
                    "messages": [
                        {"role": "system", "content": system_prompt or "You are a CV analysis expert."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.3
                }
            )
            return resp.json()["response"]

    async def _parse_cv(self, cv_content: str = None, file_path: str = None) -> Dict[str, Any]:
        """Parse CV and extract structured data"""
        if file_path:
            # Read file content
            cv_content = await self._read_file(file_path)

        prompt = f"""
        Parse the following CV and extract structured information in JSON format:

        {{
            "personal_info": {{
                "name": "",
                "email": "",
                "phone": "",
                "location": "",
                "linkedin": ""
            }},
            "summary": "",
            "skills": {{
                "technical": [],
                "soft_skills": [],
                "languages": [],
                "tools": []
            }},
            "experience": [
                {{
                    "company": "",
                    "title": "",
                    "start_date": "",
                    "end_date": "",
                    "description": "",
                    "achievements": []
                }}
            ],
            "education": [
                {{
                    "institution": "",
                    "degree": "",
                    "field": "",
                    "graduation_year": "",
                    "gpa": ""
                }}
            ],
            "certifications": [],
            "total_experience_years": 0
        }}

        CV Content:
        {cv_content}
        """

        result = await self._call_llm(prompt)
        return json.loads(result)

    async def _extract_skills(self, cv_content: str,
                               skill_categories: list = None) -> Dict[str, Any]:
        """Extract skills from CV"""
        categories = skill_categories or ["technical", "soft_skills", "tools", "languages"]

        prompt = f"""
        Extract skills from the following CV, categorized into: {', '.join(categories)}

        Return as JSON:
        {{
            "skills": {{
                "category_name": ["skill1", "skill2"]
            }},
            "proficiency_levels": {{
                "skill_name": "beginner|intermediate|advanced|expert"
            }}
        }}

        CV Content:
        {cv_content}
        """

        result = await self._call_llm(prompt)
        return json.loads(result)

    async def _extract_experience(self, cv_content: str) -> Dict[str, Any]:
        """Extract work experience"""
        prompt = f"""
        Extract work experience from the following CV.

        Return as JSON:
        {{
            "experiences": [
                {{
                    "company": "",
                    "title": "",
                    "start_date": "",
                    "end_date": "",
                    "duration_months": 0,
                    "location": "",
                    "description": "",
                    "key_achievements": [],
                    "technologies_used": []
                }}
            ],
            "total_years": 0,
            "industries": [],
            "career_progression": ""
        }}

        CV Content:
        {cv_content}
        """

        result = await self._call_llm(prompt)
        return json.loads(result)

    async def _extract_education(self, cv_content: str) -> Dict[str, Any]:
        """Extract education details"""
        prompt = f"""
        Extract education information from the following CV.

        Return as JSON:
        {{
            "education": [
                {{
                    "institution": "",
                    "institution_ranking": "",
                    "degree": "",
                    "field_of_study": "",
                    "graduation_year": "",
                    "gpa": "",
                    "honors": [],
                    "relevant_coursework": []
                }}
            ],
            "highest_degree": "",
            "certifications": [
                {{
                    "name": "",
                    "issuer": "",
                    "date": "",
                    "expiry": ""
                }}
            ]
        }}

        CV Content:
        {cv_content}
        """

        result = await self._call_llm(prompt)
        return json.loads(result)

    async def _score_cv(self, parsed_cv: dict,
                        job_requirements: dict) -> Dict[str, Any]:
        """Score CV against job requirements"""
        prompt = f"""
        Score the following CV against the job requirements.

        CV Data:
        {json.dumps(parsed_cv, indent=2)}

        Job Requirements:
        {json.dumps(job_requirements, indent=2)}

        Return scoring in JSON format:
        {{
            "overall_score": 0-100,
            "skill_match": {{
                "score": 0-100,
                "matched_skills": [],
                "missing_skills": [],
                "additional_skills": []
            }},
            "experience_match": {{
                "score": 0-100,
                "meets_minimum": true/false,
                "relevant_experience_years": 0,
                "experience_details": ""
            }},
            "education_match": {{
                "score": 0-100,
                "meets_requirements": true/false,
                "details": ""
            }},
            "recommendation": "strong_match|good_match|partial_match|weak_match",
            "summary": "",
            "interview_focus_areas": []
        }}
        """

        result = await self._call_llm(prompt)
        return json.loads(result)

    async def _read_file(self, file_path: str) -> str:
        """Read file content from various formats"""
        # Implementation for PDF, DOCX, TXT reading
        pass

    async def read_resource(self, uri: str) -> dict:
        return {"contents": []}

    async def get_prompt(self, name: str, arguments: dict) -> dict:
        if name == "cv_analysis":
            return {
                "messages": [
                    {
                        "role": "user",
                        "content": {
                            "type": "text",
                            "text": f"""Analyze the following CV comprehensively:

Focus areas: {arguments.get('focus_areas', 'all aspects')}

CV Content:
{arguments.get('cv_content', '')}

Provide:
1. Summary of qualifications
2. Key strengths
3. Areas for improvement
4. Career trajectory analysis
5. Recommendations"""
                        }
                    }
                ]
            }

        if name == "skill_matching":
            return {
                "messages": [
                    {
                        "role": "user",
                        "content": {
                            "type": "text",
                            "text": f"""Compare the candidate's skills with job requirements:

Candidate Skills:
{json.dumps(arguments.get('cv_skills', []), indent=2)}

Required Job Skills:
{json.dumps(arguments.get('job_skills', []), indent=2)}

Provide detailed matching analysis with percentage match."""
                        }
                    }
                ]
            }

        return {"messages": []}

# Create server instance
server = CVParserMCPServer()
app = server.app
```

### 7.3 Database MCP Server

```python
# backend/services/database_mcp/main.py

"""
Database MCP Server
-------------------
Exposes SOAI database as MCP resources.

Resources:
- jobs://list - All job descriptions
- jobs://{id} - Specific job description
- candidates://list - All candidates
- candidates://{id} - Specific candidate
- interviews://list - All interviews
- interviews://{id} - Specific interview

Tools:
- query_jobs: Query job descriptions with filters
- query_candidates: Query candidates with filters
- update_candidate_status: Update candidate status
- create_interview: Create new interview record
"""

from mcp_common.base_server import BaseMCPServer
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
import json
from typing import Dict, Any, List

class DatabaseMCPServer(BaseMCPServer):
    def __init__(self):
        super().__init__("database-mcp", "1.0.0")

        db_url = os.getenv("DATABASE_URL", "mysql://root:password@localhost:3306/soai")
        self.engine = create_engine(db_url)
        self.Session = sessionmaker(bind=self.engine)

        self._register_tools()
        self._register_resources()

    def get_capabilities(self) -> dict:
        return {
            "tools": {},
            "resources": {"subscribe": True, "listChanged": True}
        }

    def _register_resources(self):
        self.register_resource(
            uri="jobs://list",
            name="Job Descriptions",
            description="All available job descriptions",
            mime_type="application/json"
        )
        self.register_resource(
            uri="candidates://list",
            name="Candidates",
            description="All registered candidates",
            mime_type="application/json"
        )
        self.register_resource(
            uri="interviews://list",
            name="Interviews",
            description="All scheduled interviews",
            mime_type="application/json"
        )

    def _register_tools(self):
        self.register_tool(
            name="query_jobs",
            description="Query job descriptions with optional filters",
            input_schema={
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "enum": ["open", "closed", "draft"],
                        "description": "Job status filter"
                    },
                    "department": {
                        "type": "string",
                        "description": "Department filter"
                    },
                    "skills": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Required skills filter"
                    },
                    "limit": {
                        "type": "integer",
                        "default": 10
                    }
                }
            },
            handler=self._query_jobs
        )

        self.register_tool(
            name="query_candidates",
            description="Query candidates with optional filters",
            input_schema={
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "enum": ["new", "screening", "interview", "offer", "hired", "rejected"],
                        "description": "Candidate status"
                    },
                    "job_id": {
                        "type": "integer",
                        "description": "Filter by applied job"
                    },
                    "min_score": {
                        "type": "number",
                        "description": "Minimum match score"
                    },
                    "limit": {
                        "type": "integer",
                        "default": 10
                    }
                }
            },
            handler=self._query_candidates
        )

        self.register_tool(
            name="update_candidate_status",
            description="Update the status of a candidate",
            input_schema={
                "type": "object",
                "properties": {
                    "candidate_id": {
                        "type": "integer",
                        "description": "Candidate ID"
                    },
                    "status": {
                        "type": "string",
                        "enum": ["new", "screening", "interview", "offer", "hired", "rejected"]
                    },
                    "notes": {
                        "type": "string",
                        "description": "Status change notes"
                    }
                },
                "required": ["candidate_id", "status"]
            },
            handler=self._update_candidate_status
        )

        self.register_tool(
            name="create_interview",
            description="Schedule a new interview",
            input_schema={
                "type": "object",
                "properties": {
                    "candidate_id": {
                        "type": "integer"
                    },
                    "job_id": {
                        "type": "integer"
                    },
                    "interviewer_ids": {
                        "type": "array",
                        "items": {"type": "integer"}
                    },
                    "scheduled_time": {
                        "type": "string",
                        "format": "date-time"
                    },
                    "interview_type": {
                        "type": "string",
                        "enum": ["phone", "video", "onsite", "technical"]
                    },
                    "notes": {
                        "type": "string"
                    }
                },
                "required": ["candidate_id", "job_id", "scheduled_time", "interview_type"]
            },
            handler=self._create_interview
        )

        self.register_tool(
            name="get_job_details",
            description="Get detailed information about a specific job",
            input_schema={
                "type": "object",
                "properties": {
                    "job_id": {
                        "type": "integer",
                        "description": "Job ID"
                    }
                },
                "required": ["job_id"]
            },
            handler=self._get_job_details
        )

    async def _query_jobs(self, status: str = None, department: str = None,
                          skills: List[str] = None, limit: int = 10) -> Dict[str, Any]:
        """Query jobs with filters"""
        session = self.Session()
        try:
            query = "SELECT * FROM job_descriptions WHERE 1=1"
            params = {}

            if status:
                query += " AND status = :status"
                params["status"] = status
            if department:
                query += " AND department = :department"
                params["department"] = department

            query += " LIMIT :limit"
            params["limit"] = limit

            result = session.execute(text(query), params)
            jobs = [dict(row._mapping) for row in result]

            return {"jobs": jobs, "count": len(jobs)}
        finally:
            session.close()

    async def _query_candidates(self, status: str = None, job_id: int = None,
                                 min_score: float = None, limit: int = 10) -> Dict[str, Any]:
        """Query candidates with filters"""
        session = self.Session()
        try:
            query = "SELECT * FROM candidates WHERE 1=1"
            params = {}

            if status:
                query += " AND status = :status"
                params["status"] = status
            if job_id:
                query += " AND job_id = :job_id"
                params["job_id"] = job_id
            if min_score:
                query += " AND match_score >= :min_score"
                params["min_score"] = min_score

            query += " LIMIT :limit"
            params["limit"] = limit

            result = session.execute(text(query), params)
            candidates = [dict(row._mapping) for row in result]

            return {"candidates": candidates, "count": len(candidates)}
        finally:
            session.close()

    async def _update_candidate_status(self, candidate_id: int, status: str,
                                        notes: str = None) -> Dict[str, Any]:
        """Update candidate status"""
        session = self.Session()
        try:
            query = """
                UPDATE candidates
                SET status = :status, notes = :notes, updated_at = NOW()
                WHERE id = :candidate_id
            """
            session.execute(text(query), {
                "candidate_id": candidate_id,
                "status": status,
                "notes": notes
            })
            session.commit()

            return {"success": True, "candidate_id": candidate_id, "new_status": status}
        finally:
            session.close()

    async def _create_interview(self, candidate_id: int, job_id: int,
                                 scheduled_time: str, interview_type: str,
                                 interviewer_ids: List[int] = None,
                                 notes: str = None) -> Dict[str, Any]:
        """Create new interview"""
        session = self.Session()
        try:
            query = """
                INSERT INTO interviews
                (candidate_id, job_id, scheduled_time, interview_type, notes, status)
                VALUES (:candidate_id, :job_id, :scheduled_time, :interview_type, :notes, 'scheduled')
            """
            result = session.execute(text(query), {
                "candidate_id": candidate_id,
                "job_id": job_id,
                "scheduled_time": scheduled_time,
                "interview_type": interview_type,
                "notes": notes
            })
            session.commit()

            interview_id = result.lastrowid

            # Add interviewers if provided
            if interviewer_ids:
                for interviewer_id in interviewer_ids:
                    session.execute(text("""
                        INSERT INTO interview_interviewers (interview_id, user_id)
                        VALUES (:interview_id, :user_id)
                    """), {"interview_id": interview_id, "user_id": interviewer_id})
                session.commit()

            return {"success": True, "interview_id": interview_id}
        finally:
            session.close()

    async def _get_job_details(self, job_id: int) -> Dict[str, Any]:
        """Get detailed job information"""
        session = self.Session()
        try:
            result = session.execute(
                text("SELECT * FROM job_descriptions WHERE id = :job_id"),
                {"job_id": job_id}
            )
            row = result.fetchone()

            if row:
                return {"job": dict(row._mapping)}
            return {"error": "Job not found"}
        finally:
            session.close()

    async def read_resource(self, uri: str) -> dict:
        """Read resource by URI"""
        session = self.Session()
        try:
            if uri == "jobs://list":
                result = session.execute(text("SELECT * FROM job_descriptions LIMIT 100"))
                jobs = [dict(row._mapping) for row in result]
                return {
                    "contents": [{
                        "uri": uri,
                        "mimeType": "application/json",
                        "text": json.dumps(jobs, default=str)
                    }]
                }

            if uri.startswith("jobs://") and uri != "jobs://list":
                job_id = uri.split("//")[1]
                result = session.execute(
                    text("SELECT * FROM job_descriptions WHERE id = :id"),
                    {"id": job_id}
                )
                row = result.fetchone()
                if row:
                    return {
                        "contents": [{
                            "uri": uri,
                            "mimeType": "application/json",
                            "text": json.dumps(dict(row._mapping), default=str)
                        }]
                    }

            if uri == "candidates://list":
                result = session.execute(text("SELECT * FROM candidates LIMIT 100"))
                candidates = [dict(row._mapping) for row in result]
                return {
                    "contents": [{
                        "uri": uri,
                        "mimeType": "application/json",
                        "text": json.dumps(candidates, default=str)
                    }]
                }

            if uri == "interviews://list":
                result = session.execute(text("SELECT * FROM interviews LIMIT 100"))
                interviews = [dict(row._mapping) for row in result]
                return {
                    "contents": [{
                        "uri": uri,
                        "mimeType": "application/json",
                        "text": json.dumps(interviews, default=str)
                    }]
                }

            return {"contents": []}
        finally:
            session.close()

# Create server instance
server = DatabaseMCPServer()
app = server.app
```

### 7.4 LLM Provider MCP Server (Sampling)

```python
# backend/services/llm_provider_mcp/main.py

"""
LLM Provider MCP Server
-----------------------
Provides sampling capability for MCP clients.
Routes LLM requests to appropriate providers.

Sampling:
- createMessage: Generate completions from various LLM providers
- Multi-provider routing (OpenAI, Claude, Gemini, Ollama)
- Automatic fallback and load balancing

Tools:
- get_providers: List available LLM providers
- get_embeddings: Generate embeddings for text
"""

from mcp_common.base_server import BaseMCPServer
from fastapi import Request
from typing import Dict, Any, List, Optional
import httpx
import os
import json

class LLMProviderMCPServer(BaseMCPServer):
    def __init__(self):
        super().__init__("llm-provider-mcp", "1.0.0")

        self.providers = {
            "openai": {
                "url": "https://api.openai.com/v1/chat/completions",
                "key_env": "OPENAI_API_KEY",
                "models": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"]
            },
            "anthropic": {
                "url": "https://api.anthropic.com/v1/messages",
                "key_env": "ANTHROPIC_API_KEY",
                "models": ["claude-3-5-sonnet-20241022", "claude-3-opus-20240229"]
            },
            "google": {
                "url": "https://generativelanguage.googleapis.com/v1beta/models",
                "key_env": "GOOGLE_API_KEY",
                "models": ["gemini-1.5-pro", "gemini-1.5-flash"]
            },
            "ollama": {
                "url": os.getenv("OLLAMA_URL", "http://localhost:11434/api/chat"),
                "key_env": None,
                "models": ["llama3", "mistral", "codellama"]
            }
        }

        self._register_tools()
        self._setup_sampling()

    def get_capabilities(self) -> dict:
        return {
            "tools": {},
            "sampling": {}  # Enable sampling capability
        }

    def _setup_sampling(self):
        """Setup sampling endpoint for MCP"""
        @self.app.post("/mcp/sampling/createMessage")
        async def create_message(request: dict):
            return await self._create_message(request)

    def _register_tools(self):
        self.register_tool(
            name="get_providers",
            description="List available LLM providers and their models",
            input_schema={
                "type": "object",
                "properties": {}
            },
            handler=self._get_providers
        )

        self.register_tool(
            name="get_embeddings",
            description="Generate embeddings for text",
            input_schema={
                "type": "object",
                "properties": {
                    "text": {
                        "type": "string",
                        "description": "Text to generate embeddings for"
                    },
                    "model": {
                        "type": "string",
                        "description": "Embedding model to use",
                        "default": "text-embedding-3-large"
                    }
                },
                "required": ["text"]
            },
            handler=self._get_embeddings
        )

        self.register_tool(
            name="complete",
            description="Generate completion from LLM",
            input_schema={
                "type": "object",
                "properties": {
                    "prompt": {
                        "type": "string",
                        "description": "Prompt to complete"
                    },
                    "system_prompt": {
                        "type": "string",
                        "description": "System prompt"
                    },
                    "model": {
                        "type": "string",
                        "description": "Model to use"
                    },
                    "provider": {
                        "type": "string",
                        "enum": ["openai", "anthropic", "google", "ollama"]
                    },
                    "temperature": {
                        "type": "number",
                        "default": 0.7
                    },
                    "max_tokens": {
                        "type": "integer",
                        "default": 1024
                    }
                },
                "required": ["prompt"]
            },
            handler=self._complete
        )

    async def _get_providers(self) -> Dict[str, Any]:
        """List available providers"""
        available = {}
        for name, config in self.providers.items():
            key_env = config.get("key_env")
            has_key = key_env is None or os.getenv(key_env) is not None
            available[name] = {
                "available": has_key,
                "models": config["models"]
            }
        return {"providers": available}

    async def _get_embeddings(self, text: str,
                               model: str = "text-embedding-3-large") -> Dict[str, Any]:
        """Generate embeddings"""
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.openai.com/v1/embeddings",
                headers={"Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}"},
                json={
                    "model": model,
                    "input": text
                }
            )
            data = resp.json()
            return {
                "embedding": data["data"][0]["embedding"],
                "model": model,
                "dimensions": len(data["data"][0]["embedding"])
            }

    async def _complete(self, prompt: str, system_prompt: str = None,
                        model: str = None, provider: str = "openai",
                        temperature: float = 0.7,
                        max_tokens: int = 1024) -> Dict[str, Any]:
        """Generate completion"""
        config = self.providers.get(provider)
        if not config:
            return {"error": f"Unknown provider: {provider}"}

        if provider == "openai":
            return await self._call_openai(prompt, system_prompt, model, temperature, max_tokens)
        elif provider == "anthropic":
            return await self._call_anthropic(prompt, system_prompt, model, temperature, max_tokens)
        elif provider == "google":
            return await self._call_google(prompt, system_prompt, model, temperature, max_tokens)
        elif provider == "ollama":
            return await self._call_ollama(prompt, system_prompt, model, temperature, max_tokens)

    async def _call_openai(self, prompt: str, system_prompt: str,
                           model: str, temperature: float,
                           max_tokens: int) -> Dict[str, Any]:
        """Call OpenAI API"""
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {os.getenv('OPENAI_API_KEY')}"},
                json={
                    "model": model or "gpt-4o-mini",
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens
                }
            )
            data = resp.json()
            return {
                "response": data["choices"][0]["message"]["content"],
                "model": data["model"],
                "usage": data.get("usage")
            }

    async def _call_anthropic(self, prompt: str, system_prompt: str,
                               model: str, temperature: float,
                               max_tokens: int) -> Dict[str, Any]:
        """Call Anthropic API"""
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": os.getenv("ANTHROPIC_API_KEY"),
                    "anthropic-version": "2023-06-01"
                },
                json={
                    "model": model or "claude-3-5-sonnet-20241022",
                    "max_tokens": max_tokens,
                    "system": system_prompt or "",
                    "messages": [{"role": "user", "content": prompt}]
                }
            )
            data = resp.json()
            return {
                "response": data["content"][0]["text"],
                "model": data["model"],
                "usage": data.get("usage")
            }

    async def _call_google(self, prompt: str, system_prompt: str,
                           model: str, temperature: float,
                           max_tokens: int) -> Dict[str, Any]:
        """Call Google Gemini API"""
        model = model or "gemini-1.5-flash"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                url,
                params={"key": os.getenv("GOOGLE_API_KEY")},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "systemInstruction": {"parts": [{"text": system_prompt or ""}]},
                    "generationConfig": {
                        "temperature": temperature,
                        "maxOutputTokens": max_tokens
                    }
                }
            )
            data = resp.json()
            return {
                "response": data["candidates"][0]["content"]["parts"][0]["text"],
                "model": model
            }

    async def _call_ollama(self, prompt: str, system_prompt: str,
                           model: str, temperature: float,
                           max_tokens: int) -> Dict[str, Any]:
        """Call Ollama API"""
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                os.getenv("OLLAMA_URL", "http://localhost:11434/api/chat"),
                json={
                    "model": model or "llama3",
                    "messages": [
                        {"role": "system", "content": system_prompt or ""},
                        {"role": "user", "content": prompt}
                    ],
                    "options": {
                        "temperature": temperature,
                        "num_predict": max_tokens
                    },
                    "stream": False
                }
            )
            data = resp.json()
            return {
                "response": data["message"]["content"],
                "model": model
            }

    async def _create_message(self, request: dict) -> Dict[str, Any]:
        """MCP Sampling: createMessage implementation"""
        messages = request.get("messages", [])
        model_preferences = request.get("modelPreferences", {})
        system_prompt = request.get("systemPrompt")
        max_tokens = request.get("maxTokens", 1024)

        # Extract user message
        user_message = ""
        for msg in messages:
            if msg.get("role") == "user":
                content = msg.get("content", {})
                if isinstance(content, dict) and content.get("type") == "text":
                    user_message = content.get("text", "")
                elif isinstance(content, str):
                    user_message = content

        # Determine provider based on hints
        hints = model_preferences.get("hints", [])
        provider = "openai"  # default
        model = None

        for hint in hints:
            hint_name = hint.get("name", "").lower()
            if "claude" in hint_name or "anthropic" in hint_name:
                provider = "anthropic"
                model = hint_name if "claude" in hint_name else None
            elif "gpt" in hint_name or "openai" in hint_name:
                provider = "openai"
                model = hint_name if "gpt" in hint_name else None
            elif "gemini" in hint_name or "google" in hint_name:
                provider = "google"
                model = hint_name if "gemini" in hint_name else None
            elif "llama" in hint_name or "ollama" in hint_name:
                provider = "ollama"
                model = hint_name if "llama" in hint_name else None

        result = await self._complete(
            prompt=user_message,
            system_prompt=system_prompt,
            model=model,
            provider=provider,
            max_tokens=max_tokens
        )

        return {
            "role": "assistant",
            "content": {
                "type": "text",
                "text": result.get("response", "")
            },
            "model": result.get("model"),
            "stopReason": "endTurn"
        }

    async def read_resource(self, uri: str) -> dict:
        return {"contents": []}

# Create server instance
server = LLMProviderMCPServer()
app = server.app
```

---

## 8. Security Considerations

### 8.1 Authentication & Authorization

```
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Security Architecture                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    OAuth 2.0 Flow                        │   │
│  │                                                          │   │
│  │  1. Client requests access token                         │   │
│  │     POST /oauth/token                                    │   │
│  │     └─ client_id, client_secret, scope                   │   │
│  │                                                          │   │
│  │  2. Auth server validates and returns JWT                │   │
│  │     {                                                    │   │
│  │       "access_token": "eyJ...",                          │   │
│  │       "token_type": "bearer",                            │   │
│  │       "expires_in": 3600,                                │   │
│  │       "scope": "mcp:tools:read mcp:resources:read"       │   │
│  │     }                                                    │   │
│  │                                                          │   │
│  │  3. Client includes token in MCP requests                │   │
│  │     Authorization: Bearer eyJ...                         │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │               Capability-Based Permissions               │   │
│  │                                                          │   │
│  │  Scopes:                                                 │   │
│  │  ├─ mcp:tools:read     - List available tools            │   │
│  │  ├─ mcp:tools:execute  - Execute tools                   │   │
│  │  ├─ mcp:resources:read - Read resources                  │   │
│  │  ├─ mcp:resources:write - Modify resources               │   │
│  │  ├─ mcp:sampling:create - Request LLM completions        │   │
│  │  └─ mcp:admin          - Administrative access           │   │
│  │                                                          │   │
│  │  Tool-Level Permissions:                                 │   │
│  │  ├─ cv_parser:parse_cv     - Parse CVs                   │   │
│  │  ├─ database:query_*       - Read database               │   │
│  │  ├─ database:update_*      - Modify database             │   │
│  │  └─ knowledge:search       - Search knowledge base       │   │
│  │                                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Security Best Practices

| Area | Implementation |
|------|----------------|
| **Transport Security** | TLS 1.3 for all HTTP+SSE connections |
| **Token Validation** | JWT verification with RS256 signing |
| **Rate Limiting** | Per-client limits on tool calls (100/min) |
| **Input Validation** | JSON Schema validation for all tool inputs |
| **Audit Logging** | All MCP operations logged to ClickHouse |
| **Secrets Management** | Kubernetes secrets for API keys |
| **Network Policies** | K8s network policies for MCP server isolation |

### 8.3 Data Protection

```python
# Example: Sensitive data handling in MCP

class SecureMCPMiddleware:
    """Middleware for sensitive data protection"""

    SENSITIVE_FIELDS = ["password", "api_key", "token", "secret", "ssn"]

    def redact_sensitive(self, data: dict) -> dict:
        """Redact sensitive fields from logs/responses"""
        redacted = {}
        for key, value in data.items():
            if any(field in key.lower() for field in self.SENSITIVE_FIELDS):
                redacted[key] = "[REDACTED]"
            elif isinstance(value, dict):
                redacted[key] = self.redact_sensitive(value)
            else:
                redacted[key] = value
        return redacted

    def validate_resource_access(self, uri: str, user_scopes: list) -> bool:
        """Validate user has access to resource"""
        # Resource-level access control
        if uri.startswith("candidates://") and "hr:read" not in user_scopes:
            return False
        if "admin://" in uri and "admin" not in user_scopes:
            return False
        return True
```

---

## 9. Deployment Strategy

### 9.1 Kubernetes Architecture

```yaml
# helm/mcp-gateway/templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-gateway
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: mcp-gateway
  template:
    metadata:
      labels:
        app: mcp-gateway
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8000"
    spec:
      containers:
        - name: mcp-gateway
          image: {{ .Values.image.repository }}:{{ .Values.image.tag }}
          ports:
            - containerPort: 8000
              name: http
            - containerPort: 8001
              name: sse
          env:
            - name: REDIS_URL
              valueFrom:
                configMapKeyRef:
                  name: mcp-config
                  key: redis_url
            - name: OTEL_EXPORTER_OTLP_ENDPOINT
              value: {{ .Values.otel.endpoint }}
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 8000
            initialDelaySeconds: 5
            periodSeconds: 10
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
```

### 9.2 Helm Chart Structure

```
helm/
├── mcp-gateway/
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
│       ├── deployment.yaml
│       ├── service.yaml
│       ├── configmap.yaml
│       ├── hpa.yaml
│       └── ingress.yaml
│
├── mcp-servers/
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
│       ├── cv-parser-deployment.yaml
│       ├── knowledge-base-deployment.yaml
│       ├── database-mcp-deployment.yaml
│       ├── llm-provider-deployment.yaml
│       └── services.yaml
│
└── soai-application/
    ├── Chart.yaml
    ├── values.yaml
    └── requirements.yaml  # Add MCP dependencies
```

### 9.3 values.yaml for MCP Gateway

```yaml
# helm/mcp-gateway/values.yaml

replicaCount: 2

image:
  repository: registry.gitlab.com/soai/mcp-gateway
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 8000
  ssePort: 8001

ingress:
  enabled: true
  className: nginx
  annotations:
    nginx.ingress.kubernetes.io/proxy-read-timeout: "3600"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "3600"
  hosts:
    - host: mcp.soai.local
      paths:
        - path: /
          pathType: Prefix

config:
  redis:
    host: redis
    port: 6379
  consul:
    host: consul
    port: 8500
  auth:
    enabled: true
    jwksUrl: "http://authentication:9090/.well-known/jwks.json"

otel:
  enabled: true
  endpoint: "http://otel-collector:4317"

resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
  limits:
    memory: "512Mi"
    cpu: "500m"

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

# MCP Server Registry
servers:
  - name: cv-parser-mcp
    url: http://cv-parser-mcp:8000
    enabled: true
  - name: knowledge-base-mcp
    url: http://knowledge-base-mcp:8000
    enabled: true
  - name: database-mcp
    url: http://database-mcp:8000
    enabled: true
  - name: llm-provider-mcp
    url: http://llm-provider-mcp:8000
    enabled: true
```

---

## 10. Testing Strategy

### 10.1 Test Categories

```
┌─────────────────────────────────────────────────────────────────┐
│                       MCP Testing Strategy                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Unit Tests                            │   │
│  │                                                          │   │
│  │  • MCP protocol message parsing                          │   │
│  │  • Tool input validation                                 │   │
│  │  • Resource URI parsing                                  │   │
│  │  • Authentication middleware                             │   │
│  │                                                          │   │
│  │  Framework: pytest + pytest-asyncio                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                 Integration Tests                        │   │
│  │                                                          │   │
│  │  • MCP server ↔ Gateway communication                    │   │
│  │  • Tool execution end-to-end                             │   │
│  │  • Resource subscription updates                         │   │
│  │  • Multi-server tool aggregation                         │   │
│  │                                                          │   │
│  │  Framework: pytest + testcontainers                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Contract Tests                          │   │
│  │                                                          │   │
│  │  • MCP protocol compliance                               │   │
│  │  • JSON-RPC 2.0 adherence                                │   │
│  │  • Tool schema validation                                │   │
│  │  • Error response formats                                │   │
│  │                                                          │   │
│  │  Framework: schemathesis + hypothesis                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Performance Tests                       │   │
│  │                                                          │   │
│  │  • Tool call latency (P50, P95, P99)                     │   │
│  │  • Concurrent connection handling                        │   │
│  │  • SSE streaming throughput                              │   │
│  │  • Gateway routing overhead                              │   │
│  │                                                          │   │
│  │  Framework: locust + k6                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2 Example Test Cases

```python
# tests/mcp/test_gateway.py

import pytest
from httpx import AsyncClient
from mcp_gateway.main import app

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

class TestMCPGateway:

    async def test_initialize_returns_capabilities(self, client):
        """Test MCP initialization handshake"""
        response = await client.post("/mcp/initialize")
        assert response.status_code == 200

        data = response.json()
        assert data["protocolVersion"] == "2024-11-05"
        assert "capabilities" in data
        assert "tools" in data["capabilities"]

    async def test_list_tools_aggregates_from_servers(self, client):
        """Test tool aggregation from multiple servers"""
        response = await client.get("/mcp/tools/list")
        assert response.status_code == 200

        data = response.json()
        assert "tools" in data

        # Verify tools from different servers are included
        tool_names = [t["name"] for t in data["tools"]]
        assert "parse_cv" in tool_names
        assert "search_knowledge" in tool_names

    async def test_tool_call_routes_to_correct_server(self, client):
        """Test tool call routing"""
        response = await client.post("/mcp/tools/call", json={
            "name": "search_knowledge",
            "arguments": {"query": "test query"}
        })
        assert response.status_code == 200

        data = response.json()
        assert "content" in data

    async def test_invalid_tool_returns_404(self, client):
        """Test error handling for unknown tools"""
        response = await client.post("/mcp/tools/call", json={
            "name": "nonexistent_tool",
            "arguments": {}
        })
        assert response.status_code == 404

    async def test_resource_read_by_uri(self, client):
        """Test resource reading"""
        response = await client.post("/mcp/resources/read", json={
            "uri": "jobs://list"
        })
        assert response.status_code == 200

        data = response.json()
        assert "contents" in data

# tests/mcp/test_cv_parser.py

class TestCVParserMCPServer:

    async def test_parse_cv_returns_structured_data(self, client):
        """Test CV parsing tool"""
        response = await client.post("/mcp/tools/call", json={
            "name": "parse_cv",
            "arguments": {
                "cv_content": """
                John Doe
                Software Engineer
                Skills: Python, JavaScript, AWS
                Experience: 5 years at Tech Corp
                Education: BS Computer Science, MIT
                """
            }
        })

        assert response.status_code == 200
        data = response.json()

        result = json.loads(data["content"][0]["text"])
        assert "personal_info" in result
        assert "skills" in result
        assert "experience" in result
        assert "education" in result

    async def test_score_cv_returns_match_percentage(self, client):
        """Test CV scoring tool"""
        parsed_cv = {
            "skills": {"technical": ["Python", "AWS", "Docker"]},
            "total_experience_years": 5
        }
        job_requirements = {
            "required_skills": ["Python", "AWS"],
            "min_experience_years": 3
        }

        response = await client.post("/mcp/tools/call", json={
            "name": "score_cv",
            "arguments": {
                "parsed_cv": parsed_cv,
                "job_requirements": job_requirements
            }
        })

        assert response.status_code == 200
        data = response.json()

        result = json.loads(data["content"][0]["text"])
        assert "overall_score" in result
        assert result["overall_score"] >= 0
        assert result["overall_score"] <= 100
```

---

## 11. Monitoring & Observability

### 11.1 Metrics

```python
# MCP-specific Prometheus metrics

from prometheus_client import Counter, Histogram, Gauge

# Tool execution metrics
MCP_TOOL_CALLS = Counter(
    'mcp_tool_calls_total',
    'Total MCP tool calls',
    ['server', 'tool', 'status']
)

MCP_TOOL_LATENCY = Histogram(
    'mcp_tool_latency_seconds',
    'MCP tool execution latency',
    ['server', 'tool'],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

# Resource access metrics
MCP_RESOURCE_READS = Counter(
    'mcp_resource_reads_total',
    'Total MCP resource reads',
    ['server', 'resource_type']
)

# Connection metrics
MCP_ACTIVE_CONNECTIONS = Gauge(
    'mcp_active_connections',
    'Current active MCP connections',
    ['transport']  # stdio, http, websocket
)

# Gateway routing metrics
MCP_GATEWAY_ROUTES = Counter(
    'mcp_gateway_routes_total',
    'MCP gateway routing decisions',
    ['source', 'destination', 'status']
)
```

### 11.2 Grafana Dashboard

```json
{
  "title": "SOAI MCP Observability",
  "panels": [
    {
      "title": "MCP Tool Call Rate",
      "type": "timeseries",
      "targets": [
        {
          "expr": "rate(mcp_tool_calls_total[5m])",
          "legendFormat": "{{server}} - {{tool}}"
        }
      ]
    },
    {
      "title": "Tool Execution Latency (P95)",
      "type": "timeseries",
      "targets": [
        {
          "expr": "histogram_quantile(0.95, rate(mcp_tool_latency_seconds_bucket[5m]))",
          "legendFormat": "{{tool}}"
        }
      ]
    },
    {
      "title": "Error Rate by Server",
      "type": "stat",
      "targets": [
        {
          "expr": "sum(rate(mcp_tool_calls_total{status='error'}[5m])) by (server)"
        }
      ]
    },
    {
      "title": "Active Connections",
      "type": "gauge",
      "targets": [
        {
          "expr": "sum(mcp_active_connections) by (transport)"
        }
      ]
    }
  ]
}
```

### 11.3 Distributed Tracing

```python
# OpenTelemetry instrumentation for MCP

from opentelemetry import trace
from opentelemetry.trace import SpanKind

tracer = trace.get_tracer("mcp-gateway")

async def call_tool_with_tracing(tool_name: str, arguments: dict):
    with tracer.start_as_current_span(
        f"mcp.tool.{tool_name}",
        kind=SpanKind.CLIENT,
        attributes={
            "mcp.tool.name": tool_name,
            "mcp.tool.arguments": json.dumps(arguments)
        }
    ) as span:
        try:
            result = await execute_tool(tool_name, arguments)
            span.set_attribute("mcp.tool.success", True)
            return result
        except Exception as e:
            span.set_attribute("mcp.tool.success", False)
            span.set_attribute("mcp.tool.error", str(e))
            span.record_exception(e)
            raise
```

---

## 12. Timeline & Milestones

### Implementation Roadmap

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MCP Implementation Roadmap                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 1: Foundation                                                        │
│  ├── Set up MCP SDK dependencies                                           │
│  ├── Create base MCP server template                                       │
│  ├── Implement Knowledge Base MCP server                                   │
│  ├── Local testing with stdio transport                                    │
│  └── Deliverable: First working MCP server                                 │
│                                                                             │
│  PHASE 2: Core MCP Servers                                                  │
│  ├── CV Parser MCP server                                                  │
│  ├── Database MCP server                                                   │
│  ├── LLM Provider MCP server (sampling)                                    │
│  ├── MCP Gateway service                                                   │
│  └── Deliverable: Complete MCP server ecosystem                            │
│                                                                             │
│  PHASE 3: Agent Integration                                                 │
│  ├── Refactor Recruitment Agent with MCP client                            │
│  ├── Dynamic tool discovery in LangGraph                                   │
│  ├── MCP-aware Agent Controller                                            │
│  └── Deliverable: Agents using MCP for all tool calls                      │
│                                                                             │
│  PHASE 4: Security & Production                                             │
│  ├── OAuth 2.0 authentication                                              │
│  ├── Capability-based authorization                                        │
│  ├── Helm charts for K8s deployment                                        │
│  ├── OTEL instrumentation                                                  │
│  ├── Grafana dashboards                                                    │
│  └── Deliverable: Production-ready MCP infrastructure                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Success Criteria

| Milestone | Success Criteria |
|-----------|------------------|
| **Phase 1 Complete** | Knowledge Base MCP server responds to tool/list and tool/call |
| **Phase 2 Complete** | All 4 MCP servers operational, Gateway routing 100+ req/sec |
| **Phase 3 Complete** | Recruitment Agent uses MCP client for all external calls |
| **Phase 4 Complete** | Production deployment with <100ms P95 latency, 99.9% uptime |

---

## Appendix A: Directory Structure

```
soai/
├── backend/
│   └── services/
│       ├── mcp_common/                    # Shared MCP utilities
│       │   ├── __init__.py
│       │   ├── base_server.py             # Base MCP server class
│       │   ├── client.py                  # MCP client wrapper
│       │   ├── auth.py                    # Auth middleware
│       │   └── tracing.py                 # OTEL instrumentation
│       │
│       ├── mcp_gateway/                   # MCP Gateway service
│       │   ├── __init__.py
│       │   ├── main.py
│       │   ├── registry.py
│       │   ├── router.py
│       │   └── Dockerfile
│       │
│       ├── cv_parser_mcp/                 # CV Parser MCP server
│       │   ├── __init__.py
│       │   ├── main.py
│       │   ├── tools.py
│       │   ├── prompts.py
│       │   └── Dockerfile
│       │
│       ├── knowledge_base/                # Existing + MCP enhancement
│       │   ├── ...existing files...
│       │   └── mcp_server.py              # New MCP server module
│       │
│       ├── database_mcp/                  # Database MCP server
│       │   ├── __init__.py
│       │   ├── main.py
│       │   ├── resources.py
│       │   ├── tools.py
│       │   └── Dockerfile
│       │
│       └── llm_provider_mcp/              # LLM Provider MCP server
│           ├── __init__.py
│           ├── main.py
│           ├── sampling.py
│           ├── providers/
│           │   ├── openai.py
│           │   ├── anthropic.py
│           │   ├── google.py
│           │   └── ollama.py
│           └── Dockerfile
│
├── helm/
│   ├── mcp-gateway/
│   │   ├── Chart.yaml
│   │   ├── values.yaml
│   │   └── templates/
│   │
│   ├── mcp-servers/
│   │   ├── Chart.yaml
│   │   ├── values.yaml
│   │   └── templates/
│   │
│   └── grafana/
│       └── dashboards/
│           └── mcp-observability.json
│
├── tests/
│   └── mcp/
│       ├── test_gateway.py
│       ├── test_cv_parser.py
│       ├── test_knowledge_base.py
│       ├── test_database.py
│       └── test_llm_provider.py
│
└── docs/
    └── MCP_IMPLEMENTATION_PLAN.md         # This document
```

---

## Appendix B: MCP Protocol Reference

### JSON-RPC 2.0 Message Format

```json
// Request
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "parse_cv",
    "arguments": {
      "cv_content": "..."
    }
  }
}

// Response
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"personal_info\": {...}}"
      }
    ]
  }
}

// Error
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid params",
    "data": {
      "details": "Missing required field: cv_content"
    }
  }
}
```

### Standard Error Codes

| Code | Meaning |
|------|---------|
| -32700 | Parse error |
| -32600 | Invalid request |
| -32601 | Method not found |
| -32602 | Invalid params |
| -32603 | Internal error |

---

## Appendix C: Environment Variables

```bash
# MCP Gateway
MCP_GATEWAY_PORT=8000
MCP_SSE_PORT=8001
MCP_REDIS_URL=redis://redis:6379
MCP_CONSUL_URL=http://consul:8500
MCP_AUTH_JWKS_URL=http://authentication:9090/.well-known/jwks.json
MCP_OTEL_ENDPOINT=http://otel-collector:4317

# CV Parser MCP
CV_PARSER_MCP_PORT=8000
GEN_AI_URL=http://gen-ai-provider:8004

# Knowledge Base MCP
KNOWLEDGE_BASE_MCP_PORT=8000
QDRANT_HOST=qdrant
QDRANT_PORT=6333

# Database MCP
DATABASE_MCP_PORT=8000
DATABASE_URL=mysql://user:password@mysql:3306/soai

# LLM Provider MCP
LLM_PROVIDER_MCP_PORT=8000
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
OLLAMA_URL=http://ollama:11434
```

---

*Document Version: 1.0.0*
*Last Updated: January 2026*
*Author: SOAI Architecture Team*
