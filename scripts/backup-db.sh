#!/usr/bin/env bash
set -euo pipefail
STAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="${COACH_BACKUP_DIR:-$HOME/coach-backups}"
mkdir -p "$BACKUP_DIR"
APP="${FLY_APP:-coach-claude}"

echo "Backing up $APP from /data/coach.db → $BACKUP_DIR/coach-$STAMP.db"
flyctl ssh console -a "$APP" -C "sqlite3 /data/coach.db '.backup /data/backup-$STAMP.db'"
flyctl ssh sftp shell -a "$APP" <<EOF
get /data/backup-$STAMP.db $BACKUP_DIR/coach-$STAMP.db
rm /data/backup-$STAMP.db
EOF
echo "Backup written: $BACKUP_DIR/coach-$STAMP.db"
ls -lh "$BACKUP_DIR/coach-$STAMP.db"
