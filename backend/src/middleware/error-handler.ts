import type { Request, Response } from 'express'
import multer from 'multer'
import { ZodError } from 'zod'
import { HttpError } from '../lib/http-error.js'

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: unknown,
) => {
  void _next

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.flatten(),
    })
  }

  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      details: error.details,
    })
  }

  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'Video file must be 50 MB or smaller',
    })
  }

  console.error(error)

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  })
}
