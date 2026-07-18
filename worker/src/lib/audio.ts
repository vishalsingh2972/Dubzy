import { readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

const MIN_TEMPO_FACTOR = 0.75
const MAX_TEMPO_FACTOR = 1.35
const TIMING_TOLERANCE_SECONDS = 0.02

const clamp = (value: number, minimum: number, maximum: number) => {
  return Math.min(maximum, Math.max(minimum, value))
}

const formatFilterNumber = (value: number) => {
  return value.toFixed(6).replace(/\.?0+$/, '')
}

const runProcess = async (command: string, args: string[]) => {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args)

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(stderr || stdout || `${command} exited with code ${code}`))
    })
  })
}

export const extractAudioFromVideo = async (inputPath: string, outputPath: string) => {
  await runProcess('ffmpeg', [
      '-y',
      '-i',
      inputPath,
      '-vn',
      '-acodec',
      'libmp3lame',
      outputPath,
  ])

  return readFile(outputPath)
}

export const trimAudioSample = async (
  inputPath: string,
  outputPath: string,
  durationSeconds = 12,
  startTimeSeconds = 0,
) => {
  const args = ['-y']

  if (startTimeSeconds > 0) {
    args.push('-ss', `${startTimeSeconds}`)
  }

  args.push(
    '-i',
    inputPath,
    '-t',
    `${durationSeconds}`,
    '-ac',
    '1',
    '-ar',
    '16000',
    '-c:a',
    'pcm_s16le',
    outputPath,
  )

  await runProcess('ffmpeg', args)
}

export const getMediaDuration = async (inputPath: string) => {
  let stdout = ''

  await new Promise<void>((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      inputPath,
    ])

    let stderr = ''

    ffprobe.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })

    ffprobe.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    ffprobe.on('error', reject)
    ffprobe.on('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(stderr || `ffprobe exited with code ${code}`))
    })
  })

  const duration = Number.parseFloat(stdout.trim())

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Unable to determine media duration for ${inputPath}`)
  }

  return duration
}

export const mixDubbedSegments = async (input: {
  outputPath: string
  totalDurationSeconds: number
  segments: Array<{
    audioPath: string
    startTimeSeconds: number
    targetDurationSeconds: number
  }>
}) => {
  if (input.segments.length === 0) {
    throw new Error('Cannot mix dubbed audio without synthesized segments')
  }

  if (!Number.isFinite(input.totalDurationSeconds) || input.totalDurationSeconds <= 0) {
    throw new Error('Cannot mix dubbed audio without a positive source duration')
  }

  const totalDurationSeconds = formatFilterNumber(input.totalDurationSeconds)
  const args = [
    '-y',
    '-f',
    'lavfi',
    '-i',
    'anullsrc=channel_layout=stereo:sample_rate=44100',
  ]

  for (const segment of input.segments) {
    args.push('-i', segment.audioPath)
  }

  const filters = [
    `[0:a]atrim=0:${totalDurationSeconds},asetpts=N/SR/TB[base]`,
  ]

  for (const [index, segment] of input.segments.entries()) {
    const delay = Math.max(0, Math.round(segment.startTimeSeconds * 1000))
    const inputIndex = index + 1
    const targetDurationSeconds = formatFilterNumber(segment.targetDurationSeconds)
    filters.push(
      `[${inputIndex}:a]atrim=0:${targetDurationSeconds},asetpts=N/SR/TB,adelay=${delay}|${delay}[seg${inputIndex}]`,
    )
  }

  const mixInputs = [
    '[base]',
    ...input.segments.map((_segment, index) => `[seg${index + 1}]`),
  ].join('')

  filters.push(
    `${mixInputs}amix=inputs=${input.segments.length + 1}:duration=longest:dropout_transition=0:normalize=0,atrim=0:${totalDurationSeconds},asetpts=N/SR/TB[out]`,
  )

  args.push(
    '-filter_complex',
    filters.join(';'),
    '-map',
    '[out]',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-t',
    `${input.totalDurationSeconds}`,
    input.outputPath,
  )

  await runProcess('ffmpeg', args)
}

export const normalizeAudioForMix = async (inputPath: string, outputPath: string) => {
  try {
    await runProcess('ffmpeg', [
      '-y',
      '-i',
      inputPath,
      '-ac',
      '2',
      '-ar',
      '44100',
      '-c:a',
      'pcm_s16le',
      outputPath,
    ])
  } catch (error) {
    throw new Error(
      `Unable to normalize synthesized audio ${inputPath}: ${getErrorMessage(error)}`,
    )
  }
}

export const prepareAudioClipForTimeline = async (input: {
  inputPath: string
  outputPath: string
  targetDurationSeconds: number
  minTempoFactor?: number
  maxTempoFactor?: number
}) => {
  if (!Number.isFinite(input.targetDurationSeconds) || input.targetDurationSeconds <= 0) {
    throw new Error('Cannot prepare a dubbed segment without a positive target duration')
  }

  const rawDurationSeconds = await getMediaDuration(input.inputPath)
  const minTempoFactor = input.minTempoFactor ?? MIN_TEMPO_FACTOR
  const maxTempoFactor = input.maxTempoFactor ?? MAX_TEMPO_FACTOR

  if (minTempoFactor <= 0 || maxTempoFactor <= 0 || minTempoFactor > maxTempoFactor) {
    throw new Error('Invalid audio tempo bounds')
  }

  const tempoFactor = clamp(
    rawDurationSeconds / input.targetDurationSeconds,
    minTempoFactor,
    maxTempoFactor,
  )
  const estimatedDurationSeconds = rawDurationSeconds / tempoFactor
  const targetDurationSeconds = formatFilterNumber(input.targetDurationSeconds)
  const wasTrimmed =
    estimatedDurationSeconds > input.targetDurationSeconds + TIMING_TOLERANCE_SECONDS
  const silencePaddingSeconds = Math.max(
    0,
    input.targetDurationSeconds - Math.min(estimatedDurationSeconds, input.targetDurationSeconds),
  )

  try {
    await runProcess('ffmpeg', [
      '-y',
      '-i',
      input.inputPath,
      '-af',
      [
        `atempo=${formatFilterNumber(tempoFactor)}`,
        `atrim=0:${targetDurationSeconds}`,
        'apad',
        `atrim=0:${targetDurationSeconds}`,
        'asetpts=N/SR/TB',
      ].join(','),
      '-ac',
      '2',
      '-ar',
      '44100',
      '-c:a',
      'pcm_s16le',
      input.outputPath,
    ])
  } catch (error) {
    throw new Error(
      `Unable to prepare synthesized audio ${input.inputPath}: ${getErrorMessage(error)}`,
    )
  }

  return {
    rawDurationSeconds,
    tempoFactor,
    fittedDurationSeconds: await getMediaDuration(input.outputPath),
    silencePaddingSeconds,
    wasTrimmed,
  }
}

export const muxAudioIntoVideo = async (input: {
  videoPath: string
  audioPath: string
  outputPath: string
}) => {
  await runProcess('ffmpeg', [
    '-y',
    '-i',
    input.videoPath,
    '-i',
    input.audioPath,
    '-map',
    '0:v:0',
    '-map',
    '1:a:0',
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-shortest',
    input.outputPath,
  ])
}
