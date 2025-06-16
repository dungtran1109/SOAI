#!/bin/bash

# Variables
TOP_DIR=$(git rev-parse --show-toplevel)
OUTPUT_DIR="$TOP_DIR/test/ssl"
CA_KEY="${OUTPUT_DIR}/ca.key"
CA_CERT="${OUTPUT_DIR}/ca.crt"
DAYS_VALID=3650

# Create the output directory if it doesn't exist
mkdir -p $OUTPUT_DIR

# Step 1: Generate the CA Key and Certificate
echo "Generating CA key and certificate..."
openssl genrsa -out $CA_KEY 2048
openssl req -x509 -new -nodes \
    -key $CA_KEY -sha256 \
    -days $DAYS_VALID \
    -out $CA_CERT \
    -subj "/C=VN/ST=VN/L=HoChiMinh/O=Soai/CN=Soai"