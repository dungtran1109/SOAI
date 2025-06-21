{{/* vim: set filetype=mustache: */}}

{{/*
Create a map from ".Values.global" with defaults if missing in values file.
*/}}
{{ define "soai-application.global" }}
    {{- $globalDefaults := dict "security" (dict "tls" (dict "enabled" true "duration" "2160h" "renewBefore" "360h")) -}}
    {{- $globalDefaults := merge $globalDefaults (dict "security" (dict "issuer" (dict "name" "ca-issuer" "kind" "Issuer" "group" "cert-manager.io"))) -}}
    {{- $globalDefaults := merge $globalDefaults (dict "registry" (dict "url" "anhdung12399")) -}}
    {{- $globalDefaults := merge $globalDefaults (dict "timezone" "UTC") -}}
    {{- $globalDefaults := merge $globalDefaults (dict "nodeSelector" (dict)) -}}
    {{ if .Values.global }}
        {{- mergeOverwrite $globalDefaults .Values.global | toJson -}}
    {{ else }}
        {{- $globalDefaults | toJson }}
    {{ end }}
{{ end }}

{{/*
Get current Namespace
*/}}
{{- define "soai-application.namespace" -}}
{{- $namespace := .Release.Namespace -}}
{{- printf "%s" $namespace -}}
{{- end -}}

{{- define "soai-application.name" -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- print $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Expand the name of the mysql chart
*/}}
{{- define "soai-mysql.name" -}}
{{- $name := (include "soai-application.name" .) -}}
{{- printf "%s-mysql" $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Expand the name of the authentication chart
*/}}
{{- define "soai-authentication.name" -}}
{{- $name := (include "soai-application.name" .) -}}
{{- printf "%s-authentication" $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Expand the name of the server chart
*/}}
{{- define "soai-recruitment.name" -}}
{{- $name := (include "soai-application.name" .) -}}
{{- printf "%s-recruitment" $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Expand the name of the genai chart
*/}}
{{- define "soai-genai.name" -}}
{{- $name := (include "soai-application.name" .) -}}
{{- printf "%s-genai" $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Expand the name of the web chart
*/}}
{{- define "soai-web.name" -}}
{{- $name := (include "soai-application.name" .) -}}
{{- printf "%s-web" $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Expand the name of the consul chart
*/}}
{{- define "soai-consul.name" -}}
{{- $name := (include "soai-application.name" .) -}}
{{- printf "%s-consul" $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Selector labels for mysql.
*/}}
{{- define "soai-mysql.selectorLabels" -}}
component: {{ .Values.server.mysqlServer.name | quote }}
app: {{ template "soai-mysql.name" . }}
release: {{ .Release.Name | quote }}
app.kubernetes.io/instance: {{ .Release.Name | quote }}
{{- end }}

{{/*
Selector labels for authentication.
*/}}
{{- define "soai-authentication.selectorLabels" -}}
component: {{ .Values.server.authentication.name | quote }}
app: {{ template "soai-authentication.name" . }}
release: {{ .Release.Name | quote }}
app.kubernetes.io/instance: {{ .Release.Name | quote }}
{{- end }}

{{/*
Selector labels for recruitment.
*/}}
{{- define "soai-recruitment.selectorLabels" -}}
component: {{ .Values.server.recruitment.name | quote }}
app: {{ template "soai-recruitment.name" . }}
release: {{ .Release.Name | quote }}
app.kubernetes.io/instance: {{ .Release.Name | quote }}
{{- end }}

{{/*
Selector labels for genai.
*/}}
{{- define "soai-genai.selectorLabels" -}}
component: {{ .Values.server.genai.name | quote }}
app: {{ template "soai-genai.name" . }}
release: {{ .Release.Name | quote }}
app.kubernetes.io/instance: {{ .Release.Name | quote }}
{{- end }}

{{/*
Selector labels for web.
*/}}
{{- define "soai-web.selectorLabels" -}}
component: {{ .Values.server.web.name | quote }}
app: {{ template "soai-web.name" . }}
release: {{ .Release.Name | quote }}
app.kubernetes.io/instance: {{ .Release.Name | quote }}
{{- end }}

{{/*
Selector labels for consul.
*/}}
{{- define "soai-consul.selectorLabels" -}}
component: {{ .Values.server.consul.name | quote }}
app: {{ template "soai-consul.name" . }}
release: {{ .Release.Name | quote }}
app.kubernetes.io/instance: {{ .Release.Name | quote }}
{{- end }}

{{/*
Define product-info
*/}}
{{- define "soai-application.product-info" }}
    soai-application.com/product-name: {{ (fromYaml (.Files.Get "soai-product-info.yaml")).productName | quote }}
    soai-application.com/product-revision: {{regexReplaceAll "(.*)[+].*" .Chart.Version "${1}" }}
{{- end }}

{{/*
Define annotations
*/}}
{{- define "soai-application.annotations" -}}
    {{- $g := fromJson (include "soai-application.global" .) -}}
    {{- $productInfo := include "soai-application.product-info" . | fromYaml -}}
    {{- $global := $g.annotations -}}
    {{- $service := .Values.annotations -}}
    {{- include "soai-application.mergeAnnotations" (dict "location" .Template.Name "sources" (list $productInfo $global $service)) | trim }}
{{- end }}

{{/*
Create version
*/}}
{{- define "soai-application.version" -}}
{{- printf "%s" .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create image pull secrets
*/}}
{{- define "soai-application.pullSecrets" -}}
  {{- if .Values.imageCredentials.pullSecret -}}
    {{- print .Values.imageCredentials.pullSecret }}
  {{- else -}}
    {{- $g := fromJson (include "soai-application.global" .) -}}
    {{- if $g.pullSecret }}
      {{- print $g.pullSecret }}
    {{- end -}}
  {{- end -}}
{{- end -}}

{{/*
Define imagePath
*/}}
{{- define "soai-application.imagePath" -}}
    {{- $productInfo := fromYaml (.Files.Get "soai-product-info.yaml") -}}
    {{- $image := (get $productInfo.images .imageName) -}}
    {{- $registryUrl := $image.registry -}}
    {{- $name := $image.name -}}
    {{- $tag := $image.tag -}}
    {{- printf "%s/%s:%s" $registryUrl $name $tag -}}
{{- end -}}

{{/*
Create imagePullPolicy
*/}}
{{- define "soai-application.imagePullPolicy" -}}
    {{- $imagePullPolicy := .Values.imageCredentials.pullPolicy -}}
    {{- if .Values.global -}}
        {{- if .Values.global.registry -}}
            {{- if .Values.global.registry.imagePullPolicy -}}
                {{- $imagePullPolicy = .Values.global.registry.imagePullPolicy -}}
            {{- end -}}
        {{- end -}}
    {{- end -}}
    {{- print $imagePullPolicy -}}
{{- end -}}

{{/*
Create chart name and version as used bt chart label.
*/}}
{{- define "soai-application.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Static labels
*/}}
{{- define "soai-application.static-labels" -}}
{{- $top := index . 0 }}
{{- $name := index . 1 }}
app.kubernetes.io/name: {{ $name }}
app.kubernetes.io/version: {{ template "soai-application.version" $top }}
chart: {{ template "soai-application.chart" $top }}
heritage: {{ $top.Release.Service | quote }}
{{- end -}}

{{/*
Merged labels for common mysql
*/}}
{{- define "soai-mysql.labels" -}}
    {{- $g := fromJson (include "soai-application.global" .) -}}
    {{- $selector := (include "soai-mysql.selectorLabels" .) | fromYaml -}}
    {{- $name := (include "soai-mysql.name" .) }}
    {{- $static := include "soai-application.static-labels" (list . $name) | fromYaml -}}
    {{- $global := $g.label -}}
    {{- $service := .Values.labels -}}
    {{- include "soai-application.mergeLabels" (dict "location" .Template.Name "sources" (list $selector $static $global $service)) | trim }}
{{- end -}}

{{/*
Merged labels for common authentication
*/}}
{{- define "soai-authentication.labels" -}}
    {{- $g := fromJson (include "soai-application.global" .) -}}
    {{- $selector := (include "soai-authentication.selectorLabels" .) | fromYaml -}}
    {{- $name := (include "soai-authentication.name" .) }}
    {{- $static := include "soai-application.static-labels" (list . $name) | fromYaml -}}
    {{- $global := $g.label -}}
    {{- $service := .Values.labels -}}
    {{- include "soai-application.mergeLabels" (dict "location" .Template.Name "sources" (list $selector $static $global $service)) | trim }}
{{- end -}}

{{/*
Merged labels for common server
*/}}
{{- define "soai-recruitment.labels" -}}
    {{- $g := fromJson (include "soai-application.global" .) -}}
    {{- $selector := include "soai-recruitment.selectorLabels" . | fromYaml -}}
    {{- $name := (include "soai-recruitment.name" .) }}
    {{- $static := include "soai-application.static-labels" (list . $name) | fromYaml -}}
    {{- $global := $g.label -}}
    {{- $service := .Values.labels -}}
    {{- include "soai-application.mergeLabels" (dict "location" .Template.Name "sources" (list $selector $static $global $service)) | trim }}
{{- end -}}

{{/*
Merged labels for common genai
*/}}
{{- define "soai-genai.labels" -}}
    {{- $g := fromJson (include "soai-application.global" .) -}}
    {{- $selector := include "soai-genai.selectorLabels" . | fromYaml -}}
    {{- $name := (include "soai-genai.name" .) }}
    {{- $static := include "soai-application.static-labels" (list . $name) | fromYaml -}}
    {{- $global := $g.label -}}
    {{- $service := .Values.labels -}}
    {{- include "soai-application.mergeLabels" (dict "location" .Template.Name "sources" (list $selector $static $global $service)) | trim }}
{{- end -}}

{{/*
Merged labels for common web
*/}}
{{- define "soai-web.labels" -}}
    {{- $g := fromJson (include "soai-application.global" .) -}}
    {{- $selector := include "soai-web.selectorLabels" . | fromYaml -}}
    {{- $name := (include "soai-web.name" .) }}
    {{- $static := include "soai-application.static-labels" (list . $name) | fromYaml -}}
    {{- $global := $g.label -}}
    {{- $service := .Values.labels -}}
    {{- include "soai-application.mergeLabels" (dict "location" .Template.Name "sources" (list $selector $static $global $service)) | trim }}
{{- end -}}

{{/*
Merged labels for common consul
*/}}
{{- define "soai-consul.labels" -}}
    {{- $g := fromJson (include "soai-application.global" .) -}}
    {{- $selector := include "soai-consul.selectorLabels" . | fromYaml -}}
    {{- $name := (include "soai-consul.name" .) }}
    {{- $static := include "soai-application.static-labels" (list . $name) | fromYaml -}}
    {{- $global := $g.label -}}
    {{- $service := .Values.labels -}}
    {{- include "soai-application.mergeLabels" (dict "location" .Template.Name "sources" (list $selector $static $global $service)) | trim }}
{{- end -}}

{{/*
Define fsGroup
*/}}
{{- define "soai-application.fsGroup.coordinated" -}}
    {{- $g := fromJson (include "soai-application.global" .) -}}
    {{- if $g -}}
        {{- if $g.fsGroup -}}
            {{- if $g.fsGroup.manual -}}
                {{ $g.fsGroup.manual }}
            {{- else -}}
                {{- if $g.fsGroup.namespace -}}
                    {{- if eq $g.fsGroup.namespace true -}}
                        # The namespace default value is used
                    {{- else -}}
                        1000
                    {{- end -}}
                {{- else -}}
                    1000
                {{- end -}}
            {{- end -}}
            {{- else -}}
                1000
            {{- end -}}
        {{- else -}}
            1000
    {{- end -}}
{{- end -}}

{{/*
Define podSeccompProfile
*/}}
{{- define "soai-application.podSeccompProfile" -}}
{{- if and .Values.seccompProfile .Values.seccompProfile.type }}
seccompProfile:
  type: {{ .Values.seccompProfile.type }}
  {{- if eq .Values.seccompProfile.type "Localhost" }}
  localhostProfile: {{ .Values.seccompProfile.localhostProfile }}
  {{- end }}
{{- end }}
{{- end }}

{{/*
Configuration of supplementalGroups IDs
*/}}
{{- define "soai-application.supplementalGroups" -}}
    {{- $globalGroups := list -}}
    {{- if .Values.global -}}
        {{- if .Values.global.podSecurityContext -}}
            {{- if .Values.global.podSecurityContext.supplementalGroups -}}
                {{- if kindIs "slice" .Values.global.podSecurityContext.supplementalGroups -}}
                    {{- $globalGroups = .Values.global.podSecurityContext.supplementalGroups -}}
                {{- else -}}
                    {{- printf "global.podSecurityContext.supplementalGroups, \"%s\", is not a list." .Values.global.podSecurityContext.supplementalGroups | fail -}}
                {{- end -}}
            {{- end -}}
        {{- end -}}
    {{- end -}}

    {{- $localGroups := list -}}
    {{- if .Values.podSecurityContext -}}
        {{- if .Values.podSecurityContext.supplementalGroups -}}
            {{- if kindIs "slice" .Values.podSecurityContext.supplementalGroups -}}
                {{- $localGroups = .Values.podSecurityContext.supplementalGroups -}}
            {{- else -}}
                {{- printf "podSecurityContext.supplementalGroups, \"%s\", is not a list." .Values.podSecurityContext.supplementalGroups | fail -}}
            {{- end -}}
        {{- end -}}
    {{- end -}}

    {{- $mergedGroups := list -}}
    {{- range (concat $globalGroups $localGroups | uniq) -}}
        {{- if ne (. | toString) "" -}}
            {{- $mergeGroups = (append $mergedGroups . ) -}}
        {{- end -}}
    {{- end -}}

    {{- if gt (len $mergedGroups) 0 -}}
        {{ print "supplementalGroups:" | nindent 8 }}
        {{- toYaml $mergedGroups | nindent 10 }}
    {{- end -}}
{{- end -}}

{{/*
Define resources
*/}}
{{- define "soai-application.resources" -}}
{{- if .limits }}
  limits:
  {{- if .limits.cpu }}
    cpu: {{ .limits.cpu | quote }}
  {{- end -}}
  {{- if .limits.memory }}
    memory: {{ .limits.memory | quote }}
  {{- end -}}
{{- end -}}
{{- if .requests }}
  requests:
  {{- if .requests.cpu }}
    cpu: {{ .requests.cpu | quote }}
  {{- end -}}
  {{- if .requests.memory }}
    memory: {{ .requests.memory | quote }}
  {{- end -}}
{{- end -}}
{{- end -}}

{{/* Create username for mysql
*/}}
{{- define "soai-mysql.username" -}}
{{- $user := "root" | b64enc -}} 
{{- if .Values.password.dbUser -}}
    {{- $user := .Values.password.dbUser | b64enc -}}
{{- end -}}
{{- print $user -}}
{{- end -}}

{{/* Create password for mysql
*/}}
{{- define "soai-mysql.password" -}}
{{- $pass := "root" | b64enc -}}
{{- if .Values.password.dbPass -}}
    {{- $pass := .Values.password.dbPass | b64enc -}}
{{- end -}}
{{- print $pass -}}
{{- end -}}

{{/*
Create secret for mysql
*/}}
{{- define "soai-mysql.secrets" -}}
{{- $user := (include "soai-mysql.username" .) -}}
{{- $password := (include "soai-mysql.password" .) -}}
data:
  {{ template "soai-mysql.name" . }}-root-password: {{- print "root" | b64enc | indent 2 }}
  {{ template "soai-mysql.name" . }}-password: {{- $password | indent 2 }}
  {{- if not (eq ($user | b64dec) "root") }}
  {{ template "soai-mysql.name" . }}-user: {{- $user | indent 2 }}
  {{- end }}
  {{ template "soai-mysql.name" . }}-host: {{- include "soai-mysql.name" . | b64enc | indent 2 }}
  {{ template "soai-mysql.name" . }}-dbName: {{- print "soai_db" | b64enc | indent 2 }}
{{- end -}}

{{/*
Create secret for authentication
*/}}
{{- define "soai-authentication.secrets" -}}
data:
  {{ template "soai-authentication.name" . }}-keystore-password: {{- print .Values.password.keystorePass | b64enc | indent 2 }}
{{- end -}}

{{/* Define readinessProbe*/}}
{{- define "soai-application.readinessProbe" -}}
{{- $global := index . 0 -}}
{{- $path := index . 1 -}}
{{- $service := index . 2 -}}
{{- $g := fromJson (include "soai-application.global" $global) -}}
{{- with $global.Values.server.probes.readiness }}
readinessProbe:
  httpGet:
    path: {{ $path }}
    {{- if $g.security.tls.enabled }}
    port: {{ index $global.Values.server $service "httpsPort" }}
    scheme: HTTPS
    {{- else }}
    port: {{ index $global.Values.server $service "httpPort" }}
    scheme: HTTP
    {{- end }}
  initialDelaySeconds: {{ .initialDelaySeconds }}
  periodSeconds: {{ .periodSeconds }}
  timeoutSeconds: {{ .timeoutSeconds }}
  successThreshold: {{ .successThreshold }}
  failureThreshold: {{ .failureThreshold }}
{{- end }}
{{- end -}}

{{/* Define livenessProbe*/}}
{{- define "soai-application.livenessProbe" -}}
{{- $global := index . 0 -}}
{{- $path := index . 1 -}}
{{- $service := index . 2 -}}
{{- $g := fromJson (include "soai-application.global" $global) -}}
{{- with $global.Values.server.probes.liveness }}
livenessProbe:
  httpGet:
    path: {{ $path }}
    {{- if $g.security.tls.enabled }}
    port: {{ index $global.Values.server $service "httpsPort" }}
    scheme: HTTPS
    {{- else }}
    port: {{ index $global.Values.server $service "httpPort" }}
    scheme: HTTP
    {{- end }}
  initialDelaySeconds: {{ .initialDelaySeconds }}
  periodSeconds: {{ .periodSeconds }}
  timeoutSeconds: {{ .timeoutSeconds }}
  successThreshold: {{ .successThreshold }}
  failureThreshold: {{ .failureThreshold }}
{{- end }}
{{- end -}}

{{/*
Define soai-application.appArmorProfileAnnotation
*/}}
{{- define "soai-application.appArmorProfileAnnotation" -}}
{{- $kubeVersionMinor := default 30 (int .Capabilities.KubeVersion.Minor) -}}
{{- $kubeVersionMajor := default 1 (int .Capabilities.KubeVersion.Major) -}}
{{- $minKubeVersionMinor := 30 -}}
{{- $minKubeVersionMajor := 1 -}}
{{- if or (lt $kubeVersionMajor $minKubeVersionMajor) (and (eq $kubeVersionMajor $minKubeVersionMajor) (lt $kubeVersionMinor $minKubeVersionMinor)) }}
  {{- $acceptedProfiles := list "Unconfined" "RuntimeDefault" "Localhost" "unconfined" "runtime/default" "localhost" }}
  {{- $commonProfile := dict -}}
  {{- if .Values.appArmorProfile.type -}}
    {{- $_ := set $commonProfile "type" .Values.appArmorProfile.type -}}
    {{- if and (eq .Values.appArmorProfile.type "localhost") .Values.appArmorProfile.localhostProfile -}}
      {{- $_ := set $commonProfile "localhostProfile" .Values.appArmorProfile.localhostProfile -}}
    {{- end -}}
  {{- end -}}
  {{- $profiles := dict -}}
  {{- $profileType := "" -}}
  {{- $containers := list "authentication" "recruitment" "genai" "web" -}}
  {{- range $container := $containers -}}
    {{- $_ := set $profiles $container $commonProfile -}}
    {{- if (hasKey $.Values.appArmorProfile $container) -}}
      {{- if (index $.Values.appArmorProfile $container "type") -}}
        {{- $_ := set $profiles $container (index $.Values.appArmorProfile $container) -}}
      {{- end -}}
    {{- end -}}
  {{- end -}}
  {{- range $key, $value := $profiles -}}
    {{- if $value.type -}}
      {{- if not (has $value.type $acceptedProfiles) -}}
        {{- fail (printf "Unsupported appArmor profile type: %s, use one of the supported profiles %s" $value.type $acceptedProfiles) -}}
      {{- end -}}
      {{- if eq (lower $value.type) "localhost" -}}
        {{- if empty $value.localhostProfile -}}
          {{- fail "The 'localhost' appArmor profile requires a profile name to be provided in localhostProfile parameter." -}}
        {{- end }}
        {{- $profileType = "localhost" -}}
      {{- else if eq $value.type "RuntimeDefault" -}}
        {{- $profileType = "runtime/default" -}}
      {{- else if eq $value.type "Unconfined" -}}
        {{- $profileType = "unconfined" -}}
      {{- else -}}
        {{- $profileType = $value.type -}}
      {{- end }}
container.apparmor.security.beta.kubernetes.io/{{ $key }}: {{ $profileType }}{{ eq $profileType "localhost" | ternary (printf "/%s" $value.localhostProfile) "" }}
    {{- end -}}
  {{- end -}}
{{- end -}}
{{- end -}}

{{/*
Common function to render soai-application.appArmorProfile.securityContext (Kubernetes version >= 1.30.0)
*/}}
{{- define "soai-application.renderAppArmorProfile.securityContext" -}}
{{- $profile := index . 0 -}}
{{- $acceptedProfiles := list "Unconfined" "RuntimeDefault" "Localhost" "unconfined" "runtime/default" "localhost" }}
{{- $profileType := "" -}}
{{- if $profile.type -}}
  {{- if not (has $profile.type $acceptedProfiles) -}}
    {{- fail (printf "Unsupported appArmor profile type: %s, use one of the supported profiles %s" $profile.type $acceptedProfiles) -}}
  {{- end -}}
  {{- if eq (lower $profile.type) "localhost" -}}
    {{- if empty $profile.localhostProfile -}}
      {{- fail "The 'localhost' appArmor profile requires a profile name to be provided in localhostProfile parameter." -}}
    {{- end }}
    {{- $profileType = "Localhost" -}}
  {{- else if eq $profile.type "runtime/default" -}}
    {{- $profileType = "RuntimeDefault" -}}
  {{- else if eq $profile.type "unconfined" -}}
    {{- $profileType = "Unconfined" -}}
  {{- else -}}
    {{- $profileType = $profile.type -}}
  {{- end }}
appArmorProfile:
  type: {{ $profileType }}
  {{- eq (lower $profileType) "localhost" | ternary (printf "\nlocalhostProfile: %s" $profile.localhostProfile) "" | indent 2 }}
{{- end -}}
{{- end -}}
 
{{/*
Define soai-application.appArmorProfile.securityContext (Kubernetes version >= 1.30.0)
*/}}
{{- define "soai-application.appArmorProfile.securityContext" -}}
{{- $root := index . 0 -}}
{{- $profile := dict -}}
{{- $kubeVersionMinor := default 30 (int $root.Capabilities.KubeVersion.Minor) -}}
{{- $kubeVersionMajor := default 1 (int $root.Capabilities.KubeVersion.Major) -}}
{{- $minKubeVersionMinor := 30 -}}
{{- $minKubeVersionMajor := 1 -}}
{{- if or (gt $kubeVersionMajor $minKubeVersionMajor) (and (eq $kubeVersionMajor $minKubeVersionMajor) (ge $kubeVersionMinor $minKubeVersionMinor)) }}
  {{- if eq (len .) 1 -}}
    {{- $profile = $root.Values.appArmorProfile -}}
  {{- else if eq (len .) 2 -}}
    {{- $container := index . 1 -}}
    {{- if empty $container -}}
      {{- fail "The container name must not be empty" -}}
    {{- end -}}
    {{- $profile = index $root.Values.appArmorProfile $container -}}
  {{- else }}
    {{- fail "Invalid number of arguments passed to soai-application.appArmorProfile.securityContext" -}}
  {{- end -}}
  {{- include "soai-application.renderAppArmorProfile.securityContext" (list $profile) -}}
{{- end -}}
{{- end -}}

{{/*
Define FQDN for Cert-Manager certificates
*/}}
{{- define "soai-application.FQDN" -}}
{{- $root := index . 0 -}}
{{- $services := list (include "soai-genai.name" $root) (include "soai-web.name" $root) (include "soai-recruitment.name" $root) (include "soai-authentication.name" $root) -}}
{{- $namespace := (include "soai-application.namespace" $root) -}}
{{- range $service := $services }}
  - {{ $service }}
  - {{ $service }}.{{ $namespace }}
  - {{ $service }}.{{ $namespace }}.svc
  - {{ $service }}.{{ $namespace }}.svc.cluster.local
{{- end -}}
{{- end -}}