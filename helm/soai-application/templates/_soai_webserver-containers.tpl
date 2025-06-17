{{- define "soai-webserver-containers" -}}
{{- $top := index . 0 -}}
{{- $g := fromJson (include "soai-application.global" $top) -}}
- name: {{ $top.Values.server.webserver.name }}
  image: nginxinc/nginx-unprivileged:latest
  imagePullPolicy: {{ include "soai-application.imagePullPolicy" $top }}
  securityContext:
    {{- include "soai-application.appArmorProfile.securityContext" (list $top "webserver") | indent 4 }}
    allowPrivilegeEscalation: false
    privileged: false
    readOnlyRootFilesystem: true
    runAsNonRoot: true
    capabilities:
      drop:
        - ALL
    {{- with (index $top.Values "seccompProfile" "webserver") }}
    seccompProfile:
    {{- toYaml . | nindent 6 }}
    {{- end }}
  ports:    
    {{- if $g.security.tls.enabled }}
    - name: tls-webserver-svc
      containerPort: {{ $top.Values.server.webserver.httpsPort }}
    {{- else }}
    - name: http-webserver-svc
      containerPort: {{ $top.Values.server.webserver.httpPort }}
    {{- end }}
  resources:
{{- include "soai-application.resources" (index $top.Values "resources" "webserver") | indent 2 }}
  volumeMounts:
  - name: nginx-conf
    mountPath: /etc/nginx/conf.d/
  {{- if $g.security.tls.enabled }}
  - name: tls-webserver-cert
    mountPath: {{ $top.Values.server.secretsPath.certPath }}
    readOnly: true
  {{- end }}
volumes:
- name: nginx-conf
  configMap:
    name: {{ template "soai-application.name" $top }}-nginx-configmap
    items:
      - key: nginx.conf
        path: nginx.conf
{{- if $g.security.tls.enabled }}
- name: tls-webserver-cert
  secret:
    secretName: {{ template "soai-application.name" $top }}-cert
{{- end }}
{{- end -}}