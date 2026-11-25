set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT_DIR"

mkdir -p backups
STAMP=$(date -u +%Y%m%dT%H%M%SZ)

docker compose --env-file .env -f docker-compose.prod.yml exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom' \
  | gzip > "backups/estateai-${STAMP}.dump.gz"
