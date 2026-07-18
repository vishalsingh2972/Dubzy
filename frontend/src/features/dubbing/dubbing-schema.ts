import { z } from 'zod'
import {
  AUTO_SOURCE_LANGUAGE_CODE,
  DUBBING_LANGUAGE_CODES,
  DUBBING_LANGUAGES,
} from './dubbing-languages'

export const LANGUAGES = DUBBING_LANGUAGES
export const AUTO_SOURCE_LANGUAGE = AUTO_SOURCE_LANGUAGE_CODE

const isSupportedLanguageCode = (value: string) => {
  return DUBBING_LANGUAGE_CODES.includes(
    value as (typeof DUBBING_LANGUAGE_CODES)[number],
  )
}

const targetLanguageSchema = z
  .string()
  .min(1, 'Please select a target language')
  .refine(isSupportedLanguageCode, 'Please select a supported target language')

export const dubbingSchema = z.object({
  sourceLanguage: z
    .string()
    .min(1, 'Please select a source language')
    .refine(
      (value) => value === AUTO_SOURCE_LANGUAGE_CODE || isSupportedLanguageCode(value),
      'Please select a supported source language',
    ),
  targetLanguage: targetLanguageSchema,
}).refine(
  (value) =>
    value.sourceLanguage === AUTO_SOURCE_LANGUAGE_CODE ||
    value.sourceLanguage !== value.targetLanguage,
  {
    message: 'Choose a different target language',
    path: ['targetLanguage'],
  },
)

export type DubbingFormData = z.infer<typeof dubbingSchema>

export const addSourceVersionSchema = z.object({
  targetLanguage: targetLanguageSchema,
})

export type AddSourceVersionFormData = z.infer<typeof addSourceVersionSchema>
