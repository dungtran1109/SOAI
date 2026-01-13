## OpenTelemetry Collector to Prometheus TSDB Architecture

### Overview

This document describes the finalized metrics pipeline architecture used in the SOAI system. The system is designed such that all metric collection responsibilities are centralized inside the OpenTelemetry Collector (OTel Collector), while Prometheus functions strictly as a TSDB (time-series database) for long-term metric storage and querying. Prometheus does not perform scraping or rule evaluation in this mode.

The purpose of this design is to:

* Standardize scraping and metric enrichment across all services.
* Simplify Prometheus configuration by delegating all scrapes to the OTel Collector.
* Enforce consistent metadata on all metrics.
* Use Prometheus only for ingestion via remote_write and for storage/querying.

---

## Architectural Flow

The following sections break down the end-to-end metrics flow from services to Prometheus TSDB.

                          ┌────────────────────────────────────────┐
                          │             Applications               │
                          │                                        │
                          │  • Spring Boot (Authentication)        │
                          │  • FastAPI (Recruitment)               │
                          │  • FastAPI (GenAI)                     │
                          │                                        │
                          │  Expose HTTPS/HTTP metrics endpoints:  │
                          │   - /actuator/prometheus               │
                          │   - /metrics                           │
                          └───────────────┬────────────────────────┘
                                          │ HTTPS/HTTP Scrape
                                          │
                                          ▼
                          ┌────────────────────────────────────────┐
                          │           OTel Collector               │
                          │────────────────────────────────────────│
                          │ Receivers:                             │
                          │   - prometheus (scrape K8s pods)       │
                          │   - otlp (instrumented apps)           │
                          │   - hostmetrics                        │
                          │                                        │
                          │ Processors:                            │
                          │   - k8sattributes                      │
                          │   - resource                           │
                          │   - batch                              │
                          │   - memory_limiter                     │
                          │                                        │
                          │ Exporters:                             │
                          │   - prometheusremotewrite              │
                          │         → http://prometheus:9090       │
                          │           /api/v1/write                │
                          └───────────────┬────────────────────────┘
                                          │ Remote Write (Push)
                                          │
                                          ▼
                          ┌────────────────────────────────────────┐
                          │         Prometheus (TSDB Only)         │
                          │────────────────────────────────────────│
                          │ • No scraping                          │
                          │ • No alerting rules                    │
                          │ • No evaluation                        │
                          │ • Only stores metrics pushed via       │
                          │    remote_write                        │
                          │                                        │
                          │ Required flags:                        │
                          │  --web.enable-remote-write-receiver    │
                          │  --storage.tsdb.path=/prometheus       │
                          └───────────────┬────────────────────────┘
                                          │ Query via HTTP API
                                          │
                                          ▼
                          ┌────────────────────────────────────────┐
                          │                 Grafana                │
                          │────────────────────────────────────────│
                          │ • Queries Prometheus TSDB              │
                          │ • Visualizes dashboards                │
                          │ • Observability layer for operators    │
                          └────────────────────────────────────────┘

### 1. Application Metric Exposure Layer

Each application must expose a valid Prometheus metrics endpoint. The metrics endpoint must return metrics in Prometheus text format.

#### Spring Boot (Authentication Service)

Spring Boot exposes metrics under the Actuator Prometheus endpoint.

Requirements:

* `management.endpoints.web.exposure.include=*`
* `management.endpoint.prometheus.enabled=true`
* `management.metrics.export.prometheus.enabled=true`

Metrics endpoint path:

```
/actuator/prometheus
```

Deployment annotations must reflect:

```
prometheus.io/path: "/actuator/prometheus"
prometheus.io/port: "9443"
prometheus.io/scheme: "https"
prometheus.io/scrape-interval: "15s"
prometheus.io/scrape-role: "pod"
```

#### FastAPI Services (Recruitment and GenAI)

FastAPI does not expose Prometheus metrics by default. Each FastAPI application requires instrumentation using the Prometheus FastAPI Instrumentator library.

Example implementation:

```python
from prometheus_fastapi_instrumentator import Instrumentator

Instrumentator().instrument(app).expose(
    app,
    endpoint="/metrics",
    include_in_schema=False,
)
```

Each service must expose a unique metrics endpoint:

* Recruitment service: `/metrics`
* GenAI service: `/metrics`

Deployment annotations must match the endpoint exactly.

---

## 2. OpenTelemetry Collector Scraping Layer

The OTel Collector is responsible for scraping all application endpoints, host-level metrics, and any internal metrics.

Configuration responsibilities:

* Discover Kubernetes Pods, Services, and Endpoints.
* Apply relabeling rules to identify valid metric targets.
* Handle HTTPS scrapes with TLS verification disabled (`insecure_skip_verify: true`).
* Collect host metrics including CPU, memory, disk, filesystem, and network.
* Collect OTel Collector self-metrics.

Key receiver configuration:

```
receivers:
  prometheus:
    config:
      scrape_configs:
        - job_name: k8s-pod-15s-https
          scheme: https
          tls_config:
            insecure_skip_verify: true
          kubernetes_sd_configs:
            - role: pod
              namespaces:
                names: ["zrdtuan-ns"]
          relabel_configs:
            - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
              action: replace
              target_label: __metrics_path__
            - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_port]
              action: replace
              target_label: __address__
            - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scheme]
              action: keep
              regex: '^https$'
```

The Collector enriches metrics with Kubernetes metadata via the `k8sattributes` processor.

---

## 3. Metric Processing Layer

After scraping, OTel Collector applies several processors:

### Memory Limiting

Prevents excessive memory usage:

```
memory_limiter:
  check_interval: 1s
  limit_mib: 1000
  spike_limit_mib: 200
```

### Kubernetes Metadata Injection

```
k8sattributes:
  extract:
    metadata:
      - k8s.namespace.name
      - k8s.pod.name
      - k8s.pod.uid
      - k8s.container.name
      - container.image.name
      - container.image.tag
```

### Resource Attribute Insertion

Adds `service.instance.id` sourced from the Pod UID.

### Batching and Transformation

Used to optimize remote_write throughput.

---

## 4. Metric Export Layer

The OTel Collector exports metrics to Prometheus via the Prometheus Remote Write protocol.

Configuration:

```
exporters:
  prometheusremotewrite:
    endpoint: "http://prometheus:9090/api/v1/write"
    tls:
      insecure: true
```

This enables the Collector to push metrics directly into the Prometheus TSDB.

Prometheus must be started with the following flag:

```
--web.enable-remote-write-receiver
```

This configures Prometheus to accept data written to `/api/v1/write`.

---

## 5. Prometheus TSDB Layer

Prometheus serves exclusively as a storage backend without performing scrapes or alert evaluations.

### Prometheus Configuration

```
global:
  scrape_interval: 0s
  evaluation_interval: 0s

scrape_configs: []
rule_files: []

storage:
  tsdb:
    out_of_order_time_window: 30m
```

Only remote_write ingestion is used.

Prometheus responsibilities:

* Ingest time-series data from OTel Collector.
* Store metrics in TSDB.
* Expose metrics to Grafana and other query clients.

No alerting, rule evaluation, or scraping is performed.

---

## 6. Validation and Troubleshooting

### Validate Application Metrics

Run inside the cluster:

```
kubectl -n <namespace> run curl --rm -it --image=curlimages/curl -- sh
curl -k https://<service>:<port>/<metrics-path>
```

### Validate Prometheus TSDB

Access the Prometheus TSDB status endpoint:

```
/api/v1/status/tsdb
```

Expected:

* `numSeries` greater than zero

### Verify Remote Write Pipeline

Inside Prometheus UI query:

```
otelcol_exporter_prometheusremotewrite_consumers
```

A nonzero value indicates remote_write ingestion is working.

---

## Summary

This system centralizes all metric collection in the OpenTelemetry Collector, ensuring consistent metadata, simplified Prometheus configuration, and a unified ingestion path. Prometheus operates solely as a TSDB which receives metrics via the remote_write protocol. This architecture is designed for high maintainability, correctness, and scalability in Kubernetes-based microservice environments.
