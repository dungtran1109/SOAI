{{- define "soai-genai-containers" -}}
{{- $top := index . 0 -}}
{{- $g := fromJson (include "soai-application.global" $top) -}}
- name: {{ $top.Values.server.genai.name }}
  image: {{ template "soai-application.imagePath" (merge (dict "imageName" "soai-genai") $top) }}
  imagePullPolicy: {{ template "soai-application.imagePullPolicy" $top }}
  securityContext:
    {{- include "soai-application.appArmorProfile.securityContext" (list $top "genai") | indent 4 }}
    allowPrivilegeEscalation: false
    privileged: false
    readOnlyRootFilesystem: true
    runAsNonRoot: true
    capabilities:
        drop:
          - ALL
    {{- with (index $top.Values "seccompProfile" "genai") }}
    seccompProfile:
    {{- toYaml . | nindent 6 }}
    {{- end }}
  ports:
    {{- if $g.security.tls.enabled }}
    - name: tls-genai-svc
      containerPort: {{ $top.Values.server.genai.httpsPort }}
    {{- else }}
    - name: http-genai-svc
      containerPort: {{ $top.Values.server.genai.httpPort }}
    {{- end }}
  resources:
{{- include "soai-application.resources" (index $top.Values "resources" "genai") | indent 2 }}
  env:
  - name: POD_NAME
    valueFrom:
      fieldRef:
        fieldPath: metadata.name
  - name: NAMESPACE
    valueFrom:
      fieldRef:
        fieldPath: metadata.namespace
  - name: CONTAINER_NAME
    value: {{ $top.Values.server.genai.name }}
  - name: LOG_LEVEL
    value: {{ $top.Values.server.genai.logLevel | default "INFO" | quote }}
  - name: OPENAI_API_KEY
    valueFrom:
      secretKeyRef:
        name: openai-secret
        key: openai-key
  - name: CONSUL_HOST
    value: {{ printf "%s:%s" (include "soai-consul.name" $top) $top.Values.server.consul.httpPort }}
  - name: SERVICE_NAME
    value: {{ $top.Values.server.genai.name | quote }}
  - name: SERVICE_PORT
    {{- if $g.security.tls.enabled }}
    value: {{ $top.Values.server.genai.httpsPort | quote }}
    {{- else }}
    value: {{ $top.Values.server.genai.httpPort | quote }}
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
  volumeMounts:
  {{- if $g.security.tls.enabled }}
  - name: tls-cert
    mountPath: {{ $top.Values.server.secretsPath.certPath }}
    readOnly: true
  {{- end }}
  - name: tmp-volume
    mountPath: /tmp
{{ include "soai-application.readinessProbe" (list $top "/api/v1/gen-ai/health" "genai") | indent 2 }}
{{ include "soai-application.livenessProbe" (list $top "/api/v1/gen-ai/health" "genai") | indent 2 }}
{{- end -}}