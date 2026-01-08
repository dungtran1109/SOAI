{{- define "soai-agent-controller-containers" -}}
{{- $top := index . 0 -}}
{{- $g := fromJson (include "soai-application.global" $top) -}}
- name: {{ $top.Values.server.agentcontroller.name }}
  image: {{ template "soai-application.imagePath" (merge (dict "imageName" "soai-agent-controller") $top) }}
  imagePullPolicy: {{ template "soai-application.imagePullPolicy" $top }}
  securityContext:
    {{- include "soai-application.appArmorProfile.securityContext" (list $top "agentcontroller") | indent 4 }}
    allowPrivilegeEscalation: false
    privileged: false
    readOnlyRootFilesystem: true
    runAsNonRoot: true
    capabilities:
        drop:
          - ALL
    {{- with (index $top.Values "seccompProfile" "agentcontroller") }}
    seccompProfile:
    {{- toYaml . | nindent 6 }}
    {{- end }}
  ports:
    {{- if $g.security.tls.enabled }}
    - name: tls-agent-svc
      containerPort: {{ $top.Values.server.agentcontroller.httpsPort }}
    {{- else }}
    - name: http-agent-svc
      containerPort: {{ $top.Values.server.agentcontroller.httpPort }}
    {{- end }}
  resources:
{{- include "soai-application.resources" (index $top.Values "resources" "agentcontroller") | indent 2 }}
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
    value: {{ $top.Values.server.agentcontroller.name }}
  - name: LOG_LEVEL
    value: {{ $top.Values.server.agentcontroller.logLevel | default "INFO" | quote }}
  - name: GENAI_HOST
    value: {{ printf "%s:%s" (include "soai-genai.name" $top) (ternary $top.Values.server.genai.httpsPort $top.Values.server.genai.httpPort $g.security.tls.enabled) | quote }}
  - name: SERVICE_NAME
    value: {{ include "soai-agent-controller.name" $top }}
  - name: SERVICE_PORT
    {{- if $g.security.tls.enabled }}
    value: {{ $top.Values.server.agentcontroller.httpsPort | quote }}
    {{- else }}
    value: {{ $top.Values.server.agentcontroller.httpPort | quote }}
    {{- end }}
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
    value: redis
  - name: REDIS_PORT
    value: {{ $top.Values.server.redis.port | quote }}
  # RAG settings from constants.py
  - name: RAG_ENABLED
    value: {{ $top.Values.rag.enabled | default false | quote }}
  - name: RAG_UNGROUNDED_CONTINUATION
    value: {{ $top.Values.rag.ungroundedContinuation | default false | quote }}
  - name: RAG_TOP_K
    value: {{ $top.Values.rag.topK | default 5 | quote }}
  - name: KNOWLEDGE_BASE_HOST
    {{- if $g.security.tls.enabled }}
    value: {{ printf "%s:%s" (include "soai-knowledge-base.name" $top) $top.Values.server.knowledgebase.httpsPort }}
    {{- else }}
    value: {{ printf "%s:%s" (include "soai-knowledge-base.name" $top) $top.Values.server.knowledgebase.httpPort }}
    {{- end }}
  - name: RECRUITMENT_HOST
    {{- if $g.security.tls.enabled }}
    value: {{ printf "%s:%s" (include "soai-recruitment.name" $top) $top.Values.server.recruitment.httpsPort }}
    {{- else }}
    value: {{ printf "%s:%s" (include "soai-recruitment.name" $top) $top.Values.server.recruitment.httpPort }}
    {{- end }}
  - name: EMBEDDING_MODEL
    value: {{ $top.Values.rag.embeddingModel | default "text-embedding-3-large" | quote }}
  - name: QDRANT_COLLECTION
    value: {{ $top.Values.rag.qdrantCollection | default "cv_embeddings" | quote }}
  volumeMounts:
  {{- if $g.security.tls.enabled }}
  - name: tls-cert
    mountPath: {{ $top.Values.server.secretsPath.certPath }}
    readOnly: true
  {{- end }}
  - name: tmp-volume
    mountPath: /tmp
{{ include "soai-application.readinessProbe" (list $top "/api/v1/agent-controller/health" "agentcontroller") | indent 2 }}
{{ include "soai-application.livenessProbe" (list $top "/api/v1/agent-controller/health" "agentcontroller") | indent 2 }}
{{- end -}}