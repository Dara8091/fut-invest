# Changelog

## [1.0.0] - 2026-05-24

### Added
- Backend API completa: auth (register/login/refresh/verify-email/forgot-password/reset-password), dashboard, wallet, payments (deposit/withdraw/quote/webhook), admin (users/fees/stats/withdrawals/audit-logs), settings, referrals, onboarding, metrics
- Frontend SPA vanilla: dashboard, wallet, security, network binario, Flutter Code Hub, settings, admin panel
- API versioning (`/api/v1/`) con backward compat (`/api/`)
- Rate limiting con Redis adapter (auth, api, user, deposit, withdraw, webhook, reset-password, forgot-password)
- WAF: SQLi/XSS/path traversal + VPN/Proxy/Tor detection + geo-blocking + IP blacklist
- Cifrado AES-256 GCM real (Web Crypto API)
- TOTP real HMAC-SHA1 (RFC 6238)
- JWT con refresh token rotation (accessToken 15m + refreshToken 7d)
- Email verification obligatoria + forgot/reset password con tokens
- 3 payment providers: Mock, Coinbase Commerce, Stripe (Strategy pattern)
- PostgreSQL adapter con connection pooling
- Redis cache layer + in-memory fallback
- Vault integration para secrets management (HashiCorp Vault)
- Captcha (reCAPTCHA v2) en register/login
- In-app notifications via Socket.IO (depósitos, retiros, KYC)
- KYC upload UI + backend endpoint con validación
- Multi-currency support (USDT, BTC, ETH, USD)
- CD pipeline: GitHub Actions build → staging → production
- Smoke tests en deploy: health, login, dashboard, docs, metrics
- k6 load test con stages 5→25→50→100→100 usuarios
- Frontend tests (Jest + jsdom): i18n, auth, notifications, KYC
- Diseño futurista: dark mode, glassmorphism, neon cyan/magenta
- PWA: manifest.json, service-worker.js
- i18n es/en
- GDPR consent banner + cookie policy detallada
- Términos y Condiciones + Política de Privacidad
- Página 404 personalizada con diseño futurista
- Sitemap.xml + robots.txt
- OpenGraph tags + Twitter Cards
- Sentry error tracking (backend + frontend)
- Prometheus metrics (7 custom + histograma)
- Grafana dashboard auto-provisioned
- Alertas (error rate, latency, balance, CPU)
- Docker: multi-stage, docker-compose (dev/staging/monitoring)
- Kubernetes: deployment, service, ingress, HPA, configmap
- Terraform CloudFlare: WAF, DNS, rate limiting, SSL/TLS
- Migraciones versionadas con tabla `_migrations` y checksum SHA-256
- Backup automático con verificación de integridad + restore script
- Onboarding de 5 pasos con progreso persistente
- Referral system (código único, 5% bonus primer depósito)
- Web Push VAPID notifications
- Accessibility: skip-link, ARIA labels, focus-visible, prefers-reduced-motion
- Database encryption at rest docs (SQLCipher)
- Audit log export (CSV/JSON) para cumplimiento
- CDN configuration + asset fingerprinting
- Lazy loading SPA modules via Intersection Observer

### Changed
- rateLimit.js: refactor completo con Redis/memory dual store
- authController.js: referral_code generado automáticamente en register
- dashboardController.js: multi-currency balances desde transacciones
- index.js: WebSocket rate limit, migraciones automáticas, 404 SPA fallback
- schema.sql: +10 nuevos índices
- migrate.js: delegado a sistema de migraciones versionadas
- backup.ps1: verificación post-backup con integrity_check

### Fixed
- Rate limiters ordering en index.js (deposit/webhook ahora aplican correctamente)
- migrate.js sintaxis (stray brace)
- CSP para Sentry CDN
