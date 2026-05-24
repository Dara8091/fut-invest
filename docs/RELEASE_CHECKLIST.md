# Release Checklist

## Pre-deploy

- [ ] CI pipeline verde (6/6 jobs)
  - `backend`, `frontend`, `lint`, `security`, `e2e`, `docker`
- [ ] Lint sin warnings
- [ ] Tag `v1.0.0-rc.1` apunta al commit correcto
- [ ] GitHub secrets configurados (ver `docs/SECRETS.md`)
- [ ] `.env.production` creado en el VPS con secrets reales
- [ ] Puerto 443 abierto en el firewall del VPS
- [ ] Docker instalado en el VPS

## Deploy a Staging

```bash
# Desde GitHub Actions: workflow_dispatch con environment=staging
# O pushear a master/main
```

### Smoke tests (automáticos en CI)

- [ ] Health endpoint: `GET /api/health` -> `{"status":"ok"}`
- [ ] Login flow: `POST /api/auth/login` -> accessToken
- [ ] Dashboard autenticado: `GET /api/dashboard` -> balance
- [ ] Swagger docs: `GET /api/docs` -> HTML
- [ ] Prometheus metrics: `GET /api/metrics/prometheus` -> http_requests_total
- [ ] Frontend carga: `GET /` -> contiene "fut.invest"

## Deploy a Producción

- [ ] Smoke tests pasaron en staging
- [ ] Ejecutar `workflow_dispatch` con `environment=production`
- [ ] Verificar rollout en K8s: `kubectl rollout status deployment/futinvest-api -n futinvest`
- [ ] Verificar Sentry release creada

## Post-deploy

- [ ] Monitorear logs: `docker-compose logs -f --tail=100 api`
- [ ] Verificar WebSocket connection (ROI en tiempo real)
- [ ] Probar registro de usuario nuevo
- [ ] Probar depósito (mock)
- [ ] Probar retiro
- [ ] Monitorear métricas en Prometheus/Grafana
- [ ] Activar monitoreo de uptime (UptimeRobot, Pingdom, etc.)

## Rollback

```bash
# Staging: redeploy con commit anterior
git revert HEAD --no-edit
git push

# Producción (K8s):
kubectl rollout undo deployment/futinvest-api -n futinvest
```

## Post-lanzamiento (futuro)

- [ ] Migrar de SQLite a PostgreSQL
- [ ] Configurar SendGrid/SMTP real
- [ ] Configurar Coinbase Commerce o Stripe real
- [ ] Agregar monitoreo APM (Sentry Performance)
- [ ] Configurar backups automáticos de la base de datos
- [ ] Renovar certificados SSL (certbot renew)
