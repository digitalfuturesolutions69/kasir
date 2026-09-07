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
# Usage (Duitku is already live on this server at https://duitku.click,
# port 5001 — just re-run this to deploy the latest commit):
#   1. Copy this file (and check-server.sh) to the VPS, into the deploy
#      user's home directory
#   2. export APP_PORT=5001 DOMAIN=duitku.click
#   3. bash deploy.sh        <- as the `deploy` user, no sudo prefix
#
# Only if 5001 ever stops being free (collision with a new app on this
# shared server): run check-server.sh, pick a different free port, and
# export APP_PORT=<that port> instead — but then update the Nginx site's
# proxy_pass target manually too, since it won't self-heal.
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

# Port the Next.js app listens on. 5001 is where Duitku is actually
# running in production (duitku.click) — 4001 was the original pick but
# turned out to already be used by another app on this shared server, so
# deploys moved to 5001 instead. Only change this if 5001 itself later
# collides with something new (check with check-server.sh first).
APP_PORT="${APP_PORT:-5001}"
# ======================================================================

if [[ $EUID -eq 0 ]]; then
  echo "Please run this as the 'deploy' user (not root) — it uses sudo" >&2
  echo "internally only where actually needed, and keeps Duitku under the" >&2
  echo "same account/pm2 daemon as the other apps on this server." >&2
  echo "  su - deploy   # then re-run: bash deploy.sh" >&2
  exit 1
fi

echo "==> Checking APP_PORT ${APP_PORT} is free"
if command -v pm2 >/dev/null 2>&1 && pm2 describe duitku >/dev/null 2>&1; then
  echo "    An existing 'duitku' pm2 process is already using this port — it will be replaced by this run."
elif ss -tln 2>/dev/null | awk '{print $4}' | grep -qE "[:.]${APP_PORT}\$"; then
  echo "ERROR: something else is already listening on port ${APP_PORT}." >&2
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

# This script (and check-server.sh) live outside the git-tracked app
# directory, so the git pull above does NOT update them — without this,
# re-running `bash ~/deploy.sh` next time would silently use a stale copy
# even after fixes land in the repo. Self-update via atomic rename (mv on
# the same filesystem) so it's safe even though this script is currently
# mid-execution: the running process keeps reading its already-open file
# handle, unaffected by the directory entry now pointing elsewhere.
SELF_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
if [[ -f "$APP_DIR/deploy/deploy.sh" ]] && ! cmp -s "$APP_DIR/deploy/deploy.sh" "$SELF_PATH" 2>/dev/null; then
  echo "==> Updating $(basename "$SELF_PATH") to the latest version from the repo"
  cp "$APP_DIR/deploy/deploy.sh" "${SELF_PATH}.new"
  chmod +x "${SELF_PATH}.new"
  mv "${SELF_PATH}.new" "$SELF_PATH"
fi
if [[ -f "$APP_DIR/deploy/check-server.sh" ]]; then
  CHECK_SERVER_PATH="$(dirname "$SELF_PATH")/check-server.sh"
  if ! cmp -s "$APP_DIR/deploy/check-server.sh" "$CHECK_SERVER_PATH" 2>/dev/null; then
    cp "$APP_DIR/deploy/check-server.sh" "${CHECK_SERVER_PATH}.new"
    chmod +x "${CHECK_SERVER_PATH}.new"
    mv "${CHECK_SERVER_PATH}.new" "$CHECK_SERVER_PATH"
  fi
fi

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
  # A separate, always-managed snippet (never the certbot-owned site file
  # above, which we deliberately stop touching once HTTPS is configured)
  # so this keeps applying on every redeploy regardless of that file's
  # state. Nginx's default 1MB body cap rejects a full-resolution camera
  # photo outright — well below the app's own 8MB limit — and the default
  # 60s client_body_timeout can be too short to even receive one over a
  # slow mobile connection.
  echo "==> Ensuring Nginx allows large, slow uploads (client_max_body_size)"
  sudo tee /etc/nginx/conf.d/duitku-uploads.conf > /dev/null <<'NGINXCONF'
# Managed by Duitku's deploy.sh - do not hand-edit, it is overwritten on
# every deploy. Raises Nginx's upload size/timeout limits so full-
# resolution camera photos (several MB) aren't rejected before reaching
# the app, even over a slow mobile connection.
client_max_body_size 10m;
client_body_timeout 120s;
NGINXCONF
  sudo nginx -t && sudo systemctl reload nginx

  if sudo test -f /etc/nginx/sites-available/duitku && sudo grep -q "listen 443" /etc/nginx/sites-available/duitku 2>/dev/null; then
    echo "==> Nginx site for ${SERVER_NAMES} already has HTTPS configured (via certbot) — leaving it untouched"
    echo "    (proxy_pass target/port inside it may need updating manually if APP_PORT changed)"
  else
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
  fi
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
