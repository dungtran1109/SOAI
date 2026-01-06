{{- define "soai-qdrant-containers" -}}
{{- $top := index . 0 -}}
{{- $g := fromJson (include "soai-application.global" $top) -}}
- name: {{ $top.Values.server.qdrant.name }}
  image: {{ template "soai-application.imagePath" (merge (dict "imageName" "soai-qdrant") $top) }}
  imagePullPolicy: {{ template "soai-application.imagePullPolicy" $top }}
  securityContext:
    {{- include "soai-application.appArmorProfile.securityContext" (list $top "qdrant") | indent 4 }}
    allowPrivilegeEscalation: false
    privileged: false
    readOnlyRootFilesystem: false
    runAsNonRoot: true
    runAsUser: 1000
    capabilities:
        drop:
          - ALL
    {{- with (index $top.Values "seccompProfile" "qdrant") }}
    seccompProfile:
    {{- toYaml . | nindent 6 }}
    {{- end }}
  ports:
    - name: http-qdrant-svc
      containerPort: {{ $top.Values.server.qdrant.httpPort }}
    - name: grpc-qdrant-svc
      containerPort: {{ $top.Values.server.qdrant.grpcPort }}
  resources:
{{- include "soai-application.resources" (index $top.Values "resources" "qdrant") | indent 2 }}
  env:
  - name: QDRANT__SERVICE__HTTP_PORT
    value: {{ $top.Values.server.qdrant.httpPort | quote }}
  - name: QDRANT__SERVICE__GRPC_PORT
    value: {{ $top.Values.server.qdrant.grpcPort | quote }}
  {{- if $g.security.tls.enabled }}
  - name: QDRANT__SERVICE__ENABLE_TLS
    value: "true"
  - name: QDRANT__TLS__CERT
    value: {{ $top.Values.server.secretsPath.certPath }}/tls.crt
  - name: QDRANT__TLS__KEY
    value: {{ $top.Values.server.secretsPath.certPath }}/tls.key
  - name: QDRANT__TLS__CA_CERT
    value: {{ $top.Values.server.secretsPath.certPath }}/ca.crt
  {{- end }}
  volumeMounts:
  {{- if $g.security.tls.enabled }}
  - name: tls-cert
    mountPath: {{ $top.Values.server.secretsPath.certPath }}
    readOnly: true
  {{- end }}
  - name: qdrant-storage
    mountPath: /qdrant/storage
  readinessProbe:
    httpGet:
      path: /readyz
      port: {{ $top.Values.server.qdrant.httpPort }}
      {{- if $g.security.tls.enabled }}
      scheme: HTTPS
      {{- end }}
    initialDelaySeconds: 5
    periodSeconds: 10
    timeoutSeconds: 5
    successThreshold: 1
    failureThreshold: 3
  livenessProbe:
    httpGet:
      path: /healthz
      port: {{ $top.Values.server.qdrant.httpPort }}
      {{- if $g.security.tls.enabled }}
      scheme: HTTPS
      {{- end }}
    initialDelaySeconds: 10
    periodSeconds: 30
    timeoutSeconds: 5
    successThreshold: 1
    failureThreshold: 3
{{- end -}}
