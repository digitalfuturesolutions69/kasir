#!/usr/bin/env bash
#
# Read-only pre-flight check. Run this FIRST, before deploy.sh, so you know
# what's already running on the VPS and can pick a port/domain for Duitku
# that won't collide with the existing application.
#
# Usage: sudo bash check-server.sh

set -uo pipefail

echo "=== OS ==="
if [[ -f /etc/os-release ]]; then
  grep -E '^(NAME|VERSION)=' /etc/os-release
fi
echo ""

echo "=== Node.js / npm (system-wide) ==="
command -v node >/dev/null 2>&1 && node -v || echo "node: not installed globally"
command -v npm  >/dev/null 2>&1 && npm -v  || echo "npm: not installed globally"
echo ""

echo "=== pm2 processes (if any) ==="
if command -v pm2 >/dev/null 2>&1; then
  pm2 list
else
  echo "pm2: not installed"
fi
echo ""

echo "=== Ports currently listening ==="
if command -v ss >/dev/null 2>&1; then
  ss -tlnp 2>/dev/null | awk 'NR==1 || /LISTEN/'
else
  netstat -tlnp 2>/dev/null | awk 'NR<=2 || /LISTEN/'
fi
echo ""

echo "=== Nginx status & sites ==="
if command -v nginx >/dev/null 2>&1; then
  nginx -v 2>&1
  echo "--- sites-enabled ---"
  ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "(no sites-enabled dir)"
  echo "--- server_name / listen directives in enabled sites ---"
  grep -H -E 'server_name|listen' /etc/nginx/sites-enabled/* 2>/dev/null
else
  echo "nginx: not installed"
fi
echo ""

echo "=== Other common web servers ==="
for svc in apache2 caddy httpd; do
  if command -v "$svc" >/dev/null 2>&1; then
    echo "$svc: installed"
  fi
done
echo ""

echo "============================================================"
echo " Pakai hasil di atas untuk memilih APP_PORT (port yang belum"
echo " dipakai di daftar 'Ports currently listening') sebelum"
echo " menjalankan deploy.sh, misalnya:"
echo "   export APP_PORT=3001"
echo "============================================================"
