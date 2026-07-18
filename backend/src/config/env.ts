import { config } from 'dotenv'
import { z } from 'zod'

config()

const originUrl = z.url().transform((value) => value.replace(/\/+$/, ''))

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CLIENT_URL: originUrl.default('http://localhost:5173'),
  BETTER_AUTH_URL: originUrl.default('http://localhost:4000'),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, 'BETTER_AUTH_SECRET must be at least 32 characters long'),
  ADMIN_EMAIL: z.email('ADMIN_EMAIL must be a valid email address'),
  ADMIN_PASSWORD: z
    .string()
    .min(8, 'ADMIN_PASSWORD must be at least 8 characters long'),
  ADMIN_SESSION_SECRET: z
    .string()
    .min(32, 'ADMIN_SESSION_SECRET must be at least 32 characters long'),
  ADMIN_SESSION_TTL_HOURS: z.coerce.number().int().positive().default(8),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  PG_BOSS_SCHEMA: z.string().min(1).default('pgboss'),
  R2_ACCOUNT_ID: z.string().min(1, 'R2_ACCOUNT_ID is required'),
  R2_ACCESS_KEY_ID: z.string().min(1, 'R2_ACCESS_KEY_ID is required'),
  R2_SECRET_ACCESS_KEY: z.string().min(1, 'R2_SECRET_ACCESS_KEY is required'),
  R2_BUCKET_NAME: z.string().min(1, 'R2_BUCKET_NAME is required'),
  R2_ENDPOINT: z.url().optional(),
  R2_VIDEO_URL_BASE: z.url().optional(),
  R2_SIGNED_URL_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
})

export const env = envSchema.parse(process.env)
