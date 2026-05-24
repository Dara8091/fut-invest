# GitHub Secrets - Configuración

Ir a **Settings > Secrets and variables > Actions** y crear los siguientes secrets:

## Repositorio (Repository secrets)

| Secret | Descripción | ¿Obligatorio? |
|--------|-------------|:---:|
| `SNYK_TOKEN` | Token de Snyk para escaneo de seguridad | Opcional (fallo graceful) |
| `SENTRY_ORG` | Organización de Sentry (slug) | Opcional hasta tener Sentry |
| `SENTRY_AUTH_TOKEN` | Token de auth de Sentry | Opcional hasta tener Sentry |

## Staging (Environment: `staging`)

| Secret | Descripción |
|--------|-------------|
| `STAGING_HOST` | IP o dominio del VPS de staging |
| `STAGING_USER` | Usuario SSH (ej. `deploy`) |
| `STAGING_SSH_KEY` | Clave privada SSH (formato PEM) |

## Production (Environment: `production`)

| Secret | Descripción |
|--------|-------------|
| `PROD_HOST` | IP o dominio del servidor de producción |
| `PROD_USER` | Usuario SSH (ej. `deploy`) |
| `PROD_SSH_KEY` | Clave privada SSH (formato PEM) |

## Variables de entorno requeridas en el VPS/producción

En el servidor, crear `/opt/futinvest/.env`:

```bash
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://tudominio.com
JWT_SECRET=<generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
TOTP_SECRET=<generar con: node -e "console.log(require('crypto').randomBytes(16).toString('hex'))">
CSRF_ENABLED=true
DB_PATH=./data/fut_invest.db
```

## Verificación

```bash
# Listar secrets configurados (solo nombres, no valores)
gh secret list

# Listar secrets por environment
gh secret list --environment staging
gh secret list --environment production
```

## Notas

- `GITHUB_TOKEN` es automático, no necesita configuración
- Los secrets de Sentry y Snyk son opcionales; el sistema funciona sin ellos
- JWT_SECRET y TOTP_SECRET deben ser los mismos en GitHub Actions y en el VPS
- Para que el VPS pueda descargar la imagen de `ghcr.io`, necesitarás hacer `docker login` con un token de GitHub que tenga permisos `read:packages`. Crea un token en https://github.com/settings/tokens y ejecuta en el VPS:
  ```bash
  echo $GHCR_PAT | docker login ghcr.io -u Dara8091 --password-stdin
  ```
