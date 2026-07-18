import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import 'dotenv/config'
import pg from 'pg'

describe('reusable source-videos migration', () => {
  it('creates one source per historical job and retains version processing data', async () => {
    const migration = await readFile(
      resolve(import.meta.dirname, '../../drizzle/0002_reusable_source_videos.sql'),
      'utf8',
    )

    expect(migration).toContain('FOR legacy_job IN SELECT * FROM dubbing_jobs WHERE source_id IS NULL LOOP')
    expect(migration).toContain('UPDATE dubbing_jobs SET source_id = new_source_id WHERE id = legacy_job.id;')
    expect(migration).not.toContain('DELETE FROM dubbing_jobs')
    expect(migration).not.toContain('video_key = NULL')
  })

  it('enforces one active version and one non-failed language per source', async () => {
    const migration = await readFile(
      resolve(import.meta.dirname, '../../drizzle/0003_reusable_source_version_constraints.sql'),
      'utf8',
    )

    expect(migration).toContain('dubbing_jobs_one_active_version_per_source_idx')
    expect(migration).toContain("WHERE \"status\" IN ('pending', 'processing')")
    expect(migration).toContain('dubbing_jobs_one_current_target_per_source_idx')
    expect(migration).toContain("WHERE \"status\" IN ('pending', 'processing', 'completed')")
  })

  it('rejects conflicting rows while allowing different sources to be active', async () => {
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
    const suffix = randomUUID().replaceAll('-', '')
    const tableName = `dubbing_jobs_constraint_test_${suffix}`
    await client.connect()
    try {
      await client.query(`CREATE TEMP TABLE ${tableName} (
        source_id uuid,
        target_language text NOT NULL,
        status text NOT NULL
      )`)
      const migration = await readFile(
        resolve(import.meta.dirname, '../../drizzle/0003_reusable_source_version_constraints.sql'),
        'utf8',
      )
      await client.query(
        migration
          .replaceAll('dubbing_jobs_one_active_version_per_source_idx', `dubbing_jobs_one_active_version_${suffix}_idx`)
          .replaceAll('dubbing_jobs_one_current_target_per_source_idx', `dubbing_jobs_one_current_target_${suffix}_idx`)
          .replaceAll('"dubbing_jobs"', tableName)
          .replaceAll('--> statement-breakpoint', ''),
      )

      const firstSource = '17b74ec6-7086-459c-8f0d-d39d6c3c4acd'
      const secondSource = 'dc868836-2efe-44c7-988d-45337927abdc'
      await client.query(`INSERT INTO ${tableName} VALUES ($1, $2, $3)`, [firstSource, 'hi-IN', 'processing'])
      await expect(client.query(`INSERT INTO ${tableName} VALUES ($1, $2, $3)`, [firstSource, 'ta-IN', 'pending'])).rejects.toMatchObject({ code: '23505' })
      await client.query(`INSERT INTO ${tableName} VALUES ($1, $2, $3)`, [secondSource, 'ta-IN', 'pending'])
      await client.query(`UPDATE ${tableName} SET status = $1 WHERE source_id = $2`, ['completed', firstSource])
      await expect(client.query(`INSERT INTO ${tableName} VALUES ($1, $2, $3)`, [firstSource, 'hi-IN', 'pending'])).rejects.toMatchObject({ code: '23505' })
    } finally {
      await client.end()
    }
  })
})
