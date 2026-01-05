{{- define "soai-knowledge-base-containers" -}}
{{- $top := index . 0 -}}
{{- $g := fromJson (include "soai-application.global" $top) -}}
- name: {{ $top.Values.server.knowledgebase.name }}
  image: {{ template "soai-application.imagePath" (merge (dict "imageName" "soai-knowledge-base") $top) }}
  imagePullPolicy: {{ template "soai-application.imagePullPolicy" $top }}
  securityContext:
    {{- include "soai-application.appArmorProfile.securityContext" (list $top "knowledge-base") | indent 4 }}
    allowPrivilegeEscalation: false
    privileged: false
    readOnlyRootFilesystem: true
    runAsNonRoot: true
    capabilities:
        drop:
          - ALL
    {{- with (index $top.Values "seccompProfile" "knowledge-base") }}
    seccompProfile:
    {{- toYaml . | nindent 6 }}
    {{- end }}
  ports:
    {{- if $g.security.tls.enabled }}
    - name: tls-kb-svc
      containerPort: {{ $top.Values.server.knowledgebase.httpsPort }}
    {{- else }}
    - name: http-kb-svc
      containerPort: {{ $top.Values.server.knowledgebase.httpPort }}
    {{- end }}
  resources:
{{- include "soai-application.resources" (index $top.Values "resources" "knowledgebase") | indent 2 }}
  env:
  # From log_config.py: POD_NAME = os.getenv("POD_NAME", "knowledge_base-pod")
  - name: POD_NAME
    valueFrom:
      fieldRef:
        fieldPath: metadata.name
  # From log_config.py: NAMESPACE = os.getenv("NAMESPACE", "default")
  - name: NAMESPACE
    valueFrom:
      fieldRef:
        fieldPath: metadata.namespace
  # From log_config.py: CONTAINER_NAME = os.getenv("CONTAINER_NAME", "knowledge_base_container")
  - name: CONTAINER_NAME
    value: {{ $top.Values.server.knowledgebase.name }}
  # From constants.py: CONSUL_HOST = os.getenv("CONSUL_HOST", "localhost:8500")
  - name: CONSUL_HOST
    value: {{ printf "%s:%s" (include "soai-consul.name" $top) $top.Values.server.consul.httpPort }}
  # From constants.py: SERVICE_NAME = os.getenv("SERVICE_NAME", "knowledge_base_service")
  - name: SERVICE_NAME
    value: {{ include "soai-knowledge-base.name" $top }}
  # From constants.py: SERVICE_PORT = int(os.getenv("SERVICE_PORT", 8006))
  - name: SERVICE_PORT
    {{- if $g.security.tls.enabled }}
    value: {{ $top.Values.server.knowledgebase.httpsPort | quote }}
    {{- else }}
    value: {{ $top.Values.server.knowledgebase.httpPort | quote }}
    {{- end }}
  # From constants.py: LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
  - name: LOG_LEVEL
    value: {{ $top.Values.server.knowledgebase.logLevel | default "INFO" | quote }}
  # From constants.py: TLS_ENABLED = os.getenv("TLS_ENABLED", "false").lower() == "true"
  - name: TLS_ENABLED
    value: {{ ternary "true" "false" $g.security.tls.enabled | quote }}
  {{- if $g.security.tls.enabled }}
  # From constants.py: CERT_PATH = os.getenv("CERT_PATH", "")
  - name: CERT_PATH
    value: {{ $top.Values.server.secretsPath.certPath }}/tls.crt
  # From constants.py: KEY_PATH = os.getenv("KEY_PATH", "")
  - name: KEY_PATH
    value: {{ $top.Values.server.secretsPath.certPath }}/tls.key
  # From constants.py: CA_PATH = os.getenv("CA_PATH", "")
  - name: CA_PATH
    value: {{ $top.Values.server.secretsPath.certPath }}/ca.crt
  {{- end }}
  # For calling gen_ai_provider service (like recruitment service does)
  - name: GENAI_HOST
    {{- if $g.security.tls.enabled }}
    value: {{ printf "%s:%s" (include "soai-genai.name" $top) $top.Values.server.genai.httpsPort }}
    {{- else }}
    value: {{ printf "%s:%s" (include "soai-genai.name" $top) $top.Values.server.genai.httpPort }}
    {{- end }}
  volumeMounts:
  {{- if $g.security.tls.enabled }}
  - name: tls-cert
    mountPath: {{ $top.Values.server.secretsPath.certPath }}
    readOnly: true
  {{- end }}
  - name: tmp-volume
    mountPath: /tmp
{{ include "soai-application.readinessProbe" (list $top "/api/v1/knowledge-base/health" "knowledgebase") | indent 2 }}
{{ include "soai-application.livenessProbe" (list $top "/api/v1/knowledge-base/health" "knowledgebase") | indent 2 }}
{{- end -}}
