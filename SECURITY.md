# Guía de Seguridad para Producción - fut.invest

## Secrets Management

### Variables de Entorno (Mínimo Requerido)

| Variable | Descripción | Generación |
|----------|-------------|------------|
| `JWT_SECRET` | Clave para firmar tokens JWT | `openssl rand -base64 48` |
| `TOTP_SECRET` | Secreto compartido para 2FA | `openssl rand -hex 20` |
| `DB_PATH` | Ruta a la base de datos SQLite | `./data/fut_invest.db` |
| `FRONTEND_URL` | URL del frontend para CORS | `https://app.futinvest.io` |
| `NODE_ENV` | `production` para modo seguro | `production` |

### Producción Recomendado

Usar un vault externo para secrets en lugar de `.env`:

```bash
# HashiCorp Vault
vault kv put futinvest/production \
    JWT_SECRET=$(openssl rand -base64 48) \
    TOTP_SECRET=$(openssl rand -hex 20) \
    SENTRY_DSN=https://xxx@sentry.io/xxx \
    COINBASE_API_KEY=xxx \
    COINBASE_WEBHOOK_SECRET=xxx
```

### Secrets por Proveedor de Cloud

- **AWS**: AWS Secrets Manager + IAM roles
- **GCP**: Secret Manager + Workload Identity
- **Azure**: Key Vault + Managed Identity
- **Docker**: Secrets montados en `/run/secrets/`

### Rotación de Secrets

- `JWT_SECRET`: rotar cada 90 días (requiere re-login de todos los usuarios)
- `TOTP_SECRET`: solo rotar si hay compromiso (invalida 2FA de todos)
- API Keys de proveedores: rotar inmediatamente si hay sospecha de fuga

## Hardening de Producción

### Anti-Fuerza Bruta

- Rate limit por IP + userId: 20 req/15min en auth, 60 req/min en API general
- Captcha (reCAPTCHA v3) en login y register (descomentar en frontend)
- Bloqueo temporal tras 5 intentos fallidos en login (15 min)

### Headers de Seguridad (ya configurados vía Helmet)

- CSP estricto (connect-src solo FRONTEND_URL en prod)
- HSTS (Strict-Transport-Security: max-age=31536000)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY

### Monitoreo y Alertas

- Sentry: error tracking (configurar SENTRY_DSN)
- Uptime monitoring: Better Uptime / Checkly cada 1min
- Logs centralizados: Winston → transports personalizados (papertrail/logtail)

## Checklist Pre-Lanzamiento

- [ ] JWT_SECRET generado con `openssl rand -base64 48`
- [ ] TOTP_SECRET generado con `openssl rand -hex 20`
- [ ] NODE_ENV=production
- [ ] FRONTEND_URL apunta a dominio real
- [ ] SENTRY_DSN configurado
- [ ] PAYMENT_PROVIDER configurado con API keys reales
- [ ] Certificados SSL/TLS válidos (Let's Encrypt)
- [ ] DB_PATH apunta a volumen persistente
- [ ] Backups configurados (./scripts/backup.ps1)
- [ ] Rate limits ajustados a capacidad del servidor
- [ ] Usuario admin creado (no usar demo en prod)
- [ ] Logs en rotación (Winston file rotation)
- [ ] Pruebas de carga pasadas con k6
