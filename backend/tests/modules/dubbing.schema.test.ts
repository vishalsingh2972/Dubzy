import { describe, expect, it } from 'vitest'
import {
  completeDubbingUploadSchema,
  createDubbingSchema,
  createDubbingUploadSchema,
  createSourceVersionSchema,
} from '../../src/modules/dubbing/dubbing.schema.js'

describe('createDubbingSchema', () => {
  it('accepts supported source and target language codes', () => {
    const result = createDubbingSchema.safeParse({
      sourceLanguage: 'en-IN',
      targetLanguage: 'hi-IN',
    })

    expect(result.success).toBe(true)
  })

  it('accepts auto-detected source language', () => {
    const result = createDubbingSchema.safeParse({
      sourceLanguage: 'auto',
      targetLanguage: 'hi-IN',
    })

    expect(result.success).toBe(true)
  })

  it('defaults missing source language to auto', () => {
    const result = createDubbingSchema.safeParse({
      targetLanguage: 'hi-IN',
    })

    expect(result).toMatchObject({
      success: true,
      data: {
        sourceLanguage: 'auto',
        targetLanguage: 'hi-IN',
      },
    })
  })

  it('rejects unsupported language codes', () => {
    const result = createDubbingSchema.safeParse({
      sourceLanguage: 'klingon',
      targetLanguage: 'hi-IN',
    })

    expect(result.success).toBe(false)
  })

  it('rejects removed language codes', () => {
    const result = createDubbingSchema.safeParse({
      sourceLanguage: 'en-IN',
      targetLanguage: 'ur-IN',
    })

    expect(result.success).toBe(false)
  })

  it('rejects matching manual source and target language codes', () => {
    const result = createDubbingSchema.safeParse({
      sourceLanguage: 'hi-IN',
      targetLanguage: 'hi-IN',
    })

    expect(result.success).toBe(false)
  })

  it('rejects missing target language fields', () => {
    const result = createDubbingSchema.safeParse({
      sourceLanguage: 'en-IN',
    })

    expect(result.success).toBe(false)
  })
})

describe('createSourceVersionSchema', () => {
  it('accepts only a supported target language', () => {
    expect(createSourceVersionSchema.parse({ targetLanguage: 'ta-IN' })).toEqual({ targetLanguage: 'ta-IN' })
    expect(() => createSourceVersionSchema.parse({ targetLanguage: 'fr-FR' })).toThrow()
    expect(() => createSourceVersionSchema.parse({ targetLanguage: 'ta-IN', sourceLanguage: 'en-IN' })).toThrow()
  })
})

describe('direct video upload schemas', () => {
  it('accepts a video upload request and completion payload', () => {
    expect(
      createDubbingUploadSchema.parse({
        originalFilename: 'launch.mp4',
        contentType: 'video/mp4',
      }),
    ).toEqual({ originalFilename: 'launch.mp4', contentType: 'video/mp4' })
    expect(
      completeDubbingUploadSchema.parse({
        originalFilename: 'launch.mp4',
        videoKey: 'videos/2b7d9a67-a3f4-4bc1-9a9b-1c4ce1d1dd64.mp4',
        sourceLanguage: 'auto',
        targetLanguage: 'hi-IN',
      }),
    ).toMatchObject({ videoKey: expect.stringContaining('videos/') })
  })

  it('rejects non-video upload requests and object keys outside the video prefix', () => {
    expect(
      createDubbingUploadSchema.safeParse({
        originalFilename: 'audio.mp3',
        contentType: 'audio/mpeg',
      }).success,
    ).toBe(false)
    expect(
      completeDubbingUploadSchema.safeParse({
        originalFilename: 'launch.mp4',
        videoKey: 'audio/launch.mp4',
        sourceLanguage: 'auto',
        targetLanguage: 'hi-IN',
      }).success,
    ).toBe(false)
  })
})
