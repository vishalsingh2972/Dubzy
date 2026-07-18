---
name: backend
description: Use this agent when working in the backend app of this repo. It covers the Express + TypeScript API, Drizzle database access, pg-boss job publishing, R2 object storage, and the repo's existing module/controller/schema patterns for adding or changing backend behavior.
---

# Backend Agent

Use this agent for changes under `backend/`.

## Architecture

- `src/server.ts` starts the HTTP server and lifecycle hooks.
- `src/app.ts` wires global middleware, the root health response, and `/api`.
- `src/routes/index.ts` mounts feature routers.
- `src/modules/*` holds feature code. Keep request schemas, routes, and controllers inside the module.
- `src/db/*` owns the Drizzle client and schema definitions.
- `src/lib/queue.ts` publishes `pg-boss` jobs for async work.
- `src/lib/r2.ts` owns Cloudflare R2 upload and signed URL behavior.
- `src/middleware/*` handles not-found and error serialization.

## Working Pattern

- Add endpoints by following the existing module shape:
  route -> controller -> shared libs/db.
- Validate request bodies with Zod schemas in the module before doing side effects.
- Use `HttpError` for expected client or application failures.
- Keep controllers thin. Put reusable storage or queue logic in `src/lib/*`.
- Use Drizzle queries directly from controllers or focused helpers; preserve the existing selected response shape instead of returning raw rows.
- When creating async jobs, persist the DB record first, then enqueue with `publishDubbingJob`, and update the record to `failed` if queueing fails.

## Repo-Specific Guardrails

- Preserve the current API shape: `{ success, message?, data? }`.
- `CLIENT_URL` drives CORS. Do not widen origin handling without a clear reason.
- Video uploads currently require `multer.memoryStorage()` and MIME types starting with `video/`.
- R2-backed objects should be returned via signed URLs when a storage key exists.
- Schema changes belong in `src/db/schema.ts` and should stay aligned with the worker's copy in `worker/src/db/schema.ts`.
- Queue names and payload shapes must stay consistent with the worker consumer.

## Common Tasks

### Add a new API feature

- Create `src/modules/<feature>/<feature>.schema.ts` for request/response validation.
- Create `src/modules/<feature>/<feature>.controller.ts` for handlers.
- Create `src/modules/<feature>/<feature>.route.ts` and mount it in `src/routes/index.ts`.
- Reuse shared libs for storage, queueing, or cross-module helpers instead of duplicating logic.

### Change a job-backed flow

- Update the DB write path first.
- Keep the queue payload minimal and explicit.
- Make failure handling update persisted job state before returning the error.

### Change storage behavior

- Keep object-key creation and signed URL generation centralized in `src/lib/r2.ts`.
- Preserve content-type handling on upload paths.

## Validation

Run these from `backend/`:

```bash
npm run build
npm run lint
```

Use these when schema or DB behavior changes:

```bash
npm run db:generate
npm run db:push
```

Before finishing, confirm any backend schema or queue contract changes are reflected in `worker/` where needed.
