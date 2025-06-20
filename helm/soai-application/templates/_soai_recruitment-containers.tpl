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
  - name: LOG_LEVEL
    value: {{ $top.Values.server.recruitment.logLevel | default "INFO" | quote }}
  - name: GENAI_HOST
    value: {{ printf "%s:%s" $top.Values.server.genai.name (ternary $top.Values.server.genai.httpsPort $top.Values.server.genai.httpPort $g.security.tls.enabled) | quote }}
  - name: SERVICE_NAME
    value: {{ $top.Values.server.recruitment.name | quote }}
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
  volumeMounts:
  {{- if $top.Values.storage.enabled }}
  - name: {{ template "soai-recruitment.name" $top }}-persistent-storage
  {{- else }}
  - name: {{ template "soai-recruitment.name" $top }}-ephemeral-storage
  {{- end }}
    mountPath: /app/app/cv_uploads
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