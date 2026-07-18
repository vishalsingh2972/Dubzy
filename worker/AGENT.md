---
name: worker
description: Use this agent when working in the worker app of this repo. It covers the TypeScript pg-boss dubbing worker, Drizzle/PostgreSQL persistence, Cloudflare R2 media artifacts, ffmpeg/ffprobe processing, Sarvam speech-to-text and translation, Smallest voice cloning and TTS, environment validation, and the orchestration/task split.
---

# Worker Agent

Use this agent for changes under `worker/`.

## Architecture

- `src/worker.ts` boots `pg-boss`, registers process workers, and handles shutdown for pg-boss and the PostgreSQL pool.
- `src/processes/dubbing-job/index.ts` creates the `dubbing-job` queue with `retryLimit: 0` and hands each message to the processor.
- `src/processes/dubbing-job/types.ts` defines the queue payload `{ jobId: string }`, transcript segment shape, and transcription result shape.
- `src/processes/dubbing-job/process.ts` owns orchestration, status transitions, step logging, failure persistence, and temp directory cleanup.
- `src/processes/dubbing-job/repository.ts` isolates Drizzle reads, unconditional updates, and conditional status updates.
- `src/processes/dubbing-job/tasks/*` holds the focused pipeline steps: extract audio, transcribe, clone voice, translate, synthesize dubbed audio, and mux video.
- `src/lib/audio.ts` wraps `ffmpeg` and `ffprobe` for extraction, trimming, duration reads, segment mixing, normalization, and muxing.
- `src/lib/r2.ts` owns object-key conventions, R2 downloads/uploads, and stored video URL creation.
- `src/lib/providers/sarvam.ts` and `sarvam-languages.ts` own Sarvam STT/translation calls and supported language validation.
- `src/lib/providers/smallest.ts` owns Smallest voice cloning, TTS calls, response validation, and WAV file writing.
- `src/config/env.ts` validates required database, R2, Sarvam, and Smallest configuration with Zod.
- `src/lib/logger.ts` provides event-style structured logging.

## Working Pattern

- Keep queue registration thin: create/register the queue, receive the job, then call the process function.
- Keep workflow sequencing in `process.ts`; tasks should perform one concrete step and return small explicit results.
- Load the job, reject missing data, and skip `completed`, `failed`, and already `processing` rows before doing media work.
- Claim work with `updateDubbingJobIfStatus(jobId, "pending", ...)`; do not replace this with a non-conditional update.
- Persist intermediate artifacts after each major step: `audioKey`, transcript fields, `voiceCloneId`, translation JSON, `dubbedAudioKey`, and final video fields.
- Keep provider-specific request/response details inside `src/lib/providers/*`; task files should call provider helpers instead of building raw API requests.
- Keep media transforms in `src/lib/audio.ts` and R2 object naming/upload/download behavior in `src/lib/r2.ts`.
- Keep temp files isolated with `mkdtemp(path.join(tmpdir(), "dubbing-worker-"))` and clean them in `finally`.

## Repo-Specific Guardrails

- The queue name and payload contract must match the backend publisher: queue `dubbing-job`, payload `{ jobId: string }`.
- `retryLimit: 0` is intentional unless retry behavior and idempotency are redesigned together.
- Job state should move through the existing statuses: `pending`, `processing`, `completed`, `failed`.
- On failure, persist a useful `errorMessage` before rethrowing.
- Preserve `currentStep` logging so failures point to the step that threw.
- Single-speaker dubbing is enforced after Sarvam transcription; changing this requires a speaker/voice strategy.
- Sarvam language codes must pass through `sarvam-languages.ts` before translation.
- Smallest TTS responses must remain validated as audio and real WAV data before normalization/mixing.
- Translation and synthesis currently run segment-by-segment. If adding concurrency, preserve segment ordering and account for provider rate limits.
- `ffmpeg` and `ffprobe` are external runtime dependencies. Media changes should expect process failure and surface stderr when possible.
- Database schema changes must stay aligned with `backend/src/db/schema.ts`.
- Environment changes must update both `.env.example` and `src/config/env.ts`.

## Common Tasks

### Add a new processing step

- Extend the orchestration in `process.ts`.
- Add a focused task under `src/processes/dubbing-job/tasks/`.
- Persist any new artifacts or state through `repository.ts`.
- Keep each task return shape small and explicit.
- Add step-level logging with the same `dubbing_job.step.started` and `dubbing_job.step.completed` pattern.

### Change job persistence

- Update repository helpers first.
- Keep `updatedAt` writes centralized in repository update methods.
- Avoid broad partial updates unless the process step truly owns those fields.
- Keep backend and worker schema definitions in sync.

### Change file handling

- Keep object-key logic in `src/lib/r2.ts`.
- Preserve temp directory isolation with `mkdtemp` under the system temp dir.
- Keep generated artifact keys stable unless callers and stored data are migrated:
  - `audio/{jobId}.mp3`
  - `dubbed-audio/{jobId}.m4a`
  - `dubbed/{jobId}.mp4`

### Change provider behavior

- Put Sarvam STT/translation changes in `src/lib/providers/sarvam.ts`; update `sarvam-languages.ts` for language support changes.
- Put Smallest voice clone/TTS changes in `src/lib/providers/smallest.ts`.
- Keep task files provider-agnostic where practical: tasks should pass job/audio/segment inputs and receive normalized outputs.
- Preserve response validation before writing provider output into later media steps.

## Validation

Run these from `worker/`:

```bash
npm run build
```

Before finishing, confirm:

- backend and worker queue payloads still match
- backend and worker schema definitions still match
- `.env.example` and `src/config/env.ts` still match after env changes
- any new media-processing assumptions are compatible with local `ffmpeg` and `ffprobe`
- any provider behavior changes preserve transcript, translation, voice clone, and synthesized audio contracts
