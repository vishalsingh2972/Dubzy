import { Router } from 'express'
import { adminRouter } from '../modules/admin/admin.route.js'
import { dubbingRouter } from '../modules/dubbing/dubbing.route.js'
import { healthRouter } from '../modules/health/health.route.js'
import { usersRouter } from '../modules/users/users.route.js'

export const apiRouter = Router()

apiRouter.use('/admin', adminRouter)
apiRouter.use('/health', healthRouter)
apiRouter.use('/dubbing', dubbingRouter)
apiRouter.use('/users', usersRouter)
