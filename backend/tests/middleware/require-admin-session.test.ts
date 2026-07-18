import type { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpError } from '../../src/lib/http-error.js'
import { requireAdminSession } from '../../src/middleware/require-admin-session.js'

const mocks = vi.hoisted(() => ({
  getAuthSession: vi.fn(),
  db: {
    select: vi.fn(),
  },
  eq: vi.fn((column: unknown, value: unknown) => ({ column, value })),
}))

vi.mock('../../src/middleware/require-auth.js', () => ({
  getAuthSession: mocks.getAuthSession,
}))

vi.mock('../../src/db/client.js', () => ({
  db: mocks.db,
}))

vi.mock('drizzle-orm', () => ({
  eq: mocks.eq,
}))

const createResponse = () =>
  ({
    locals: {},
  }) as Response

describe('requireAdminSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('stores admin session data and calls next', async () => {
    const req = {} as Request
    const res = createResponse()
    const next = vi.fn() as NextFunction

    mocks.getAuthSession.mockResolvedValue({
      user: { id: 'admin-id' },
    })

    const where = vi.fn().mockResolvedValue([{ role: 'admin', email: 'admin@example.com' }])
    const from = vi.fn(() => ({ where }))
    mocks.db.select.mockReturnValue({ from })

    await requireAdminSession(req, res, next)

    expect(res.locals.adminEmail).toBe('admin@example.com')
    expect(res.locals.userId).toBe('admin-id')
    expect(next).toHaveBeenCalledOnce()
  })

  it('throws a 403 when user is not an admin', async () => {
    const req = {} as Request
    const res = createResponse()
    const next = vi.fn() as NextFunction

    mocks.getAuthSession.mockResolvedValue({
      user: { id: 'user-id' },
    })

    const where = vi.fn().mockResolvedValue([{ role: 'user', email: 'user@example.com' }])
    const from = vi.fn(() => ({ where }))
    mocks.db.select.mockReturnValue({ from })

    await expect(
      requireAdminSession(req, res, next),
    ).rejects.toMatchObject<HttpError>({
      statusCode: 403,
      message: 'Admin privileges required',
    })
    expect(next).not.toHaveBeenCalled()
  })
})
