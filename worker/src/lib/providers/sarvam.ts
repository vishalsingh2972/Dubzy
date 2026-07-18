import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { SarvamAIClient, type SarvamAI } from 'sarvamai'
import { env } from '../../config/env.js'
import type {
  TranscriptSegment,
  TranscriptionResult,
} from '../../processes/dubbing-job/types.js'
import { assertSarvamLanguageCode } from './sarvam-languages.js'

const sarvamClient = new SarvamAIClient({
  apiSubscriptionKey: env.SARVAM_API_KEY,
})

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const getEmotion = (value: Record<string, unknown>) => {
  if (typeof value.emotion === 'string') {
    return value.emotion
  }

  if (Array.isArray(value.emotions) && typeof value.emotions[0] === 'string') {
    return value.emotions[0]
  }

  return null
}

const getSegmentsFromResponse = (
  response: Record<string, unknown>,
  transcript: string,
): TranscriptSegment[] => {
  const diarizedTranscript = response.diarized_transcript

  if (
    isRecord(diarizedTranscript) &&
    Array.isArray(diarizedTranscript.entries) &&
    diarizedTranscript.entries.length > 0
  ) {
    const segments: Array<TranscriptSegment | null> = diarizedTranscript.entries.map(
      (entry, index) => {
        if (!isRecord(entry)) {
          return null
        }

        const sourceText =
          typeof entry.transcript === 'string' ? entry.transcript.trim() : ''

        if (!sourceText) {
          return null
        }

        const startTimeSeconds =
          typeof entry.start_time_seconds === 'number' ? entry.start_time_seconds : 0
        const endTimeSeconds =
          typeof entry.end_time_seconds === 'number' ? entry.end_time_seconds : startTimeSeconds

        return {
          index,
          sourceText,
          startTimeSeconds,
          endTimeSeconds,
          speakerId: typeof entry.speaker_id === 'string' ? entry.speaker_id : null,
          emotion: getEmotion(entry),
          metadata: entry,
        } satisfies TranscriptSegment
      },
    )

    return segments.filter((entry): entry is TranscriptSegment => entry !== null)
  }

  const timestamps = response.timestamps

  if (
    isRecord(timestamps) &&
    Array.isArray(timestamps.end_time_seconds) &&
    timestamps.end_time_seconds.length > 0
  ) {
    const lastEndTime = timestamps.end_time_seconds.at(-1)

    return [
      {
        index: 0,
        sourceText: transcript,
        startTimeSeconds: 0,
        endTimeSeconds: typeof lastEndTime === 'number' ? lastEndTime : 0,
        speakerId: null,
        emotion: null,
      },
    ]
  }

  return [
    {
      index: 0,
      sourceText: transcript,
      startTimeSeconds: 0,
      endTimeSeconds: 0,
      speakerId: null,
      emotion: null,
    },
  ]
}

export const transcribeAudioFile = async (
  audioPath: string,
): Promise<TranscriptionResult> => {
  const outputDir = await mkdtemp(path.join(tmpdir(), 'sarvam-stt-'))

  try {
    const job = await sarvamClient.speechToTextJob.createJob({
      model: 'saaras:v3',
      mode: 'transcribe',
      languageCode: 'unknown',
      withDiarization: true,
      withTimestamps: true,
      numSpeakers: 1,
    })

    await job.uploadFiles([audioPath])
    await job.start()
    await job.waitUntilComplete()

    const fileResults = await job.getFileResults()

    if (fileResults.failed.length > 0) {
      const failure = fileResults.failed[0]
      throw new Error(
        failure?.error_message ??
          `Sarvam transcription failed for ${failure?.file_name ?? audioPath}`,
      )
    }

    if (fileResults.successful.length === 0) {
      throw new Error('Sarvam transcription completed without a successful output file')
    }

    await job.downloadOutputs(outputDir)

    const outputPath = path.join(outputDir, `${path.basename(audioPath)}.json`)
    const rawText = await readFile(outputPath, 'utf8')
    const parsed = JSON.parse(rawText) as Record<string, unknown>
    const transcript =
      typeof parsed.transcript === 'string' ? parsed.transcript.trim() : ''

    if (!transcript) {
      throw new Error('Sarvam transcription returned an empty transcript')
    }

    return {
      transcript,
      detectedLanguageCode:
        typeof parsed.language_code === 'string' ? parsed.language_code : null,
      languageProbability:
        typeof parsed.language_probability === 'number'
          ? parsed.language_probability
          : null,
      segments: getSegmentsFromResponse(parsed, transcript),
      raw: parsed,
    }
  } finally {
    await rm(outputDir, { recursive: true, force: true })
  }
}

export const translateText = async (input: {
  text: string
  sourceLanguageCode: string
  targetLanguageCode: string
}) => {
  const sourceLanguageCode = assertSarvamLanguageCode(
    input.sourceLanguageCode,
    'Source language',
  )
  const targetLanguageCode = assertSarvamLanguageCode(
    input.targetLanguageCode,
    'Target language',
  )

  const response = await sarvamClient.text.translate({
    input: input.text,
    source_language_code: sourceLanguageCode as SarvamAI.TranslateSourceLanguage,
    target_language_code: targetLanguageCode as SarvamAI.TranslateTargetLanguage,
    speaker_gender: env.SARVAM_TRANSLATION_SPEAKER_GENDER,
    mode: env.SARVAM_TRANSLATION_MODE,
    model: 'mayura:v1',
    numerals_format: env.SARVAM_TRANSLATION_NUMERALS_FORMAT,
  })

  const translatedText = response.translated_text?.trim()

  if (!translatedText) {
    throw new Error('Sarvam translation returned an empty response')
  }

  return translatedText
}
