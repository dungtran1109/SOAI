#!/bin/bash

# Variables
TOP_DIR=$(git rev-parse --show-toplevel)
TEST_DIR=$TOP_DIR/test
OUTPUT_DIR="$TEST_DIR/ssl"
CA_KEY="${OUTPUT_DIR}/ca.key"
CA_CERT="${OUTPUT_DIR}/ca.crt"
SERVER_KEY="${OUTPUT_DIR}/nginx-selfsigned.key"
SERVER_CSR="${OUTPUT_DIR}/nginx-selfsigned.csr"
SERVER_CERT="${OUTPUT_DIR}/nginx-selfsigned.crt"
CONFIG_FILE="${OUTPUT_DIR}/nginx-selfsigned.csr.cnf"
EXT_FILE="${OUTPUT_DIR}/v3.ext"
DHPARAM_FILE="${OUTPUT_DIR}/nginx-dhparam.pem"
DAYS_VALID=3650

DNS_NAMES=()
IP_ADDRESSES=()

# Parse command-line arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --dns)
            shift
            while [[ "$1" != "" && "$1" != "--ip" ]]; do
                DNS_NAMES+=("$1")
                shift
            done
            ;;
        --ip)
            shift
            while [[ "$1" != "" && "$1" != "--dns" ]]; do
                IP_ADDRESSES+=("$1")
                shift
            done
            ;;
        *)
            echo "Unknown parameter passed: $1"
            exit 1
            ;;
    esac
done

# Check if either DNS or IP is provided
if [ ${#DNS_NAMES[@]} -eq 0 ] && [ ${#IP_ADDRESSES[@]} -eq 0 ]; then
    echo "Usage: $0 --dns <DNS_NAMES>... --ip <IP_ADDRESSES>..."
    exit 1
fi

echo "Generate CA Certificates..."
$TEST_DIR/generate_ca.sh

# Step 2: Create a Configuration File for the CSR
echo "Creating configuration file for the CSR..."
cat <<EOT > $CONFIG_FILE
[ req ]
default_bits       = 2048
prompt             = no
default_md         = sha256
req_extensions     = req_ext
distinguished_name = dn

[ dn ]
C  = VN
ST = VietNam
L  = Ho Chi Minh
O  = SOAI
CN = ${DNS_NAMES[0]:-${IP_ADDRESSES[0]}}

[ req_ext ]
subjectAltName = @alt_names

[ alt_names ]
EOT

# Add IP addresses to the configuration file
if [ ${#IP_ADDRESSES[@]} -gt 0 ]; then
    for i in "${!IP_ADDRESSES[@]}"; do
        echo "IP.$((i+1)) = ${IP_ADDRESSES[$i]}" >> $CONFIG_FILE
    done
fi

# Add DNS names to the configuration file
if [ ${#DNS_NAMES[@]} -gt 0 ]; then
    for i in "${!DNS_NAMES[@]}"; do
        echo "DNS.$((i+1)) = ${DNS_NAMES[$i]}" >> $CONFIG_FILE
    done
fi

# Step 3: Generate the Server Key and CSR
echo "Generating server key and CSR..."
openssl genrsa -out $SERVER_KEY 2048
openssl req -new -key $SERVER_KEY -out $SERVER_CSR -config $CONFIG_FILE

# Step 4: Create a Configuration File for the Certificate Extensions
echo "Creating configuration file for the certificate extensions..."
cat <<EOT > $EXT_FILE
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[ alt_names ]
EOT

# Add IP addresses to the extensions file
if [ ${#IP_ADDRESSES[@]} -gt 0 ]; then
    for i in "${!IP_ADDRESSES[@]}"; do
        echo "IP.$((i+1)) = ${IP_ADDRESSES[$i]}" >> $EXT_FILE
    done
fi

# Add DNS names to the extensions file
if [ ${#DNS_NAMES[@]} -gt 0 ]; then
    for i in "${!DNS_NAMES[@]}"; do
        echo "DNS.$((i+1)) = ${DNS_NAMES[$i]}" >> $EXT_FILE
    done
fi

# Step 5: Sign the Server Certificate with the CA
echo "Signing the server certificate with the CA..."
openssl x509 -req -in $SERVER_CSR -CA $CA_CERT -CAkey $CA_KEY -CAcreateserial -out $SERVER_CERT -days $DAYS_VALID -sha256 -extfile $EXT_FILE

echo "Create dhparam pem certificate..."
openssl dhparam -out $DHPARAM_FILE 2048

# Step 6: Verify the Certificate
echo "Verifying the certificate..."
openssl x509 -in $SERVER_CERT -text -noout

# Verify all generated files
if [ -f "$CA_CERT" ] && [ -f "$SERVER_CERT" ] && [ -f "$SERVER_KEY" ] && [ -f "$DHPARAM_FILE" ]; then
  echo "Certificates generated successfully in the '$OUTPUT_DIR' directory:"
  echo "CA Certificate: $CA_CERT"
  echo "Server Certificate: $SERVER_CERT"
  echo "Server Key: $SERVER_KEY"
  echo "DHPARAM Key: $DHPARAM_FILE"
else
  echo "Error: Failed to generate one or more certificates."
fi