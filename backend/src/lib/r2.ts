import { randomUUID } from 'node:crypto'
import path from 'node:path'
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '../config/env.js'

const endpoint =
  env.R2_ENDPOINT ?? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`

export const r2Client = new S3Client({
  region: 'auto',
  endpoint,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
})

const normalizeExtension = (originalname: string) => {
  const extension = path.extname(originalname).toLowerCase()
  return extension || '.bin'
}

export const createVideoObjectKey = (originalname: string) => {
  return `videos/${randomUUID()}${normalizeExtension(originalname)}`
}

export const uploadVideoToR2 = async (input: {
  key: string
  body: Buffer
  contentType: string
}) => {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
    }),
  )
}

export const createPresignedVideoUpload = async (input: {
  key: string
  contentType: string
  userId: string
}) => {
  return getSignedUrl(
    r2Client,
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: input.key,
      ContentType: input.contentType,
      Metadata: { 'upload-owner': input.userId },
    }),
    {
      expiresIn: 15 * 60,
      unhoistableHeaders: new Set(['x-amz-meta-upload-owner']),
    },
  )
}

export const getUploadedVideoMetadata = async (key: string) => {
  try {
    return await r2Client.send(
      new HeadObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: key,
      }),
    )
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      '$metadata' in error &&
      typeof error.$metadata === 'object' &&
      error.$metadata !== null &&
      'httpStatusCode' in error.$metadata &&
      error.$metadata.httpStatusCode === 404
    ) {
      return null
    }
    throw error
  }
}

export const deleteObjectsFromR2 = async (keys: string[]) => {
  const uniqueKeys = [...new Set(keys.filter((key) => key.length > 0))]

  for (let index = 0; index < uniqueKeys.length; index += 1000) {
    const batch = uniqueKeys.slice(index, index + 1000)
    const result = await r2Client.send(
      new DeleteObjectsCommand({
        Bucket: env.R2_BUCKET_NAME,
        Delete: {
          Objects: batch.map((key) => ({ Key: key })),
        },
      }),
    )

    if (result.Errors?.length) {
      throw new Error(
        `Failed to delete ${result.Errors.length} object${result.Errors.length === 1 ? '' : 's'} from R2`,
      )
    }
  }
}

export const getSignedVideoUrl = async (key: string) => {
  return getSignedUrl(
    r2Client,
    new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
    }),
    { expiresIn: env.R2_SIGNED_URL_TTL_SECONDS },
  )
}

export const getSignedObjectUrl = async (key: string) => {
  return getSignedVideoUrl(key)
}

export const getSignedObjectDownloadUrl = async (
  key: string,
  filename: string,
) => {
  return getSignedUrl(
    r2Client,
    new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${filename}"`,
    }),
    { expiresIn: env.R2_SIGNED_URL_TTL_SECONDS },
  )
}

export const getStoredVideoUrl = (key: string) => {
  if (env.R2_VIDEO_URL_BASE) {
    return new URL(
      key,
      `${env.R2_VIDEO_URL_BASE.replace(/\/$/, '')}/`,
    ).toString()
  }

  return `${endpoint}/${env.R2_BUCKET_NAME}/${key}`
}
