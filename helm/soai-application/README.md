# SOAI Application Helm Chart

This Helm chart deploys the SOAI system with modular components including authentication, recruitment, GenAI, frontend web, and supporting services like MySQL and Consul. This document outlines all configurable Helm values and their default settings.

---

## Global Configuration

| Key | Type | Description | Default |
|-----|------|-------------|---------|
| `global.security.tls.enabled` | `bool` | Enable TLS across services | `true` |
| `global.security.tls.duration` | `string` | Validity duration of TLS certificate (e.g. `2160h` = 90 days) | `2160h` |
| `global.security.tls.renewBefore` | `string` | Time before expiration to attempt certificate renewal | `360h` |
| `global.security.issuer.name` | `string` | Name of the cert-manager issuer | `ca-issuer` |
| `global.security.issuer.kind` | `string` | Issuer kind, typically `Issuer` or `ClusterIssuer` | `Issuer` |
| `global.security.issuer.group` | `string` | API group for cert-manager integration | `cert-manager.io` |
| `registry.url` | `string` | Docker registry host | `anhdung12399` |
| `registry.repoPath` | `string` | Repository path in registry | `""` |
| `timezone` | `string` | Container timezone (e.g., `UTC`, `Asia/Ho_Chi_Minh`) | `UTC` |
| `nodeSelector` | `object` | Node selector for scheduling pods | `{}` |
| `annotations` | `object` | Global pod annotations | `{}` |
| `labels` | `object` | Global pod labels | `{}` |
| `networkPolicy.enabled` | `bool` | Enable Kubernetes NetworkPolicy | `false` |
| `topologySpreadConstraints` | `object` | Configure pod distribution across nodes | `N/A` |
| `podSecurityContext.supplementalGroups` | `list` | Additional Linux groups applied to the pod | `[]` |
| `fsGroup.manual` | `int` | Manually enforced file system group | `null` |
| `fsGroup.namespace` | `bool` | Use namespace-defined fsGroup if true | `null` |

---

## Update Strategy

| Key | Type | Description | Default |
|-----|------|-------------|---------|
| `updateStrategy.type` | `string` | Deployment strategy: `RollingUpdate` or `Recreate` | `RollingUpdate` |

---

## Services

Each microservice supports standard configuration fields including `replicaCount`, ports, nodePorts, and service type.

### Authentication

| Key | Description | Default |
|-----|-------------|---------|
| `server.authentication.name` | Component name | `authentication` |
| `replicaCount` | Number of replicas | `1` |
| `serviceType` | Service type (`ClusterIP`, `NodePort`, `LoadBalancer`) | `LoadBalancer` |
| `httpPort` / `httpsPort` | HTTP/HTTPS container ports | `9090` / `9443` |
| `httpNodePort` / `httpsNodePort` | Exposed NodePorts | `30903` / `30943` |

### Recruitment

Same structure as above. Notable:
| Key | Description | Default |
|-----|-------------|---------|
| `server.recruitment.logLevel` | Logging level (`INFO`, `DEBUG`, etc.) | `INFO` |
| `server.genai.name` | Name | `genai` |
| `logLevel` | Logging verbosity | `INFO` |
| `server.web.name` | Name | `web` |
| `httpPort` / `httpsPort` | Ports | `8080` / `8443` |
| `server.consul.name` | Name | `consul` |
| `httpPort` | Service port | `8500` |
| `httpNodePort` | NodePort | `30500` |

---

## Health Probes

| Probe | Key | Default |
|-------|-----|---------|
| Readiness | `initialDelaySeconds` | `60` |
|          | `periodSeconds` | `60` |
|          | `timeoutSeconds` | `15` |
|          | `failureThreshold` | `5` |
| Liveness | (same structure) | |

---

## Resources

Describes CPU/memory for init and each service.

| Component | CPU Request | CPU Limit | Mem Request | Mem Limit |
|-----------|-------------|-----------|-------------|-----------|
| `initcontainer` | `50m` | `1` | `50Mi` | `200Mi` |
| `mysql` | `500m` | `2` | `512Mi` | `2048Mi` |
| `authentication` | `500m` | `2` | `512Mi` | `2048Mi` |
| `recruitment` | `1` | `2` | `1024Mi` | `4096Mi` |
| `genai` | `200m` | `1` | `512Mi` | `2048Mi` |
| `web` | `100m` | `200m` | `50Mi` | `100Mi` |
| `consul` | `100m` | `200m` | `256Mi` | `512Mi` |

---

## Persistent Storage

| Key | Type | Description | Default |
|-----|------|-------------|---------|
| `storage.enabled` | `bool` | Enable PVC/PV storage | `true` |
| `storage.reclaimPolicy` | `string` | PV reclaim policy | `Retain` |
| `storage.persistentVolume.enabled` | `bool` | Enable hostPath PVs | `false` |
| `storage.persistentVolume.hostPath` | `object` | Host path mapping per service | `/mnt/soai/...` |
| `storage.persistentVolume.storageCapacity.mysql` | `string` | Storage size | `2Gi` |
| `storage.storageClass.enabled` | `bool` | Use storageClass | `false` |
| `storage.storageClass.name` | `string` | Class name | `local-storage` |

---

## Secrets & Keys

| Key | Description | Default |
|-----|-------------|---------|
| `password.dbUser` | DB username | `soai_user` |
| `password.dbPass` | DB password | `soai_password` |
| `password.keystorePass` | Java keystore password | `soai_keystore_password` |

---

## OpenAI Integration

| Key | Description | Default |
|-----|-------------|---------|
| `openai.apiKey` | Key for GPT access | `""` |

---

## Issuer IP Whitelist

| Key | Description | Default |
|-----|-------------|---------|
| `issuer.ipAddress` | Allowed source IPs | `[]` |