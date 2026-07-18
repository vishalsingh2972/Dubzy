import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler.js'
import { requireAuth } from '../../middleware/require-auth.js'
import { getCurrentUser } from './users.controller.js'

export const usersRouter = Router()

usersRouter.get('/me', asyncHandler(requireAuth), asyncHandler(getCurrentUser))
