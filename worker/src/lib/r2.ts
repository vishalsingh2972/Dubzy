import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { env } from '../config/env.js'

const endpoint = env.R2_ENDPOINT ?? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`

export const r2Client = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
})

export const createAudioObjectKey = (jobId: string) => {
  return `audio/${jobId}.mp3`
}

export const createDubbedAudioObjectKey = (jobId: string) => {
  return `dubbed-audio/${jobId}.m4a`
}

export const createDubbedVideoObjectKey = (jobId: string) => {
  return `dubbed/${jobId}.mp4`
}

export const getStoredObjectUrl = (key: string) => {
  if (env.R2_VIDEO_URL_BASE) {
    return new URL(
      key,
      `${env.R2_VIDEO_URL_BASE.replace(/\/$/, '')}/`,
    ).toString()
  }

  return `${endpoint}/${env.R2_BUCKET_NAME}/${key}`
}

export const downloadObjectToFile = async (key: string, outputPath: string) => {
  const response = await r2Client.send(
    new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
    }),
  )

  if (!response.Body) {
    throw new Error(`Missing object body for ${key}`)
  }

  await mkdir(dirname(outputPath), { recursive: true })

  const body = response.Body as Readable

  await pipeline(body, createWriteStream(outputPath))
}

export const uploadAudioToR2 = async (
  key: string,
  file: Buffer,
  contentType = 'audio/mpeg',
) => {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
    }),
  )
}

export const uploadVideoToR2 = async (input: {
  key: string
  file: Buffer
  contentType: string
}) => {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: input.key,
      Body: input.file,
      ContentType: input.contentType,
    }),
  )
}
