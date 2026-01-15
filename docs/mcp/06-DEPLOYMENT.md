# MCP Deployment Guide

## Document Information

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Last Updated | January 2026 |
| Status | Draft |
| Prerequisites | [05-SECURITY.md](05-SECURITY.md) |

---

## 1. Deployment Architecture

### 1.1 Kubernetes Deployment Topology

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    Kubernetes Deployment Architecture                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           NAMESPACE: soai                                │   │
│  │                                                                          │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │   │
│  │  │                    MCP GATEWAY (Deployment)                       │   │   │
│  │  │                                                                   │   │   │
│  │  │  Replicas: 2-10 (HPA)                                             │   │   │
│  │  │  Resources: 256Mi-512Mi RAM, 100m-500m CPU                        │   │   │
│  │  │  Ports: 8000 (HTTP), 8001 (SSE)                                   │   │   │
│  │  │                                                                   │   │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐               │   │   │
│  │  │  │   Pod 1     │  │   Pod 2     │  │   Pod N     │               │   │   │
│  │  │  │ mcp-gateway │  │ mcp-gateway │  │ mcp-gateway │               │   │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘               │   │   │
│  │  │                                                                   │   │   │
│  │  └──────────────────────────────────────────────────────────────────┘   │   │
│  │                              │                                           │   │
│  │                              ▼                                           │   │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │   │
│  │  │                     MCP SERVERS (Deployments)                     │   │   │
│  │  │                                                                   │   │   │
│  │  │  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐        │   │   │
│  │  │  │ cv-parser-mcp  │ │ knowledge-base │ │ database-mcp   │        │   │   │
│  │  │  │ Replicas: 2    │ │ -mcp           │ │ Replicas: 2    │        │   │   │
│  │  │  │ Port: 8000     │ │ Replicas: 2    │ │ Port: 8000     │        │   │   │
│  │  │  └────────────────┘ │ Port: 8000     │ └────────────────┘        │   │   │
│  │  │                     └────────────────┘                            │   │   │
│  │  │  ┌────────────────┐ ┌────────────────┐                           │   │   │
│  │  │  │ llm-provider   │ │ email-mcp      │                           │   │   │
│  │  │  │ -mcp           │ │ Replicas: 1    │                           │   │   │
│  │  │  │ Replicas: 2    │ │ Port: 8000     │                           │   │   │
│  │  │  │ Port: 8000     │ └────────────────┘                           │   │   │
│  │  │  └────────────────┘                                              │   │   │
│  │  │                                                                   │   │   │
│  │  └──────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Helm Chart Structure

### 2.1 Chart Organization

```
helm/
├── mcp-gateway/
│   ├── Chart.yaml
│   ├── values.yaml
│   ├── values-dev.yaml
│   ├── values-staging.yaml
│   ├── values-prod.yaml
│   └── templates/
│       ├── _helpers.tpl
│       ├── deployment.yaml
│       ├── service.yaml
│       ├── configmap.yaml
│       ├── secret.yaml
│       ├── hpa.yaml
│       ├── pdb.yaml
│       ├── ingress.yaml
│       ├── networkpolicy.yaml
│       └── servicemonitor.yaml
│
├── mcp-servers/
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
│       ├── _helpers.tpl
│       ├── cv-parser-deployment.yaml
│       ├── knowledge-base-deployment.yaml
│       ├── database-mcp-deployment.yaml
│       ├── llm-provider-deployment.yaml
│       ├── services.yaml
│       └── configmaps.yaml
│
└── soai-mcp/                    # Umbrella chart
    ├── Chart.yaml
    ├── values.yaml
    └── charts/
        ├── mcp-gateway/
        └── mcp-servers/
```

### 2.2 MCP Gateway Chart

```yaml
# helm/mcp-gateway/Chart.yaml
apiVersion: v2
name: mcp-gateway
description: SOAI MCP Gateway - Central routing for MCP servers
type: application
version: 1.0.0
appVersion: "1.0.0"

dependencies:
  - name: redis
    version: "18.x.x"
    repository: "https://charts.bitnami.com/bitnami"
    condition: redis.enabled
```

```yaml
# helm/mcp-gateway/values.yaml

replicaCount: 2

image:
  repository: registry.gitlab.com/soai/mcp-gateway
  tag: latest
  pullPolicy: IfNotPresent

imagePullSecrets:
  - name: gitlab-registry

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
    nginx.ingress.kubernetes.io/proxy-buffering: "off"
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: mcp.soai.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: mcp-tls
      hosts:
        - mcp.soai.example.com

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
  targetMemoryUtilizationPercentage: 80

podDisruptionBudget:
  enabled: true
  minAvailable: 1

# Environment configuration
config:
  logLevel: INFO
  requestTimeout: 30

# Redis configuration
redis:
  enabled: true
  url: ""  # Leave empty to use bundled Redis
  external:
    enabled: false
    url: "redis://redis:6379"

# Authentication
auth:
  enabled: true
  jwksUrl: "http://authentication:9090/.well-known/jwks.json"
  audience: "mcp-gateway"
  issuer: "https://auth.soai.example.com"

# Observability
otel:
  enabled: true
  endpoint: "http://otel-collector:4317"

# MCP Servers (auto-registered)
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

# Prometheus monitoring
serviceMonitor:
  enabled: true
  interval: 30s
  path: /metrics
```

### 2.3 Gateway Deployment Template

```yaml
# helm/mcp-gateway/templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "mcp-gateway.fullname" . }}
  labels:
    {{- include "mcp-gateway.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "mcp-gateway.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
        prometheus.io/scrape: "true"
        prometheus.io/port: "8000"
        prometheus.io/path: "/metrics"
      labels:
        {{- include "mcp-gateway.selectorLabels" . | nindent 8 }}
    spec:
      {{- with .Values.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: 8000
              protocol: TCP
            - name: sse
              containerPort: 8001
              protocol: TCP
          env:
            - name: PORT
              value: "8000"
            - name: SSE_PORT
              value: "8001"
            - name: LOG_LEVEL
              value: {{ .Values.config.logLevel | quote }}
            - name: REQUEST_TIMEOUT
              value: {{ .Values.config.requestTimeout | quote }}
            {{- if .Values.redis.external.enabled }}
            - name: REDIS_URL
              value: {{ .Values.redis.external.url | quote }}
            {{- else }}
            - name: REDIS_URL
              value: "redis://{{ include "mcp-gateway.fullname" . }}-redis-master:6379"
            {{- end }}
            {{- if .Values.auth.enabled }}
            - name: AUTH_ENABLED
              value: "true"
            - name: JWKS_URL
              value: {{ .Values.auth.jwksUrl | quote }}
            - name: JWT_AUDIENCE
              value: {{ .Values.auth.audience | quote }}
            - name: JWT_ISSUER
              value: {{ .Values.auth.issuer | quote }}
            {{- end }}
            {{- if .Values.otel.enabled }}
            - name: OTEL_EXPORTER_OTLP_ENDPOINT
              value: {{ .Values.otel.endpoint | quote }}
            - name: OTEL_SERVICE_NAME
              value: "mcp-gateway"
            {{- end }}
          envFrom:
            - configMapRef:
                name: {{ include "mcp-gateway.fullname" . }}-config
            - secretRef:
                name: {{ include "mcp-gateway.fullname" . }}-secret
                optional: true
          livenessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 10
            periodSeconds: 30
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health/ready
              port: http
            initialDelaySeconds: 5
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 3
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
      {{- with .Values.nodeSelector }}
      nodeSelector:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.affinity }}
      affinity:
        {{- toYaml . | nindent 8 }}
      {{- end }}
      {{- with .Values.tolerations }}
      tolerations:
        {{- toYaml . | nindent 8 }}
      {{- end }}
```

---

## 3. MCP Server Deployments

### 3.1 CV Parser MCP Server

```yaml
# helm/mcp-servers/templates/cv-parser-deployment.yaml
{{- if .Values.cvParser.enabled }}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cv-parser-mcp
  labels:
    app: cv-parser-mcp
    type: mcp-server
spec:
  replicas: {{ .Values.cvParser.replicas }}
  selector:
    matchLabels:
      app: cv-parser-mcp
  template:
    metadata:
      labels:
        app: cv-parser-mcp
        type: mcp-server
    spec:
      containers:
        - name: cv-parser-mcp
          image: "{{ .Values.cvParser.image.repository }}:{{ .Values.cvParser.image.tag }}"
          ports:
            - containerPort: 8000
          env:
            - name: PORT
              value: "8000"
            - name: GEN_AI_URL
              value: {{ .Values.cvParser.genAiUrl | quote }}
            - name: OTEL_EXPORTER_OTLP_ENDPOINT
              value: {{ .Values.otel.endpoint | quote }}
          resources:
            {{- toYaml .Values.cvParser.resources | nindent 12 }}
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
{{- end }}
```

### 3.2 Knowledge Base MCP Server

```yaml
# helm/mcp-servers/templates/knowledge-base-deployment.yaml
{{- if .Values.knowledgeBase.enabled }}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: knowledge-base-mcp
  labels:
    app: knowledge-base-mcp
    type: mcp-server
spec:
  replicas: {{ .Values.knowledgeBase.replicas }}
  selector:
    matchLabels:
      app: knowledge-base-mcp
  template:
    metadata:
      labels:
        app: knowledge-base-mcp
        type: mcp-server
    spec:
      containers:
        - name: knowledge-base-mcp
          image: "{{ .Values.knowledgeBase.image.repository }}:{{ .Values.knowledgeBase.image.tag }}"
          ports:
            - containerPort: 8000
          env:
            - name: PORT
              value: "8000"
            - name: QDRANT_HOST
              value: {{ .Values.knowledgeBase.qdrant.host | quote }}
            - name: QDRANT_PORT
              value: {{ .Values.knowledgeBase.qdrant.port | quote }}
            - name: QDRANT_HTTPS
              value: {{ .Values.knowledgeBase.qdrant.https | quote }}
            - name: GEN_AI_URL
              value: {{ .Values.knowledgeBase.genAiUrl | quote }}
            - name: OTEL_EXPORTER_OTLP_ENDPOINT
              value: {{ .Values.otel.endpoint | quote }}
          resources:
            {{- toYaml .Values.knowledgeBase.resources | nindent 12 }}
{{- end }}
```

### 3.3 MCP Servers Values

```yaml
# helm/mcp-servers/values.yaml

# CV Parser MCP Server
cvParser:
  enabled: true
  replicas: 2
  image:
    repository: registry.gitlab.com/soai/cv-parser-mcp
    tag: latest
  genAiUrl: "http://gen-ai-provider:8004"
  resources:
    requests:
      memory: "256Mi"
      cpu: "100m"
    limits:
      memory: "512Mi"
      cpu: "500m"

# Knowledge Base MCP Server
knowledgeBase:
  enabled: true
  replicas: 2
  image:
    repository: registry.gitlab.com/soai/knowledge-base-mcp
    tag: latest
  qdrant:
    host: qdrant
    port: "6333"
    https: "false"
  genAiUrl: "http://gen-ai-provider:8004"
  resources:
    requests:
      memory: "256Mi"
      cpu: "100m"
    limits:
      memory: "512Mi"
      cpu: "500m"

# Database MCP Server
database:
  enabled: true
  replicas: 2
  image:
    repository: registry.gitlab.com/soai/database-mcp
    tag: latest
  databaseUrl: "mysql://soai:password@mysql:3306/soai"
  resources:
    requests:
      memory: "256Mi"
      cpu: "100m"
    limits:
      memory: "512Mi"
      cpu: "500m"

# LLM Provider MCP Server
llmProvider:
  enabled: true
  replicas: 2
  image:
    repository: registry.gitlab.com/soai/llm-provider-mcp
    tag: latest
  providers:
    openai:
      enabled: true
      apiKeySecret: openai-api-key
    anthropic:
      enabled: true
      apiKeySecret: anthropic-api-key
    google:
      enabled: false
    ollama:
      enabled: false
      url: "http://ollama:11434"
  resources:
    requests:
      memory: "256Mi"
      cpu: "100m"
    limits:
      memory: "512Mi"
      cpu: "500m"

# OTEL Configuration
otel:
  enabled: true
  endpoint: "http://otel-collector:4317"
```

---

## 4. Deployment Commands

### 4.1 Installation

```bash
# Add Helm repository (if using external charts)
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Create namespace
kubectl create namespace soai

# Install MCP Gateway
helm upgrade --install mcp-gateway ./helm/mcp-gateway \
  --namespace soai \
  --values ./helm/mcp-gateway/values.yaml \
  --values ./helm/mcp-gateway/values-prod.yaml

# Install MCP Servers
helm upgrade --install mcp-servers ./helm/mcp-servers \
  --namespace soai \
  --values ./helm/mcp-servers/values.yaml

# Or install umbrella chart
helm upgrade --install soai-mcp ./helm/soai-mcp \
  --namespace soai \
  --values ./helm/soai-mcp/values.yaml
```

### 4.2 Verification

```bash
# Check deployments
kubectl get deployments -n soai -l type=mcp-server
kubectl get deployments -n soai -l app=mcp-gateway

# Check pods
kubectl get pods -n soai -l type=mcp-server
kubectl get pods -n soai -l app=mcp-gateway

# Check services
kubectl get svc -n soai | grep mcp

# View logs
kubectl logs -n soai -l app=mcp-gateway --tail=100 -f

# Test MCP Gateway
kubectl port-forward -n soai svc/mcp-gateway 8000:8000

# In another terminal
curl http://localhost:8000/health
curl http://localhost:8000/mcp/tools/list
```

### 4.3 Upgrade

```bash
# Upgrade with new image
helm upgrade mcp-gateway ./helm/mcp-gateway \
  --namespace soai \
  --set image.tag=v1.1.0 \
  --reuse-values

# Rolling restart
kubectl rollout restart deployment/mcp-gateway -n soai
kubectl rollout status deployment/mcp-gateway -n soai
```

---

## 5. Monitoring Setup

### 5.1 Grafana Dashboard

```json
{
  "title": "MCP Gateway Dashboard",
  "panels": [
    {
      "title": "Request Rate",
      "type": "timeseries",
      "targets": [
        {
          "expr": "rate(mcp_gateway_requests_total[5m])",
          "legendFormat": "{{method}} - {{server}}"
        }
      ]
    },
    {
      "title": "Request Latency P95",
      "type": "timeseries",
      "targets": [
        {
          "expr": "histogram_quantile(0.95, rate(mcp_gateway_request_latency_seconds_bucket[5m]))",
          "legendFormat": "{{method}}"
        }
      ]
    },
    {
      "title": "Error Rate",
      "type": "stat",
      "targets": [
        {
          "expr": "sum(rate(mcp_gateway_requests_total{status='error'}[5m])) / sum(rate(mcp_gateway_requests_total[5m])) * 100"
        }
      ]
    },
    {
      "title": "Active Servers",
      "type": "gauge",
      "targets": [
        {
          "expr": "count(mcp_server_health{status='healthy'})"
        }
      ]
    }
  ]
}
```

### 5.2 Alerting Rules

```yaml
# helm/mcp-gateway/templates/prometheusrule.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: mcp-gateway-alerts
spec:
  groups:
    - name: mcp-gateway
      rules:
        - alert: MCPGatewayHighErrorRate
          expr: |
            sum(rate(mcp_gateway_requests_total{status="error"}[5m]))
            / sum(rate(mcp_gateway_requests_total[5m])) > 0.05
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "MCP Gateway error rate > 5%"

        - alert: MCPGatewayHighLatency
          expr: |
            histogram_quantile(0.95, rate(mcp_gateway_request_latency_seconds_bucket[5m])) > 1
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "MCP Gateway P95 latency > 1s"

        - alert: MCPServerDown
          expr: mcp_server_health{status!="healthy"} == 1
          for: 1m
          labels:
            severity: critical
          annotations:
            summary: "MCP Server {{ $labels.server }} is unhealthy"
```

---

## 6. Troubleshooting

### 6.1 Common Issues

| Issue | Symptoms | Solution |
|-------|----------|----------|
| Gateway not routing | 404 on tool calls | Check server registration in Redis |
| High latency | Slow responses | Check network policies, increase resources |
| Auth failures | 401 errors | Verify JWKS URL, check token expiration |
| Server unavailable | 503 errors | Check pod health, view logs |

### 6.2 Debug Commands

```bash
# Check MCP Gateway logs
kubectl logs -n soai -l app=mcp-gateway -f

# Check specific MCP server logs
kubectl logs -n soai -l app=cv-parser-mcp -f

# Check Redis (registry)
kubectl exec -it -n soai redis-master-0 -- redis-cli
> KEYS mcp:server:*
> GET mcp:server:cv-parser-mcp

# Test internal connectivity
kubectl run -it --rm debug --image=curlimages/curl -n soai -- sh
> curl http://mcp-gateway:8000/health
> curl http://cv-parser-mcp:8000/health

# Check network policies
kubectl get networkpolicies -n soai
```

---

*Document Index: [README.md](README.md)*
