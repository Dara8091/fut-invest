# ============================================
# fut.invest - Dockerfile (Backend)
# ============================================
FROM node:22-alpine AS builder

WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production

FROM node:22-alpine
RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY backend/ .

RUN mkdir -p /app/data /app/logs /app/certs

EXPOSE 3001
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "src/index.js"]
