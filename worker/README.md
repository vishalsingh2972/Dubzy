# Dubbing Worker Deployment

The dubbing worker runs dubbing jobs from `pg-boss`, uses PostgreSQL for queue and job state, reads and writes media in Cloudflare R2, and calls Sarvam and Smallest provider APIs.

## Prerequisites

- A VPS with Docker and Docker Compose installed.
- An external PostgreSQL database that is reachable from inside a Docker container.
- Cloudflare R2 credentials.
- Sarvam and Smallest API keys.

## Setup

From the worker directory on the VPS:

```bash
cp .env.example .env
```

Edit `.env` and fill in the required values:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME
PG_BOSS_SCHEMA=pgboss
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_ENDPOINT=
R2_VIDEO_URL_BASE=
SARVAM_API_KEY=
SMALLEST_API_KEY=
```

`DATABASE_URL` must use a hostname that the container can reach. Do not use `localhost` for an external database, because inside the container `localhost` means the worker container itself.

## Deploy

Build and start the worker:

```bash
docker compose up -d --build
```

The worker does not expose any ports. It runs in the background and listens for jobs from PostgreSQL through `pg-boss`.

## Operations

View logs:

```bash
docker compose logs -f worker
```

Check status:

```bash
docker compose ps
```

Restart the worker:

```bash
docker compose restart worker
```

Stop the worker:

```bash
docker compose down
```

Redeploy after pulling new code:

```bash
docker compose up -d --build
```

Smoke-test the built image:

```bash
docker compose run --rm --entrypoint sh worker -lc 'node --version && ffmpeg -version >/dev/null && test -f dist/worker.js'
```
