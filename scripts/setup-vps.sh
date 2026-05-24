#!/bin/bash
set -euo pipefail

# ============================================
# fut.invest - VPS Setup Script (Ubuntu 22.04+)
# Ejecutar como root en un VPS nuevo
# ============================================

DOMAIN="${1:-staging.futinvest.io}"
DEPLOY_USER="deploy"
APP_DIR="/opt/futinvest"

echo "=== fut.invest VPS Setup ==="
echo "Domain: $DOMAIN"
echo "User:   $DEPLOY_USER"
echo "App dir: $APP_DIR"

# 1. Actualizar sistema
apt-get update && apt-get upgrade -y

# 2. Instalar Docker
if ! command -v docker &>/dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable --now docker
fi

# 3. Instalar docker-compose plugin
apt-get install -y docker-compose-plugin

# 4. Crear usuario deploy
if ! id "$DEPLOY_USER" &>/dev/null; then
    useradd -m -s /bin/bash "$DEPLOY_USER"
    usermod -aG docker "$DEPLOY_USER"
    mkdir -p /home/$DEPLOY_USER/.ssh
    echo "# Agrega tu clave pública aquí (o configúrala manualmente)" > /home/$DEPLOY_USER/.ssh/authorized_keys
    chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh
    chmod 700 /home/$DEPLOY_USER/.ssh
    chmod 600 /home/$DEPLOY_USER/.ssh/authorized_keys
fi

# 5. Crear directorio de la app
mkdir -p "$APP_DIR"
chown $DEPLOY_USER:$DEPLOY_USER "$APP_DIR"

# 6. Nginx como reverse proxy + SSL
apt-get install -y nginx certbot python3-certbot-nginx

# Configurar nginx como reverse proxy
cat > /etc/nginx/sites-available/futinvest <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/futinvest /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 7. Obtener SSL (si el dominio apunta a este servidor)
echo ""
echo "=== SSL Certificate ==="
echo "Ejecuta cuando el DNS apunte a este servidor:"
echo "  certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN"
echo ""

# 8. Login a ghcr.io (necesitas un PAT con scope read:packages)
echo ""
echo "=== GitHub Container Registry ==="
echo "Crea un token en https://github.com/settings/tokens con scope read:packages"
echo "Luego ejecuta:"
echo "  echo TU_TOKEN | docker login ghcr.io -u Dara8091 --password-stdin"
echo ""

# 9. Crear .env de ejemplo
if [ ! -f "$APP_DIR/.env" ]; then
    cat > "$APP_DIR/.env" <<EOF
# Genera los secrets con:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
NODE_ENV=staging
PORT=3001
FRONTEND_URL=https://$DOMAIN
JWT_SECRET=REEMPLAZAR_CON_SECRETO_REAL
TOTP_SECRET=REEMPLAZAR_CON_SECRETO_REAL
PAYMENT_PROVIDER=mock
DB_PATH=/data/fut_invest.db
WITHDRAWAL_WORKER_ENABLED=true
REQUIRE_EMAIL_VERIFICATION=false
CSRF_ENABLED=true
METRICS_ENABLED=true
EOF
    chown $DEPLOY_USER:$DEPLOY_USER "$APP_DIR/.env"
    chmod 600 "$APP_DIR/.env"
    echo ".env creado en $APP_DIR/.env"
    echo "IMPORTANTE: Edita el archivo y reemplaza JWT_SECRET y TOTP_SECRET"
fi

echo ""
echo "=== Setup completado ==="
echo ""
echo "Próximos pasos:"
echo "  1. Editar $APP_DIR/.env con secrets reales"
echo "  2. docker login a ghcr.io"
echo "  3. Copiar docker-compose.staging.yml al VPS:"
echo "     scp docker-compose.staging.yml $DEPLOY_USER@$DOMAIN:$APP_DIR/"
echo "  4. Ejecutar deploy desde GitHub Actions"
echo "  5. Certbot para SSL: certbot --nginx -d $DOMAIN"
