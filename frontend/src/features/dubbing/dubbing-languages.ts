export const DUBBING_LANGUAGES = [
  { code: 'bn-IN', name: 'Bengali' },
  { code: 'en-IN', name: 'English' },
  { code: 'gu-IN', name: 'Gujarati' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'kn-IN', name: 'Kannada' },
  { code: 'ml-IN', name: 'Malayalam' },
  { code: 'mr-IN', name: 'Marathi' },
  { code: 'od-IN', name: 'Odia' },
  { code: 'pa-IN', name: 'Punjabi' },
  { code: 'ta-IN', name: 'Tamil' },
  { code: 'te-IN', name: 'Telugu' },
] as const

export const DUBBING_LANGUAGE_CODES = DUBBING_LANGUAGES.map((language) => language.code)
export const AUTO_SOURCE_LANGUAGE_CODE = 'auto'

export const getDubbingLanguageName = (code: string | null | undefined) => {
  if (!code) {
    return null
  }

  if (code === AUTO_SOURCE_LANGUAGE_CODE) {
    return 'Auto-detect'
  }

  return DUBBING_LANGUAGES.find((language) => language.code === code)?.name ?? code
}
