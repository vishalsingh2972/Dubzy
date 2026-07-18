import type { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpError } from '../../src/lib/http-error.js'
import { requireApprovedUser } from '../../src/middleware/require-approved-user.js'

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  fromNodeHeaders: vi.fn(),
  db: {
    select: vi.fn(),
  },
  eq: vi.fn((column: unknown, value: unknown) => ({ column, value })),
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

const mockSelectWhere = (rows: unknown[]) => {
  const where = vi.fn().mockResolvedValue(rows)
  const from = vi.fn(() => ({ where }))
  mocks.db.select.mockReturnValue({ from })
  return { from, where }
}

describe('requireApprovedUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.fromNodeHeaders.mockReturnValue(new Headers())
  })

  it('allows approved users through', async () => {
    const req = { headers: { cookie: 'session=value' } } as Request
    const res = createResponse()
    const next = vi.fn() as NextFunction

    mocks.getSession.mockResolvedValue({
      user: { id: 'user_123' },
      session: { id: 'session_123' },
    })
    mockSelectWhere([
      {
        id: 'user_123',
        approvalStatus: 'approved',
      },
    ])

    await requireApprovedUser(req, res, next)

    expect(res.locals.userId).toBe('user_123')
    expect(res.locals.approvalStatus).toBe('approved')
    expect(next).toHaveBeenCalledOnce()
  })

  it('throws a 403 for pending users', async () => {
    const req = { headers: { cookie: 'session=value' } } as Request
    const res = createResponse()
    const next = vi.fn() as NextFunction

    mocks.getSession.mockResolvedValue({
      user: { id: 'user_123' },
      session: { id: 'session_123' },
    })
    mockSelectWhere([
      {
        id: 'user_123',
        approvalStatus: 'pending',
      },
    ])

    await expect(
      requireApprovedUser(req, res, next),
    ).rejects.toMatchObject<HttpError>({
      statusCode: 403,
      message: 'Account pending approval',
      details: {
        approvalStatus: 'pending',
      },
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('throws a 401 when there is no auth session', async () => {
    const req = { headers: {} } as Request
    const res = createResponse()
    const next = vi.fn() as NextFunction

    mocks.getSession.mockResolvedValue(null)

    await expect(
      requireApprovedUser(req, res, next),
    ).rejects.toMatchObject<HttpError>({
      statusCode: 401,
      message: 'Authentication required',
    })
    expect(next).not.toHaveBeenCalled()
  })
})
