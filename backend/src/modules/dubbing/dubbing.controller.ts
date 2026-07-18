import type { Request, Response } from 'express'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { dubbingJobs, sourceVideos } from '../../db/schema.js'
import {
  completeDubbingUploadSchema,
  createDubbingUploadSchema,
  createSourceVersionSchema,
} from './dubbing.schema.js'
import { HttpError } from '../../lib/http-error.js'
import {
  createVideoObjectKey,
  createPresignedVideoUpload,
  deleteObjectsFromR2,
  getUploadedVideoMetadata,
  getSignedObjectDownloadUrl,
  getSignedObjectUrl,
  getStoredVideoUrl,
} from '../../lib/r2.js'
import { publishDubbingJob } from '../../lib/queue.js'

const allowedMimeTypePrefix = 'video/'
export const maxVideoFileSizeBytes = 50 * 1024 * 1024

const versionFields = {
  id: dubbingJobs.id,
  sourceId: dubbingJobs.sourceId,
  audioKey: dubbingJobs.audioKey,
  dubbedAudioKey: dubbingJobs.dubbedAudioKey,
  dubbedVideoKey: dubbingJobs.dubbedVideoKey,
  targetLanguage: dubbingJobs.targetLanguage,
  transcriptionLanguage: dubbingJobs.transcriptionLanguage,
  voiceCloneId: dubbingJobs.voiceCloneId,
  transcriptJson: dubbingJobs.transcriptJson,
  translationJson: dubbingJobs.translationJson,
  status: dubbingJobs.status,
  dubbedVideoUrl: dubbingJobs.dubbedVideoUrl,
  errorMessage: dubbingJobs.errorMessage,
  createdAt: dubbingJobs.createdAt,
  updatedAt: dubbingJobs.updatedAt,
}

const sourceFields = {
  id: sourceVideos.id,
  originalFilename: sourceVideos.originalFilename,
  displayTitle: sourceVideos.displayTitle,
  sourceLanguage: sourceVideos.sourceLanguage,
  videoKey: sourceVideos.videoKey,
  videoUrl: sourceVideos.videoUrl,
  createdAt: sourceVideos.createdAt,
  updatedAt: sourceVideos.updatedAt,
}

type VersionRow = Pick<
  typeof dubbingJobs.$inferSelect,
  | 'id'
  | 'sourceId'
  | 'audioKey'
  | 'dubbedAudioKey'
  | 'dubbedVideoKey'
  | 'targetLanguage'
  | 'transcriptionLanguage'
  | 'voiceCloneId'
  | 'transcriptJson'
  | 'translationJson'
  | 'status'
  | 'dubbedVideoUrl'
  | 'errorMessage'
  | 'createdAt'
  | 'updatedAt'
>
type SourceRow = Pick<
  typeof sourceVideos.$inferSelect,
  | 'id'
  | 'originalFilename'
  | 'displayTitle'
  | 'sourceLanguage'
  | 'videoKey'
  | 'videoUrl'
  | 'createdAt'
  | 'updatedAt'
>

const parseSegments = (value: string | null) => {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

const toVersionResponse = async (job: VersionRow) => ({
  id: job.id,
  sourceId: job.sourceId,
  audioKey: job.audioKey,
  audioUrl: job.audioKey ? await getSignedObjectUrl(job.audioKey) : null,
  dubbedAudioKey: job.dubbedAudioKey,
  dubbedAudioUrl: job.dubbedAudioKey
    ? await getSignedObjectUrl(job.dubbedAudioKey)
    : null,
  dubbedVideoKey: job.dubbedVideoKey,
  targetLanguage: job.targetLanguage,
  transcriptionLanguage: job.transcriptionLanguage,
  voiceCloneId: job.voiceCloneId,
  transcriptSegments: parseSegments(job.transcriptJson),
  translatedSegments: parseSegments(job.translationJson),
  status: job.status,
  dubbedVideoUrl: job.dubbedVideoKey
    ? await getSignedObjectUrl(job.dubbedVideoKey)
    : job.dubbedVideoUrl,
  errorMessage: job.errorMessage,
  createdAt: job.createdAt,
  updatedAt: job.updatedAt,
})

const toSourceResponse = async (source: SourceRow, versions: VersionRow[]) => ({
  id: source.id,
  originalFilename: source.originalFilename,
  displayTitle: source.displayTitle,
  sourceLanguage: source.sourceLanguage,
  videoKey: source.videoKey,
  videoUrl: source.videoKey ? await getSignedObjectUrl(source.videoKey) : source.videoUrl,
  createdAt: source.createdAt,
  updatedAt: source.updatedAt,
  versions: await Promise.all(versions.map(toVersionResponse)),
})

const getAuthenticatedUserId = (res: Response) => {
  const userId = res.locals.userId
  if (typeof userId !== 'string' || userId.length === 0) {
    throw new HttpError(401, 'Authentication required')
  }
  return userId
}

const getVersionIdParam = (req: Request) => {
  const id = req.params.id
  if (typeof id !== 'string') throw new HttpError(400, 'Language version id is required')
  return id
}

const getSourceIdParam = (req: Request) => {
  const sourceId = req.params.sourceId
  if (
    typeof sourceId !== 'string' ||
    !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(
      sourceId,
    )
  ) {
    throw new HttpError(404, 'Source video not found')
  }
  return sourceId
}

const isUniqueViolation = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === '23505'

const getScopedVersion = async (id: string, userId: string) => {
  const [row] = await db
    .select({ version: versionFields })
    .from(dubbingJobs)
    .where(and(eq(dubbingJobs.id, id), eq(dubbingJobs.userId, userId)))
  return row
}

const deriveDisplayTitle = (originalFilename: string) => {
  const basename = originalFilename.trim().replace(/^.*[\\/]/, '')
  return basename || 'Untitled source video'
}

export const createDubbingUpload = async (req: Request, res: Response) => {
  const userId = getAuthenticatedUserId(res)
  const payload = createDubbingUploadSchema.parse(req.body)
  const videoKey = createVideoObjectKey(payload.originalFilename)
  const uploadUrl = await createPresignedVideoUpload({
    key: videoKey,
    contentType: payload.contentType,
    userId,
  })

  res.status(201).json({
    success: true,
    data: {
      videoKey,
      uploadUrl,
      uploadHeaders: {
        'Content-Type': payload.contentType,
        'x-amz-meta-upload-owner': userId,
      },
    },
  })
}

export const createDubbingJob = async (req: Request, res: Response) => {
  const userId = getAuthenticatedUserId(res)
  const payload = completeDubbingUploadSchema.parse(req.body)
  const uploadedVideo = await getUploadedVideoMetadata(payload.videoKey)
  if (!uploadedVideo) throw new HttpError(400, 'Uploaded video was not found')
  if (uploadedVideo.Metadata?.['upload-owner'] !== userId) {
    throw new HttpError(403, 'Uploaded video does not belong to this user')
  }
  if (
    !uploadedVideo.ContentType?.startsWith(allowedMimeTypePrefix) ||
    !uploadedVideo.ContentLength ||
    uploadedVideo.ContentLength > maxVideoFileSizeBytes
  ) {
    throw new HttpError(400, 'Uploaded file must be a video no larger than 50 MB')
  }

  let source: SourceRow
  let job: VersionRow
  try {
    ;({ source, job } = await db.transaction(async (tx) => {
      const [createdSource] = await tx
        .insert(sourceVideos)
        .values({
          userId,
          originalFilename: payload.originalFilename,
          displayTitle: deriveDisplayTitle(payload.originalFilename),
          sourceLanguage: payload.sourceLanguage,
          videoKey: payload.videoKey,
          videoUrl: getStoredVideoUrl(payload.videoKey),
        })
        .returning(sourceFields)
      if (!createdSource) throw new Error('Failed to create source video')

      const [createdJob] = await tx
        .insert(dubbingJobs)
        .values({ sourceId: createdSource.id, userId, sourceLanguage: payload.sourceLanguage, targetLanguage: payload.targetLanguage, status: 'pending' })
        .returning(versionFields)
      if (!createdJob) throw new Error('Failed to create language version')
      return { source: createdSource, job: createdJob }
    }))
  } catch {
    await deleteObjectsFromR2([payload.videoKey])
    throw new HttpError(500, 'Failed to create source video and language version')
  }

  try {
    await publishDubbingJob({ jobId: job.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to enqueue dubbing job'
    await db.update(dubbingJobs).set({ status: 'failed', errorMessage: message, updatedAt: new Date() }).where(eq(dubbingJobs.id, job.id))
    throw new HttpError(500, 'Failed to enqueue dubbing job')
  }

  res.status(201).json({
    success: true,
    message: 'Source video and language version created',
    data: await toSourceResponse(source, [job]),
  })
}

export const createSourceVersion = async (req: Request, res: Response) => {
  const userId = getAuthenticatedUserId(res)
  const sourceId = getSourceIdParam(req)
  const payload = createSourceVersionSchema.parse(req.body)

  let job: VersionRow
  try {
    job = await db.transaction(async (tx) => {
      const [source] = await tx
        .select(sourceFields)
        .from(sourceVideos)
        .where(and(eq(sourceVideos.id, sourceId), eq(sourceVideos.userId, userId)))
        .for('update')
      if (!source) throw new HttpError(404, 'Source video not found')
      if (source.sourceLanguage === payload.targetLanguage) {
        throw new HttpError(400, 'Source and target languages must be different')
      }

      const versions = await tx
        .select(versionFields)
        .from(dubbingJobs)
        .where(eq(dubbingJobs.sourceId, source.id))
      if (versions.some((version) => version.status === 'pending' || version.status === 'processing')) {
        throw new HttpError(409, 'Another language version is already active')
      }
      const sameLanguageVersion = versions.find(
        (version) => version.targetLanguage === payload.targetLanguage,
      )
      if (sameLanguageVersion?.status === 'failed') {
        throw new HttpError(409, 'Failed language versions require the separate retry flow')
      }
      if (sameLanguageVersion) {
        throw new HttpError(409, 'This target language has already been added')
      }

      const [createdJob] = await tx
        .insert(dubbingJobs)
        .values({
          sourceId: source.id,
          userId,
          sourceLanguage: source.sourceLanguage,
          targetLanguage: payload.targetLanguage,
          status: 'pending',
        })
        .returning(versionFields)
      if (!createdJob) throw new Error('Failed to create language version')

      await tx
        .update(sourceVideos)
        .set({ updatedAt: new Date() })
        .where(eq(sourceVideos.id, source.id))
      return createdJob
    })
  } catch (error) {
    if (error instanceof HttpError) throw error
    if (isUniqueViolation(error)) {
      throw new HttpError(409, 'A conflicting language version was created concurrently')
    }
    throw error
  }

  try {
    await publishDubbingJob({ jobId: job.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to enqueue dubbing job'
    await db
      .update(dubbingJobs)
      .set({ status: 'failed', errorMessage: message, updatedAt: new Date() })
      .where(eq(dubbingJobs.id, job.id))
    throw new HttpError(500, 'Failed to enqueue dubbing job')
  }

  res.status(201).json({
    success: true,
    message: 'Language version created',
    data: await toVersionResponse(job),
  })
}

export const listDubbingJobs = async (_req: Request, res: Response) => {
  const userId = getAuthenticatedUserId(res)
  const rows = await db
    .select({ source: sourceFields, version: versionFields })
    .from(sourceVideos)
    .leftJoin(dubbingJobs, eq(dubbingJobs.sourceId, sourceVideos.id))
    .where(eq(sourceVideos.userId, userId))
    .orderBy(desc(sourceVideos.updatedAt), desc(dubbingJobs.updatedAt))

  const grouped = new Map<string, { source: SourceRow; versions: VersionRow[] }>()
  for (const row of rows) {
    const group = grouped.get(row.source.id) ?? { source: row.source, versions: [] }
    if (row.version) group.versions.push(row.version)
    grouped.set(row.source.id, group)
  }
  res.json({ success: true, data: await Promise.all([...grouped.values()].map(({ source, versions }) => toSourceResponse(source, versions))) })
}

export const getDubbingJob = async (req: Request, res: Response) => {
  const row = await getScopedVersion(getVersionIdParam(req), getAuthenticatedUserId(res))
  if (!row) throw new HttpError(404, 'Language version not found')
  res.json({ success: true, data: await toVersionResponse(row.version) })
}

export const downloadDubbingJobVideo = async (req: Request, res: Response) => {
  const row = await getScopedVersion(getVersionIdParam(req), getAuthenticatedUserId(res))
  if (!row) throw new HttpError(404, 'Language version not found')
  if (row.version.status !== 'completed' || !row.version.dubbedVideoKey) throw new HttpError(409, 'Dubbed video is not ready for download')
  const url = await getSignedObjectDownloadUrl(row.version.dubbedVideoKey, `dubbed-video-${row.version.id}.mp4`)
  res.redirect(url)
}

export const deleteSourceVideo = async (req: Request, res: Response) => {
  const userId = getAuthenticatedUserId(res)
  const sourceId = getSourceIdParam(req)

  try {
    await db.transaction(async (tx) => {
      const [source] = await tx
        .select(sourceFields)
        .from(sourceVideos)
        .where(and(eq(sourceVideos.id, sourceId), eq(sourceVideos.userId, userId)))
        .for('update')

      if (!source) throw new HttpError(404, 'Source video not found')

      const versions = await tx
        .select(versionFields)
        .from(dubbingJobs)
        .where(eq(dubbingJobs.sourceId, source.id))

      if (
        versions.some(
          (version) =>
            version.status === 'pending' || version.status === 'processing',
        )
      ) {
        throw new HttpError(
          409,
          'Active language versions must finish before the source can be deleted',
        )
      }

      const objectKeys = [
        ...new Set(
          [
            source.videoKey,
            ...versions.flatMap((version) => [
              version.audioKey,
              version.dubbedAudioKey,
              version.dubbedVideoKey,
            ]),
          ].filter((key): key is string => Boolean(key)),
        ),
      ]

      try {
        await deleteObjectsFromR2(objectKeys)
      } catch {
        throw new HttpError(500, 'Failed to delete all source media files')
      }

      await tx.delete(dubbingJobs).where(eq(dubbingJobs.sourceId, source.id))
      await tx
        .delete(sourceVideos)
        .where(and(eq(sourceVideos.id, source.id), eq(sourceVideos.userId, userId)))
    })
  } catch (error) {
    if (error instanceof HttpError) throw error
    throw new HttpError(500, 'Failed to delete the source video')
  }

  res.status(204).send()
}

// Kept as a backwards-compatible endpoint. It removes only version-owned artifacts;
// the reusable source media is intentionally retained.
export const deleteDubbingJob = async (req: Request, res: Response) => {
  const userId = getAuthenticatedUserId(res)
  const row = await getScopedVersion(getVersionIdParam(req), userId)
  if (!row) throw new HttpError(404, 'Language version not found')
  if (row.version.status === 'pending' || row.version.status === 'processing') throw new HttpError(409, 'Active language versions cannot be deleted')
  await deleteObjectsFromR2([row.version.audioKey, row.version.dubbedAudioKey, row.version.dubbedVideoKey].filter((key): key is string => Boolean(key)))
  await db.delete(dubbingJobs).where(and(eq(dubbingJobs.id, row.version.id), eq(dubbingJobs.userId, userId)))
  res.status(204).send()
}
