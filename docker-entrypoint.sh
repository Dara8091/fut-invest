#!/bin/sh
set -e

if [ ! -f /app/certs/key.pem ] && [ "${NODE_ENV}" != "production" ]; then
    openssl req -x509 -newkey rsa:2048 \
        -keyout /app/certs/key.pem \
        -out /app/certs/cert.pem \
        -days 365 -nodes \
        -subj "/CN=localhost" \
        -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" 2>/dev/null
fi

node src/db/migrate.js
exec "$@"
