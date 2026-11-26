# EstateAI Execution Plan

Scope: turn the README specification into a working, releasable product. Build backend first, verify it, then build the frontend against the working API. Work incrementally by module; never implement everything in one change.

## Principles

- Backend owns all business logic, validation, authorization and AI calls.
- Frontend only calls REST APIs under `/api/v1`; no secrets or Gemini calls in the browser.
- Consistent envelope: `{ success, message, data }` / `{ success, message, errors }`.
- TypeScript everywhere, Zod validation, Prisma for relational data, raw parameterized SQL only for pgvector.
- Optional third-party services (Gemini, Cloudinary, Redis, email) degrade gracefully in development but are required/validated in production.
- Every phase ends with typecheck + tests + a manual smoke check before moving on.

## Phase 1 — Foundation and authentication

Deliverables:

1. Root scaffold: `estateai-server/`, `estateai-client/`, `docker-compose.yml` (Postgres + pgvector, Redis), root scripts.
2. Backend TypeScript project: `tsconfig`, `package.json`, `.env.example`, logger, env validation.
3. Prisma schema for all core tables/enums + initial migration + seed (admin, agent, buyer, sample listings).
4. Global middleware: request ID, CORS, Helmet, compression, rate limiting, Zod validation, auth, RBAC, error handling, 404.
5. Auth module: register, login, refresh-token rotation, logout, `/auth/me`, email verification, forgot/reset password, change password.
6. Health/readiness endpoints and unit/integration tests for auth utilities and endpoints.

Verification: `npm run typecheck`, `npm test`, `curl /api/v1/health`, register/login/refesh/logout flow.

## Phase 2 — Property marketplace

1. Property module with modular routes/controller/service/repository/schema/types.
2. CRUD, ownership checks, archive/soft delete, status changes, agent-owned listings.
3. Cloudinary image upload with validation, ordering, cover image; local storage fallback for development.
4. Admin approval workflow (pending/approve/reject/request correction).
5. Filtered search, sorting, pagination, property detail, views tracking.
6. Tests for ownership, validation, approval, and filters.

## Phase 3 — AI discovery

1. Gemini SDK config with strict env validation and graceful dev fallback.
2. Natural-language search: Gemini structured extraction -> Zod validation -> trusted backend query builder.
3. Embeddings service, pgvector column + HNSW index, content-hash sync, background reindex job.
4. Hybrid search: strict SQL filters first, vector similarity ranking second.
5. Description generator using only supplied property facts; tone/regenerate/edit.
6. Tests for prompt/output validation and strict-filter enforcement.

## Phase 4 — Advanced AI

1. RAG chatbot with property context, conversation/message persistence, rate limiting.
2. Property comparison with backend-computed metrics and optional AI explanation.
3. AI lead assistant (summaries, follow-up drafts, suggestions) as reviewable suggestions only.

## Phase 5 — CRM and operations

1. Favorites, saved searches, search history and match notifications.
2. Leads: creation from inquiries, pipeline statuses, notes/activities, follow-ups, CSV export.
3. Notifications (in-app), analytics/property views, agent/admin dashboards.

## Phase 6 — Frontend

1. Vite + React + TS + Tailwind + Router + TanStack Query + Axios + Zustand + RHF/Zod.
2. Typed API client and auth/session handling.
3. Public pages, auth pages, buyer pages, agent pages, admin pages with loading/error/empty states.

## Phase 7 — Production release

1. Dockerfiles, compose production profile, Nginx, env validation, backups.
2. GitHub Actions CI (typecheck, lint, tests, build), health checks, logging, docs.
3. Release checklist based on README "Definition of Done".

## Current status

- Toolchain: Node v22, npm 10, Docker 29, PostgreSQL client 18.
- Phase 1 complete: server scaffold, Prisma schema + initial migration, auth/RBAC, health checks, 10 passing tests, seed data.
- Phase 2 complete: property CRUD, ownership checks, Cloudinary/local image pipeline, approval workflow, filters/pagination, 13 passing tests.
- Phase 3 complete: Gemini config with offline fallback, NL structured search, factual description generator, pgvector embeddings + HNSW, hybrid ranking, 20 passing tests.
- Phase 4 complete: grounded RAG chatbot with conversation persistence, backend-computed comparison with saved history, lead assistant with grounded suggestions and matching, 25 passing tests.
- Phase 5 complete: favorites, saved searches, search history, match notifications, leads CRM with CSV export, notifications, reports, agent/admin dashboards, 33 passing tests.
- Phase 6 complete: public/auth/buyer/agent/admin pages, protected role routes, typed API services, AI search/chat/compare, CRM pages, property management, approvals, reports, dashboards.
- Phase 7 complete: production Dockerfiles, Compose profile, Nginx SPA/API proxy, CI workflow, backup/restore scripts, release guide and verification.
- Verified: server typecheck + 33 tests + build; client build + lint + 5 tests; live health, property, AI search, favorites and dashboard smoke checks.
