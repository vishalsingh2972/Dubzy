import type { Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dubbingJobs, sourceVideos } from '../../src/db/schema.js'
import { HttpError } from '../../src/lib/http-error.js'
import { createDubbingJob, createDubbingUpload, createSourceVersion, deleteSourceVideo, downloadDubbingJobVideo, listDubbingJobs } from '../../src/modules/dubbing/dubbing.controller.js'

const mocks = vi.hoisted(() => ({
  db: { insert: vi.fn(), select: vi.fn(), update: vi.fn(), delete: vi.fn(), transaction: vi.fn() },
  and: vi.fn((...conditions: unknown[]) => ({ op: 'and', conditions })),
  desc: vi.fn((column: unknown) => ({ op: 'desc', column })),
  eq: vi.fn((column: unknown, value: unknown) => ({ op: 'eq', column, value })),
  createVideoObjectKey: vi.fn(),
  createPresignedVideoUpload: vi.fn(),
  getStoredVideoUrl: vi.fn(),
  getUploadedVideoMetadata: vi.fn(),
  getSignedObjectUrl: vi.fn(),
  getSignedObjectDownloadUrl: vi.fn(),
  deleteObjectsFromR2: vi.fn(),
  publishDubbingJob: vi.fn(),
}))

vi.mock('../../src/db/client.js', () => ({ db: mocks.db }))
vi.mock('drizzle-orm', () => ({ and: mocks.and, desc: mocks.desc, eq: mocks.eq }))
vi.mock('../../src/lib/r2.js', () => ({
  createVideoObjectKey: mocks.createVideoObjectKey,
  createPresignedVideoUpload: mocks.createPresignedVideoUpload,
  deleteObjectsFromR2: mocks.deleteObjectsFromR2,
  getUploadedVideoMetadata: mocks.getUploadedVideoMetadata,
  getStoredVideoUrl: mocks.getStoredVideoUrl,
  getSignedObjectUrl: mocks.getSignedObjectUrl,
  getSignedObjectDownloadUrl: mocks.getSignedObjectDownloadUrl,
}))
vi.mock('../../src/lib/queue.js', () => ({ publishDubbingJob: mocks.publishDubbingJob }))

const now = new Date('2026-05-18T10:00:00.000Z')
const source = { id: '17b74ec6-7086-459c-8f0d-d39d6c3c4acd', userId: 'user_123', originalFilename: 'launch.mp4', displayTitle: 'launch.mp4', sourceLanguage: 'en-IN', videoKey: 'videos/launch.mp4', videoUrl: 'r2://videos/launch.mp4', createdAt: now, updatedAt: now }
const version = { id: '1b27a0eb-5a81-49f1-945d-13eb78cfc8c7', sourceId: source.id, userId: 'user_123', videoUrl: null, videoKey: null, audioKey: null, dubbedAudioKey: null, dubbedVideoKey: null, sourceLanguage: 'en-IN', targetLanguage: 'hi-IN', transcriptionLanguage: null, voiceCloneId: null, transcriptJson: null, translationJson: null, status: 'pending' as const, dubbedVideoUrl: null, errorMessage: null, createdAt: now, updatedAt: now }

const response = () => {
  const res = { locals: { userId: 'user_123' }, status: vi.fn(), json: vi.fn(), redirect: vi.fn(), send: vi.fn() }
  res.status.mockReturnValue(res)
  return res as unknown as Response & typeof res
}

const insertReturning = (row: unknown) => {
  const returning = vi.fn().mockResolvedValue([row])
  const values = vi.fn(() => ({ returning }))
  return { values }
}

describe('reusable source-video controller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createVideoObjectKey.mockReturnValue('videos/launch.mp4')
    mocks.getStoredVideoUrl.mockReturnValue('r2://videos/launch.mp4')
    mocks.getSignedObjectUrl.mockImplementation(async (key: string) => `https://cdn.test/${key}`)
    mocks.getSignedObjectDownloadUrl.mockResolvedValue('https://cdn.test/download')
    mocks.createPresignedVideoUpload.mockResolvedValue('https://r2.test/upload')
    mocks.getUploadedVideoMetadata.mockResolvedValue({
      ContentLength: 5,
      ContentType: 'video/mp4',
      Metadata: { 'upload-owner': 'user_123' },
    })
    mocks.publishDubbingJob.mockResolvedValue(undefined)
    mocks.db.transaction.mockImplementation(async (callback: (tx: typeof mocks.db) => unknown) => callback(mocks.db))
  })

  it('creates a user-bound direct upload URL', async () => {
    const res = response()
    await createDubbingUpload(
      {
        body: { originalFilename: 'launch.mp4', contentType: 'video/mp4' },
      } as Request,
      res,
    )

    expect(mocks.createPresignedVideoUpload).toHaveBeenCalledWith({
      key: 'videos/launch.mp4',
      contentType: 'video/mp4',
      userId: 'user_123',
    })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          videoKey: 'videos/launch.mp4',
          uploadUrl: 'https://r2.test/upload',
        }),
      }),
    )
  })

  it('creates one user-owned source and its first language version from a verified direct upload', async () => {
    const sourceInsert = insertReturning(source)
    const versionInsert = insertReturning(version)
    mocks.db.insert.mockReturnValueOnce(sourceInsert).mockReturnValueOnce(versionInsert)
    const res = response()
    await createDubbingJob({ body: { sourceLanguage: 'en-IN', targetLanguage: 'hi-IN', originalFilename: 'launch.mp4', videoKey: 'videos/launch.mp4' } } as unknown as Request, res)

    expect(sourceInsert.values).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user_123', originalFilename: 'launch.mp4', displayTitle: 'launch.mp4', videoKey: 'videos/launch.mp4' }))
    expect(versionInsert.values).toHaveBeenCalledWith(expect.objectContaining({ sourceId: source.id, targetLanguage: 'hi-IN', status: 'pending' }))
    expect(mocks.publishDubbingJob).toHaveBeenCalledWith({ jobId: version.id })
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ id: source.id, versions: [expect.objectContaining({ id: version.id })] }) }))
  })

  it('retains the source and marks its version failed when enqueueing fails', async () => {
    mocks.db.insert.mockReturnValueOnce(insertReturning(source)).mockReturnValueOnce(insertReturning(version))
    const where = vi.fn().mockResolvedValue(undefined)
    mocks.db.update.mockReturnValue({ set: vi.fn(() => ({ where })) })
    mocks.publishDubbingJob.mockRejectedValue(new Error('queue unavailable'))
    await expect(createDubbingJob({ body: { sourceLanguage: 'en-IN', targetLanguage: 'hi-IN', originalFilename: 'launch.mp4', videoKey: 'videos/launch.mp4' } } as unknown as Request, response())).rejects.toMatchObject<HttpError>({ statusCode: 500, message: 'Failed to enqueue dubbing job' })
    expect(mocks.db.update).toHaveBeenCalled()
  })

  it('rejects a direct upload owned by another user', async () => {
    mocks.getUploadedVideoMetadata.mockResolvedValue({
      ContentLength: 5,
      ContentType: 'video/mp4',
      Metadata: { 'upload-owner': 'another-user' },
    })

    await expect(
      createDubbingJob(
        {
          body: {
            sourceLanguage: 'en-IN',
            targetLanguage: 'hi-IN',
            originalFilename: 'launch.mp4',
            videoKey: 'videos/launch.mp4',
          },
        } as Request,
        response(),
      ),
    ).rejects.toMatchObject<HttpError>({ statusCode: 403 })
    expect(mocks.db.transaction).not.toHaveBeenCalled()
  })

  it.each([
    ['missing', null, 400],
    [
      'oversized',
      {
        ContentLength: 50 * 1024 * 1024 + 1,
        ContentType: 'video/mp4',
        Metadata: { 'upload-owner': 'user_123' },
      },
      400,
    ],
  ])('rejects a %s direct upload before creating a job', async (_case, uploadedVideo, statusCode) => {
    mocks.getUploadedVideoMetadata.mockResolvedValue(uploadedVideo)

    await expect(
      createDubbingJob(
        {
          body: {
            sourceLanguage: 'en-IN',
            targetLanguage: 'hi-IN',
            originalFilename: 'launch.mp4',
            videoKey: 'videos/launch.mp4',
          },
        } as Request,
        response(),
      ),
    ).rejects.toMatchObject<HttpError>({ statusCode })
    expect(mocks.db.transaction).not.toHaveBeenCalled()
  })

  it('groups only the authenticated user\'s language versions below their source', async () => {
    const orderBy = vi.fn().mockResolvedValue([{ source, version }])
    const where = vi.fn(() => ({ orderBy }))
    mocks.db.select.mockReturnValue({ from: vi.fn(() => ({ leftJoin: vi.fn(() => ({ where })) })) })
    const res = response()
    await listDubbingJobs({} as Request, res)
    expect(mocks.eq).toHaveBeenCalledWith(expect.anything(), 'user_123')
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: [expect.objectContaining({ id: source.id, versions: [expect.objectContaining({ id: version.id })] })] }))
  })

  it('allows download only for a completed language version owned through its source', async () => {
    const completed = { ...version, status: 'completed' as const, dubbedVideoKey: 'dubbed/launch.mp4' }
    const where = vi.fn().mockResolvedValue([{ source, version: completed }])
    mocks.db.select.mockReturnValue({ from: vi.fn(() => ({ where })) })
    const res = response()
    await downloadDubbingJobVideo({ params: { id: version.id } } as unknown as Request, res)
    expect(res.redirect).toHaveBeenCalledWith('https://cdn.test/download')
  })

  it('reuses an owned source to create and enqueue a different language without uploading', async () => {
    const tamilVersion = { ...version, id: 'dc868836-2efe-44c7-988d-45337927abdc', targetLanguage: 'ta-IN' }
    const sourceWhere = vi.fn(() => ({ for: vi.fn().mockResolvedValue([source]) }))
    const versionsWhere = vi.fn().mockResolvedValue([])
    mocks.db.select
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: sourceWhere })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: versionsWhere })) })
    const versionInsert = insertReturning(tamilVersion)
    mocks.db.insert.mockReturnValue(versionInsert)
    const sourceUpdateWhere = vi.fn().mockResolvedValue(undefined)
    mocks.db.update.mockReturnValue({ set: vi.fn(() => ({ where: sourceUpdateWhere })) })

    const res = response()
    await createSourceVersion({ params: { sourceId: source.id }, body: { targetLanguage: 'ta-IN' } } as unknown as Request, res)

    expect(mocks.getUploadedVideoMetadata).not.toHaveBeenCalled()
    expect(versionInsert.values).toHaveBeenCalledWith(expect.objectContaining({ sourceId: source.id, sourceLanguage: 'en-IN', targetLanguage: 'ta-IN', status: 'pending' }))
    expect(mocks.publishDubbingJob).toHaveBeenCalledWith({ jobId: tamilVersion.id })
    expect(res.status).toHaveBeenCalledWith(201)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ id: tamilVersion.id, targetLanguage: 'ta-IN' }) }))
  })

  it('returns an ownership-safe not found for another user source', async () => {
    mocks.db.select.mockReturnValue({ from: vi.fn(() => ({ where: vi.fn(() => ({ for: vi.fn().mockResolvedValue([]) })) })) })
    await expect(createSourceVersion({ params: { sourceId: source.id }, body: { targetLanguage: 'ta-IN' } } as unknown as Request, response())).rejects.toMatchObject<HttpError>({ statusCode: 404 })
  })

  it('rejects an unsupported target language before accessing the source', async () => {
    await expect(createSourceVersion({ params: { sourceId: source.id }, body: { targetLanguage: 'fr-FR' } } as unknown as Request, response())).rejects.toMatchObject({ name: 'ZodError' })
    expect(mocks.db.transaction).not.toHaveBeenCalled()
  })

  it('rejects the locked source language as a target', async () => {
    mocks.db.select.mockReturnValue({ from: vi.fn(() => ({ where: vi.fn(() => ({ for: vi.fn().mockResolvedValue([source]) })) })) })
    await expect(createSourceVersion({ params: { sourceId: source.id }, body: { targetLanguage: 'en-IN' } } as unknown as Request, response())).rejects.toMatchObject<HttpError>({ statusCode: 400 })
  })

  it.each([
    ['processing', 'Another language version is already active'],
    ['completed', 'This target language has already been added'],
  ] as const)('returns a conflict when an existing version is %s', async (status, message) => {
    const sourceWhere = vi.fn(() => ({ for: vi.fn().mockResolvedValue([source]) }))
    const versionsWhere = vi.fn().mockResolvedValue([{ ...version, status, targetLanguage: status === 'completed' ? 'ta-IN' : 'hi-IN' }])
    mocks.db.select.mockReturnValueOnce({ from: vi.fn(() => ({ where: sourceWhere })) }).mockReturnValueOnce({ from: vi.fn(() => ({ where: versionsWhere })) })
    await expect(createSourceVersion({ params: { sourceId: source.id }, body: { targetLanguage: 'ta-IN' } } as unknown as Request, response())).rejects.toMatchObject<HttpError>({ statusCode: 409, message })
  })

  it('does not turn a failed language into an implicit retry', async () => {
    const sourceWhere = vi.fn(() => ({ for: vi.fn().mockResolvedValue([source]) }))
    const versionsWhere = vi.fn().mockResolvedValue([{ ...version, status: 'failed', targetLanguage: 'ta-IN' }])
    mocks.db.select.mockReturnValueOnce({ from: vi.fn(() => ({ where: sourceWhere })) }).mockReturnValueOnce({ from: vi.fn(() => ({ where: versionsWhere })) })
    await expect(createSourceVersion({ params: { sourceId: source.id }, body: { targetLanguage: 'ta-IN' } } as unknown as Request, response())).rejects.toMatchObject<HttpError>({ statusCode: 409, message: 'Failed language versions require the separate retry flow' })
  })

  it('retains and marks a newly created version failed when enqueueing fails', async () => {
    const failedVersion = { ...version, id: 'dc868836-2efe-44c7-988d-45337927abdc', targetLanguage: 'ta-IN' }
    mocks.db.select.mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ for: vi.fn().mockResolvedValue([source]) })) })) }).mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([]) })) })
    mocks.db.insert.mockReturnValue(insertReturning(failedVersion))
    const where = vi.fn().mockResolvedValue(undefined)
    const set = vi.fn(() => ({ where }))
    mocks.db.update.mockReturnValue({ set })
    mocks.publishDubbingJob.mockRejectedValue(new Error('queue unavailable'))
    await expect(createSourceVersion({ params: { sourceId: source.id }, body: { targetLanguage: 'ta-IN' } } as unknown as Request, response())).rejects.toMatchObject<HttpError>({ statusCode: 500 })
    expect(mocks.db.update).toHaveBeenCalledTimes(2)
    expect(set).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'failed', errorMessage: 'queue unavailable' }))
    expect(mocks.deleteObjectsFromR2).not.toHaveBeenCalled()
  })

  it('maps a database uniqueness race to a conflict', async () => {
    mocks.db.transaction.mockRejectedValue(Object.assign(new Error('duplicate'), { code: '23505' }))
    await expect(createSourceVersion({ params: { sourceId: source.id }, body: { targetLanguage: 'ta-IN' } } as unknown as Request, response())).rejects.toMatchObject<HttpError>({ statusCode: 409 })
  })

  describe('deleting a source video', () => {
    const arrangeLockedSource = (versions: unknown[]) => {
      const sourceWhere = vi.fn(() => ({ for: vi.fn().mockResolvedValue([source]) }))
      const versionsWhere = vi.fn().mockResolvedValue(versions)
      mocks.db.select
        .mockReturnValueOnce({ from: vi.fn(() => ({ where: sourceWhere })) })
        .mockReturnValueOnce({ from: vi.fn(() => ({ where: versionsWhere })) })
    }

    const arrangeMissingScopedSource = () => {
      mocks.db.select.mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({ for: vi.fn().mockResolvedValue([]) })),
        })),
      })
    }

    it('returns not found for a missing source without deleting media or records', async () => {
      arrangeMissingScopedSource()

      await expect(
        deleteSourceVideo(
          { params: { sourceId: source.id } } as unknown as Request,
          response(),
        ),
      ).rejects.toMatchObject<HttpError>({
        statusCode: 404,
        message: 'Source video not found',
      })
      expect(mocks.deleteObjectsFromR2).not.toHaveBeenCalled()
      expect(mocks.db.delete).not.toHaveBeenCalled()
    })

    it('uses the ownership predicate and returns the same not found for an unowned source', async () => {
      arrangeMissingScopedSource()

      await expect(
        deleteSourceVideo(
          { params: { sourceId: source.id } } as unknown as Request,
          response(),
        ),
      ).rejects.toMatchObject<HttpError>({ statusCode: 404 })
      expect(mocks.eq).toHaveBeenCalledWith(sourceVideos.userId, 'user_123')
      expect(mocks.deleteObjectsFromR2).not.toHaveBeenCalled()
    })

    it('returns the same not found for a malformed source id before querying PostgreSQL', async () => {
      await expect(
        deleteSourceVideo(
          { params: { sourceId: 'not-a-uuid' } } as unknown as Request,
          response(),
        ),
      ).rejects.toMatchObject<HttpError>({
        statusCode: 404,
        message: 'Source video not found',
      })
      expect(mocks.db.transaction).not.toHaveBeenCalled()
    })

    it.each(['pending', 'processing'] as const)(
      'rejects deletion while a version is %s',
      async (status) => {
        arrangeLockedSource([{ ...version, status }])

        await expect(
          deleteSourceVideo(
            { params: { sourceId: source.id } } as unknown as Request,
            response(),
          ),
        ).rejects.toMatchObject<HttpError>({ statusCode: 409 })
        expect(mocks.deleteObjectsFromR2).not.toHaveBeenCalled()
        expect(mocks.db.delete).not.toHaveBeenCalled()
      },
    )

    it('deduplicates all source and version media, then deletes children before the source', async () => {
      const completed = {
        ...version,
        status: 'completed' as const,
        audioKey: 'audio/shared.mp3',
        dubbedAudioKey: 'dubbed-audio/hi.m4a',
        dubbedVideoKey: 'dubbed/hi.mp4',
      }
      const failed = {
        ...version,
        id: 'dc868836-2efe-44c7-988d-45337927abdc',
        status: 'failed' as const,
        targetLanguage: 'ta-IN',
        audioKey: 'audio/shared.mp3',
        dubbedAudioKey: 'dubbed-audio/ta.m4a',
        dubbedVideoKey: null,
      }
      arrangeLockedSource([completed, failed])
      const childWhere = vi.fn().mockResolvedValue(undefined)
      const sourceWhere = vi.fn().mockResolvedValue(undefined)
      mocks.db.delete
        .mockReturnValueOnce({ where: childWhere })
        .mockReturnValueOnce({ where: sourceWhere })
      const res = response()

      await deleteSourceVideo(
        { params: { sourceId: source.id } } as unknown as Request,
        res,
      )

      expect(mocks.deleteObjectsFromR2).toHaveBeenCalledWith([
        'videos/launch.mp4',
        'audio/shared.mp3',
        'dubbed-audio/hi.m4a',
        'dubbed/hi.mp4',
        'dubbed-audio/ta.m4a',
      ])
      expect(mocks.deleteObjectsFromR2.mock.invocationCallOrder[0]).toBeLessThan(
        mocks.db.delete.mock.invocationCallOrder[0],
      )
      expect(mocks.db.delete).toHaveBeenNthCalledWith(1, dubbingJobs)
      expect(mocks.db.delete).toHaveBeenNthCalledWith(2, sourceVideos)
      expect(res.status).toHaveBeenCalledWith(204)
      expect(res.send).toHaveBeenCalled()
    })

    it('retains database records when complete R2 deletion cannot be confirmed', async () => {
      arrangeLockedSource([{ ...version, status: 'completed' }])
      mocks.deleteObjectsFromR2.mockRejectedValue(
        new Error('R2 returned per-object errors'),
      )

      await expect(
        deleteSourceVideo(
          { params: { sourceId: source.id } } as unknown as Request,
          response(),
        ),
      ).rejects.toMatchObject<HttpError>({ statusCode: 500 })
      expect(mocks.db.delete).not.toHaveBeenCalled()
    })

    it('returns a retry-safe failure when database cleanup fails after storage cleanup', async () => {
      arrangeLockedSource([{ ...version, status: 'completed' }])
      mocks.db.delete.mockReturnValue({
        where: vi.fn().mockRejectedValue(new Error('database unavailable')),
      })

      await expect(
        deleteSourceVideo(
          { params: { sourceId: source.id } } as unknown as Request,
          response(),
        ),
      ).rejects.toMatchObject<HttpError>({ statusCode: 500 })
      expect(mocks.deleteObjectsFromR2).toHaveBeenCalledTimes(1)
    })
  })
})
