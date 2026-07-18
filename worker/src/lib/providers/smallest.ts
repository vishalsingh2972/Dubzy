import path from 'node:path'
import { readFile, writeFile } from 'node:fs/promises'
import { env } from '../../config/env.js'
import { logger } from '../logger.js'
import { toSmallestLanguageCode } from './smallest-languages.js'

const getResponseMessage = async (response: Response) => {
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''

  if (contentType.includes('application/json')) {
    const payload = (await response.json()) as Record<string, unknown>

    if (typeof payload.message === 'string') {
      return payload.message
    }

    if (typeof payload.error === 'string') {
      return payload.error
    }
  }

  if (contentType.startsWith('text/')) {
    const payload = (await response.text()).trim()

    if (payload.length > 0) {
      return payload
    }
  }

  return response.statusText || 'Unknown response payload'
}

const normalizeLanguageCode = (languageCode: string) => {
  return languageCode.split('-')[0]?.toLowerCase() ?? 'en'
}

const normalizeTtsModel = (model: string) => model.replaceAll('-', '_')

const getAudioContentType = (samplePath: string) => {
  const extension = path.extname(samplePath).toLowerCase()

  if (extension === '.wav') {
    return 'audio/wav'
  }

  if (extension === '.mp3') {
    return 'audio/mpeg'
  }

  return 'application/octet-stream'
}

const getNormalizedContentType = (response: Response) => {
  return response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ?? null
}

const isAudioResponseContentType = (contentType: string | null) => {
  return contentType === null || contentType.startsWith('audio/') || contentType === 'application/octet-stream'
}

const isWavBuffer = (buffer: Buffer) => {
  return (
    buffer.byteLength >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WAVE'
  )
}

const getAudioPreview = (buffer: Buffer) => {
  return buffer.subarray(0, 16).toString('hex')
}

export const createVoiceClone = async (input: {
  jobId: string
  samplePath: string
  languageCode: string
}) => {
  const fileBuffer = await readFile(input.samplePath)
  const form = new FormData()
  const contentType = getAudioContentType(input.samplePath)
  const filename = path.basename(input.samplePath)

  form.append('displayName', `dubbing-${input.jobId}`)
  form.append('language', normalizeLanguageCode(input.languageCode))
  if (env.SMALLEST_VOICE_CLONE_ACCENT) {
    form.append('accent', env.SMALLEST_VOICE_CLONE_ACCENT)
  }

  if (env.SMALLEST_VOICE_CLONE_TAGS) {
    form.append('tags', env.SMALLEST_VOICE_CLONE_TAGS)
  }

  form.append('file', new File([fileBuffer], filename, { type: contentType }))

  logger.info('smallest.voice_clone.upload', {
    jobId: input.jobId,
    filename,
    contentType,
    sizeBytes: fileBuffer.byteLength,
    language: normalizeLanguageCode(input.languageCode),
    hasAccent: Boolean(env.SMALLEST_VOICE_CLONE_ACCENT),
    hasTags: Boolean(env.SMALLEST_VOICE_CLONE_TAGS),
  })

  const response = await fetch(`${env.SMALLEST_API_BASE_URL}/waves/v1/voice-cloning`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.SMALLEST_API_KEY}`,
    },
    body: form,
  })

  if (!response.ok) {
    throw new Error(
      `Smallest voice cloning failed: ${response.status} ${await getResponseMessage(response)}`,
    )
  }

  const payload = (await response.json()) as {
    data?: {
      voiceId?: string
    }
  }

  const voiceId = payload.data?.voiceId

  if (!voiceId) {
    throw new Error('Smallest voice cloning did not return a voiceId')
  }

  return voiceId
}

export const synthesizeVoiceCloneSpeech = async (input: {
  text: string
  voiceId: string
  languageCode: string
  speed?: number
  outputPathStem: string
}) => {
  const response = await fetch(
    `${env.SMALLEST_API_BASE_URL}/waves/v1/tts`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.SMALLEST_API_KEY}`,
        Accept: 'audio/wav',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: input.text,
        voice_id: input.voiceId,
        model: normalizeTtsModel(env.SMALLEST_TTS_MODEL),
        sample_rate: 44100,
        speed: input.speed ?? 1,
        language: toSmallestLanguageCode(input.languageCode),
        output_format: 'wav',
      }),
    },
  )

  if (!response.ok) {
    throw new Error(
      `Smallest speech synthesis failed: ${response.status} ${await getResponseMessage(response)}`,
    )
  }

  const contentType = getNormalizedContentType(response)

  if (!isAudioResponseContentType(contentType)) {
    throw new Error(
      `Smallest speech synthesis returned non-audio content (${contentType}): ${await getResponseMessage(response)}`,
    )
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer())

  if (audioBuffer.byteLength === 0) {
    throw new Error('Smallest speech synthesis returned an empty audio response')
  }

  if (!isWavBuffer(audioBuffer)) {
    throw new Error(
      `Smallest speech synthesis returned invalid WAV audio (contentType=${contentType}, sizeBytes=${audioBuffer.byteLength}, firstBytesHex=${getAudioPreview(audioBuffer)})`,
    )
  }

  const outputPath = `${input.outputPathStem}.wav`

  await writeFile(outputPath, audioBuffer)

  return {
    outputPath,
    contentType,
    sizeBytes: audioBuffer.byteLength,
  }
}
