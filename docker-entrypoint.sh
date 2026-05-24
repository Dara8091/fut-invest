#!/bin/sh
# fut.invest - Entrypoint: migra DB en runtime, luego ejecuta app
set -e
node src/db/migrate.js
exec "$@"
