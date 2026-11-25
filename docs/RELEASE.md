# EstateAI release guide

## Local development

1. Copy `.env.example` to `estateai-server/.env` and adjust ports if needed.
2. Start infrastructure with `docker compose up -d`.
3. Install and migrate the backend:
   - `cd estateai-server`
   - `npm install`
   - `npm run prisma:deploy`
   - `npm run prisma:seed`
4. Install and start the frontend:
   - `cd estateai-client`
   - `npm install`
   - `npm run dev`
5. Start the API:
   - `cd estateai-server`
   - `npm run dev`

Seed accounts use password `Password123`:

- `admin@estateai.local`
- `agent@estateai.local`
- `buyer@estateai.local`

Gemini, Cloudinary and SMTP are optional in development. EstateAI uses deterministic offline fallbacks when those integrations are absent.

## Production release

1. Copy `.env.example` to `.env` and replace every placeholder with real values.
2. Generate distinct JWT secrets with at least 32 characters each.
3. Set a strong `POSTGRES_PASSWORD` and update `DATABASE_URL` to match it.
4. Provide `GEMINI_API_KEY`; production environment validation requires it.
5. Provide Cloudinary credentials for durable image storage and SMTP credentials for email.
6. Build and start the stack:

   ```bash
   docker compose --env-file .env -f docker-compose.prod.yml up -d --build
   ```

7. Confirm all services are healthy:

   ```bash
   docker compose --env-file .env -f docker-compose.prod.yml ps
   curl -fsS http://localhost/api/v1/health
   curl -fsS http://localhost/
   ```

The web container serves the built SPA on port 80 and proxies `/api` and `/uploads` to the API container.

## Backups

Create a custom-format compressed backup:

```bash
scripts/backup.sh
```

Restore the most recent backup after stopping user traffic:

```bash
scripts/restore.sh backups/estateai-TIMESTAMP.dump.gz
```

Backups are written to `backups/`, which is ignored by Git. Store production backups outside the application host and test restores regularly.

## CI

`.github/workflows/ci.yml` runs on pushes and pull requests:

- server: Prisma generate/migrate, typecheck, tests, build, Docker image build
- client: build, lint, tests, Docker image build

CI uses pgvector PostgreSQL and Redis service containers so integration tests run against real infrastructure.

## Release checklist

- `npm run typecheck`, `npm test`, and `npm run build` pass in `estateai-server`.
- `npm run build`, `npm run lint`, and `npm test` pass in `estateai-client`.
- Both Docker images build successfully.
- Production environment validation passes with real secrets.
- Register, login, refresh, logout, and password reset work.
- Buyer, agent and admin role routes are correctly protected.
- Agent can create and submit a listing; admin can approve it.
- Buyer can AI-search, favorite, compare, ask the assistant and send an inquiry.
- Agent receives the lead and can update its status and export CSV.
- Notifications are created for saved-search matches and lead activity.
- Dashboards show live database data.
- Health checks and backups are verified.
