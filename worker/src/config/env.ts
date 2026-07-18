import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  PG_BOSS_SCHEMA: z.string().min(1).default("pgboss"),
  R2_ACCOUNT_ID: z.string().min(1, "R2_ACCOUNT_ID is required"),
  R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID is required"),
  R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY is required"),
  R2_BUCKET_NAME: z.string().min(1, "R2_BUCKET_NAME is required"),
  R2_ENDPOINT: z.url().optional(),
  R2_VIDEO_URL_BASE: z.url().optional(),
  R2_SIGNED_URL_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  SARVAM_API_KEY: z.string().min(1, "SARVAM_API_KEY is required"),
  SARVAM_TRANSLATION_MODE: z
    .enum(["formal", "modern-colloquial", "classic-colloquial"])
    .default("modern-colloquial"),
  SARVAM_TRANSLATION_NUMERALS_FORMAT: z
    .enum(["native", "international"])
    .default("international"),
  SARVAM_TRANSLATION_SPEAKER_GENDER: z.enum(['Male', 'Female']).optional(),
  SMALLEST_API_KEY: z.string().min(1, "SMALLEST_API_KEY is required"),
  SMALLEST_API_BASE_URL: z.url().default("https://api.smallest.ai"),
  SMALLEST_TTS_MODEL: z.string().min(1).default("lightning_v3.1"),
  SMALLEST_VOICE_CLONE_ACCENT: z.string().min(1).default("general"),
  SMALLEST_VOICE_CLONE_TAGS: z.string().optional(),
});

export const env = envSchema.parse(process.env);
