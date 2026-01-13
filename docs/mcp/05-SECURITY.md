# MCP Security Design

## Document Information

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | January 2026 |
| Status | Draft |
| Prerequisites | [04-API-SPECIFICATION.md](04-API-SPECIFICATION.md) |

---

## 1. Security Architecture

### 1.1 Security Layers

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          MCP Security Architecture                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    LAYER 1: TRANSPORT SECURITY                           │   │
│  │                                                                          │   │
│  │  • TLS 1.3 for all HTTP communications                                   │   │
│  │  • Certificate validation                                                │   │
│  │  • mTLS for inter-service communication (optional)                       │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                         │
│                                       ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    LAYER 2: AUTHENTICATION                               │   │
│  │                                                                          │   │
│  │  • OAuth 2.0 / OpenID Connect                                            │   │
│  │  • JWT token validation                                                  │   │
│  │  • API key authentication (for M2M)                                      │   │
│  │  • Service account tokens                                                │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                         │
│                                       ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    LAYER 3: AUTHORIZATION                                │   │
│  │                                                                          │   │
│  │  • Capability-based access control                                       │   │
│  │  • Role-Based Access Control (RBAC)                                      │   │
│  │  • Tool-level permissions                                                │   │
│  │  • Resource-level access control                                         │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                         │
│                                       ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    LAYER 4: INPUT VALIDATION                             │   │
│  │                                                                          │   │
│  │  • JSON Schema validation                                                │   │
│  │  • Input sanitization                                                    │   │
│  │  • Size limits                                                           │   │
│  │  • Type checking                                                         │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                         │
│                                       ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    LAYER 5: AUDIT & MONITORING                           │   │
│  │                                                                          │   │
│  │  • Request/response logging                                              │   │
│  │  • Security event monitoring                                             │   │
│  │  • Anomaly detection                                                     │   │
│  │  • Compliance reporting                                                  │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication

### 2.1 OAuth 2.0 Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          OAuth 2.0 Authentication Flow                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  CLIENT                    AUTH SERVER                    MCP GATEWAY           │
│     │                          │                              │                 │
│     │ 1. Request token         │                              │                 │
│     │    POST /oauth/token     │                              │                 │
│     │    {                     │                              │                 │
│     │      grant_type: "client_credentials",                  │                 │
│     │      client_id: "...",   │                              │                 │
│     │      client_secret: "...",                              │                 │
│     │      scope: "mcp:tools:execute mcp:resources:read"      │                 │
│     │    }                     │                              │                 │
│     │─────────────────────────►│                              │                 │
│     │                          │                              │                 │
│     │ 2. Return JWT token      │                              │                 │
│     │◄─────────────────────────│                              │                 │
│     │    {                     │                              │                 │
│     │      access_token: "eyJ...",                            │                 │
│     │      token_type: "Bearer",                              │                 │
│     │      expires_in: 3600,   │                              │                 │
│     │      scope: "mcp:tools:execute mcp:resources:read"      │                 │
│     │    }                     │                              │                 │
│     │                          │                              │                 │
│     │ 3. MCP request with token│                              │                 │
│     │───────────────────────────────────────────────────────►│                 │
│     │    Authorization: Bearer eyJ...                         │                 │
│     │                          │                              │                 │
│     │                          │ 4. Validate token            │                 │
│     │                          │◄─────────────────────────────│                 │
│     │                          │    (JWKS verification)       │                 │
│     │                          │                              │                 │
│     │                          │ 5. Token valid               │                 │
│     │                          │─────────────────────────────►│                 │
│     │                          │                              │                 │
│     │ 6. MCP response          │                              │                 │
│     │◄───────────────────────────────────────────────────────│                 │
│     │                          │                              │                 │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 JWT Token Structure

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "soai-key-001"
  },
  "payload": {
    "iss": "https://auth.soai.example.com",
    "sub": "client:recruitment-agent",
    "aud": "mcp-gateway",
    "exp": 1704067200,
    "iat": 1704063600,
    "jti": "unique-token-id",
    "scope": "mcp:tools:execute mcp:resources:read",
    "client_id": "recruitment-agent",
    "roles": ["agent", "hr_reader"]
  },
  "signature": "..."
}
```

### 2.3 Authentication Middleware

```python
# backend/services/mcp_gateway/middleware/auth.py

from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import httpx
from functools import lru_cache
import os

security = HTTPBearer()

class JWTAuth:
    """JWT Authentication handler"""

    def __init__(self):
        self.jwks_url = os.getenv(
            "JWKS_URL",
            "http://authentication:9090/.well-known/jwks.json"
        )
        self.audience = os.getenv("JWT_AUDIENCE", "mcp-gateway")
        self.issuer = os.getenv("JWT_ISSUER", "https://auth.soai.example.com")
        self._jwks_cache = None

    async def get_jwks(self):
        """Fetch JWKS from auth server (cached)"""
        if self._jwks_cache is None:
            async with httpx.AsyncClient() as client:
                response = await client.get(self.jwks_url)
                self._jwks_cache = response.json()
        return self._jwks_cache

    async def validate_token(
        self,
        credentials: HTTPAuthorizationCredentials = Depends(security)
    ) -> dict:
        """Validate JWT token and return claims"""
        token = credentials.credentials

        try:
            # Get JWKS
            jwks = await self.get_jwks()

            # Decode and validate
            payload = jwt.decode(
                token,
                jwks,
                algorithms=["RS256"],
                audience=self.audience,
                issuer=self.issuer
            )

            return payload

        except JWTError as e:
            raise HTTPException(
                status_code=401,
                detail=f"Invalid token: {str(e)}"
            )

    def require_scope(self, required_scope: str):
        """Decorator to require specific scope"""
        async def scope_checker(
            claims: dict = Depends(self.validate_token)
        ):
            scopes = claims.get("scope", "").split()
            if required_scope not in scopes:
                raise HTTPException(
                    status_code=403,
                    detail=f"Required scope: {required_scope}"
                )
            return claims
        return scope_checker

jwt_auth = JWTAuth()
```

---

## 3. Authorization

### 3.1 Permission Model

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          MCP Permission Model                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         SCOPE HIERARCHY                                  │   │
│  │                                                                          │   │
│  │  mcp:admin                    Full administrative access                 │   │
│  │    │                                                                     │   │
│  │    ├── mcp:tools:*            All tool permissions                       │   │
│  │    │     ├── mcp:tools:read       List tools                             │   │
│  │    │     └── mcp:tools:execute    Execute tools                          │   │
│  │    │                                                                     │   │
│  │    ├── mcp:resources:*        All resource permissions                   │   │
│  │    │     ├── mcp:resources:read   Read resources                         │   │
│  │    │     └── mcp:resources:write  Modify resources                       │   │
│  │    │                                                                     │   │
│  │    ├── mcp:prompts:*          All prompt permissions                     │   │
│  │    │     ├── mcp:prompts:read     List/get prompts                       │   │
│  │    │     └── mcp:prompts:execute  Execute prompts                        │   │
│  │    │                                                                     │   │
│  │    └── mcp:sampling:*         All sampling permissions                   │   │
│  │          └── mcp:sampling:create  Request LLM completions                │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      TOOL-LEVEL PERMISSIONS                              │   │
│  │                                                                          │   │
│  │  Format: tool:{server}:{tool_name}                                       │   │
│  │                                                                          │   │
│  │  Examples:                                                               │   │
│  │  • tool:cv-parser:parse_cv        Execute parse_cv                       │   │
│  │  • tool:cv-parser:*               All cv-parser tools                    │   │
│  │  • tool:database:query_*          All query tools in database            │   │
│  │  • tool:database:update_*         All update tools (dangerous)           │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    RESOURCE-LEVEL PERMISSIONS                            │   │
│  │                                                                          │   │
│  │  Format: resource:{scheme}:{action}                                      │   │
│  │                                                                          │   │
│  │  Examples:                                                               │   │
│  │  • resource:jobs:read             Read job resources                     │   │
│  │  • resource:candidates:*          Full access to candidates              │   │
│  │  • resource:knowledge:write       Write to knowledge base                │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Role Definitions

| Role | Scopes | Description |
|------|--------|-------------|
| **agent** | `mcp:tools:execute`, `mcp:resources:read`, `mcp:sampling:create` | AI agent access |
| **hr_reader** | `resource:jobs:read`, `resource:candidates:read` | HR read-only |
| **hr_admin** | `resource:jobs:*`, `resource:candidates:*` | HR full access |
| **developer** | `mcp:tools:*`, `mcp:resources:*` | Development access |
| **admin** | `mcp:admin` | Full administrative access |

### 3.3 Permission Checker

```python
# backend/services/mcp_gateway/middleware/permissions.py

from typing import List, Set
import fnmatch

class PermissionChecker:
    """Check if user has required permissions"""

    def __init__(self, user_scopes: List[str], user_roles: List[str]):
        self.scopes = set(user_scopes)
        self.roles = set(user_roles)
        self._expanded_scopes = self._expand_scopes()

    def _expand_scopes(self) -> Set[str]:
        """Expand wildcard scopes"""
        expanded = set()

        for scope in self.scopes:
            expanded.add(scope)

            # Expand wildcards
            if scope.endswith(":*"):
                base = scope[:-2]
                expanded.add(f"{base}:read")
                expanded.add(f"{base}:write")
                expanded.add(f"{base}:execute")

            # Admin has all permissions
            if scope == "mcp:admin":
                expanded.update([
                    "mcp:tools:read", "mcp:tools:execute",
                    "mcp:resources:read", "mcp:resources:write",
                    "mcp:prompts:read", "mcp:prompts:execute",
                    "mcp:sampling:create"
                ])

        return expanded

    def has_scope(self, required: str) -> bool:
        """Check if user has required scope"""
        # Direct match
        if required in self._expanded_scopes:
            return True

        # Wildcard match
        for scope in self._expanded_scopes:
            if fnmatch.fnmatch(required, scope):
                return True

        return False

    def can_execute_tool(self, server: str, tool: str) -> bool:
        """Check if user can execute specific tool"""
        # General tool execution permission
        if not self.has_scope("mcp:tools:execute"):
            return False

        # Tool-specific permission (if defined)
        tool_scope = f"tool:{server}:{tool}"
        if f"tool:{server}:*" in self._expanded_scopes:
            return True
        if tool_scope in self._expanded_scopes:
            return True

        # If no specific tool permissions, allow (has general execute)
        return True

    def can_read_resource(self, uri: str) -> bool:
        """Check if user can read specific resource"""
        if not self.has_scope("mcp:resources:read"):
            return False

        # Extract scheme
        scheme = uri.split("://")[0] if "://" in uri else None
        if not scheme:
            return False

        # Check resource-specific permission
        if f"resource:{scheme}:read" in self._expanded_scopes:
            return True
        if f"resource:{scheme}:*" in self._expanded_scopes:
            return True

        # General read permission allows access
        return True
```

---

## 4. Rate Limiting

### 4.1 Rate Limit Configuration

| Client Type | Requests/Min | Burst | Tool Calls/Min |
|-------------|--------------|-------|----------------|
| Agent | 100 | 20 | 50 |
| Developer | 200 | 50 | 100 |
| Admin | 500 | 100 | 250 |
| External | 30 | 10 | 15 |

### 4.2 Rate Limiter Implementation

```python
# backend/services/mcp_gateway/middleware/rate_limit.py

import redis.asyncio as redis
import time
from fastapi import Request, HTTPException

class RateLimiter:
    """Token bucket rate limiter using Redis"""

    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client

    async def check_rate_limit(
        self,
        client_id: str,
        limit: int,
        window_seconds: int = 60
    ) -> tuple[bool, dict]:
        """
        Check if request is within rate limit.

        Returns:
            (allowed, info) - whether request is allowed and rate limit info
        """
        key = f"ratelimit:{client_id}"
        now = time.time()
        window_start = now - window_seconds

        # Use Redis transaction
        async with self.redis.pipeline(transaction=True) as pipe:
            # Remove old entries
            await pipe.zremrangebyscore(key, 0, window_start)
            # Count current entries
            await pipe.zcard(key)
            # Add new entry
            await pipe.zadd(key, {str(now): now})
            # Set expiry
            await pipe.expire(key, window_seconds)
            # Execute
            results = await pipe.execute()

        current_count = results[1]

        info = {
            "limit": limit,
            "remaining": max(0, limit - current_count - 1),
            "reset": int(now + window_seconds)
        }

        if current_count >= limit:
            return False, info

        return True, info

class RateLimitMiddleware:
    """FastAPI middleware for rate limiting"""

    def __init__(self, redis_url: str):
        self.redis = redis.from_url(redis_url)
        self.limiter = RateLimiter(self.redis)

        # Default limits by role
        self.limits = {
            "agent": 100,
            "developer": 200,
            "admin": 500,
            "default": 30
        }

    async def __call__(self, request: Request, call_next):
        # Extract client info from JWT claims
        claims = getattr(request.state, "jwt_claims", {})
        client_id = claims.get("client_id", request.client.host)
        roles = claims.get("roles", [])

        # Determine limit based on role
        limit = self.limits["default"]
        for role in roles:
            if role in self.limits:
                limit = max(limit, self.limits[role])

        # Check rate limit
        allowed, info = await self.limiter.check_rate_limit(client_id, limit)

        if not allowed:
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded",
                headers={
                    "X-RateLimit-Limit": str(info["limit"]),
                    "X-RateLimit-Remaining": str(info["remaining"]),
                    "X-RateLimit-Reset": str(info["reset"]),
                    "Retry-After": str(info["reset"] - int(time.time()))
                }
            )

        # Add rate limit headers to response
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(info["limit"])
        response.headers["X-RateLimit-Remaining"] = str(info["remaining"])
        response.headers["X-RateLimit-Reset"] = str(info["reset"])

        return response
```

---

## 5. Input Validation

### 5.1 Validation Rules

| Field | Rule | Example |
|-------|------|---------|
| Tool name | Alphanumeric + underscore | `parse_cv`, `search_knowledge` |
| Resource URI | Valid URI format | `jobs://123`, `knowledge://docs` |
| Arguments | Match JSON Schema | Defined per tool |
| Content size | Max 10MB | Request body limit |
| String length | Max 1MB per field | Prevents memory attacks |

### 5.2 Input Validator

```python
# backend/services/mcp_common/validation.py

import re
from typing import Any, Dict
from pydantic import BaseModel, validator, ValidationError
import jsonschema
from fastapi import HTTPException

class ToolCallValidator(BaseModel):
    """Validate tool call requests"""

    name: str
    arguments: Dict[str, Any] = {}

    @validator("name")
    def validate_tool_name(cls, v):
        if not re.match(r'^[a-z][a-z0-9_]*$', v):
            raise ValueError(
                "Tool name must be lowercase alphanumeric with underscores"
            )
        if len(v) > 64:
            raise ValueError("Tool name too long (max 64 chars)")
        return v

    @validator("arguments")
    def validate_arguments_size(cls, v):
        import json
        size = len(json.dumps(v))
        if size > 1_000_000:  # 1MB
            raise ValueError("Arguments too large (max 1MB)")
        return v

class ResourceURIValidator(BaseModel):
    """Validate resource URI"""

    uri: str

    @validator("uri")
    def validate_uri(cls, v):
        # Check format
        if "://" not in v:
            raise ValueError("Invalid URI format (missing scheme)")

        scheme, path = v.split("://", 1)

        # Validate scheme
        if not re.match(r'^[a-z][a-z0-9]*$', scheme):
            raise ValueError("Invalid URI scheme")

        # Prevent path traversal
        if ".." in path:
            raise ValueError("Path traversal not allowed")

        return v

def validate_tool_arguments(
    tool_schema: Dict[str, Any],
    arguments: Dict[str, Any]
):
    """Validate arguments against tool's JSON Schema"""
    try:
        jsonschema.validate(arguments, tool_schema)
    except jsonschema.ValidationError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid arguments: {e.message}"
        )
```

---

## 6. Audit Logging

### 6.1 Audit Events

| Event | Data Captured | Retention |
|-------|---------------|-----------|
| AUTH_SUCCESS | client_id, ip, timestamp | 90 days |
| AUTH_FAILURE | client_id, ip, reason | 1 year |
| TOOL_CALL | tool, args (redacted), result | 30 days |
| RESOURCE_ACCESS | uri, action, client | 30 days |
| PERMISSION_DENIED | client, required_scope | 1 year |
| RATE_LIMIT_EXCEEDED | client, limit, count | 30 days |

### 6.2 Audit Logger

```python
# backend/services/mcp_common/audit.py

import json
import datetime
from typing import Any, Dict, Optional
import structlog
from opentelemetry import trace

logger = structlog.get_logger("audit")
tracer = trace.get_tracer("mcp-audit")

class AuditLogger:
    """Security audit logging"""

    SENSITIVE_FIELDS = {
        "password", "secret", "token", "api_key", "credential",
        "ssn", "credit_card", "cv_content"
    }

    def __init__(self, service_name: str):
        self.service = service_name

    def _redact_sensitive(self, data: Any, depth: int = 0) -> Any:
        """Redact sensitive fields from data"""
        if depth > 10:
            return "[MAX_DEPTH]"

        if isinstance(data, dict):
            return {
                k: "[REDACTED]" if k.lower() in self.SENSITIVE_FIELDS
                else self._redact_sensitive(v, depth + 1)
                for k, v in data.items()
            }
        elif isinstance(data, list):
            return [self._redact_sensitive(item, depth + 1) for item in data]
        elif isinstance(data, str) and len(data) > 1000:
            return f"[TRUNCATED:{len(data)} chars]"
        return data

    async def log_event(
        self,
        event_type: str,
        client_id: str,
        data: Dict[str, Any],
        success: bool = True,
        error: Optional[str] = None
    ):
        """Log an audit event"""
        with tracer.start_as_current_span(f"audit.{event_type}") as span:
            event = {
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "service": self.service,
                "event_type": event_type,
                "client_id": client_id,
                "success": success,
                "data": self._redact_sensitive(data),
                "trace_id": span.get_span_context().trace_id
            }

            if error:
                event["error"] = error

            # Log to structured logger
            if success:
                logger.info("audit_event", **event)
            else:
                logger.warning("audit_event", **event)

            # Set span attributes
            span.set_attribute("audit.event_type", event_type)
            span.set_attribute("audit.client_id", client_id)
            span.set_attribute("audit.success", success)

    async def log_tool_call(
        self,
        client_id: str,
        tool_name: str,
        arguments: Dict[str, Any],
        result: Any,
        success: bool = True,
        error: Optional[str] = None
    ):
        """Log a tool call"""
        await self.log_event(
            event_type="TOOL_CALL",
            client_id=client_id,
            data={
                "tool": tool_name,
                "arguments": arguments,
                "result_size": len(str(result)) if result else 0
            },
            success=success,
            error=error
        )

    async def log_auth_event(
        self,
        client_id: str,
        ip_address: str,
        success: bool,
        reason: Optional[str] = None
    ):
        """Log authentication event"""
        event_type = "AUTH_SUCCESS" if success else "AUTH_FAILURE"
        await self.log_event(
            event_type=event_type,
            client_id=client_id,
            data={
                "ip_address": ip_address,
                "reason": reason
            },
            success=success,
            error=reason if not success else None
        )
```

---

## 7. Security Best Practices

### 7.1 Checklist

| Category | Practice | Status |
|----------|----------|--------|
| **Transport** | TLS 1.3 enabled | ☐ |
| **Transport** | HSTS headers | ☐ |
| **Authentication** | JWT RS256 signing | ☐ |
| **Authentication** | Token expiration (1 hour) | ☐ |
| **Authorization** | Principle of least privilege | ☐ |
| **Authorization** | Tool-level permissions | ☐ |
| **Input** | JSON Schema validation | ☐ |
| **Input** | Size limits enforced | ☐ |
| **Secrets** | K8s secrets for API keys | ☐ |
| **Secrets** | No secrets in logs | ☐ |
| **Audit** | All operations logged | ☐ |
| **Audit** | Sensitive data redacted | ☐ |
| **Network** | K8s network policies | ☐ |
| **Network** | Service mesh (optional) | ☐ |

### 7.2 Kubernetes Security

```yaml
# helm/mcp-gateway/templates/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: mcp-gateway-policy
spec:
  podSelector:
    matchLabels:
      app: mcp-gateway
  policyTypes:
    - Ingress
    - Egress
  ingress:
    # Allow from ingress controller
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 8000
    # Allow from agents in same namespace
    - from:
        - podSelector:
            matchLabels:
              role: agent
      ports:
        - protocol: TCP
          port: 8000
  egress:
    # Allow to MCP servers
    - to:
        - podSelector:
            matchLabels:
              type: mcp-server
      ports:
        - protocol: TCP
          port: 8000
    # Allow to Redis
    - to:
        - podSelector:
            matchLabels:
              app: redis
      ports:
        - protocol: TCP
          port: 6379
```

---

*Next: [06-DEPLOYMENT.md](06-DEPLOYMENT.md) - MCP Deployment Guide*
