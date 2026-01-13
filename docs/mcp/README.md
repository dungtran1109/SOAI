# SOAI MCP Documentation

## Model Context Protocol Integration for SOAI

This documentation provides a comprehensive design and implementation plan for integrating **Model Context Protocol (MCP)** into the SOAI multi-agent AI platform.

---

## Document Index

| # | Document | Description |
|---|----------|-------------|
| 1 | [Design Overview](01-DESIGN-OVERVIEW.md) | Executive summary, MCP concepts, pros/cons analysis |
| 2 | [Architecture](02-ARCHITECTURE.md) | System architecture, data flow, component design |
| 3 | [Implementation](03-IMPLEMENTATION.md) | Phase-by-phase implementation guide with code |
| 4 | [API Specification](04-API-SPECIFICATION.md) | MCP endpoint definitions, tool schemas |
| 5 | [Security](05-SECURITY.md) | Authentication, authorization, audit logging |
| 6 | [Deployment](06-DEPLOYMENT.md) | Kubernetes/Helm deployment guide |

---

## Quick Start

### What is MCP?

**Model Context Protocol (MCP)** is an open standard by Anthropic that enables AI applications to connect to external tools, data sources, and services through a unified protocol.

### Why MCP for SOAI?

| Current Challenge | MCP Solution |
|-------------------|--------------|
| Hardcoded tool integrations | Standardized tool interface |
| Manual context passing | Dynamic resource management |
| Provider lock-in | Multi-LLM support via sampling |
| Non-reusable capabilities | Composable MCP servers |

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    MCP HOSTS                            │
│  (Recruitment Agent, Agent Controller, Claude Desktop)  │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                   MCP GATEWAY                           │
│  (Routing, Auth, Discovery, Metrics)                    │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                  MCP SERVERS                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐   │
│  │ CV Parser   │ │ Knowledge   │ │ Database        │   │
│  │ (Tools)     │ │ Base (RAG)  │ │ (Resources)     │   │
│  └─────────────┘ └─────────────┘ └─────────────────┘   │
│  ┌─────────────┐ ┌─────────────┐                       │
│  │LLM Provider │ │ Email       │                       │
│  │ (Sampling)  │ │ (Tools)     │                       │
│  └─────────────┘ └─────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

### MCP Servers for SOAI

| Server | Purpose | Primitives |
|--------|---------|------------|
| **CV Parser** | CV analysis & scoring | Tools: `parse_cv`, `score_cv` |
| **Knowledge Base** | RAG capabilities | Resources + Tools |
| **Database** | Job/candidate data | Resources: `jobs://`, `candidates://` |
| **LLM Provider** | Multi-model routing | Sampling |

---

## Implementation Phases

### Phase 1: Foundation
- Set up MCP SDK dependencies
- Create base MCP server template
- Implement Knowledge Base MCP server
- Establish testing framework

### Phase 2: Core Servers
- CV Parser MCP server
- Database MCP server
- LLM Provider MCP server
- MCP Gateway service

### Phase 3: Agent Integration
- Refactor Recruitment Agent with MCP client
- Dynamic tool discovery in LangGraph
- MCP-aware Agent Controller

### Phase 4: Production
- OAuth 2.0 authentication
- Capability-based authorization
- Kubernetes/Helm deployment
- Observability (OTEL, Grafana dashboards)

---

## Key Files

### Code Structure

```
backend/services/
├── mcp_common/           # Shared MCP utilities
│   ├── base_server.py    # Base MCP server class
│   └── client.py         # MCP client wrapper
├── mcp_gateway/          # MCP Gateway service
│   ├── main.py
│   └── registry.py
├── cv_parser_mcp/        # CV Parser MCP server
├── knowledge_base/       # Existing + MCP module
│   └── mcp_server.py
├── database_mcp/         # Database MCP server
└── llm_provider_mcp/     # LLM Provider MCP server
```

### Helm Charts

```
helm/
├── mcp-gateway/          # Gateway Helm chart
├── mcp-servers/          # MCP servers chart
└── soai-mcp/             # Umbrella chart
```

---

## Getting Started

### Local Development

```bash
# Install dependencies
pip install -r requirements-mcp.txt

# Run Knowledge Base MCP server
cd backend/services/knowledge_base
python mcp_server.py

# Run Gateway
cd backend/services/mcp_gateway
python main.py

# Test
curl http://localhost:8000/mcp/tools/list
```

### Kubernetes Deployment

```bash
# Install MCP components
helm upgrade --install mcp-gateway ./helm/mcp-gateway -n soai
helm upgrade --install mcp-servers ./helm/mcp-servers -n soai

# Verify
kubectl get pods -n soai -l type=mcp-server
```

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Tool call latency overhead | < 20ms P95 |
| Gateway availability | 99.9% |
| Tool discovery time | < 100ms |
| New tool deployment | < 1 day |

---

## References

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [Anthropic MCP Documentation](https://docs.anthropic.com/en/build-with-claude/mcp)

---

*Last Updated: January 2026*
*Version: 1.0.0*
