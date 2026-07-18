import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import morgan from 'morgan'
import { toNodeHandler } from 'better-auth/node'
import { auth } from './auth.js'
import { env } from './config/env.js'
import { errorHandler } from './middleware/error-handler.js'
import { notFoundHandler } from './middleware/not-found.js'
import { apiRouter } from './routes/index.js'

export const app = express()

app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  }),
)
app.use(helmet())
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
)
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.all('/api/auth/*splat', toNodeHandler(auth))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Fullstack boilerplate API',
  })
})

app.use('/api', apiRouter)
app.use(notFoundHandler)
app.use(errorHandler)
