import type { NextFunction, Request, Response } from 'express'
import { db } from '../db/client.js'
import { user } from '../db/schema.js'
import { eq } from 'drizzle-orm'
import { getAuthSession } from './require-auth.js'
import { HttpError } from '../lib/http-error.js'

export const requireAdminSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const session = await getAuthSession(req)
  
  const [currentUser] = await db
    .select({ role: user.role, email: user.email })
    .from(user)
    .where(eq(user.id, session.user.id))

  if (!currentUser || currentUser.role !== 'admin') {
    throw new HttpError(403, 'Admin privileges required')
  }

  res.locals.adminEmail = currentUser.email
  res.locals.userId = session.user.id
  next()
}
