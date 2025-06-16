{{- define "soai-mysql.container" -}}
{{- $top := index . 0 -}}
- name: {{ $top.Values.server.mysqlServer.name }}
  image: mysql:8.0.32
  imagePullPolicy: {{ template "soai-application.imagePullPolicy" $top }}
  securityContext:
    allowPrivilegeEscalation: false
    privileged: false
    readOnlyRootFilesystem: false
    runAsNonRoot: false
    {{- with (index $top.Values "seccompProfile" "mysql") }}
    seccompProfile:
    {{- toYaml . | nindent 6 }}
    {{- end }}
  env:
  - name: MYSQL_PASSWORD
    valueFrom:
      secretKeyRef:
        name: {{ template "soai-mysql.name" $top }}-secret
        key: {{ template "soai-mysql.name" $top }}-password
  - name: MYSQL_ROOT_PASSWORD
    valueFrom:
      secretKeyRef:
        name: {{ template "soai-mysql.name" $top }}-secret
        key: {{ template "soai-mysql.name" $top }}-root-password
  {{- if not (eq ((include "soai-mysql.password" $top) | b64dec) "root") }}
  - name: MYSQL_USER
    valueFrom:
      secretKeyRef:
        name: {{ template "soai-mysql.name" $top }}-secret
        key: {{ template "soai-mysql.name" $top }}-user
  {{- end }}
  - name: MYSQL_DATABASE
    valueFrom:
      secretKeyRef:
        name: {{ template "soai-mysql.name" $top }}-secret
        key: {{ template "soai-mysql.name" $top }}-dbName
  ports:
  - containerPort: {{ $top.Values.server.mysqlServer.port }}
  volumeMounts:
  {{- if $top.Values.storage.enabled }}
  - name: {{ template "soai-mysql.name" $top }}-persistent-storage
  {{- else }}
  - name: {{ template "soai-mysql.name" $top }}-ephemeral-storage
  {{- end }}
    mountPath: /var/lib/mysql
  - name: conf
    mountPath: /etc/mysql/conf.d
  resources:
{{- include "soai-application.resources" (index $top.Values "resources" "mysql") | indent 2 }}
volumes:
- name: conf
  emptyDir: {}
- name: config-map
  configMap:
    name: {{ template "soai-mysql.name" $top }}-configmap
{{- if $top.Values.storage.enabled }}
- name: {{ template "soai-mysql.name" $top }}-persistent-storage
  persistentVolumeClaim:
    claimName: {{ template "soai-mysql.name" $top }}-pv-claim
{{- else }}
- name: {{ template "soai-mysql.name" $top }}-ephemeral-storage
  emptyDir: {}
{{- end }}
{{- end }}