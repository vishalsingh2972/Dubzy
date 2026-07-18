import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler.js'
import { requireAdminSession } from '../../middleware/require-admin-session.js'
import {
  approveAdminUser,
  getAdminSession,
  listAdminUsers,
} from './admin.controller.js'

export const adminRouter = Router()

adminRouter.get(
  '/session',
  asyncHandler(requireAdminSession),
  asyncHandler(getAdminSession),
)
adminRouter.get(
  '/users',
  asyncHandler(requireAdminSession),
  asyncHandler(listAdminUsers),
)
adminRouter.post(
  '/users/:id/approve',
  asyncHandler(requireAdminSession),
  asyncHandler(approveAdminUser),
)
