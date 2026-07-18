import type { NextFunction, Request, Response } from 'express'
import { eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { user } from '../db/schema.js'
import { HttpError } from '../lib/http-error.js'
import { getAuthSession } from './require-auth.js'

export const requireApprovedUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const session = await getAuthSession(req)
  const [currentUser] = await db
    .select({
      id: user.id,
      approvalStatus: user.approvalStatus,
    })
    .from(user)
    .where(eq(user.id, session.user.id))

  if (!currentUser) {
    throw new HttpError(401, 'Authentication required')
  }

  if (currentUser.approvalStatus !== 'approved') {
    throw new HttpError(403, 'Account pending approval', {
      approvalStatus: currentUser.approvalStatus,
    })
  }

  res.locals.userId = currentUser.id
  res.locals.approvalStatus = currentUser.approvalStatus
  next()
}
