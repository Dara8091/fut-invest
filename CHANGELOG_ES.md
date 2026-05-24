# Registro de Cambios

## [1.0.0] - 24 de mayo de 2026

### Añadido
- Backend API completo con Express + SQLite + JWT + bcrypt
- Frontend SPA con panel de inversión, billetera, seguridad, red binaria
- Versioneado de API (`/api/v1/`) con compatibilidad hacia atrás
- Rate limiting con adaptador Redis (8 limitadores distintos)
- WAF con detección de SQLi/XSS/path traversal + VPN/Proxy/Tor
- Cifrado AES-256 GCM y TOTP HMAC-SHA1 reales
- JWT con refresh token rotation
- 3 proveedores de pago: Mock, Coinbase Commerce, Stripe
- Adaptador PostgreSQL con connection pooling
- Caché Redis + fallback en memoria
- Integración HashiCorp Vault para secrets
- reCAPTCHA en registro/inicio de sesión
- Notificaciones en-app vía Socket.IO
- Subida de documentos KYC con vista previa
- Soporte multi-moneda (USDT, BTC, ETH, USD)
- Pipeline CD completo (build → staging → producción)
- Tests de humo en deploy (health, login, dashboard, docs, metrics)
- Prueba de carga k6 con 100 usuarios concurrentes
- Tests de frontend (Jest + jsdom)
- Diseño futurista con modo oscuro y glassmorphism
- PWA, i18n es/en, banner GDPR
- Página 404 personalizada
- Sitemap.xml + robots.txt + OpenGraph
- Sentry frontend + backend
- Métricas Prometheus + dashboard Grafana
- Docker + Kubernetes + Terraform CloudFlare
- Migraciones versionadas con verificación checksum
- Backup automático con verificación de integridad
- Onboarding de 5 pasos
- Sistema de referidos (5% bonus)
- Accesibilidad: skip-link, ARIA, focus-visible
- Guía de cifrado de base de datos
- Exportación de logs de auditoría (CSV)
- Configuración CDN + lazy loading
