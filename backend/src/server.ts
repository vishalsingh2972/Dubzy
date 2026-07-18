import { app } from './app.js'
import { env } from './config/env.js'
import { pool } from './db/client.js'
import { startQueue, stopQueue } from './lib/queue.js'

void startQueue()

const server = app.listen(env.PORT, () => {
  console.info(`API server running on http://localhost:${env.PORT}`)
})

const shutdown = async (signal: string) => {
  console.info(`${signal} received. Closing server...`)
  server.close(async () => {
    await stopQueue()
    await pool.end()
    process.exit(0)
  })
}

process.on('SIGINT', () => {
  void shutdown('SIGINT')
})

process.on('SIGTERM', () => {
  void shutdown('SIGTERM')
})
