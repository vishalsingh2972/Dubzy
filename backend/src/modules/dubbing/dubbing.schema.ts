import { z } from 'zod'
import {
  AUTO_SOURCE_LANGUAGE_CODE,
  DUBBING_LANGUAGE_CODES,
} from './dubbing-languages.js'

const sourceLanguageSchema = z
  .enum([AUTO_SOURCE_LANGUAGE_CODE, ...DUBBING_LANGUAGE_CODES])
  .default(AUTO_SOURCE_LANGUAGE_CODE)

export const createDubbingSchema = z
  .object({
    sourceLanguage: sourceLanguageSchema,
    targetLanguage: z.enum(DUBBING_LANGUAGE_CODES),
  })
  .refine(
    (value) =>
      value.sourceLanguage === AUTO_SOURCE_LANGUAGE_CODE ||
      value.sourceLanguage !== value.targetLanguage,
    {
      message: 'Source and target languages must be different',
      path: ['targetLanguage'],
    },
  )

export const createDubbingUploadSchema = z
  .object({
    originalFilename: z.string().trim().min(1).max(255),
    contentType: z.string().startsWith('video/'),
  })
  .strict()

export const completeDubbingUploadSchema = createDubbingSchema
  .extend({
    originalFilename: z.string().trim().min(1).max(255),
    videoKey: z.string().startsWith('videos/').max(512),
  })
  .strict()

export const createSourceVersionSchema = z
  .object({
    targetLanguage: z.enum(DUBBING_LANGUAGE_CODES),
  })
  .strict()

export const transcriptSegmentSchema = z.object({
  index: z.number().int().nonnegative(),
  sourceText: z.string(),
  translatedText: z.string().optional(),
  startTimeSeconds: z.number(),
  endTimeSeconds: z.number(),
  speakerId: z.string().nullable(),
  emotion: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const dubbingJobResponseSchema = z.object({
  id: z.string().uuid(),
  videoUrl: z.string().url().nullable(),
  videoKey: z.string().nullable(),
  audioKey: z.string().nullable(),
  audioUrl: z.string().url().nullable(),
  dubbedAudioKey: z.string().nullable(),
  dubbedAudioUrl: z.string().url().nullable(),
  dubbedVideoKey: z.string().nullable(),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
  transcriptionLanguage: z.string().nullable(),
  voiceCloneId: z.string().nullable(),
  transcriptSegments: z.array(transcriptSegmentSchema).nullable(),
  translatedSegments: z.array(transcriptSegmentSchema).nullable(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  dubbedVideoUrl: z.string().url().nullable(),
  errorMessage: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type CreateDubbingInput = z.infer<typeof createDubbingSchema>
export type DubbingJobResponse = z.infer<typeof dubbingJobResponseSchema>
