import type { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpError } from '../../src/lib/http-error.js'
import { requireAuth } from '../../src/middleware/require-auth.js'

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  fromNodeHeaders: vi.fn(),
}))

vi.mock('../../src/auth.js', () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}))

vi.mock('better-auth/node', () => ({
  fromNodeHeaders: mocks.fromNodeHeaders,
}))

const createResponse = () =>
  ({
    locals: {},
  }) as Response

describe('requireAuth', () => {
  beforeEach(() => {
    mocks.fromNodeHeaders.mockReturnValue(new Headers())
  })

  it('stores the authenticated user id and calls next', async () => {
    const req = { headers: { cookie: 'session=value' } } as Request
    const res = createResponse()
    const next = vi.fn() as NextFunction

    mocks.getSession.mockResolvedValue({
      user: { id: 'user_123' },
      session: { id: 'session_123' },
    })

    await requireAuth(req, res, next)

    expect(mocks.fromNodeHeaders).toHaveBeenCalledWith(req.headers)
    expect(mocks.getSession).toHaveBeenCalledWith({
      headers: expect.any(Headers),
    })
    expect(res.locals.userId).toBe('user_123')
    expect(next).toHaveBeenCalledOnce()
  })

  it('throws a 401 when no session is present', async () => {
    const req = { headers: {} } as Request
    const res = createResponse()
    const next = vi.fn() as NextFunction

    mocks.getSession.mockResolvedValue(null)

    await expect(requireAuth(req, res, next)).rejects.toMatchObject<HttpError>({
      statusCode: 401,
      message: 'Authentication required',
    })
    expect(next).not.toHaveBeenCalled()
    expect(res.locals.userId).toBeUndefined()
  })
})
