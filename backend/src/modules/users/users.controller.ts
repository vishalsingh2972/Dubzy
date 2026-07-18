import type { Request, Response } from 'express'
import { eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { user } from '../../db/schema.js'
import { HttpError } from '../../lib/http-error.js'

export const getCurrentUser = async (_req: Request, res: Response) => {
  const userId = res.locals.userId

  if (typeof userId !== 'string' || userId.length === 0) {
    throw new HttpError(401, 'Authentication required')
  }

  const [currentUser] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      approvalStatus: user.approvalStatus,
      approvedAt: user.approvedAt,
    })
    .from(user)
    .where(eq(user.id, userId))

  if (!currentUser) {
    throw new HttpError(404, 'User not found')
  }

  res.json({
    success: true,
    data: currentUser,
  })
}
