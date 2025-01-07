#!/bin/bash
CURRENT_DIR=${PWD}
mkdir -p ${CURRENT_DIR}/etc/ssl/private
mkdir -p ${CURRENT_DIR}/etc/ssl/certs

openssl genrsa -des3 -out rootSO_CA.key 2048
openssl req -x509 -new -nodes -key rootSO_CA.key -sha256 -days 1825 -out rootSO_CA.pem

openssl genrsa -out ${CURRENT_DIR}/etc/ssl/private/nginx-selfsigned.key 2048
openssl req -new -key ${CURRENT_DIR}/etc/ssl/private/nginx-selfsigned.key -out ${CURRENT_DIR}/etc/ssl/certs/nginx-selfsigned.csr

openssl x509 -req -in ${CURRENT_DIR}/etc/ssl/certs/nginx-selfsigned.csr -CA rootSO_CA.pem -CAkey rootSO_CA.key -CAcreateserial \
-out ${CURRENT_DIR}/etc/ssl/certs/nginx-selfsigned.crt -days 1825 -sha256 -extfile smartoptics.ext


#openssl req -x509 -nodes -days 1825 -newkey rsa:2048 -keyout ${CURRENT_DIR}/etc/ssl/private/nginx-selfsigned.key -out ${CURRENT_DIR}/etc/ssl/certs/nginx-selfsigned.crt
openssl dhparam -out ${CURRENT_DIR}/etc/ssl/certs/nginx-dhparam.pem 2048