import type { NextFunction, Request, Response } from 'express'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '../auth.js'
import { HttpError } from '../lib/http-error.js'

export const getAuthSession = async (req: Request) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  })

  if (!session) {
    throw new HttpError(401, 'Authentication required')
  }

  return session
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const session = await getAuthSession(req)

  res.locals.userId = session.user.id
  next()
}
