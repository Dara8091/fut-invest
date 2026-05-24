#!/bin/bash
# fut.invest - Security audit script
# Usage: bash scripts/audit.sh

set -e

echo "=== npm audit ==="
cd "$(dirname "$0")/.."
npm audit --audit-level=high || true

echo ""
echo "=== Outdated packages ==="
npm outdated || true

echo ""
echo "=== Lint ==="
if [ -f node_modules/.bin/eslint ]; then
    npx eslint src/ --ext .js || true
else
    echo "ESLint not found, skipping"
fi

echo ""
echo "=== Secrets scan ==="
if command -v trufflehog &> /dev/null; then
    trufflehog filesystem --directory=. --no-update || true
else
    echo "trufflehog not found (install: pip install trufflehog)"
fi

echo ""
echo "=== Dependency licenses ==="
if command -v license-checker &> /dev/null; then
    npx license-checker --summary || true
else
    echo "license-checker not found (install: npm install -g license-checker)"
fi

echo ""
echo "=== Audit complete ==="
