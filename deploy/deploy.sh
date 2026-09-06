#!/usr/bin/env bash
#
# Deploy script for Duitku on an Ubuntu/Debian VPS that MAY already be
# running other applications. This script is careful never to touch any
# existing Nginx site, existing pm2 process, or the system Node.js install
# if a different major version is already present.
#
# Run `check-server.sh` first to see what's already on the server and to
# pick an APP_PORT that isn't in use yet.
#
# Usage:
#   1. Copy this file (and check-server.sh) to the VPS
#   2. Run check-server.sh first, pick a free APP_PORT
#   3. export GITHUB_TOKEN=... APP_PORT=3001 (and DOMAIN=... if you have one)
#   4. sudo -E bash deploy.sh
#
# Safe to re-run: it skips steps that are already done, and never removes
# anything belonging to another application.

set -euo pipefail

# ============================== CONFIG ==============================
# GitHub repo containing the app.
GITHUB_REPO="${GITHUB_REPO:-digitalfuturesolutions69/kasir}"

# If the repo is private, create a GitHub Personal Access Token with
# read-only "Contents" access and export it before running:
#   export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_TOKEN="${GITHUB_TOKEN:-}"

# Where the app will live on the server. Kept separate from any existing
# app's directory.
APP_DIR="${APP_DIR:-/opt/duitku}"

# Domain name (subdomain) DEDICATED to Duitku, e.g. duitku.example.com.
# Leave empty to skip Nginx entirely — the app will only be reachable at
# http://<server-ip>:<APP_PORT> until you have a domain for it.
#
# IMPORTANT: because another app already owns this server's default Nginx
# site, a domain is required before Duitku can be exposed on port 80/443.
# This script will NEVER touch the existing default site.
DOMAIN="${DOMAIN:-}"

# Port the Next.js app listens on. MUST NOT collide with the existing
# app — run check-server.sh first to confirm this port is free.
APP_PORT="${APP_PORT:-3001}"

# Node.js major version to install/use for Duitku.
NODE_MAJOR="${NODE_MAJOR:-22}"
# ======================================================================

if [[ $EUID -ne 0 ]]; then
  echo "Please run as root (sudo -E bash deploy.sh)" >&2
  exit 1
fi

echo "==> Checking APP_PORT ${APP_PORT} is free"
if ss -tln 2>/dev/null | awk '{print $4}' | grep -qE "[:.]${APP_PORT}\$"; then
  echo "ERROR: something is already listening on port ${APP_PORT}." >&2
  echo "Run check-server.sh, pick a free port, and re-run with APP_PORT=<free-port>." >&2
  exit 1
fi

echo "==> Updating apt and installing base packages (git, curl — safe on any server)"
apt-get update -y
apt-get install -y ca-certificates curl gnupg git

CURRENT_NODE_MAJOR="$(command -v node >/dev/null 2>&1 && node -v | grep -oE '^v[0-9]+' | tr -d v || echo "")"
if [[ -z "$CURRENT_NODE_MAJOR" ]]; then
  echo "==> No system Node.js found, installing Node.js ${NODE_MAJOR}.x"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
elif [[ "$CURRENT_NODE_MAJOR" == "$NODE_MAJOR" ]]; then
  echo "==> System Node.js v${CURRENT_NODE_MAJOR} already matches, reusing it"
else
  echo "==> WARNING: system Node.js is v${CURRENT_NODE_MAJOR}, but Duitku wants v${NODE_MAJOR}."
  echo "    NOT touching the system Node.js install to avoid breaking the existing app."
  echo "    Installing Node.js ${NODE_MAJOR}.x separately via nvm for this app only."
  export NVM_DIR="/opt/duitku-nvm"
  mkdir -p "$NVM_DIR"
  if [[ ! -s "$NVM_DIR/nvm.sh" ]]; then
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | NVM_DIR="$NVM_DIR" bash
  fi
  # shellcheck disable=SC1091
  source "$NVM_DIR/nvm.sh"
  nvm install "$NODE_MAJOR"
  nvm alias default "$NODE_MAJOR"
  export PATH="$NVM_DIR/versions/node/$(nvm version default)/bin:$PATH"
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "==> Installing pm2 (process manager) globally"
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

echo "==> Starting app with pm2 (process name: duitku, port ${APP_PORT})"
pm2 delete duitku >/dev/null 2>&1 || true
PORT="$APP_PORT" pm2 start npm --name duitku -- start
pm2 save
# pm2 startup only needs to run once per server; harmless to re-run.
pm2 startup systemd -u root --hp /root >/tmp/pm2-startup.out 2>&1 || true
grep -E '^sudo ' /tmp/pm2-startup.out | bash || true

if [[ -n "$DOMAIN" ]]; then
  echo "==> Adding a NEW Nginx site for ${DOMAIN} (existing sites untouched)"
  cat > "/etc/nginx/sites-available/duitku" <<EOF
server {
    listen 80;
    server_name ${DOMAIN};

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
  nginx -t
  systemctl reload nginx

  if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
    ufw allow 'Nginx Full' >/dev/null || true
  fi
else
  echo "==> No DOMAIN set — skipping Nginx entirely (existing app's Nginx config is untouched)"
  if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
    echo "==> Opening firewall for port ${APP_PORT}"
    ufw allow "${APP_PORT}/tcp" >/dev/null || true
  fi
fi

echo ""
echo "============================================================"
if [[ -n "$DOMAIN" ]]; then
  echo " Deploy selesai. Aplikasi tersedia (HTTP) di: http://${DOMAIN}"
  echo ""
  echo " Untuk mengaktifkan HTTPS (setelah DNS domain mengarah ke"
  echo " server ini), jalankan:"
  echo "   apt-get install -y certbot python3-certbot-nginx"
  echo "   certbot --nginx -d ${DOMAIN}"
else
  echo " Deploy selesai. Aplikasi lain di server ini TIDAK diganggu."
  echo " Duitku tersedia sementara di: http://103.175.207.51:${APP_PORT}"
  echo ""
  echo " Setelah Anda punya subdomain khusus untuk Duitku (misalnya"
  echo " duitku.namadomainanda.com) dan sudah diarahkan ke server ini,"
  echo " jalankan ulang:"
  echo "   export GITHUB_TOKEN=... APP_PORT=${APP_PORT} DOMAIN=duitku.namadomainanda.com"
  echo "   sudo -E bash deploy.sh"
  echo " lalu aktifkan HTTPS dengan certbot."
fi
echo "============================================================"
