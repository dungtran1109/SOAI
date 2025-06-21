{{- define "soai-consul-containers" -}}
{{- $top := index . 0 -}}
{{- $g := fromJson (include "soai-application.global" $top) -}}
- name: {{ $top.Values.server.consul.name }}
  image: {{ template "soai-application.imagePath" (merge (dict "imageName" "soai-consul") $top) }}
  command:
      - consul
      - agent
      - -server
      - -bootstrap
      - -ui
      - -client=0.0.0.0
      - -data-dir=/consul/data
  imagePullPolicy: {{ include "soai-application.imagePullPolicy" $top }}
  securityContext:
    {{- include "soai-application.appArmorProfile.securityContext" (list $top "consul") | indent 4 }}
    runAsNonRoot: false
    allowPrivilegeEscalation: false
    privileged: false
    readOnlyRootFilesystem: false
    {{- with (index $top.Values "seccompProfile" "consul") }}
    seccompProfile:
    {{- toYaml . | nindent 6 }}
    {{- end }}
  ports:
    - name: http-consul-svc
      containerPort: {{ $top.Values.server.consul.httpPort }}
  resources:
{{- include "soai-application.resources" (index $top.Values "resources" "consul") | indent 2 }}
  volumeMounts:
    - name: consul-data
      mountPath: /consul/data
{{- end -}}
