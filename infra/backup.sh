#!/bin/sh
# Kunlik zaxira nusxa (TZ 9.4): ma'lumotlar bazasi + yuklangan fayllar, 30 kun saqlanadi.
# cron:  15 3 * * *  /opt/sifatdev/infra/backup.sh >> /var/log/sifatdev-backup.log 2>&1
# Oyda bir marta tiklash sinovi: restore-test.sh ni staging'da ishga tushiring.
set -eu
cd "$(dirname "$0")"
DEST="${BACKUP_DIR:-/var/backups/sifatdev}"
STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DEST"
umask 077

docker compose exec -T postgres pg_dump -U sifatdev -Fc sifatdev > "$DEST/db-$STAMP.dump"
docker run --rm -v sifatdev_uploads:/data:ro -v "$DEST":/backup alpine \
  tar -czf "/backup/uploads-$STAMP.tar.gz" -C /data .

# Ixtiyoriy: shifrlash (GPG kaliti serverda bo'lmasin — faqat ochiq kalit)
if [ -n "${BACKUP_GPG_RECIPIENT:-}" ]; then
  for f in "$DEST/db-$STAMP.dump" "$DEST/uploads-$STAMP.tar.gz"; do
    gpg --batch --yes -r "$BACKUP_GPG_RECIPIENT" -e "$f" && rm -f "$f"
  done
fi

find "$DEST" -type f -mtime +30 -delete
echo "$(date -Is) backup ok: $STAMP"
