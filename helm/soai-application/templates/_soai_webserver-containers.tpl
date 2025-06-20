{{- define "soai-webserver-containers" -}}
{{- $top := index . 0 -}}
{{- $g := fromJson (include "soai-application.global" $top) -}}
- name: {{ $top.Values.server.webserver.name }}
  image: {{ template "soai-application.imagePath" (merge (dict "imageName" "soai-webserver") $top) }}
  imagePullPolicy: {{ include "soai-application.imagePullPolicy" $top }}
  securityContext:
    {{- include "soai-application.appArmorProfile.securityContext" (list $top "webserver") | indent 4 }}
    allowPrivilegeEscalation: false
    privileged: false
    readOnlyRootFilesystem: true
    runAsNonRoot: true
    runAsUser: 101
    capabilities:
      drop:
        - ALL
    {{- with (index $top.Values "seccompProfile" "webserver") }}
    seccompProfile:
    {{- toYaml . | nindent 6 }}
    {{- end }}
  ports:    
    {{- if $g.security.tls.enabled }}
    - name: tls-wsv-svc
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
  - name: tmp-volume
    mountPath: /tmp
  - name: nginx-cache
    mountPath: /var/cache/nginx
  - name: nginx-logs
    mountPath: /var/log/nginx
  {{- if $g.security.tls.enabled }}
  - name: tls-cert
    mountPath: {{ $top.Values.server.secretsPath.certPath }}
    readOnly: true
  {{- end }}
{{- end -}}