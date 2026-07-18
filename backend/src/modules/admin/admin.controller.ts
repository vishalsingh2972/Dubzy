import type { Request, Response } from 'express'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db/client.js'
import { user } from '../../db/schema.js'
import { HttpError } from '../../lib/http-error.js'

const adminUserStatusSchema = z.enum(['pending', 'approved'])

const selectAdminUserFields = {
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
  approvalStatus: user.approvalStatus,
  approvedAt: user.approvedAt,
}

export const getAdminSession = async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      email: res.locals.adminEmail,
      role: 'admin',
    },
  })
}

export const listAdminUsers = async (req: Request, res: Response) => {
  const status = adminUserStatusSchema.parse(req.query.status)
  const users = await db
    .select(selectAdminUserFields)
    .from(user)
    .where(eq(user.approvalStatus, status))
    .orderBy(desc(user.createdAt))

  res.json({
    success: true,
    data: users,
  })
}

export const approveAdminUser = async (req: Request, res: Response) => {
  const userIdParam = req.params.id
  const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam

  if (!userId) {
    throw new HttpError(400, 'User id is required')
  }

  const approvedAt = new Date()
  const [approvedUser] = await db
    .update(user)
    .set({
      approvalStatus: 'approved',
      approvedAt,
      approvedBy: res.locals.adminEmail, // using the admin's email who approved it
      updatedAt: approvedAt,
    })
    .where(and(eq(user.id, userId), eq(user.approvalStatus, 'pending')))
    .returning(selectAdminUserFields)

  if (!approvedUser) {
    const [existingUser] = await db
      .select(selectAdminUserFields)
      .from(user)
      .where(eq(user.id, userId))

    if (!existingUser) {
      throw new HttpError(404, 'User not found')
    }

    res.json({
      success: true,
      data: existingUser,
    })
    return
  }

  res.json({
    success: true,
    data: approvedUser,
  })
}
