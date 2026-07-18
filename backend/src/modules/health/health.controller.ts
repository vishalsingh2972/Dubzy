import { sql } from 'drizzle-orm'
import type { Request, Response } from 'express'
import { db } from '../../db/client.js'

export const getHealth = async (_req: Request, res: Response) => {
  await db.execute(sql`select 1`)

  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  })
}
