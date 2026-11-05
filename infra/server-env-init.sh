#!/bin/sh
# Serverda maxfiy .env fayllarini yaratadi. Kalitlar shu yerda yaratiladi va hech qayerga chiqarilmaydi.
# Mavjud fayllarga tegmaydi, shuning uchun qayta ishga tushirish xavfsiz.
#   cd /srv/Sifatdev.uz/infra && sh server-env-init.sh
set -eu
cd "$(dirname "$0")"
umask 077

if [ ! -f .env ]; then
  cat > .env <<EOF
POSTGRES_PASSWORD=$(openssl rand -hex 32)
IMAGE_TAG=latest
GOOGLE_SITE_VERIFICATION=
YANDEX_VERIFICATION=
EOF
  echo ".env yaratildi"
else
  echo ".env mavjud, tegilmadi"
fi

if [ ! -f backend.env ]; then
  cat > backend.env <<EOF
ALLOWED_ORIGINS=https://sifatdev.uz,https://www.sifatdev.uz
PUBLIC_SITE_URL=https://sifatdev.uz
IP_HASH_SECRET=$(openssl rand -hex 32)
DATA_ENC_KEY=$(openssl rand -hex 32)
SESSION_TTL_HOURS=8
LEAD_RETENTION_DAYS=730

# Quyidagilarni o'zingiz to'ldiring (nano backend.env):
TURNSTILE_SECRET=
TELEGRAM_BOT_TOKEN=
TELEGRAM_SALES_CHAT_ID=
TELEGRAM_HR_CHAT_ID=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="SIFATDEV <no-reply@sifatdev.uz>"
TEAM_EMAIL_SALES=
TEAM_EMAIL_HR=
EOF
  echo "backend.env yaratildi: TURNSTILE_SECRET, Telegram va SMTP ni to'ldiring"
else
  echo "backend.env mavjud, tegilmadi"
fi
chmod 600 .env backend.env
