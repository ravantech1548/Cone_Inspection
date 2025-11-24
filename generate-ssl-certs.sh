#!/bin/bash

# Generate Self-Signed SSL Certificates
# For development and testing purposes

set -e

echo "==================================="
echo "Generating SSL Certificates"
echo "==================================="
echo ""

# Create certs directory
mkdir -p certs

# Generate private key and certificate for backend
echo "Generating backend certificate..."
openssl req -x509 -newkey rsa:4096 -keyout certs/backend-key.pem -out certs/backend-cert.pem -days 365 -nodes \
  -subj "/C=US/ST=State/L=City/O=Organization/OU=Department/CN=localhost"

echo "✓ Backend certificate generated"
echo ""

# Generate private key and certificate for inference service
echo "Generating inference service certificate..."
openssl req -x509 -newkey rsa:4096 -keyout certs/inference-key.pem -out certs/inference-cert.pem -days 365 -nodes \
  -subj "/C=US/ST=State/L=City/O=Organization/OU=Department/CN=localhost"

echo "✓ Inference service certificate generated"
echo ""

# Set permissions
chmod 600 certs/*.pem

echo "==================================="
echo "Certificates Generated Successfully"
echo "==================================="
echo ""
echo "Files created:"
echo "  - certs/backend-key.pem"
echo "  - certs/backend-cert.pem"
echo "  - certs/inference-key.pem"
echo "  - certs/inference-cert.pem"
echo ""
echo "⚠️  These are self-signed certificates for development only!"
echo "   Browsers will show security warnings."
echo ""
echo "To trust the certificates:"
echo "  - Chrome: Click 'Advanced' → 'Proceed to localhost'"
echo "  - Firefox: Click 'Advanced' → 'Accept the Risk'"
echo ""
