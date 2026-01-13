# MCP Implementation Guide

## Document Information

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | January 2026 |
| Status | Draft |
| Prerequisites | [02-ARCHITECTURE.md](02-ARCHITECTURE.md) |

---

## 1. Implementation Phases

### 1.1 Phase Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      MCP Implementation Roadmap                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  PHASE 1                PHASE 2                PHASE 3               PHASE 4    │
│  Foundation             Core Servers           Integration           Production │
│                                                                                 │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐       ┌─────────┐ │
│  │ • MCP SDK   │       │ • CV Parser │       │ • Refactor  │       │ • OAuth │ │
│  │ • Base      │       │ • Database  │       │   Recruit.  │       │ • Helm  │ │
│  │   template  │       │ • LLM Prov. │       │   Agent     │       │ • OTEL  │ │
│  │ • Knowledge │       │ • Gateway   │       │ • Agent     │       │ • Dash- │ │
│  │   Base MCP  │       │             │       │   Controller│       │   boards│ │
│  └─────────────┘       └─────────────┘       └─────────────┘       └─────────┘ │
│                                                                                 │
│  Deliverables:          Deliverables:         Deliverables:         Deliver.:  │
│  • Working KB MCP       • 4 MCP servers       • MCP-based agents    • Prod     │
│  • Test suite           • Gateway routing     • Dynamic discovery   │  ready   │
│  • Local dev setup      • 1000 req/s          • E2E tests           • 99.9%    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Phase 1: Foundation

### 2.1 Project Structure

```
backend/services/
├── mcp_common/                      # Shared MCP utilities
│   ├── __init__.py
│   ├── base_server.py               # Base MCP server class
│   ├── client.py                    # MCP client wrapper
│   ├── models.py                    # Pydantic models
│   ├── auth.py                      # Auth middleware
│   ├── tracing.py                   # OTEL instrumentation
│   └── exceptions.py                # Custom exceptions
│
├── mcp_gateway/                     # MCP Gateway service
│   ├── __init__.py
│   ├── main.py                      # FastAPI app
│   ├── config.py                    # Configuration
│   ├── registry.py                  # Server registry
│   ├── router.py                    # Request routing
│   ├── aggregator.py                # Tool/resource aggregation
│   ├── middleware/
│   │   ├── auth.py
│   │   ├── rate_limit.py
│   │   └── tracing.py
│   ├── Dockerfile
│   └── requirements.txt
│
├── knowledge_base/                  # Existing service + MCP
│   ├── ...existing files...
│   ├── mcp_server.py                # MCP server module
│   └── mcp_handlers.py              # Tool handlers
│
└── tests/
    └── mcp/
        ├── conftest.py
        ├── test_base_server.py
        ├── test_gateway.py
        └── test_knowledge_base.py
```

### 2.2 Dependencies

```txt
# requirements-mcp.txt

# MCP SDK
mcp>=1.0.0

# FastAPI ecosystem
fastapi>=0.109.0
uvicorn>=0.27.0
httpx>=0.26.0
python-multipart>=0.0.6

# Validation
pydantic>=2.5.0
jsonschema>=4.20.0

# Async support
anyio>=4.2.0
asyncio-throttle>=1.0.2

# Observability
opentelemetry-api>=1.22.0
opentelemetry-sdk>=1.22.0
opentelemetry-instrumentation-fastapi>=0.43b0
prometheus-client>=0.19.0

# Caching
redis>=5.0.0
cachetools>=5.3.0

# Auth
python-jose[cryptography]>=3.3.0
passlib>=1.7.4

# Utils
python-dotenv>=1.0.0
structlog>=24.1.0
```

### 2.3 Base MCP Server Implementation

```python
# backend/services/mcp_common/base_server.py

"""
Base MCP Server Template
------------------------
Provides common functionality for all SOAI MCP servers.
Implements MCP protocol version 2024-11-05.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Callable, Awaitable
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
import structlog

logger = structlog.get_logger()

# ============================================================================
# MCP Protocol Models
# ============================================================================

class MCPToolInputSchema(BaseModel):
    """JSON Schema for tool input"""
    type: str = "object"
    properties: Dict[str, Any] = Field(default_factory=dict)
    required: List[str] = Field(default_factory=list)

class MCPTool(BaseModel):
    """MCP Tool definition"""
    name: str
    description: str
    inputSchema: MCPToolInputSchema

class MCPResource(BaseModel):
    """MCP Resource definition"""
    uri: str
    name: str
    description: Optional[str] = None
    mimeType: Optional[str] = "application/json"

class MCPPrompt(BaseModel):
    """MCP Prompt definition"""
    name: str
    description: Optional[str] = None
    arguments: Optional[List[Dict[str, Any]]] = None

class MCPContent(BaseModel):
    """MCP Content block"""
    type: str = "text"
    text: str

class MCPToolResult(BaseModel):
    """MCP Tool execution result"""
    content: List[MCPContent]
    isError: bool = False

class MCPResourceContents(BaseModel):
    """MCP Resource contents"""
    uri: str
    mimeType: str = "application/json"
    text: str

class MCPCapabilities(BaseModel):
    """MCP Server capabilities"""
    tools: Optional[Dict[str, Any]] = Field(default_factory=dict)
    resources: Optional[Dict[str, Any]] = None
    prompts: Optional[Dict[str, Any]] = None
    sampling: Optional[Dict[str, Any]] = None
    logging: Optional[Dict[str, Any]] = None

class MCPServerInfo(BaseModel):
    """MCP Server information"""
    name: str
    version: str

class MCPInitializeResult(BaseModel):
    """MCP Initialize response"""
    protocolVersion: str = "2024-11-05"
    serverInfo: MCPServerInfo
    capabilities: MCPCapabilities

# ============================================================================
# Base MCP Server Class
# ============================================================================

class BaseMCPServer(ABC):
    """
    Abstract base class for all MCP servers in SOAI.

    Usage:
        class MyMCPServer(BaseMCPServer):
            def __init__(self):
                super().__init__("my-server", "1.0.0")
                self._register_tools()

            def get_capabilities(self) -> MCPCapabilities:
                return MCPCapabilities(tools={})

            def _register_tools(self):
                self.register_tool(
                    name="my_tool",
                    description="Does something",
                    input_schema={...},
                    handler=self._my_tool_handler
                )

            async def _my_tool_handler(self, **kwargs):
                return {"result": "success"}
    """

    def __init__(self, name: str, version: str = "1.0.0"):
        self.name = name
        self.version = version
        self.app = FastAPI(
            title=f"SOAI MCP Server: {name}",
            version=version,
            docs_url="/docs",
            redoc_url="/redoc"
        )

        # Internal registries
        self._tools: Dict[str, Dict[str, Any]] = {}
        self._resources: List[MCPResource] = []
        self._prompts: List[MCPPrompt] = []

        # Setup
        self._setup_cors()
        self._setup_routes()

        logger.info("MCP server initialized", server=name, version=version)

    def _setup_cors(self):
        """Configure CORS middleware"""
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    def _setup_routes(self):
        """Setup MCP protocol routes"""

        # Initialize
        @self.app.post("/mcp/initialize")
        async def initialize() -> MCPInitializeResult:
            """Initialize MCP connection"""
            return MCPInitializeResult(
                serverInfo=MCPServerInfo(
                    name=self.name,
                    version=self.version
                ),
                capabilities=self.get_capabilities()
            )

        # Tools
        @self.app.get("/mcp/tools/list")
        async def list_tools():
            """List available tools"""
            return {"tools": self.list_tools()}

        @self.app.post("/mcp/tools/call")
        async def call_tool(request: Request):
            """Execute a tool"""
            body = await request.json()
            name = body.get("name")
            arguments = body.get("arguments", {})

            result = await self.call_tool(name, arguments)
            return result

        # Resources
        @self.app.get("/mcp/resources/list")
        async def list_resources():
            """List available resources"""
            return {"resources": [r.model_dump() for r in self._resources]}

        @self.app.post("/mcp/resources/read")
        async def read_resource(request: Request):
            """Read a resource"""
            body = await request.json()
            uri = body.get("uri")
            return await self.read_resource(uri)

        # Prompts
        @self.app.get("/mcp/prompts/list")
        async def list_prompts():
            """List available prompts"""
            return {"prompts": [p.model_dump() for p in self._prompts]}

        @self.app.post("/mcp/prompts/get")
        async def get_prompt(request: Request):
            """Get a prompt with arguments"""
            body = await request.json()
            name = body.get("name")
            arguments = body.get("arguments", {})
            return await self.get_prompt(name, arguments)

        # Health
        @self.app.get("/health")
        async def health():
            """Health check endpoint"""
            return {
                "status": "healthy",
                "server": self.name,
                "version": self.version
            }

        @self.app.get("/health/ready")
        async def ready():
            """Readiness check"""
            return {"ready": True}

    # ========================================================================
    # Abstract Methods
    # ========================================================================

    @abstractmethod
    def get_capabilities(self) -> MCPCapabilities:
        """Return server capabilities. Must be implemented by subclass."""
        pass

    @abstractmethod
    async def read_resource(self, uri: str) -> dict:
        """Read a resource by URI. Must be implemented by subclass."""
        pass

    # ========================================================================
    # Tool Management
    # ========================================================================

    def register_tool(
        self,
        name: str,
        description: str,
        input_schema: Dict[str, Any],
        handler: Callable[..., Awaitable[Any]]
    ):
        """
        Register a tool with the server.

        Args:
            name: Tool name (unique identifier)
            description: Human-readable description
            input_schema: JSON Schema for input validation
            handler: Async function to execute the tool
        """
        tool_def = MCPTool(
            name=name,
            description=description,
            inputSchema=MCPToolInputSchema(**input_schema)
        )

        self._tools[name] = {
            "definition": tool_def,
            "handler": handler
        }

        logger.info("Tool registered", tool=name, server=self.name)

    def list_tools(self) -> List[dict]:
        """Return list of tool definitions"""
        return [t["definition"].model_dump() for t in self._tools.values()]

    async def call_tool(self, name: str, arguments: dict) -> dict:
        """
        Execute a tool by name.

        Args:
            name: Tool name
            arguments: Tool arguments

        Returns:
            MCP tool result
        """
        if name not in self._tools:
            logger.warning("Tool not found", tool=name, server=self.name)
            return {
                "content": [{"type": "text", "text": f"Tool '{name}' not found"}],
                "isError": True
            }

        handler = self._tools[name]["handler"]

        try:
            logger.info("Executing tool", tool=name, server=self.name)

            # Execute handler
            if asyncio.iscoroutinefunction(handler):
                result = await handler(**arguments)
            else:
                result = handler(**arguments)

            # Format result
            if isinstance(result, str):
                text = result
            else:
                text = json.dumps(result, default=str, indent=2)

            return {
                "content": [{"type": "text", "text": text}],
                "isError": False
            }

        except Exception as e:
            logger.error("Tool execution failed", tool=name, error=str(e))
            return {
                "content": [{"type": "text", "text": f"Error: {str(e)}"}],
                "isError": True
            }

    # ========================================================================
    # Resource Management
    # ========================================================================

    def register_resource(
        self,
        uri: str,
        name: str,
        description: str = None,
        mime_type: str = "application/json"
    ):
        """
        Register a resource with the server.

        Args:
            uri: Resource URI (e.g., "knowledge://documents")
            name: Human-readable name
            description: Resource description
            mime_type: Content type
        """
        resource = MCPResource(
            uri=uri,
            name=name,
            description=description,
            mimeType=mime_type
        )
        self._resources.append(resource)
        logger.info("Resource registered", uri=uri, server=self.name)

    # ========================================================================
    # Prompt Management
    # ========================================================================

    def register_prompt(
        self,
        name: str,
        description: str = None,
        arguments: List[dict] = None
    ):
        """
        Register a prompt template.

        Args:
            name: Prompt name
            description: Prompt description
            arguments: List of argument definitions
        """
        prompt = MCPPrompt(
            name=name,
            description=description,
            arguments=arguments
        )
        self._prompts.append(prompt)
        logger.info("Prompt registered", prompt=name, server=self.name)

    async def get_prompt(self, name: str, arguments: dict) -> dict:
        """
        Get a prompt with arguments substituted.
        Override in subclass for custom prompt handling.

        Args:
            name: Prompt name
            arguments: Prompt arguments

        Returns:
            MCP prompt messages
        """
        return {"messages": []}


# ============================================================================
# Helper Functions
# ============================================================================

def create_mcp_error(code: int, message: str, data: dict = None) -> dict:
    """Create MCP error response"""
    error = {
        "code": code,
        "message": message
    }
    if data:
        error["data"] = data
    return {"error": error}
```

### 2.4 Knowledge Base MCP Server

```python
# backend/services/knowledge_base/mcp_server.py

"""
Knowledge Base MCP Server
-------------------------
Exposes RAG capabilities via MCP protocol.

Resources:
- knowledge://documents - All documents
- knowledge://documents/{id} - Specific document
- knowledge://collections - Available collections

Tools:
- search_knowledge: Semantic search
- add_document: Add document
- get_document: Get document by ID
- delete_document: Remove document
"""

import os
import json
import uuid
from typing import Dict, Any, List, Optional

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import httpx

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mcp_common.base_server import BaseMCPServer, MCPCapabilities
import structlog

logger = structlog.get_logger()


class KnowledgeBaseMCPServer(BaseMCPServer):
    """MCP Server for Knowledge Base / RAG operations"""

    def __init__(self):
        super().__init__("knowledge-base-mcp", "1.0.0")

        # Initialize Qdrant client
        self.qdrant = QdrantClient(
            host=os.getenv("QDRANT_HOST", "localhost"),
            port=int(os.getenv("QDRANT_PORT", 6333)),
            https=os.getenv("QDRANT_HTTPS", "false").lower() == "true"
        )

        # Gen AI provider URL for embeddings
        self.gen_ai_url = os.getenv("GEN_AI_URL", "http://gen-ai-provider:8004")

        # Default collection
        self.default_collection = os.getenv("QDRANT_COLLECTION", "knowledge")

        # Embedding dimension
        self.embedding_dim = int(os.getenv("EMBEDDING_DIM", 3072))

        # Initialize
        self._ensure_collection_exists()
        self._register_tools()
        self._register_resources()

        logger.info("Knowledge Base MCP Server initialized")

    def get_capabilities(self) -> MCPCapabilities:
        """Return server capabilities"""
        return MCPCapabilities(
            tools={},
            resources={
                "subscribe": True,
                "listChanged": True
            }
        )

    def _ensure_collection_exists(self):
        """Ensure default collection exists"""
        try:
            collections = self.qdrant.get_collections()
            exists = any(c.name == self.default_collection
                        for c in collections.collections)

            if not exists:
                self.qdrant.create_collection(
                    collection_name=self.default_collection,
                    vectors_config=VectorParams(
                        size=self.embedding_dim,
                        distance=Distance.COSINE
                    )
                )
                logger.info("Created collection", collection=self.default_collection)
        except Exception as e:
            logger.error("Failed to ensure collection", error=str(e))

    def _register_tools(self):
        """Register all tools"""

        # Search Knowledge
        self.register_tool(
            name="search_knowledge",
            description="Perform semantic search across the knowledge base to find relevant documents. Returns top-k most similar documents based on the query.",
            input_schema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query text"
                    },
                    "collection": {
                        "type": "string",
                        "description": "Collection to search in (optional)"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of results (default: 5)",
                        "default": 5
                    },
                    "score_threshold": {
                        "type": "number",
                        "description": "Minimum similarity score (0-1)",
                        "default": 0.7
                    },
                    "filters": {
                        "type": "object",
                        "description": "Metadata filters"
                    }
                },
                "required": ["query"]
            },
            handler=self._search_knowledge
        )

        # Add Document
        self.register_tool(
            name="add_document",
            description="Add a new document to the knowledge base. The document will be embedded and stored for semantic search.",
            input_schema={
                "type": "object",
                "properties": {
                    "content": {
                        "type": "string",
                        "description": "Document content text"
                    },
                    "metadata": {
                        "type": "object",
                        "description": "Document metadata (title, source, etc.)"
                    },
                    "collection": {
                        "type": "string",
                        "description": "Target collection"
                    },
                    "document_id": {
                        "type": "string",
                        "description": "Custom document ID (optional)"
                    }
                },
                "required": ["content"]
            },
            handler=self._add_document
        )

        # Get Document
        self.register_tool(
            name="get_document",
            description="Retrieve a specific document by its ID",
            input_schema={
                "type": "object",
                "properties": {
                    "document_id": {
                        "type": "string",
                        "description": "Document ID to retrieve"
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

        # Delete Document
        self.register_tool(
            name="delete_document",
            description="Delete a document from the knowledge base",
            input_schema={
                "type": "object",
                "properties": {
                    "document_id": {
                        "type": "string",
                        "description": "Document ID to delete"
                    },
                    "collection": {
                        "type": "string",
                        "description": "Collection name"
                    }
                },
                "required": ["document_id"]
            },
            handler=self._delete_document
        )

        # List Collections
        self.register_tool(
            name="list_collections",
            description="List all available collections in the knowledge base",
            input_schema={
                "type": "object",
                "properties": {}
            },
            handler=self._list_collections
        )

    def _register_resources(self):
        """Register resources"""
        self.register_resource(
            uri="knowledge://documents",
            name="All Documents",
            description="All documents in the knowledge base"
        )
        self.register_resource(
            uri="knowledge://collections",
            name="Collections",
            description="Available document collections"
        )

    # ========================================================================
    # Tool Handlers
    # ========================================================================

    async def _get_embedding(self, text: str) -> List[float]:
        """Get embedding from gen_ai_provider"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.gen_ai_url}/api/v1/embeddings",
                json={"text": text}
            )
            response.raise_for_status()
            return response.json()["embedding"]

    async def _search_knowledge(
        self,
        query: str,
        collection: str = None,
        limit: int = 5,
        score_threshold: float = 0.7,
        filters: dict = None
    ) -> Dict[str, Any]:
        """Perform semantic search"""
        collection = collection or self.default_collection

        logger.info("Searching knowledge base",
                   query=query[:50], collection=collection, limit=limit)

        # Get embedding for query
        embedding = await self._get_embedding(query)

        # Build filter if provided
        query_filter = None
        if filters:
            from qdrant_client.models import Filter, FieldCondition, MatchValue
            conditions = []
            for key, value in filters.items():
                conditions.append(
                    FieldCondition(key=key, match=MatchValue(value=value))
                )
            query_filter = Filter(must=conditions)

        # Search Qdrant
        results = self.qdrant.search(
            collection_name=collection,
            query_vector=embedding,
            limit=limit,
            score_threshold=score_threshold,
            query_filter=query_filter
        )

        # Format results
        documents = []
        for result in results:
            documents.append({
                "id": str(result.id),
                "score": round(result.score, 4),
                "content": result.payload.get("content", ""),
                "metadata": {
                    k: v for k, v in result.payload.items()
                    if k != "content"
                }
            })

        return {
            "query": query,
            "collection": collection,
            "results": documents,
            "count": len(documents)
        }

    async def _add_document(
        self,
        content: str,
        metadata: dict = None,
        collection: str = None,
        document_id: str = None
    ) -> Dict[str, Any]:
        """Add document to knowledge base"""
        collection = collection or self.default_collection
        doc_id = document_id or str(uuid.uuid4())

        logger.info("Adding document",
                   doc_id=doc_id, collection=collection,
                   content_length=len(content))

        # Get embedding
        embedding = await self._get_embedding(content)

        # Prepare payload
        payload = {
            "content": content,
            **(metadata or {})
        }

        # Upsert to Qdrant
        self.qdrant.upsert(
            collection_name=collection,
            points=[
                PointStruct(
                    id=doc_id,
                    vector=embedding,
                    payload=payload
                )
            ]
        )

        return {
            "status": "success",
            "document_id": doc_id,
            "collection": collection,
            "content_length": len(content)
        }

    async def _get_document(
        self,
        document_id: str,
        collection: str = None
    ) -> Dict[str, Any]:
        """Get document by ID"""
        collection = collection or self.default_collection

        results = self.qdrant.retrieve(
            collection_name=collection,
            ids=[document_id],
            with_payload=True
        )

        if not results:
            return {"error": f"Document '{document_id}' not found"}

        point = results[0]
        return {
            "id": str(point.id),
            "content": point.payload.get("content", ""),
            "metadata": {
                k: v for k, v in point.payload.items()
                if k != "content"
            }
        }

    async def _delete_document(
        self,
        document_id: str,
        collection: str = None
    ) -> Dict[str, Any]:
        """Delete document"""
        collection = collection or self.default_collection

        self.qdrant.delete(
            collection_name=collection,
            points_selector=[document_id]
        )

        return {
            "status": "success",
            "deleted_id": document_id,
            "collection": collection
        }

    async def _list_collections(self) -> Dict[str, Any]:
        """List all collections"""
        collections = self.qdrant.get_collections()

        result = []
        for col in collections.collections:
            info = self.qdrant.get_collection(col.name)
            result.append({
                "name": col.name,
                "vectors_count": info.vectors_count,
                "points_count": info.points_count
            })

        return {"collections": result}

    # ========================================================================
    # Resource Handler
    # ========================================================================

    async def read_resource(self, uri: str) -> dict:
        """Read resource by URI"""

        if uri == "knowledge://collections":
            result = await self._list_collections()
            return {
                "contents": [{
                    "uri": uri,
                    "mimeType": "application/json",
                    "text": json.dumps(result)
                }]
            }

        if uri == "knowledge://documents":
            # Return summary of documents (not all content)
            collection = self.default_collection
            info = self.qdrant.get_collection(collection)
            return {
                "contents": [{
                    "uri": uri,
                    "mimeType": "application/json",
                    "text": json.dumps({
                        "collection": collection,
                        "total_documents": info.points_count
                    })
                }]
            }

        if uri.startswith("knowledge://documents/"):
            doc_id = uri.split("/")[-1]
            result = await self._get_document(doc_id)
            return {
                "contents": [{
                    "uri": uri,
                    "mimeType": "application/json",
                    "text": json.dumps(result)
                }]
            }

        return {"contents": []}


# ============================================================================
# Application Entry Point
# ============================================================================

server = KnowledgeBaseMCPServer()
app = server.app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "mcp_server:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "false").lower() == "true"
    )
```

---

## 3. Phase 2: Core MCP Servers

### 3.1 MCP Gateway Implementation

```python
# backend/services/mcp_gateway/main.py

"""
MCP Gateway Service
-------------------
Central routing and orchestration for all MCP servers.

Features:
- Dynamic server discovery
- Request routing
- OAuth 2.0 authentication
- Rate limiting
- Metrics & tracing
"""

import os
import json
from typing import Dict, List, Optional, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import redis.asyncio as redis
from prometheus_client import Counter, Histogram, generate_latest
from opentelemetry import trace
from opentelemetry.trace import SpanKind

import structlog

logger = structlog.get_logger()
tracer = trace.get_tracer("mcp-gateway")

# ============================================================================
# Configuration
# ============================================================================

class Settings:
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    REGISTRY_TTL = int(os.getenv("REGISTRY_TTL", 60))
    REQUEST_TIMEOUT = float(os.getenv("REQUEST_TIMEOUT", 30.0))

settings = Settings()

# ============================================================================
# Metrics
# ============================================================================

REQUEST_COUNT = Counter(
    'mcp_gateway_requests_total',
    'Total MCP gateway requests',
    ['method', 'server', 'status']
)

REQUEST_LATENCY = Histogram(
    'mcp_gateway_request_latency_seconds',
    'Request latency',
    ['method', 'server']
)

# ============================================================================
# Models
# ============================================================================

class MCPServerInfo(BaseModel):
    name: str
    url: str
    tools: List[str] = []
    resources: List[str] = []
    health_status: str = "unknown"

class ToolCallRequest(BaseModel):
    name: str
    arguments: Dict[str, Any] = {}

class ResourceReadRequest(BaseModel):
    uri: str

# ============================================================================
# Server Registry
# ============================================================================

class ServerRegistry:
    """Manages MCP server registration and discovery"""

    def __init__(self):
        self.redis: Optional[redis.Redis] = None
        self._local_cache: Dict[str, MCPServerInfo] = {}

    async def connect(self):
        """Connect to Redis"""
        self.redis = redis.from_url(settings.REDIS_URL)
        logger.info("Connected to Redis")

    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis:
            await self.redis.close()

    async def register(self, server: MCPServerInfo):
        """Register a server"""
        key = f"mcp:server:{server.name}"
        await self.redis.setex(
            key,
            settings.REGISTRY_TTL,
            server.model_dump_json()
        )
        self._local_cache[server.name] = server
        logger.info("Server registered", server=server.name, url=server.url)

    async def unregister(self, name: str):
        """Unregister a server"""
        key = f"mcp:server:{name}"
        await self.redis.delete(key)
        self._local_cache.pop(name, None)
        logger.info("Server unregistered", server=name)

    async def get_all_servers(self) -> List[MCPServerInfo]:
        """Get all registered servers"""
        servers = []
        async for key in self.redis.scan_iter("mcp:server:*"):
            data = await self.redis.get(key)
            if data:
                servers.append(MCPServerInfo.model_validate_json(data))
        return servers

    async def get_server_for_tool(self, tool_name: str) -> Optional[MCPServerInfo]:
        """Find server that provides a tool"""
        servers = await self.get_all_servers()
        for server in servers:
            if tool_name in server.tools:
                return server
        return None

    async def get_server_for_resource(self, uri: str) -> Optional[MCPServerInfo]:
        """Find server that provides a resource"""
        scheme = uri.split("://")[0] if "://" in uri else None
        servers = await self.get_all_servers()
        for server in servers:
            for resource_uri in server.resources:
                if resource_uri.startswith(f"{scheme}://"):
                    return server
        return None

    async def build_tool_map(self) -> Dict[str, str]:
        """Build mapping of tool_name -> server_name"""
        tool_map = {}
        servers = await self.get_all_servers()
        for server in servers:
            for tool in server.tools:
                tool_map[tool] = server.name
        return tool_map

# ============================================================================
# Application
# ============================================================================

registry = ServerRegistry()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    await registry.connect()

    # Register default servers from config
    default_servers = [
        MCPServerInfo(
            name="knowledge-base-mcp",
            url=os.getenv("KNOWLEDGE_BASE_MCP_URL", "http://knowledge-base-mcp:8000"),
            tools=["search_knowledge", "add_document", "get_document",
                   "delete_document", "list_collections"],
            resources=["knowledge://documents", "knowledge://collections"]
        ),
        MCPServerInfo(
            name="cv-parser-mcp",
            url=os.getenv("CV_PARSER_MCP_URL", "http://cv-parser-mcp:8000"),
            tools=["parse_cv", "extract_skills", "extract_experience",
                   "extract_education", "score_cv"],
            resources=[]
        ),
        MCPServerInfo(
            name="database-mcp",
            url=os.getenv("DATABASE_MCP_URL", "http://database-mcp:8000"),
            tools=["query_jobs", "query_candidates", "update_candidate_status",
                   "create_interview", "get_job_details"],
            resources=["jobs://", "candidates://", "interviews://"]
        ),
        MCPServerInfo(
            name="llm-provider-mcp",
            url=os.getenv("LLM_PROVIDER_MCP_URL", "http://llm-provider-mcp:8000"),
            tools=["get_providers", "get_embeddings", "complete"],
            resources=[]
        )
    ]

    for server in default_servers:
        await registry.register(server)

    yield

    await registry.disconnect()

app = FastAPI(
    title="SOAI MCP Gateway",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# HTTP Client
# ============================================================================

async def forward_request(
    server: MCPServerInfo,
    method: str,
    path: str,
    body: dict = None
) -> dict:
    """Forward request to MCP server"""
    url = f"{server.url}{path}"

    with tracer.start_as_current_span(
        f"mcp.forward.{path}",
        kind=SpanKind.CLIENT
    ) as span:
        span.set_attribute("mcp.server", server.name)
        span.set_attribute("mcp.path", path)

        async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT) as client:
            if method == "GET":
                response = await client.get(url)
            else:
                response = await client.post(url, json=body)

            span.set_attribute("http.status_code", response.status_code)

            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=response.text
                )

            return response.json()

# ============================================================================
# MCP Protocol Endpoints
# ============================================================================

@app.post("/mcp/initialize")
async def initialize():
    """Initialize MCP connection"""
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
    """Aggregate tools from all servers"""
    all_tools = []
    servers = await registry.get_all_servers()

    for server in servers:
        try:
            result = await forward_request(server, "GET", "/mcp/tools/list")
            tools = result.get("tools", [])

            # Add server metadata
            for tool in tools:
                tool["_server"] = server.name

            all_tools.extend(tools)
            REQUEST_COUNT.labels(
                method="tools/list",
                server=server.name,
                status="success"
            ).inc()

        except Exception as e:
            logger.error("Failed to list tools from server",
                        server=server.name, error=str(e))
            REQUEST_COUNT.labels(
                method="tools/list",
                server=server.name,
                status="error"
            ).inc()

    return {"tools": all_tools}

@app.post("/mcp/tools/call")
async def call_tool(request: ToolCallRequest):
    """Route tool call to appropriate server"""
    with REQUEST_LATENCY.labels(
        method="tools/call",
        server="gateway"
    ).time():
        server = await registry.get_server_for_tool(request.name)

        if not server:
            REQUEST_COUNT.labels(
                method="tools/call",
                server="unknown",
                status="not_found"
            ).inc()
            raise HTTPException(404, f"Tool '{request.name}' not found")

        try:
            result = await forward_request(
                server,
                "POST",
                "/mcp/tools/call",
                {"name": request.name, "arguments": request.arguments}
            )

            REQUEST_COUNT.labels(
                method="tools/call",
                server=server.name,
                status="success"
            ).inc()

            return result

        except Exception as e:
            REQUEST_COUNT.labels(
                method="tools/call",
                server=server.name,
                status="error"
            ).inc()
            raise

@app.get("/mcp/resources/list")
async def list_resources():
    """Aggregate resources from all servers"""
    all_resources = []
    servers = await registry.get_all_servers()

    for server in servers:
        try:
            result = await forward_request(server, "GET", "/mcp/resources/list")
            resources = result.get("resources", [])
            all_resources.extend(resources)
        except Exception as e:
            logger.error("Failed to list resources",
                        server=server.name, error=str(e))

    return {"resources": all_resources}

@app.post("/mcp/resources/read")
async def read_resource(request: ResourceReadRequest):
    """Route resource read to appropriate server"""
    server = await registry.get_server_for_resource(request.uri)

    if not server:
        raise HTTPException(404, f"Resource '{request.uri}' not found")

    return await forward_request(
        server,
        "POST",
        "/mcp/resources/read",
        {"uri": request.uri}
    )

@app.post("/mcp/sampling/createMessage")
async def create_message(request: Request):
    """Forward sampling request to LLM provider"""
    body = await request.json()

    # Route to LLM provider MCP server
    server = await registry.get_server_for_tool("complete")

    if not server:
        raise HTTPException(500, "LLM provider not available")

    return await forward_request(
        server,
        "POST",
        "/mcp/sampling/createMessage",
        body
    )

# ============================================================================
# Registry Management
# ============================================================================

@app.post("/registry/register")
async def register_server(server: MCPServerInfo):
    """Register a new MCP server"""
    await registry.register(server)
    return {"status": "registered", "server": server.name}

@app.delete("/registry/unregister/{name}")
async def unregister_server(name: str):
    """Unregister an MCP server"""
    await registry.unregister(name)
    return {"status": "unregistered", "server": name}

@app.get("/registry/servers")
async def get_servers():
    """List all registered servers"""
    servers = await registry.get_all_servers()
    return {"servers": [s.model_dump() for s in servers]}

# ============================================================================
# Health & Metrics
# ============================================================================

@app.get("/health")
async def health():
    """Health check"""
    servers = await registry.get_all_servers()
    return {
        "status": "healthy",
        "servers_count": len(servers)
    }

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    from fastapi.responses import Response
    return Response(
        content=generate_latest(),
        media_type="text/plain"
    )

# ============================================================================
# Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "false").lower() == "true"
    )
```

---

## 4. Testing

### 4.1 Test Structure

```python
# tests/mcp/conftest.py

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, MagicMock

@pytest_asyncio.fixture
async def gateway_client():
    """Create test client for gateway"""
    from mcp_gateway.main import app

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        yield client

@pytest_asyncio.fixture
async def kb_client():
    """Create test client for knowledge base"""
    from knowledge_base.mcp_server import app

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        yield client

@pytest.fixture
def mock_qdrant():
    """Mock Qdrant client"""
    mock = MagicMock()
    mock.search.return_value = []
    mock.get_collections.return_value = MagicMock(collections=[])
    return mock
```

### 4.2 Gateway Tests

```python
# tests/mcp/test_gateway.py

import pytest
from httpx import AsyncClient

class TestMCPGateway:
    """Tests for MCP Gateway"""

    @pytest.mark.asyncio
    async def test_initialize(self, gateway_client: AsyncClient):
        """Test MCP initialization"""
        response = await gateway_client.post("/mcp/initialize")

        assert response.status_code == 200
        data = response.json()

        assert data["protocolVersion"] == "2024-11-05"
        assert "serverInfo" in data
        assert data["serverInfo"]["name"] == "soai-mcp-gateway"
        assert "capabilities" in data
        assert "tools" in data["capabilities"]

    @pytest.mark.asyncio
    async def test_list_tools(self, gateway_client: AsyncClient):
        """Test tool listing"""
        response = await gateway_client.get("/mcp/tools/list")

        assert response.status_code == 200
        data = response.json()

        assert "tools" in data
        assert isinstance(data["tools"], list)

    @pytest.mark.asyncio
    async def test_tool_not_found(self, gateway_client: AsyncClient):
        """Test calling non-existent tool"""
        response = await gateway_client.post(
            "/mcp/tools/call",
            json={
                "name": "nonexistent_tool",
                "arguments": {}
            }
        )

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_health_check(self, gateway_client: AsyncClient):
        """Test health endpoint"""
        response = await gateway_client.get("/health")

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "healthy"
        assert "servers_count" in data
```

### 4.3 Knowledge Base Tests

```python
# tests/mcp/test_knowledge_base.py

import pytest
from httpx import AsyncClient
from unittest.mock import patch, AsyncMock

class TestKnowledgeBaseMCP:
    """Tests for Knowledge Base MCP Server"""

    @pytest.mark.asyncio
    async def test_initialize(self, kb_client: AsyncClient):
        """Test MCP initialization"""
        response = await kb_client.post("/mcp/initialize")

        assert response.status_code == 200
        data = response.json()

        assert data["serverInfo"]["name"] == "knowledge-base-mcp"

    @pytest.mark.asyncio
    async def test_list_tools(self, kb_client: AsyncClient):
        """Test tool listing"""
        response = await kb_client.get("/mcp/tools/list")

        assert response.status_code == 200
        data = response.json()

        tool_names = [t["name"] for t in data["tools"]]
        assert "search_knowledge" in tool_names
        assert "add_document" in tool_names

    @pytest.mark.asyncio
    @patch("knowledge_base.mcp_server.KnowledgeBaseMCPServer._get_embedding")
    @patch("knowledge_base.mcp_server.KnowledgeBaseMCPServer.qdrant")
    async def test_search_knowledge(
        self,
        mock_qdrant,
        mock_embedding,
        kb_client: AsyncClient
    ):
        """Test search_knowledge tool"""
        # Setup mocks
        mock_embedding.return_value = [0.1] * 3072
        mock_qdrant.search.return_value = []

        response = await kb_client.post(
            "/mcp/tools/call",
            json={
                "name": "search_knowledge",
                "arguments": {"query": "test query"}
            }
        )

        assert response.status_code == 200
        data = response.json()

        assert "content" in data
        assert data["isError"] == False

    @pytest.mark.asyncio
    async def test_list_resources(self, kb_client: AsyncClient):
        """Test resource listing"""
        response = await kb_client.get("/mcp/resources/list")

        assert response.status_code == 200
        data = response.json()

        resource_uris = [r["uri"] for r in data["resources"]]
        assert "knowledge://documents" in resource_uris
        assert "knowledge://collections" in resource_uris
```

---

*Next: [04-API-SPECIFICATION.md](04-API-SPECIFICATION.md) - MCP API Specification*
