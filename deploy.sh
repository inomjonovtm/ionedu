#!/usr/bin/env bash
# Ionedu — one-command server update.
#
#   bash deploy.sh                 # update the branch that is checked out
#   bash deploy.sh redesign-atlas  # switch to a branch and update it
#
# Optional environment variables:
#   IONEDU_SERVICE   systemd unit to restart (default: tries gunicorn, ionedu)
#   SKIP_FRONTEND=1  do not rebuild the frontend
set -euo pipefail

cd "$(dirname "$0")"
ROOT="$(pwd)"
BRANCH="${1:-$(git rev-parse --abbrev-ref HEAD)}"

step() { printf '\n\033[1;33m▶ %s\033[0m\n' "$1"; }

step "Kod yangilanmoqda ($BRANCH)"
git fetch origin
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

step "Backend: paketlar"
cd "$ROOT/backend"
if   [ -x .venv/bin/python ]; then PY=".venv/bin/python"
elif [ -x venv/bin/python ];  then PY="venv/bin/python"
else python3 -m venv .venv; PY=".venv/bin/python"
fi
"$PY" -m pip install --quiet --upgrade pip
"$PY" -m pip install --quiet -r requirements.txt

step "Backend: migratsiya, statik fayllar, sertifikatlar"
"$PY" manage.py migrate --noinput
"$PY" manage.py collectstatic --noinput
"$PY" manage.py regenerate_certificates

if [ "${SKIP_FRONTEND:-0}" != "1" ] && command -v npm >/dev/null 2>&1; then
  step "Frontend: yig'ish"
  cd "$ROOT/frontend"
  npm ci --no-audit --no-fund
  npm run build
else
  step "Frontend o'tkazib yuborildi (npm topilmadi yoki SKIP_FRONTEND=1)"
fi

step "Server qayta ishga tushirilmoqda"
restarted=0
if command -v systemctl >/dev/null 2>&1; then
  for unit in ${IONEDU_SERVICE:-gunicorn ionedu}; do
    if systemctl list-unit-files "$unit.service" 2>/dev/null | grep -q "$unit.service"; then
      sudo systemctl restart "$unit" && echo "  $unit qayta ishga tushdi" && restarted=1
    fi
  done
  if systemctl list-unit-files nginx.service 2>/dev/null | grep -q nginx.service; then
    sudo systemctl reload nginx && echo "  nginx yangilandi"
  fi
fi
if [ "$restarted" = "0" ] && pgrep -f "gunicorn" >/dev/null 2>&1; then
  # Not a systemd unit: ask the running gunicorn master to reload its workers.
  pkill -HUP -f "gunicorn: master" 2>/dev/null || pkill -HUP -f "gunicorn" || true
  echo "  gunicorn jarayoni qayta yuklandi (HUP)" && restarted=1
fi
if [ "$restarted" = "0" ]; then
  echo "  DIQQAT: backend avtomatik qayta ishga tushmadi!"
  echo "  Eski kod ishlab tursa, testni boshlash va tartibni saqlash xato beradi."
  echo "  Gunicorn'ni o'zingiz qayta ishga tushiring"
  echo "  (yoki: IONEDU_SERVICE=<xizmat-nomi> bash deploy.sh)"
fi

printf '\n\033[1;32m✓ Tayyor: %s\033[0m\n' "$(git log --oneline -1)"
