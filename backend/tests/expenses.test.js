/**
 * Tests d'intégration — routes /api/user/expenses
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'
import { buildApp } from '../src/app.js'
import { encryptValue } from '../src/utils/crypto.js'

beforeAll(() => {
  process.env.MASTER_SECRET = 'b'.repeat(64)
  process.env.JWT_SECRET = 'test-jwt-secret'
})

function createMock() {
  return {
    user: { findUnique: vi.fn() },
    userParam: { findMany: vi.fn() },
    category: { findMany: vi.fn(), findFirst: vi.fn() },
    item: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $queryRaw: vi.fn().mockResolvedValue([]),
    $disconnect: vi.fn(),
  }
}

describe('Expense endpoints', () => {
  let app, prisma

  beforeEach(async () => {
    prisma = createMock()
    app = await buildApp({ testing: true, prisma })
    await app.ready()
  })

  afterEach(async () => { if(app) await app.close() })

  it('GET /api/user/expenses/recent — 200', async () => {
    prisma.item.findMany.mockResolvedValue([
      {
        id: 'exp1',
        title: 'Coffee',
        amount: 5n,
        type: 'expense',
        date: new Date(),
        isRecurring: false,
        recurrence: null,
        description: null,
        category: null
      }
    ])
    const token = app.jwt.sign({ userId: 'user123' })
    const res = await app.inject({
      method: 'GET',
      url: '/api/user/expenses/recent',
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.json())).toBe(true)
  })

  it('GET /api/user/expenses — 200 paginated', async () => {
    prisma.item.findMany.mockResolvedValue([])
    prisma.item.count.mockResolvedValue(42)
    const token = app.jwt.sign({ userId: 'user123' })
    const res = await app.inject({
      method: 'GET',
      url: '/api/user/expenses?limit=10&offset=0',
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toBeDefined()
    expect(body.total).toBe(42)
    expect(body.hasMore).toBe(true)
  })

  it('GET /api/user/expenses — hasMore false at end', async () => {
    prisma.item.findMany.mockResolvedValue([])
    prisma.item.count.mockResolvedValue(5)
    const token = app.jwt.sign({ userId: 'user123' })
    const res = await app.inject({
      method: 'GET',
      url: '/api/user/expenses?limit=10&offset=0',
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.json().hasMore).toBe(false)
  })

  it('POST /api/user/expenses — 201', async () => {
    prisma.item.create.mockResolvedValue({
      id: 'exp-new',
      title: 'Lunch',
      amount: 15n,
      type: 'expense',
      date: new Date(),
      isRecurring: false,
      recurrence: null,
      description: null,
      category: null
    })
    const token = app.jwt.sign({ userId: 'user123' })
    const res = await app.inject({
      method: 'POST',
      url: '/api/user/expenses',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        title: 'Lunch',
        amount: 15,
        date: '2024-01-15',
        type: 'expense'
      }
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().title).toBe('Lunch')
  })

  it('POST /api/user/expenses — 400 invalid category', async () => {
    prisma.category.findFirst.mockResolvedValue(null)
    const token = app.jwt.sign({ userId: 'user123' })
    const res = await app.inject({
      method: 'POST',
      url: '/api/user/expenses',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        title: 'Lunch',
        amount: 15,
        date: '2024-01-15',
        type: 'expense',
        categoryId: '550e8400-e29b-41d4-a716-446655440000'
      }
    })
    expect(res.statusCode).toBe(400)
    expect(res.json().code).toBe('INVALID_CATEGORY')
  })

  it('POST /api/user/expenses with recurring — 201', async () => {
    prisma.item.create.mockResolvedValue({
      id: 'exp-rec',
      title: 'Subscription',
      amount: 99n,
      type: 'expense',
      date: new Date(),
      isRecurring: true,
      recurrence: 'monthly',
      description: null,
      category: null
    })
    const token = app.jwt.sign({ userId: 'user123' })
    const res = await app.inject({
      method: 'POST',
      url: '/api/user/expenses',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        title: 'Subscription',
        amount: 99,
        date: '2024-01-15',
        type: 'expense',
        isRecurring: true,
        recurrence: 'monthly'
      }
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().isRecurring).toBe(true)
    expect(res.json().recurrence).toBe('monthly')
  })

  it('PUT /api/user/expenses/:id — 200', async () => {
    const expId = '550e8400-e29b-41d4-a716-446655440001'
    prisma.item.findFirst.mockResolvedValue({
      id: expId,
      title: 'Old',
      amount: 10n,
      date: new Date(),
      type: 'expense',
      isRecurring: false,
      recurrence: null,
      categoryId: null,
      description: null
    })
    prisma.item.update.mockResolvedValue({
      id: expId,
      title: 'Updated',
      amount: 20n,
      type: 'expense',
      date: new Date(),
      isRecurring: false,
      recurrence: null,
      description: null,
      category: null
    })
    const token = app.jwt.sign({ userId: 'user123' })
    const res = await app.inject({
      method: 'PUT',
      url: `/api/user/expenses/${expId}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { title: 'Updated', amount: 20 }
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().title).toBe('Updated')
  })

  it('PUT /api/user/expenses/:id — 404', async () => {
    const expId = '550e8400-e29b-41d4-a716-446655440002'
    prisma.item.findFirst.mockResolvedValue(null)
    const token = app.jwt.sign({ userId: 'user123' })
    const res = await app.inject({
      method: 'PUT',
      url: `/api/user/expenses/${expId}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { title: 'Test' }
    })
    expect(res.statusCode).toBe(404)
    expect(res.json().code).toBe('EXPENSE_NOT_FOUND')
  })

  it('DELETE /api/user/expenses/:id — 200', async () => {
    const expId = '550e8400-e29b-41d4-a716-446655440003'
    prisma.item.findFirst.mockResolvedValue({ id: expId })
    prisma.item.delete.mockResolvedValue({})
    const token = app.jwt.sign({ userId: 'user123' })
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/user/expenses/${expId}`,
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().success).toBe(true)
  })

  it('DELETE /api/user/expenses/:id — 404', async () => {
    const expId = '550e8400-e29b-41d4-a716-446655440004'
    prisma.item.findFirst.mockResolvedValue(null)
    const token = app.jwt.sign({ userId: 'user123' })
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/user/expenses/${expId}`,
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(404)
  })
})
