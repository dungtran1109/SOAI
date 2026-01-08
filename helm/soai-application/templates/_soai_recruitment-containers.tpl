{{- define "soai-recruitment-containers" -}}
{{- $top := index . 0 -}}
{{- $g := fromJson (include "soai-application.global" $top) -}}
- name: {{ $top.Values.server.recruitment.name }}
  image: {{ template "soai-application.imagePath" (merge (dict "imageName" "soai-recruitment") $top) }}
  imagePullPolicy: {{ template "soai-application.imagePullPolicy" $top }}
  securityContext:
    {{- include "soai-application.appArmorProfile.securityContext" (list $top "recruitment") | indent 4 }}
    allowPrivilegeEscalation: false
    privileged: false
    readOnlyRootFilesystem: true
    runAsNonRoot: true
    capabilities:
      drop:
        - ALL
    {{- with (index $top.Values "seccompProfile" "recruitment") }}
    seccompProfile:
    {{- toYaml . | nindent 6 }}
    {{- end }}
  ports:    
    {{- if $g.security.tls.enabled }}
    - name: tls-rcm-svc
      containerPort: {{ $top.Values.server.recruitment.httpsPort }}
    {{- else }}
    - name: http-recruitment-svc
      containerPort: {{ $top.Values.server.recruitment.httpPort }}
    {{- end }}
  resources:
{{- include "soai-application.resources" (index $top.Values "resources" "recruitment") | indent 2 }}
  env:
  - name: OTEL_ENDPOINT
    value: {{ $g.otel.endpoint | default "otel-collector:4317" | quote }}
  - name: POD_NAME
    valueFrom:
      fieldRef:
        fieldPath: metadata.name
  - name: NAMESPACE
    valueFrom:
      fieldRef:
        fieldPath: metadata.namespace
  - name: CONTAINER_NAME
    value: {{ $top.Values.server.recruitment.name }}
  - name: LOG_LEVEL
    value: {{ $top.Values.server.recruitment.logLevel | default "INFO" | quote }}
  - name: GENAI_HOST
    value: {{ printf "%s:%s" (include "soai-genai.name" $top) (ternary $top.Values.server.genai.httpsPort $top.Values.server.genai.httpPort $g.security.tls.enabled) | quote }}
  - name: SERVICE_NAME
    value: {{ include "soai-recruitment.name" $top }}
  - name: SERVICE_PORT
  {{- if $g.security.tls.enabled }}
    value: {{ $top.Values.server.recruitment.httpsPort | quote }}
  {{- else }}
    value: {{ $top.Values.server.recruitment.httpPort | quote }}
  {{- end }}
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
  {{- if $g.security.tls.enabled }}
  - name: CERT_PATH
    value: {{ $top.Values.server.secretsPath.certPath }}/tls.crt
  - name: KEY_PATH
    value: {{ $top.Values.server.secretsPath.certPath }}/tls.key
  - name: CA_PATH
    value: {{ $top.Values.server.secretsPath.certPath }}/ca.crt
  {{- end }}
  - name: TLS_ENABLED
    value: {{ ternary "true" "false" $g.security.tls.enabled | quote }}
  - name: REDIS_HOST
    value: {{ include "soai-redis.name" $top }}
  - name: REDIS_PORT
    value: {{ $top.Values.server.redis.port | quote }}
  - name: CELERY_BROKER_URL
    value: {{ printf "redis://%s:%s/0" (include "soai-redis.name" $top) (toString $top.Values.server.redis.port) | quote }}
  - name: CELERY_RESULT_BACKEND
    value: {{ printf "redis://%s:%s/0" (include "soai-redis.name" $top) (toString $top.Values.server.redis.port) | quote }}
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
  # MinIO / Object Storage settings
  - name: OBJECT_STORAGE_ENABLED
    value: {{ $top.Values.objectStorage.enabled | default false | quote }}
  {{- if $top.Values.objectStorage.enabled }}
  - name: MINIO_ENDPOINT
    value: {{ printf "%s:%s" (include "soai-minio.name" $top) $top.Values.server.minio.apiPort }}
  - name: MINIO_ACCESS_KEY
    valueFrom:
      secretKeyRef:
        name: {{ template "soai-minio.name" $top }}-secret
        key: root-user
  - name: MINIO_SECRET_KEY
    valueFrom:
      secretKeyRef:
        name: {{ template "soai-minio.name" $top }}-secret
        key: root-password
  - name: MINIO_BUCKET_NAME
    value: {{ $top.Values.objectStorage.bucketName | default "cv-storage" | quote }}
  - name: MINIO_PRESIGNED_URL_EXPIRY
    value: {{ $top.Values.objectStorage.presignedUrlExpiry | default 86400 | quote }}
  {{- if $top.Values.objectStorage.externalEndpoint }}
  - name: MINIO_EXTERNAL_ENDPOINT
    value: {{ $top.Values.objectStorage.externalEndpoint | quote }}
  {{- end }}
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
{{ include "soai-application.readinessProbe" (list $top "/api/v1/recruitment/health" "recruitment") | indent 2 }}
{{ include "soai-application.livenessProbe" (list $top "/api/v1/recruitment/health" "recruitment") | indent 2 }}
{{- end -}}