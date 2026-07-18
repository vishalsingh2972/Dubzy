import type { Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpError } from '../../src/lib/http-error.js'
import { getCurrentUser } from '../../src/modules/users/users.controller.js'

const mocks = vi.hoisted(() => ({
  db: {
    select: vi.fn(),
  },
  eq: vi.fn((column: unknown, value: unknown) => ({ column, value })),
}))

vi.mock('../../src/db/client.js', () => ({
  db: mocks.db,
}))

vi.mock('drizzle-orm', () => ({
  eq: mocks.eq,
}))

type MockResponse = Response & {
  json: ReturnType<typeof vi.fn>
}

const createResponse = (userId: string | undefined = 'user_123') =>
  ({
    locals: userId ? { userId } : {},
    json: vi.fn(),
  }) as unknown as MockResponse

const mockSelectWhere = (rows: unknown[]) => {
  const where = vi.fn().mockResolvedValue(rows)
  const from = vi.fn(() => ({ where }))
  mocks.db.select.mockReturnValue({ from })
}

describe('getCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the pending approval state for the signed-in user', async () => {
    const res = createResponse()
    mockSelectWhere([
      {
        id: 'user_123',
        name: 'Pending User',
        email: 'pending@example.com',
        approvalStatus: 'pending',
        approvedAt: null,
      },
    ])

    await getCurrentUser({} as Request, res)

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        id: 'user_123',
        name: 'Pending User',
        email: 'pending@example.com',
        approvalStatus: 'pending',
        approvedAt: null,
      },
    })
  })

  it('returns the approved state for the signed-in user', async () => {
    const approvedAt = new Date('2026-05-22T10:00:00.000Z')
    const res = createResponse()
    mockSelectWhere([
      {
        id: 'user_123',
        name: 'Approved User',
        email: 'approved@example.com',
        approvalStatus: 'approved',
        approvedAt,
      },
    ])

    await getCurrentUser({} as Request, res)

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        id: 'user_123',
        name: 'Approved User',
        email: 'approved@example.com',
        approvalStatus: 'approved',
        approvedAt,
      },
    })
  })

  it('throws when the authenticated user id is missing', async () => {
    await expect(
      getCurrentUser({} as Request, createResponse('')),
    ).rejects.toMatchObject<HttpError>({
      statusCode: 401,
      message: 'Authentication required',
    })
  })
})
