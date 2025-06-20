{{- define "soai-auth-containers" -}}
{{- $top := index . 0 -}}
{{- $g := fromJson (include "soai-application.global" $top) -}}
- name: {{ $top.Values.server.authentication.name }}
  image: {{ template "soai-application.imagePath" (merge (dict "imageName" "soai-authentication") $top) }}
  imagePullPolicy: {{ template "soai-application.imagePullPolicy" $top }}
  securityContext:
    {{- include "soai-application.appArmorProfile.securityContext" (list $top "authentication") | indent 4 }}
    allowPrivilegeEscalation: false
    privileged: false
    readOnlyRootFilesystem: true
    runAsNonRoot: true
    capabilities:
      drop:
        - ALL
    {{- with (index $top.Values "seccompProfile" "authentication") }}
    seccompProfile:
    {{- toYaml . | nindent 6 }}
    {{- end }}
  ports:
    {{- if $g.security.tls.enabled }}
    - name: tls-auth-svc
      containerPort: {{ $top.Values.server.authentication.httpsPort }}
    {{- else }}
    - name: http-auth-svc
      containerPort: {{ $top.Values.server.authentication.httpPort }}
    {{- end }}
  resources:
{{- include "soai-application.resources" (index $top.Values "resources" "authentication") | indent 2 }}
  env:
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
  - name: SPRING_CONFIG_LOCATION
    value: /etc/config/application.yaml
  {{- if $g.security.tls.enabled }}
  - name: KEYSTORE_PASSWORD
    valueFrom:
      secretKeyRef:
        name: {{ template "soai-authentication.name" $top }}-secret
        key: {{ template "soai-authentication.name" $top }}-keystore-password
  - name: KEYSTORE_PATH
    value: {{ $top.Values.server.secretsPath.keyStorePath }}/keystore.p12
  {{- end }}
  volumeMounts:
  - name: config-properties
    mountPath: /etc/config
  - name: tmp-volume
    mountPath: /tmp
  {{- if $g.security.tls.enabled }}
  - name: keystore-cert
    mountPath: {{ $top.Values.server.secretsPath.keyStorePath }}
  {{- end }}
{{ include "soai-application.readinessProbe" (list $top "/actuator/health" "authentication") | indent 2 }}
{{ include "soai-application.livenessProbe" (list $top "/actuator/health" "authentication") | indent 2 }}
{{- end -}}
