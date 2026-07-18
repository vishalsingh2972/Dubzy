import type { Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpError } from '../../src/lib/http-error.js'
import {
  approveAdminUser,
  getAdminSession,
  listAdminUsers,
} from '../../src/modules/admin/admin.controller.js'

const mocks = vi.hoisted(() => ({
  env: {
    ADMIN_EMAIL: 'admin@example.com',
    ADMIN_PASSWORD: 'supersecret-password',
  },
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
  eq: vi.fn((column: unknown, value: unknown) => ({ column, value })),
  and: vi.fn((...conditions: unknown[]) => ({ conditions })),
  desc: vi.fn((column: unknown) => ({ column })),
}))

vi.mock('../../src/config/env.js', () => ({
  env: mocks.env,
}))

vi.mock('../../src/db/client.js', () => ({
  db: mocks.db,
}))

vi.mock('drizzle-orm', () => ({
  and: mocks.and,
  desc: mocks.desc,
  eq: mocks.eq,
}))

type MockResponse = Response & {
  status: ReturnType<typeof vi.fn>
  json: ReturnType<typeof vi.fn>
  send: ReturnType<typeof vi.fn>
}

const createResponse = () => {
  const res = {
    locals: {},
    status: vi.fn(),
    json: vi.fn(),
    send: vi.fn(),
  }

  res.status.mockReturnValue(res)

  return res as unknown as MockResponse
}

const mockSelectWhere = (rows: unknown[]) => {
  const where = vi.fn().mockResolvedValue(rows)
  const from = vi.fn(() => ({ where }))
  mocks.db.select.mockReturnValue({ from })
  return { from, where }
}

const mockSelectOrder = (rows: unknown[]) => {
  const orderBy = vi.fn().mockResolvedValue(rows)
  const where = vi.fn(() => ({ orderBy }))
  const from = vi.fn(() => ({ where }))
  mocks.db.select.mockReturnValue({ from })
  return { from, where, orderBy }
}

const mockUpdateReturning = (rows: unknown[]) => {
  const returning = vi.fn().mockResolvedValue(rows)
  const where = vi.fn(() => ({ returning }))
  const set = vi.fn(() => ({ where }))
  mocks.db.update.mockReturnValue({ set })
  return { set, where, returning }
}

describe('admin controller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the current admin session', async () => {
    const res = createResponse()
    res.locals.adminEmail = 'admin@example.com'

    await getAdminSession({} as Request, res)

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        email: 'admin@example.com',
        role: 'admin',
      },
    })
  })

  it('lists users filtered by pending status', async () => {
    const res = createResponse()
    mockSelectOrder([
      {
        id: 'user_1',
        name: 'Pending User',
        email: 'pending@example.com',
        createdAt: new Date('2026-05-22T09:00:00.000Z'),
        approvalStatus: 'pending',
        approvedAt: null,
      },
    ])

    await listAdminUsers(
      {
        query: {
          status: 'pending',
        },
      } as unknown as Request,
      res,
    )

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [
        expect.objectContaining({
          approvalStatus: 'pending',
        }),
      ],
    })
  })

  it('lists users filtered by approved status', async () => {
    const res = createResponse()
    mockSelectOrder([
      {
        id: 'user_2',
        name: 'Approved User',
        email: 'approved@example.com',
        createdAt: new Date('2026-05-20T09:00:00.000Z'),
        approvalStatus: 'approved',
        approvedAt: new Date('2026-05-21T09:00:00.000Z'),
      },
    ])

    await listAdminUsers(
      {
        query: {
          status: 'approved',
        },
      } as unknown as Request,
      res,
    )

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [
        expect.objectContaining({
          approvalStatus: 'approved',
        }),
      ],
    })
  })

  it('approves a pending user and records approval metadata', async () => {
    const res = createResponse()
    res.locals.adminEmail = 'admin@example.com'
    const update = mockUpdateReturning([
      {
        id: 'user_123',
        name: 'Pending User',
        email: 'pending@example.com',
        createdAt: new Date('2026-05-20T09:00:00.000Z'),
        approvalStatus: 'approved',
        approvedAt: new Date('2026-05-22T10:00:00.000Z'),
      },
    ])

    await approveAdminUser(
      {
        params: {
          id: 'user_123',
        },
      } as unknown as Request,
      res,
    )

    expect(update.set).toHaveBeenCalledWith({
      approvalStatus: 'approved',
      approvedAt: expect.any(Date),
      approvedBy: 'admin@example.com',
      updatedAt: expect.any(Date),
    })
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: expect.objectContaining({
        approvalStatus: 'approved',
      }),
    })
  })

  it('throws a 404 when approving an unknown user', async () => {
    mockUpdateReturning([])
    mockSelectWhere([])

    await expect(
      approveAdminUser(
        {
          params: {
            id: 'missing_user',
          },
        } as unknown as Request,
        createResponse(),
      ),
    ).rejects.toMatchObject<HttpError>({
      statusCode: 404,
      message: 'User not found',
    })
  })
})
