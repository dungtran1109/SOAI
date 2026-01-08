{{- define "soai-recruitment-worker-container" -}}
{{- $top := index . 0 -}}
{{- $g := fromJson (include "soai-application.global" $top) -}}
- name: {{ $top.Values.server.recruitment.name }}-worker
  image: {{ template "soai-application.imagePath" (merge (dict "imageName" "soai-recruitment") $top) }}
  imagePullPolicy: {{ template "soai-application.imagePullPolicy" $top }}
  command: ["celery"]
  args: ["-A", "celery_worker", "worker", "--loglevel=info", "--concurrency=4"]
  securityContext:
    allowPrivilegeEscalation: false
    privileged: false
    readOnlyRootFilesystem: true
    runAsNonRoot: true
    capabilities:
      drop:
        - ALL
  env:
  - name: OTEL_ENDPOINT
    value: "otel-collector:4317"
  - name: POD_NAME
    valueFrom:
      fieldRef:
        fieldPath: metadata.name
  - name: NAMESPACE
    valueFrom:
      fieldRef:
        fieldPath: metadata.namespace
  - name: CONTAINER_NAME
    value: {{ $top.Values.server.recruitment.name }}-worker
  - name: LOG_LEVEL
    value: {{ $top.Values.server.recruitment.logLevel | default "INFO" | quote }}
  - name: GENAI_HOST
    value: {{ printf "%s:%s" (include "soai-genai.name" $top) (ternary $top.Values.server.genai.httpsPort $top.Values.server.genai.httpPort $g.security.tls.enabled) | quote }}
  - name: CONSUL_HOST
    value: {{ printf "%s:%s" (include "soai-consul.name" $top) $top.Values.server.consul.httpPort }}
  - name: SERVICE_NAME
    value: {{ include "soai-recruitment.name" $top }}
  - name: DB_HOST
    valueFrom:
      secretKeyRef:
        name: {{ template "soai-mysql.name" $top }}-secret
        key: {{ template "soai-mysql.name" $top }}-host
  - name: DB_PORT
    value: {{ $top.Values.server.mysqlServer.port | quote }}
  - name: DB_NAME
    valueFrom:
      secretKeyRef:
        name: {{ template "soai-mysql.name" $top }}-secret
        key: {{ template "soai-mysql.name" $top }}-dbName
  - name: DB_USERNAME
  {{- if not (eq ((include "soai-mysql.username" $top) | b64dec) "root") }}
    valueFrom:
      secretKeyRef:
        name: {{ template "soai-mysql.name" $top }}-secret
        key: {{ template "soai-mysql.name" $top }}-user
  {{- else }}
    valueFrom:
      secretKeyRef:
        name: {{ template "soai-mysql.name" $top }}-secret
        key: {{ template "soai-mysql.name" $top }}-root-password
  {{- end }}
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: {{ template "soai-mysql.name" $top }}-secret
        key: {{ template "soai-mysql.name" $top }}-password
  - name: REDIS_HOST
    value: redis
  - name: REDIS_PORT
    value: {{ $top.Values.server.redis.port | quote }}
  - name: CELERY_BROKER_URL
    value: {{ printf "redis://redis:%s/0" (toString $top.Values.server.redis.port) | quote }}
  - name: CELERY_RESULT_BACKEND
    value: {{ printf "redis://redis:%s/0" (toString $top.Values.server.redis.port) | quote }}
  - name: CELERY_TASK_TIME_LIMIT
    value: "600"
  - name: CELERY_TASK_SOFT_TIME_LIMIT
    value: "500"
  # Knowledge Base / RAG settings from constants.py
  - name: KNOWLEDGE_BASE_HOST
    {{- if $g.security.tls.enabled }}
    value: {{ printf "%s:%s" (include "soai-knowledge-base.name" $top) $top.Values.server.knowledgebase.httpsPort }}
    {{- else }}
    value: {{ printf "%s:%s" (include "soai-knowledge-base.name" $top) $top.Values.server.knowledgebase.httpPort }}
    {{- end }}
  - name: EMBEDDING_MODEL
    value: {{ $top.Values.rag.embeddingModel | default "text-embedding-3-large" | quote }}
  - name: QDRANT_COLLECTION
    value: {{ $top.Values.rag.qdrantCollection | default "cv_embeddings" | quote }}
  {{- if $g.security.tls.enabled }}
  - name: CERT_PATH
    value: {{ $top.Values.server.secretsPath.certPath }}/tls.crt
  - name: KEY_PATH
    value: {{ $top.Values.server.secretsPath.certPath }}/tls.key
  - name: CA_PATH
    value: {{ $top.Values.server.secretsPath.certPath }}/ca.crt
  - name: TLS_ENABLED
    value: "true"
  {{- else }}
  - name: TLS_ENABLED
    value: "false"
  {{- end }}
  volumeMounts:
  {{- if $top.Values.storage.enabled }}
  - name: {{ template "soai-recruitment.name" $top }}-persistent-storage
  {{- else }}
  - name: {{ template "soai-recruitment.name" $top }}-ephemeral-storage
  {{- end }}
    mountPath: /app/app/cv_uploads
  - name: home-volume
    mountPath: /home/soai_user
  {{- if $g.security.tls.enabled }}
  - name: tls-cert
    mountPath: {{ $top.Values.server.secretsPath.certPath }}
    readOnly: true
  {{- end }}
  - name: tmp-volume
    mountPath: /tmp
  resources:
{{- include "soai-application.resources" (index $top.Values "resources" "recruitmentWorker") | indent 2 }}
{{- end -}}
