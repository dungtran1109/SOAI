{{/*
Expand the name of the chart.
*/}}
{{- define "prometheus.name" -}}
{{- default .Chart.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "prometheus.chart" -}}
{{- printf "%s-%s" (include "prometheus.name" .) .Chart.Version | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "prometheus.selectorLabels" -}}
app.kubernetes.io/name: {{ include "prometheus.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "prometheus.labels" -}}
helm.sh/chart: {{ include "prometheus.chart" . }}
{{ include "prometheus.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Service names for cross references
*/}}
{{- define "prometheus.prometheusServiceName" -}}
{{ include "prometheus.name" . }}
{{- end }}

{{- define "prometheus.alertmanagerServiceName" -}}
alertmanager
{{- end }}

{{- define "prometheus.nodeExporterServiceName" -}}
node-exporter
{{- end }}

{{- define "prometheus.grafanaServiceName" -}}
grafana
{{- end }}
