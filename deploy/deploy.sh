#!/usr/bin/env bash
#
# Deploy script for Duitku on a shared Ubuntu/Debian VPS that already runs
# other applications (managed by the `deploy` user + pm2). This script is
# careful never to touch any existing Nginx site or other pm2 process.
#
# Run as the SAME non-root user that manages the other apps (e.g. `deploy`),
# NOT as root — it uses `sudo` internally only for the handful of steps that
# genuinely need it (apt-get, writing to /etc/nginx, reloading nginx).
#
# Run `check-server.sh` first to see what's already on the server and to
# pick an APP_PORT that isn't in use yet.
#
# Usage:
#   1. Copy this file (and check-server.sh) to the VPS, into the deploy
#      user's home directory
#   2. Run check-server.sh first, pick a free APP_PORT
#   3. export APP_PORT=4001 (and DOMAIN=... once you have one)
#   4. bash deploy.sh        <- as the `deploy` user, no sudo prefix
#
# Safe to re-run: it skips steps that are already done, and never removes
# anything belonging to another application.

set -euo pipefail

# ============================== CONFIG ==============================
# GitHub repo containing the app (public, so no token needed).
GITHUB_REPO="${GITHUB_REPO:-digitalfuturesolutions69/kasir}"

# Optional: only needed if the repo is ever made private again.
GITHUB_TOKEN="${GITHUB_TOKEN:-}"

# Where the app will live — defaults to a folder in the current user's
# home, alongside how other apps on this server are laid out (e.g.
# /home/deploy/duitku next to /home/deploy/chatbot).
APP_DIR="${APP_DIR:-$HOME/duitku}"

# Domain name (subdomain) DEDICATED to Duitku, e.g. duitku.example.com.
# Leave empty to skip Nginx entirely — the app will only be reachable at
# http://<server-ip>:<APP_PORT> until you have a domain for it.
#
# IMPORTANT: other domains already own this server's Nginx config. This
# script will NEVER touch any existing site — it only ever adds a new one.
DOMAIN="${DOMAIN:-}"

# Port the Next.js app listens on. MUST NOT collide with an existing app —
# run check-server.sh first to confirm this port is free. 4001 was checked
# free on this server as of the last check.
APP_PORT="${APP_PORT:-4001}"
# ======================================================================

if [[ $EUID -eq 0 ]]; then
  echo "Please run this as the 'deploy' user (not root) — it uses sudo" >&2
  echo "internally only where actually needed, and keeps Duitku under the" >&2
  echo "same account/pm2 daemon as the other apps on this server." >&2
  echo "  su - deploy   # then re-run: bash deploy.sh" >&2
  exit 1
fi

echo "==> Checking APP_PORT ${APP_PORT} is free"
if ss -tln 2>/dev/null | awk '{print $4}' | grep -qE "[:.]${APP_PORT}\$"; then
  echo "ERROR: something is already listening on port ${APP_PORT}." >&2
  echo "Run check-server.sh, pick a free port, and re-run with APP_PORT=<free-port>." >&2
  exit 1
fi

echo "==> Refreshing sudo credentials (will prompt once if needed)"
sudo -v

echo "==> Making sure git/curl are present"
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg git

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: no 'node' found on this account's PATH." >&2
  echo "This server already runs other Node.js apps under this user —" >&2
  echo "make sure you're logged in as the same user/shell that runs them" >&2
  echo "(nvm-managed Node.js is often only loaded in an interactive login shell)." >&2
  exit 1
fi
NODE_VERSION="$(node -v)"
NODE_MAJOR_CURRENT="$(echo "$NODE_VERSION" | grep -oE '^v[0-9]+' | tr -d v)"
echo "==> Using existing Node.js ${NODE_VERSION}"
if [[ "$NODE_MAJOR_CURRENT" -lt 20 ]]; then
  echo "WARNING: Duitku (Next.js 16) wants Node.js >= 20. Build may fail on ${NODE_VERSION}."
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "==> Installing pm2 (process manager) for this user"
  npm install -g pm2
else
  echo "==> Reusing existing pm2 ($(pm2 -v)) — Duitku will show up in 'pm2 list' with your other apps"
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
# Never keep a token in the on-disk remote URL.
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

if [[ -n "$DOMAIN" ]]; then
  # Also serve the www. variant unless DOMAIN already has a subdomain
  # (e.g. duitku.example.com) — avoids producing www.duitku.example.com.
  if [[ "$DOMAIN" == *.*.* ]]; then
    SERVER_NAMES="$DOMAIN"
  else
    SERVER_NAMES="$DOMAIN www.$DOMAIN"
  fi
  echo "==> Adding a NEW Nginx site for ${SERVER_NAMES} (existing sites untouched)"
  sudo tee "/etc/nginx/sites-available/duitku" > /dev/null <<EOF
server {
    listen 80;
    server_name ${SERVER_NAMES};

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
  sudo ln -sf /etc/nginx/sites-available/duitku /etc/nginx/sites-enabled/duitku
  sudo nginx -t
  sudo systemctl reload nginx

  if command -v ufw >/dev/null 2>&1 && sudo ufw status | grep -q "Status: active"; then
    sudo ufw allow 'Nginx Full' >/dev/null || true
  fi
else
  echo "==> No DOMAIN set — skipping Nginx entirely (existing sites untouched)"
  if command -v ufw >/dev/null 2>&1 && sudo ufw status | grep -q "Status: active"; then
    echo "==> Opening firewall for port ${APP_PORT}"
    sudo ufw allow "${APP_PORT}/tcp" >/dev/null || true
  fi
fi

echo ""
echo "============================================================"
if [[ -n "$DOMAIN" ]]; then
  echo " Deploy selesai. Aplikasi tersedia (HTTP) di: http://${DOMAIN}"
  echo ""
  echo " Untuk mengaktifkan HTTPS (setelah DNS domain mengarah ke"
  echo " server ini), jalankan:"
  echo "   sudo apt-get install -y certbot python3-certbot-nginx"
  echo "   sudo certbot --nginx $(printf -- '-d %s ' $SERVER_NAMES)"
else
  echo " Deploy selesai. Aplikasi lain di server ini TIDAK diganggu."
  echo " Duitku tersedia sementara di: http://103.175.207.51:${APP_PORT}"
  echo ""
  echo " Setelah Anda punya subdomain khusus untuk Duitku (misalnya"
  echo " duitku.namadomainanda.com) dan sudah diarahkan ke server ini,"
  echo " jalankan ulang:"
  echo "   export APP_PORT=${APP_PORT} DOMAIN=duitku.namadomainanda.com"
  echo "   bash deploy.sh"
  echo " lalu aktifkan HTTPS dengan certbot."
fi
echo "============================================================"
