const SARVAM_LANGUAGE_CODES = [
  'bn-IN',
  'en-IN',
  'gu-IN',
  'hi-IN',
  'kn-IN',
  'ml-IN',
  'mr-IN',
  'od-IN',
  'pa-IN',
  'ta-IN',
  'te-IN',
] as const

const SARVAM_LANGUAGE_ALIASES: Record<string, (typeof SARVAM_LANGUAGE_CODES)[number]> = {
  bn: 'bn-IN',
  'bn-in': 'bn-IN',
  en: 'en-IN',
  'en-in': 'en-IN',
  gu: 'gu-IN',
  'gu-in': 'gu-IN',
  hi: 'hi-IN',
  'hi-in': 'hi-IN',
  kn: 'kn-IN',
  'kn-in': 'kn-IN',
  ml: 'ml-IN',
  'ml-in': 'ml-IN',
  mr: 'mr-IN',
  'mr-in': 'mr-IN',
  od: 'od-IN',
  or: 'od-IN',
  'od-in': 'od-IN',
  'or-in': 'od-IN',
  pa: 'pa-IN',
  'pa-in': 'pa-IN',
  ta: 'ta-IN',
  'ta-in': 'ta-IN',
  te: 'te-IN',
  'te-in': 'te-IN',
} as const

export type SarvamLanguageCode = (typeof SARVAM_LANGUAGE_CODES)[number]

export const sarvamLanguageCodes = [...SARVAM_LANGUAGE_CODES]

export const normalizeSarvamLanguageCode = (languageCode: string) => {
  const normalizedCode = languageCode.trim().toLowerCase()
  return SARVAM_LANGUAGE_ALIASES[normalizedCode] ?? null
}

export const assertSarvamLanguageCode = (languageCode: string, label: string) => {
  const normalizedCode = normalizeSarvamLanguageCode(languageCode)

  if (normalizedCode) {
    return normalizedCode
  }

  throw new Error(
    `${label} "${languageCode}" is not supported. Expected one of: ${sarvamLanguageCodes.join(', ')}`,
  )
}
