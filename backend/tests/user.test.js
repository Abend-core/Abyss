/**
 * Tests d'intégration — routes /api/user
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'
import { buildApp } from '../src/app.ts'
import bcrypt from 'bcryptjs'
import { encryptValue } from '../src/utils/crypto.ts'

beforeAll(() => {
  process.env.MASTER_SECRET = 'b'.repeat(64)
  process.env.JWT_SECRET = 'test-jwt-secret'
})

function createMock() {
  return {
    user: { findUnique: vi.fn(), delete: vi.fn() },
    userParam: { findMany: vi.fn(), upsert: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
    category: { findMany: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
    item: { create: vi.fn(), findMany: vi.fn() },
    $queryRaw: vi.fn().mockResolvedValue([]),
    $disconnect: vi.fn(),
  }
}

describe('User endpoints', () => {
  let app, prisma

  beforeEach(async () => {
    prisma = createMock()
    app = await buildApp({ testing: true, prisma })
    await app.ready()
  })

  afterEach(async () => { if(app) await app.close() })

  it('GET /api/user — 200', async () => {
    prisma.userParam.findMany.mockResolvedValue([
      { key: 'currency', valueEncrypted: encryptValue('EUR', 'user-settings') }
    ])
    const token = app.jwt.sign({ userId: 'user123', email: 'test@test.com' })
    const res = await app.inject({
      method: 'GET',
      url: '/api/user',
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().id).toBe('user123')
  })

  it('GET /api/user — 401 no JWT', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/user' })
    expect(res.statusCode).toBe(401)
  })

  it('PUT /api/user — 200 update currency', async () => {
    prisma.userParam.upsert.mockResolvedValue({})
    const token = app.jwt.sign({ userId: 'user123' })
    const res = await app.inject({
      method: 'PUT',
      url: '/api/user',
      headers: { authorization: `Bearer ${token}` },
      payload: { currency: 'USD' }
    })
    expect(res.statusCode).toBe(200)
  })

  it('PUT /api/user — 422 invalid currency', async () => {
    const token = app.jwt.sign({ userId: 'user123' })
    const res = await app.inject({
      method: 'PUT',
      url: '/api/user',
      headers: { authorization: `Bearer ${token}` },
      payload: { currency: 'XXX' }
    })
    // Fastify schema validation may return 400, or the handler may return 422
    // Both are acceptable - it's a validation error
    expect([400, 422]).toContain(res.statusCode)
  })

  it('DELETE /api/user — 200', async () => {
    prisma.user.delete.mockResolvedValue({})
    const token = app.jwt.sign({ userId: 'user123' })
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/user',
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().deleted).toBe(true)
  })

  it('GET /api/user/export — 200', async () => {
    prisma.userParam.findMany.mockResolvedValue([])
    prisma.category.findMany.mockResolvedValue([])
    const token = app.jwt.sign({ userId: 'user123' })
    const res = await app.inject({
      method: 'GET',
      url: '/api/user/export',
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(200)
  })

  it('POST /api/user/import — 200', async () => {
    prisma.category.deleteMany.mockResolvedValue({})
    prisma.userParam.deleteMany.mockResolvedValue({})
    const token = app.jwt.sign({ userId: 'user123' })
    const res = await app.inject({
      method: 'POST',
      url: '/api/user/import',
      headers: { authorization: `Bearer ${token}` },
      payload: { params: [], categories: [] }
    })
    expect(res.statusCode).toBe(200)
  })

  it ('POST /api/account/export — 200', async () => {
    const pwd = await bcrypt.hash('test', 4)
    prisma.user.findUnique.mockResolvedValue({ passwordHash: pwd })
    prisma.category.findMany.mockResolvedValue([])
    prisma.operation.findMany.mockResolvedValue([])
    prisma.userParam.findMany.mockResolvedValue([])
    const token = app.jwt.sign({ userId: 'user123' })
    const res = await app.inject({
      method: 'POST',
      url: '/api/account/export',
      headers: { authorization: `Bearer ${token}` },
      payload: { password: 'test' }
    })
    expect(res.statusCode).toBe(200)
  })

  it('POST /api/account/export — 401 wrong password', async () => {
    const pwd = await bcrypt.hash('correct', 4)
    prisma.user.findUnique.mockResolvedValue({ passwordHash: pwd })
    const token = app.jwt.sign({ userId: 'user123' })
    const res = await app.inject({
      method: 'POST',
      url: '/api/account/export',
      headers: { authorization: `Bearer ${token}` },
      payload: { password: 'wrong' }
    })
    expect(res.statusCode).toBe(401)
  })

  it('POST /api/account/import — 200', async () => {
    prisma.category.create.mockResolvedValue({ id: 'cat1' })
    prisma.operation.create.mockResolvedValue({ id: 'item1' })
    const token = app.jwt.sign({ userId: 'user123' })
    const res = await app.inject({
      method: 'POST',
      url: '/api/account/import',
      headers: { authorization: `Bearer ${token}` },
      payload: { categories: [], items: [] }
    })
    expect(res.statusCode).toBe(200)
  })
})
