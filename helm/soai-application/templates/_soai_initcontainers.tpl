{{- define "soai-initContainers" -}}
{{- $top := index . 0 }}
{{- $pod := index . 1 -}}
{{- $g := fromJson (include "soai-application.global" $top ) -}}
{{- if eq $pod "mysql" }}
- name: soai-mysql-initcontainer
  image: {{ template "soai-application.imagePath" (merge (dict "imageName" "soai-mysql") $top) }}
  imagePullPolicy: {{ template "soai-application.imagePullPolicy" $top }}
  securityContext:
    allowPrivilegeEscalation: false
    privileged: false
    readOnlyRootFilesystem: true
    runAsNonRoot: true
    runAsUser: 1001
    capabilities:
      drop:
        - ALL
    {{- with (index $top.Values "seccompProfile" "initcontainer") }}
    seccompProfile:
    {{- toYaml . | nindent 6 }}
    {{- end }}
  command:
  - /bin/bash
  - -c
  - |
    set -ex
    [[ $HOSTNAME =~ ([0-9]+)$ ]] || exit 1
    ordinal=${BASH_REMATCH[1]}
    echo [mysqld] > /mnt/conf.d/server-id.cnf
    # Add an offset to avoid reserved server-id=0 value.
    echo server-id=$((100 + $ordinal)) >> /mnt/conf.d/server-id.cnf
    # Copy appropriate conf.d files from config-map to emptyDir.
    if [[ $ordinal -eq 0 ]]; then
    cp /mnt/config-map/primary.cnf /mnt/conf.d/
    else
    cp /mnt/config-map/replica.cnf /mnt/conf.d/
    fi
  resources:
{{- include "soai-application.resources" (index $top.Values "resources" "initcontainer") | indent 2 }}
  volumeMounts:
  - name: conf
    mountPath: /mnt/conf.d
  - name: config-map
    mountPath: /mnt/config-map
{{- else if eq $pod "authentication" }}
{{- if $g.security.tls.enabled }}
- name: init-keystore
  image: alpine:3.13
  imagePullPolicy: {{ template "soai-application.imagePullPolicy" $top }}
  securityContext:
    allowPrivilegeEscalation: false
    privileged: false
    readOnlyRootFilesystem: false
    runAsNonRoot: false
    capabilities:
      drop:
        - ALL
    {{- with (index $top.Values "seccompProfile" "initcontainer") }}
    seccompProfile:
    {{- toYaml . | nindent 6 }}
    {{- end }}
  command: ["/bin/sh", "-c"]
  args:
  - |
    apk add --no-cache openssl;
    rm -rf {{ $top.Values.server.secretsPath.keyStorePath }}/keystore.p12;
    openssl pkcs12 -export \
      -in {{ $top.Values.server.secretsPath.certPath }}/tls.crt \
      -inkey {{ $top.Values.server.secretsPath.certPath }}/tls.key \
      -out {{ $top.Values.server.secretsPath.keyStorePath }}/keystore.p12 \
      -CAfile {{ $top.Values.server.secretsPath.certPath }}/ca.crt \
      -name ssl-cert \
      -passout pass:$KEYSTORE_PASSWORD
    if [ -f {{ $top.Values.server.secretsPath.keyStorePath }}/keystore.p12 ]; then
      echo "keystore.p12 is a file"
    else
      echo "keystore.p12 is a directory"
    fi
    echo "Check if keystore.p12 exists directly:"
    if [ -f "{{ $top.Values.server.secretsPath.keyStorePath }}/keystore.p12" ]; then
      echo "keystore.p12 exists!";
    else
      echo "keystore.p12 did not exist!";
    fi
    echo "Waiting for keystore.p12 to be found...";
    while ! stat "{{ $top.Values.server.secretsPath.keyStorePath }}/keystore.p12" > /dev/null 2>&1; do
      echo "keystore.p12 not found, waiting...";
      sleep 5;
    done;
    echo "keystore.p12 found! Listing its permissions:";
    while true; do
      openssl pkcs12 -info -in "{{ $top.Values.server.secretsPath.keyStorePath }}/keystore.p12" -nokeys -passin pass:$KEYSTORE_PASSWORD;
      if [ $? -eq 0 ]; then
        echo "Keystore verification successful!";
        break;
      else
        echo "Keystore verification failed! Retrying in 5 seconds...";
        sleep 5;
      fi
    done;

    echo "Give permission tp to keystore.p12";
    chmod 644 {{ $top.Values.server.secretsPath.keyStorePath }}/keystore.p12;
  env:
  - name: KEYSTORE_PASSWORD
    valueFrom:
      secretKeyRef:
        name: {{ template "soai-authentication.name" $top }}-secret
        key: {{ template "soai-authentication.name" $top }}-keystore-password
  volumeMounts:
  - name: keystore-cert
    mountPath: {{ $top.Values.server.secretsPath.keyStorePath }}
  - name: tls-secret
    mountPath: {{ $top.Values.server.secretsPath.certPath }}
{{- end }}
{{- else if eq $pod "recruitment" }}
- name: wait-for-mysql
  image: {{ template "soai-application.imagePath" (merge (dict "imageName" "soai-mysql") $top) }}
  imagePullPolicy: {{ template "soai-application.imagePullPolicy" $top }}
  securityContext:
    allowPrivilegeEscalation: false
    privileged: false
    readOnlyRootFilesystem: true
    runAsNonRoot: false
    capabilities:
      drop:
        - ALL
    {{- with (index $top.Values "seccompProfile" "initcontainer") }}
    seccompProfile:
    {{- toYaml . | nindent 6 }}
    {{- end }}
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
  command:
    - sh
    - -c
    - |
      echo "Starting initContainer to wait for MySQL";
      until mysql -h $DB_HOST -u $DB_USERNAME -p$DB_PASSWORD -e "SELECT 1"; do
        echo "Waiting for MySQL to be ready...";
        sleep 5;
      done;
      echo "MySQL is up and running";
      echo "Init container finished successfully";
{{- end }}
{{- end -}}