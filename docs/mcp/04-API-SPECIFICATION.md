# MCP API Specification

## Document Information

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Protocol Version | 2024-11-05 |
| Last Updated | January 2026 |
| Prerequisites | [03-IMPLEMENTATION.md](03-IMPLEMENTATION.md) |

---

## 1. Protocol Overview

### 1.1 Base URL

| Environment | Gateway URL |
|-------------|-------------|
| Development | `http://localhost:8000` |
| Staging | `https://mcp.staging.soai.example.com` |
| Production | `https://mcp.soai.example.com` |

### 1.2 Protocol

- **Format**: JSON-RPC 2.0
- **Content-Type**: `application/json`
- **Transport**: HTTP POST (primary), SSE (notifications)

---

## 2. Core Endpoints

### 2.1 Initialize Connection

Establishes MCP connection and negotiates capabilities.

```
POST /mcp/initialize
```

**Request Body:**
```json
{
  "protocolVersion": "2024-11-05",
  "clientInfo": {
    "name": "soai-recruitment-agent",
    "version": "1.0.0"
  },
  "capabilities": {
    "roots": {
      "listChanged": true
    },
    "sampling": {}
  }
}
```

**Response:**
```json
{
  "protocolVersion": "2024-11-05",
  "serverInfo": {
    "name": "soai-mcp-gateway",
    "version": "1.0.0"
  },
  "capabilities": {
    "tools": {
      "listChanged": true
    },
    "resources": {
      "subscribe": true,
      "listChanged": true
    },
    "prompts": {
      "listChanged": true
    },
    "logging": {}
  }
}
```

---

### 2.2 List Tools

Returns all available tools across registered MCP servers.

```
GET /mcp/tools/list
```

**Response:**
```json
{
  "tools": [
    {
      "name": "parse_cv",
      "description": "Parse a CV file and extract structured information",
      "inputSchema": {
        "type": "object",
        "properties": {
          "cv_content": {
            "type": "string",
            "description": "Raw text content of the CV"
          },
          "file_path": {
            "type": "string",
            "description": "Path to CV file"
          }
        },
        "oneOf": [
          {"required": ["cv_content"]},
          {"required": ["file_path"]}
        ]
      },
      "_server": "cv-parser-mcp"
    },
    {
      "name": "search_knowledge",
      "description": "Semantic search across knowledge base",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "Search query"
          },
          "limit": {
            "type": "integer",
            "default": 5
          }
        },
        "required": ["query"]
      },
      "_server": "knowledge-base-mcp"
    }
  ]
}
```

---

### 2.3 Call Tool

Executes a tool with provided arguments.

```
POST /mcp/tools/call
```

**Request Body:**
```json
{
  "name": "parse_cv",
  "arguments": {
    "cv_content": "John Doe\nSoftware Engineer\n\nExperience:\n- 5 years at Tech Corp\n\nSkills:\n- Python, JavaScript, AWS"
  }
}
```

**Success Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"personal_info\": {\"name\": \"John Doe\", \"title\": \"Software Engineer\"}, \"skills\": {\"technical\": [\"Python\", \"JavaScript\", \"AWS\"]}, \"experience\": [{\"company\": \"Tech Corp\", \"duration\": \"5 years\"}]}"
    }
  ],
  "isError": false
}
```

**Error Response:**
```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Invalid CV format - unable to parse"
    }
  ],
  "isError": true
}
```

---

### 2.4 List Resources

Returns all available resources.

```
GET /mcp/resources/list
```

**Response:**
```json
{
  "resources": [
    {
      "uri": "jobs://list",
      "name": "Job Descriptions",
      "description": "All available job descriptions",
      "mimeType": "application/json"
    },
    {
      "uri": "candidates://list",
      "name": "Candidates",
      "description": "All registered candidates",
      "mimeType": "application/json"
    },
    {
      "uri": "knowledge://documents",
      "name": "Knowledge Documents",
      "description": "All documents in knowledge base",
      "mimeType": "application/json"
    }
  ]
}
```

---

### 2.5 Read Resource

Reads content from a resource by URI.

```
POST /mcp/resources/read
```

**Request Body:**
```json
{
  "uri": "jobs://123"
}
```

**Response:**
```json
{
  "contents": [
    {
      "uri": "jobs://123",
      "mimeType": "application/json",
      "text": "{\"id\": 123, \"title\": \"Senior Software Engineer\", \"department\": \"Engineering\", \"requirements\": {\"skills\": [\"Python\", \"Kubernetes\"], \"experience_years\": 5}}"
    }
  ]
}
```

---

### 2.6 List Prompts

Returns available prompt templates.

```
GET /mcp/prompts/list
```

**Response:**
```json
{
  "prompts": [
    {
      "name": "cv_analysis",
      "description": "Comprehensive CV analysis prompt",
      "arguments": [
        {
          "name": "cv_content",
          "description": "Raw CV text",
          "required": true
        },
        {
          "name": "focus_areas",
          "description": "Areas to focus on",
          "required": false
        }
      ]
    },
    {
      "name": "interview_questions",
      "description": "Generate interview questions",
      "arguments": [
        {
          "name": "job_title",
          "required": true
        },
        {
          "name": "skills",
          "required": true
        }
      ]
    }
  ]
}
```

---

### 2.7 Get Prompt

Retrieves a prompt with arguments substituted.

```
POST /mcp/prompts/get
```

**Request Body:**
```json
{
  "name": "cv_analysis",
  "arguments": {
    "cv_content": "John Doe...",
    "focus_areas": "technical skills"
  }
}
```

**Response:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": {
        "type": "text",
        "text": "Analyze the following CV with focus on technical skills:\n\nJohn Doe..."
      }
    }
  ]
}
```

---

### 2.8 Create Message (Sampling)

Requests LLM completion. Used by MCP servers to access LLM capabilities.

```
POST /mcp/sampling/createMessage
```

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": {
        "type": "text",
        "text": "Parse this CV and extract structured information..."
      }
    }
  ],
  "systemPrompt": "You are a CV parsing expert. Extract information in JSON format.",
  "modelPreferences": {
    "hints": [
      {"name": "claude-3-5-sonnet"}
    ],
    "costPriority": 0.3,
    "speedPriority": 0.5,
    "intelligencePriority": 0.2
  },
  "maxTokens": 2000,
  "includeContext": "thisServer"
}
```

**Response:**
```json
{
  "role": "assistant",
  "content": {
    "type": "text",
    "text": "{\"personal_info\": {...}, \"skills\": [...], \"experience\": [...]}"
  },
  "model": "claude-3-5-sonnet-20241022",
  "stopReason": "endTurn"
}
```

---

## 3. Registry Endpoints

### 3.1 Register Server

Registers a new MCP server with the gateway.

```
POST /registry/register
```

**Request Body:**
```json
{
  "name": "custom-mcp-server",
  "url": "http://custom-server:8000",
  "tools": ["custom_tool_1", "custom_tool_2"],
  "resources": ["custom://data"],
  "health_status": "healthy"
}
```

**Response:**
```json
{
  "status": "registered",
  "server": "custom-mcp-server"
}
```

---

### 3.2 Unregister Server

Removes a server from the registry.

```
DELETE /registry/unregister/{name}
```

**Response:**
```json
{
  "status": "unregistered",
  "server": "custom-mcp-server"
}
```

---

### 3.3 List Servers

Returns all registered servers.

```
GET /registry/servers
```

**Response:**
```json
{
  "servers": [
    {
      "name": "cv-parser-mcp",
      "url": "http://cv-parser-mcp:8000",
      "tools": ["parse_cv", "score_cv", "extract_skills"],
      "resources": [],
      "health_status": "healthy"
    },
    {
      "name": "knowledge-base-mcp",
      "url": "http://knowledge-base-mcp:8000",
      "tools": ["search_knowledge", "add_document"],
      "resources": ["knowledge://documents", "knowledge://collections"],
      "health_status": "healthy"
    }
  ]
}
```

---

## 4. Tool Specifications

### 4.1 CV Parser Tools

#### parse_cv

Parses CV content and extracts structured data.

| Field | Value |
|-------|-------|
| Server | cv-parser-mcp |
| Category | Document Processing |

**Input Schema:**
```json
{
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
}
```

**Output Schema:**
```json
{
  "personal_info": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string"
  },
  "summary": "string",
  "skills": {
    "technical": ["string"],
    "soft_skills": ["string"],
    "languages": ["string"],
    "tools": ["string"]
  },
  "experience": [
    {
      "company": "string",
      "title": "string",
      "start_date": "string",
      "end_date": "string",
      "description": "string",
      "achievements": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "graduation_year": "string"
    }
  ],
  "certifications": ["string"],
  "total_experience_years": "number"
}
```

---

#### score_cv

Scores a CV against job requirements.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "parsed_cv": {
      "type": "object",
      "description": "Parsed CV data from parse_cv"
    },
    "job_requirements": {
      "type": "object",
      "properties": {
        "required_skills": {"type": "array", "items": {"type": "string"}},
        "preferred_skills": {"type": "array", "items": {"type": "string"}},
        "min_experience_years": {"type": "integer"},
        "education_requirements": {"type": "string"}
      }
    }
  },
  "required": ["parsed_cv", "job_requirements"]
}
```

**Output Schema:**
```json
{
  "overall_score": "number (0-100)",
  "skill_match": {
    "score": "number",
    "matched_skills": ["string"],
    "missing_skills": ["string"]
  },
  "experience_match": {
    "score": "number",
    "meets_minimum": "boolean",
    "relevant_years": "number"
  },
  "education_match": {
    "score": "number",
    "meets_requirements": "boolean"
  },
  "recommendation": "strong_match | good_match | partial_match | weak_match",
  "interview_focus_areas": ["string"]
}
```

---

### 4.2 Knowledge Base Tools

#### search_knowledge

Performs semantic search across the knowledge base.

| Field | Value |
|-------|-------|
| Server | knowledge-base-mcp |
| Category | RAG / Search |

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Search query text"
    },
    "collection": {
      "type": "string",
      "description": "Collection to search (optional)"
    },
    "limit": {
      "type": "integer",
      "default": 5,
      "description": "Maximum results"
    },
    "score_threshold": {
      "type": "number",
      "default": 0.7,
      "description": "Minimum similarity (0-1)"
    },
    "filters": {
      "type": "object",
      "description": "Metadata filters"
    }
  },
  "required": ["query"]
}
```

**Output Schema:**
```json
{
  "query": "string",
  "collection": "string",
  "results": [
    {
      "id": "string",
      "score": "number",
      "content": "string",
      "metadata": {"key": "value"}
    }
  ],
  "count": "number"
}
```

---

#### add_document

Adds a document to the knowledge base.

**Input Schema:**
```json
{
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
    },
    "document_id": {
      "type": "string",
      "description": "Custom ID (optional)"
    }
  },
  "required": ["content"]
}
```

**Output Schema:**
```json
{
  "status": "success",
  "document_id": "string",
  "collection": "string",
  "content_length": "number"
}
```

---

### 4.3 Database Tools

#### query_jobs

Queries job descriptions with filters.

| Field | Value |
|-------|-------|
| Server | database-mcp |
| Category | Data Access |

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "enum": ["open", "closed", "draft"]
    },
    "department": {
      "type": "string"
    },
    "skills": {
      "type": "array",
      "items": {"type": "string"}
    },
    "limit": {
      "type": "integer",
      "default": 10
    }
  }
}
```

---

#### update_candidate_status

Updates a candidate's status.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "candidate_id": {
      "type": "integer"
    },
    "status": {
      "type": "string",
      "enum": ["new", "screening", "interview", "offer", "hired", "rejected"]
    },
    "notes": {
      "type": "string"
    }
  },
  "required": ["candidate_id", "status"]
}
```

---

## 5. Error Codes

### 5.1 Standard JSON-RPC Errors

| Code | Name | Description |
|------|------|-------------|
| -32700 | Parse Error | Invalid JSON |
| -32600 | Invalid Request | Invalid JSON-RPC request |
| -32601 | Method Not Found | Method does not exist |
| -32602 | Invalid Params | Invalid method parameters |
| -32603 | Internal Error | Internal server error |

### 5.2 MCP-Specific Errors

| Code | Name | Description |
|------|------|-------------|
| 1001 | Tool Not Found | Requested tool not available |
| 1002 | Resource Not Found | Requested resource not available |
| 1003 | Server Unavailable | MCP server is not responding |
| 1004 | Auth Required | Authentication required |
| 1005 | Permission Denied | Insufficient permissions |
| 1006 | Rate Limited | Too many requests |
| 1007 | Timeout | Request timed out |

### 5.3 Error Response Format

```json
{
  "jsonrpc": "2.0",
  "id": "req-123",
  "error": {
    "code": 1001,
    "message": "Tool 'nonexistent_tool' not found",
    "data": {
      "available_tools": ["parse_cv", "search_knowledge"],
      "suggestion": "Did you mean 'parse_cv'?"
    }
  }
}
```

---

## 6. Resource URI Schemes

### 6.1 Supported Schemes

| Scheme | Server | Description |
|--------|--------|-------------|
| `jobs://` | database-mcp | Job descriptions |
| `candidates://` | database-mcp | Candidate records |
| `interviews://` | database-mcp | Interview records |
| `knowledge://` | knowledge-base-mcp | Knowledge documents |
| `users://` | auth-mcp | User information |

### 6.2 URI Patterns

```
# List resources
jobs://list
candidates://list
knowledge://documents
knowledge://collections

# Specific resources
jobs://123
candidates://456
knowledge://documents/abc-def-123

# Filtered resources
jobs://list?status=open&department=engineering
candidates://list?status=interview&min_score=70
```

---

## 7. Authentication

### 7.1 OAuth 2.0 Bearer Token

Include token in Authorization header:

```http
POST /mcp/tools/call HTTP/1.1
Host: mcp.soai.example.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "parse_cv",
  "arguments": {...}
}
```

### 7.2 Required Scopes

| Scope | Description |
|-------|-------------|
| `mcp:tools:read` | List available tools |
| `mcp:tools:execute` | Execute tools |
| `mcp:resources:read` | Read resources |
| `mcp:resources:write` | Modify resources |
| `mcp:sampling:create` | Request LLM completions |
| `mcp:admin` | Administrative operations |

---

*Next: [05-SECURITY.md](05-SECURITY.md) - MCP Security Design*
