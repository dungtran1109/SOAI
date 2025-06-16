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
    - name: tls-server-svc
      containerPort: {{ $top.Values.server.recruitment.httpsPort }}
    {{- else }}
    - name: http-server-svc
      containerPort: {{ $top.Values.server.recruitment.httpPort }}
    {{- end }}
  resources:
{{- include "soai-application.resources" (index $top.Values "resources" "recruitment") | indent 2 }}
  env:
  - name: LOG_LEVEL
    value: {{ $top.Values.server.recruitment.logLevel | default "INFO" | quote }}
  {{- if $g.security.tls.enabled }}
  - name: CERT_PATH
    value: {{ $top.Values.server.secretsPath.certPath }}/tls.crt
  - name: KEY_PATH
    value: {{ $top.Values.server.secretsPath.certPath }}/tls.key
  - name: CA_PATH
    value: {{ $top.Values.server.secretsPath.certPath }}/ca.crt
  {{- end }}
  - name: TLS_ENABLED
  {{- if $g.security.tls.enabled }}
    value: "true"
  {{- else }}
    value: "false"
  {{- end }}
  volumeMounts:
  {{- if $top.Values.storage.enabled }}
  - name: {{ template "soai-recruitment.name" $top }}-persistent-storage
  {{- else }}
  - name: {{ template "soai-recruitment.name" $top }}-ephemeral-storage
  {{- end }}
    mountPath: /app
  {{- if $g.security.tls.enabled }}
  - name: tls-server-cert
    mountPath: {{ $top.Values.server.secretsPath.certPath }}
    readOnly: true
  {{- end }}
{{ include "soai-application.readinessProbe" (list $top "/api/v1/recruitment/health" "recruitment") | indent 2 }}
{{ include "soai-application.livenessProbe" (list $top "/api/v1/recruitment/health" "recruitment") | indent 2 }}
volumes:
{{- if $top.Values.storage.enabled }}
- name: {{ template "soai-recruitment.name" $top }}-persistent-storage
  persistentVolumeClaim:
    claimName: {{ template "soai-recruitment.name" $top }}-pv-claim
{{- else }}
- name: {{ template "soai-recruitment.name" $top }}-ephemeral-storage
  emptyDir: {}
{{- end }}
{{- if $g.security.tls.enabled }}
- name: tls-server-cert
  secret:
    secretName: {{ template "soai-application.name" $top }}-cert
{{- end }}
{{- end -}}