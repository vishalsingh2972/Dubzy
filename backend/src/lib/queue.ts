import PgBoss from 'pg-boss'
import { env } from '../config/env.js'

export const DUBBING_JOB_QUEUE = 'dubbing-job'

type DubbingJobMessage = {
  jobId: string
}

let boss: PgBoss | null = null
let startPromise: Promise<PgBoss> | null = null

const createBoss = () => {
  return new PgBoss({
    connectionString: env.DATABASE_URL,
    schema: env.PG_BOSS_SCHEMA,
  })
}

const ensureQueue = async (instance: PgBoss) => {
  await instance.createQueue(DUBBING_JOB_QUEUE)
}

export const startQueue = async () => {
  if (boss) {
    return boss
  }

  if (!startPromise) {
    startPromise = (async () => {
      const instance = createBoss()
      await instance.start()
      await ensureQueue(instance)
      boss = instance
      return instance
    })()
  }

  return startPromise
}

export const publishDubbingJob = async (payload: DubbingJobMessage) => {
  const instance = await startQueue()
  const jobId = await instance.send(DUBBING_JOB_QUEUE, payload)

  if (!jobId) {
    throw new Error(`Failed to enqueue job on queue ${DUBBING_JOB_QUEUE}`)
  }

  return jobId
}

export const stopQueue = async () => {
  if (!boss) {
    return
  }

  const instance = boss
  boss = null
  startPromise = null
  await instance.stop()
}
