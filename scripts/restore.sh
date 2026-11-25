set -euo pipefail

BACKUP_FILE=${1:?Usage: scripts/restore.sh backups/estateai-TIMESTAMP.dump.gz}

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT_DIR"

gzip -cd "$BACKUP_FILE" \
  | docker compose --env-file .env -f docker-compose.prod.yml exec -T postgres \
      sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner'
