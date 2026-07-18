import { sql } from 'drizzle-orm'
import { index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

export const jobStatusEnum = pgEnum('job_status', ['pending', 'processing', 'completed', 'failed'])

export const sourceVideos = pgTable('source_videos', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id'),
  originalFilename: text('original_filename'),
  displayTitle: text('display_title').notNull(),
  sourceLanguage: text('source_language').notNull(),
  videoUrl: text('video_url'),
  videoKey: text('video_key'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const dubbingJobs = pgTable('dubbing_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  sourceId: uuid('source_id').references(() => sourceVideos.id, { onDelete: 'restrict' }),
  userId: text('user_id'),
  videoUrl: text('video_url'),
  videoKey: text('video_key'),
  audioKey: text('audio_key'),
  dubbedAudioKey: text('dubbed_audio_key'),
  dubbedVideoKey: text('dubbed_video_key'),
  sourceLanguage: text('source_language').notNull(),
  targetLanguage: text('target_language').notNull(),
  transcriptionLanguage: text('transcription_language'),
  voiceCloneId: text('voice_clone_id'),
  transcriptJson: text('transcript_json'),
  translationJson: text('translation_json'),
  status: jobStatusEnum('status').notNull().default('pending'),
  dubbedVideoUrl: text('dubbed_video_url'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('dubbing_jobs_source_id_idx').on(table.sourceId),
  uniqueIndex('dubbing_jobs_one_active_version_per_source_idx')
    .on(table.sourceId)
    .where(sql`${table.status} in ('pending', 'processing')`),
  uniqueIndex('dubbing_jobs_one_current_target_per_source_idx')
    .on(table.sourceId, table.targetLanguage)
    .where(sql`${table.status} in ('pending', 'processing', 'completed')`),
])
