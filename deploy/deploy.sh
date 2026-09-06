#!/usr/bin/env bash
#
# Deploy script for Duitku on a fresh Ubuntu/Debian VPS.
#
# Usage:
#   1. Copy this file to the VPS (scp deploy/deploy.sh root@103.175.207.51:~/)
#   2. Edit the CONFIG section below (or export the same-named env vars before running)
#   3. Run as root: sudo bash deploy.sh
#
# Safe to re-run: it skips steps that are already done (idempotent-ish).

set -euo pipefail

# ============================== CONFIG ==============================
# GitHub repo containing the app.
GITHUB_REPO="${GITHUB_REPO:-digitalfuturesolutions69/kasir}"

# If the repo is private, create a GitHub Personal Access Token with
# read-only "Contents" access and export it before running:
#   export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_TOKEN="${GITHUB_TOKEN:-}"

# Where the app will live on the server.
APP_DIR="${APP_DIR:-/opt/duitku}"

# Domain name for Nginx + SSL. Leave empty to serve over plain HTTP via
# the server's IP address only (no SSL) — you can re-run this script
# later once you have a domain pointed at this server.
DOMAIN="${DOMAIN:-}"

# Port the Next.js app listens on internally (Nginx proxies to this).
APP_PORT="${APP_PORT:-3000}"

# Node.js major version to install.
NODE_MAJOR="${NODE_MAJOR:-22}"
# ======================================================================

if [[ $EUID -ne 0 ]]; then
  echo "Please run as root (sudo bash deploy.sh)" >&2
  exit 1
fi

echo "==> Updating apt and installing base packages"
apt-get update -y
apt-get install -y ca-certificates curl gnupg git nginx

if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | grep -oE '^v[0-9]+' | tr -d v)" != "$NODE_MAJOR" ]]; then
  echo "==> Installing Node.js ${NODE_MAJOR}.x"
  mkdir -p /etc/apt/keyrings
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
else
  echo "==> Node.js $(node -v) already installed, skipping"
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "==> Installing pm2 (process manager)"
  npm install -g pm2
fi

echo "==> Fetching application code"
if [[ -n "$GITHUB_TOKEN" ]]; then
  CLONE_URL="https://${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git"
else
  CLONE_URL="https://github.com/${GITHUB_REPO}.git"
fi

if [[ -d "$APP_DIR/.git" ]]; then
  echo "    App already cloned, pulling latest changes"
  git -C "$APP_DIR" remote set-url origin "$CLONE_URL"
  git -C "$APP_DIR" fetch origin
  git -C "$APP_DIR" reset --hard origin/main
else
  git clone "$CLONE_URL" "$APP_DIR"
fi
# Never keep the token in the on-disk remote URL.
git -C "$APP_DIR" remote set-url origin "https://github.com/${GITHUB_REPO}.git"

cd "$APP_DIR"

if [[ ! -f .env ]]; then
  echo "==> Creating .env with a generated JWT secret"
  JWT_SECRET="$(openssl rand -hex 32)"
  cat > .env <<EOF
DATABASE_URL="file:./prisma/prod.db"
JWT_SECRET="${JWT_SECRET}"
EOF
else
  echo "==> .env already exists, leaving it untouched"
fi

echo "==> Installing dependencies"
npm ci --no-audit --no-fund

echo "==> Applying database migrations"
npx prisma migrate deploy

echo "==> Building production bundle"
npm run build

echo "==> Starting app with pm2"
pm2 delete duitku >/dev/null 2>&1 || true
PORT="$APP_PORT" pm2 start npm --name duitku -- start
pm2 save
pm2 startup systemd -u root --hp /root >/tmp/pm2-startup.out 2>&1 || true
grep -E '^sudo ' /tmp/pm2-startup.out | bash || true

echo "==> Configuring Nginx"
SERVER_NAME="${DOMAIN:-_}"
cat > /etc/nginx/sites-available/duitku <<EOF
server {
    listen 80;
    server_name ${SERVER_NAME};

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
ln -sf /etc/nginx/sites-available/duitku /etc/nginx/sites-enabled/duitku
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  echo "==> Opening firewall ports (OpenSSH + Nginx)"
  ufw allow OpenSSH >/dev/null || true
  ufw allow 'Nginx Full' >/dev/null || true
fi

echo ""
echo "============================================================"
if [[ -n "$DOMAIN" ]]; then
  echo " Deploy selesai. Aplikasi tersedia (HTTP) di: http://${DOMAIN}"
  echo ""
  echo " Untuk mengaktifkan HTTPS (setelah DNS domain sudah mengarah"
  echo " ke server ini), jalankan:"
  echo "   apt-get install -y certbot python3-certbot-nginx"
  echo "   certbot --nginx -d ${DOMAIN}"
else
  echo " Deploy selesai. Aplikasi tersedia (HTTP) di: http://$(curl -s ifconfig.me || echo 103.175.207.51)"
  echo ""
  echo " Belum ada domain. Setelah Anda punya domain dan sudah"
  echo " diarahkan (A record) ke server ini, jalankan ulang:"
  echo "   DOMAIN=domain-anda.com bash deploy.sh"
  echo " lalu jalankan certbot untuk mengaktifkan HTTPS."
fi
echo "============================================================"
