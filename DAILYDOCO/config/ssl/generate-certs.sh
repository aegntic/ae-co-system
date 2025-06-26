#!/bin/bash

# Script to generate self-signed SSL certificates for development
# For production, use Let's Encrypt or proper certificates

set -e

echo "🔐 Generating self-signed SSL certificates for DailyDoco Pro..."

# Generate private key
openssl genrsa -out key.pem 2048

# Generate certificate signing request
openssl req -new -key key.pem -out csr.pem -subj "/C=US/ST=State/L=City/O=DailyDoco Pro/CN=localhost"

# Generate self-signed certificate (valid for 365 days)
openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out cert.pem

# Clean up CSR
rm csr.pem

# Set proper permissions
chmod 600 key.pem
chmod 644 cert.pem

echo "✅ SSL certificates generated successfully!"
echo "   - Certificate: cert.pem"
echo "   - Private Key: key.pem"
echo ""
echo "⚠️  These are self-signed certificates for development only."
echo "   For production, use Let's Encrypt or proper CA-signed certificates."