#!/usr/bin/env bash
#
# Read-only security diagnostic for the VPS hosting Duitku (and other
# apps under the same `deploy` user). Gathers OS/SSH/firewall/TLS/Nginx
# posture in one pass so it can be reviewed off-server — never changes
# anything, safe to run any time, and doesn't touch other applications.
#
# Usage: sudo bash security-check.sh
# (sudo needed to read sshd_config, ufw, and the Nginx site file)

set -uo pipefail

# Run under sudo, $HOME becomes /root — resolve the actual deploy user's
# home so the ~/duitku lookups below (and pm2, in their user profile)
# still work.
DEPLOY_HOME="$HOME"
if [[ -n "${SUDO_USER:-}" ]]; then
  DEPLOY_HOME="$(getent passwd "$SUDO_USER" | cut -d: -f6)"
fi

echo "=== OS & pending security updates ==="
if [[ -f /etc/os-release ]]; then
  grep -E '^(NAME|VERSION)=' /etc/os-release
fi
if command -v apt >/dev/null 2>&1; then
  UPDATES="$(apt list --upgradable 2>/dev/null | grep -c '\-security')"
  echo "Security updates pending: ${UPDATES:-0}"
fi
echo ""

echo "=== Automatic security updates ==="
if dpkg -l unattended-upgrades >/dev/null 2>&1; then
  echo "unattended-upgrades: installed"
  systemctl is-enabled unattended-upgrades 2>/dev/null || true
else
  echo "unattended-upgrades: NOT installed (OS patches must be applied manually)"
fi
echo ""

echo "=== SSH hardening — EFFECTIVE config (wins over any file precedence guessing) ==="
if command -v sshd >/dev/null 2>&1; then
  sudo sshd -T 2>/dev/null | grep -iE '^(permitrootlogin|passwordauthentication|pubkeyauthentication)\b' \
    || echo "Could not run 'sshd -T' (needs sudo)"
else
  echo "sshd not found on PATH"
fi
echo "--- raw files, for reference only (sshd -T above is what actually applies) ---"
grep -H -E '^\s*(PermitRootLogin|PasswordAuthentication|PubkeyAuthentication)\b' /etc/ssh/sshd_config 2>/dev/null
grep -H -E '^\s*(PermitRootLogin|PasswordAuthentication|PubkeyAuthentication)\b' /etc/ssh/sshd_config.d/*.conf 2>/dev/null
echo ""

echo "=== fail2ban (SSH/login brute-force protection) ==="
if command -v fail2ban-client >/dev/null 2>&1; then
  sudo fail2ban-client status 2>/dev/null || echo "fail2ban installed but status unavailable (run with sudo)"
else
  echo "fail2ban: NOT installed"
fi
echo ""

echo "=== Firewall (ufw) ==="
if command -v ufw >/dev/null 2>&1; then
  sudo ufw status verbose 2>/dev/null || ufw status
else
  echo "ufw: not installed"
fi
echo ""

echo "=== Ports currently listening ==="
if command -v ss >/dev/null 2>&1; then
  ss -tlnp 2>/dev/null | awk 'NR==1 || /LISTEN/'
else
  netstat -tlnp 2>/dev/null | awk 'NR<=2 || /LISTEN/'
fi
echo ""

echo "=== TLS certificate (duitku.click) ==="
if command -v certbot >/dev/null 2>&1; then
  sudo certbot certificates 2>/dev/null | grep -A5 "duitku.click" || echo "No certbot certificate found for duitku.click"
  echo "--- Renewal timer ---"
  systemctl list-timers 2>/dev/null | grep -i certbot || echo "(no certbot timer found — check 'sudo systemctl list-timers')"
else
  echo "certbot: not installed"
fi
echo ""

echo "=== HTTP -> HTTPS redirect check (duitku.click) ==="
curl -sI --max-time 10 http://duitku.click 2>/dev/null | head -3 || echo "curl failed — check manually"
echo ""

echo "=== Nginx: version banner & duitku site config ==="
if command -v nginx >/dev/null 2>&1; then
  nginx -v 2>&1
  echo "--- server_tokens (should be 'off' to hide Nginx version from responses) ---"
  grep -rH "server_tokens" /etc/nginx/nginx.conf /etc/nginx/conf.d/*.conf 2>/dev/null || echo "server_tokens not explicitly set (defaults to 'on' — leaks Nginx version)"
  echo "--- duitku site file ---"
  sudo cat /etc/nginx/sites-available/duitku 2>/dev/null || echo "(not found)"
else
  echo "nginx: not installed"
fi
echo ""

echo "=== File permissions: Duitku secrets & database ==="
if [[ -f "$DEPLOY_HOME/duitku/.env" ]]; then
  ls -la "$DEPLOY_HOME/duitku/.env"
else
  echo "$DEPLOY_HOME/duitku/.env not found (wrong user/path?)"
fi
find "$DEPLOY_HOME/duitku/prisma" -iname "*.db" -exec ls -la {} \; 2>/dev/null
echo ""

echo "=== Duitku pm2 process health ==="
if [[ -n "${SUDO_USER:-}" ]]; then
  # pm2 lives in the deploy user's own npm global path, invisible to
  # root's PATH under sudo — run the check as that user instead.
  sudo -u "$SUDO_USER" bash -lc 'pm2 describe duitku 2>/dev/null | grep -E "status|restarts|uptime|memory" || pm2 list' 2>/dev/null \
    || echo "Could not run pm2 as $SUDO_USER — try: pm2 describe duitku (without sudo)"
elif command -v pm2 >/dev/null 2>&1; then
  pm2 describe duitku 2>/dev/null | grep -E "status|restarts|uptime|memory" || pm2 list
else
  echo "pm2: not installed"
fi
echo ""

echo "=== Disk space ==="
df -h / 2>/dev/null
echo ""

echo "============================================================"
echo " Tempel seluruh output di atas untuk dianalisis."
echo "============================================================"
