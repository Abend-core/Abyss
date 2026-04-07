/**
 * Tests d'intégration — routes /api/categories
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
    category: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    item: { deleteMany: vi.fn() },
    $queryRaw: vi.fn().mockResolvedValue([]),
    $disconnect: vi.fn(),
  }
}

describe('Category endpoints', () => {
  let app, prisma

  beforeEach(async () => {
    prisma = createMock()
    app = await buildApp({ testing: true, prisma })
    await app.ready()
  })

  afterEach(async () => { if(app) await app.close() })

  it('GET /api/categories — 200', async () => {
    prisma.category.findMany.mockResolvedValue([
      {
        id: 'cat1',
        nameEncrypted: encryptValue('Food', 'category-name'),
        color: '#FF0000',
        parentId: null,
        position: 0,
        _count: { items: 5 }
      }
    ])
    const token = app.jwt.sign({ userId: 'user123' })
    const res = await app.inject({
      method: 'GET',
      url: '/api/categories',
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body[0].name).toBe('Food')
    expect(body[0].itemCount).toBe(5)
  })

  it('GET /api/categories — 401 no JWT', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/categories' })
    expect(res.statusCode).toBe(401)
  })

  it('POST /api/categories — 201', async () => {
    prisma.category.create.mockResolvedValue({
      id: 'new-cat',
      nameEncrypted: encryptValue('Shopping', 'category-name'),
      color: '#00FF00',
      parentId: null,
      position: 0
    })
    const token = app.jwt.sign({ userId: 'user123' })
    const res = await app.inject({
      method: 'POST',
      url: '/api/categories',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Shopping', color: '#00FF00' }
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().name).toBe('Shopping')
  })

  it('POST /api/categories — 422 empty name', async () => {
    const token = app.jwt.sign({ userId: 'user123' })
    const res = await app.inject({
      method: 'POST',
      url: '/api/categories',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: '   ' }
    })
    expect(res.statusCode).toBe(422)
    expect(res.json().code).toBe('INVALID_CATEGORY_NAME')
  })

  it('PUT /api/categories/:id — 200', async () => {
    const catId = '550e8400-e29b-41d4-a716-446655440000'
    prisma.category.findFirst.mockResolvedValue({ id: catId, parentId: null })
    prisma.category.update.mockResolvedValue({})
    const token = app.jwt.sign({ userId: 'user123' })
    const res = await app.inject({
      method: 'PUT',
      url: `/api/categories/${catId}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'New Name' }
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().updated).toBe(true)
  })

  it('PUT /api/categories/:id — 404 not found', async () => {
    const catId = '550e8400-e29b-41d4-a716-446655440001'
    prisma.category.findFirst.mockResolvedValue(null)
    const token = app.jwt.sign({ userId: 'user123' })
    const res = await app.inject({
      method: 'PUT',
      url: `/api/categories/${catId}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'Test' }
    })
    expect(res.statusCode).toBe(404)
    expect(res.json().code).toBe('CATEGORY_NOT_FOUND')
  })

  it ('PUT /api/categories/:id — 422 max depth', async () => {
    const catId = '550e8400-e29b-41d4-a716-446655440002'
    const parentId = '550e8400-e29b-41d4-a716-446655440003'
    prisma.category.findFirst
      .mockResolvedValueOnce({ id: catId, parentId: null })
      .mockResolvedValueOnce({ id: parentId, parentId: '550e8400-e29b-41d4-a716-446655440004' })
    const token = app.jwt.sign ({ userId: 'user123' })
    const res = await app.inject({
      method: 'PUT',
      url: `/api/categories/${catId}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { parentId }
    })
    expect(res.statusCode).toBe(422)
    expect(res.json().code).toBe('MAX_DEPTH_REACHED')
  })

  it('DELETE /api/categories/:id — 200', async () => {
    const catId = '550e8400-e29b-41d4-a716-446655440005'
    prisma.category.findFirst.mockResolvedValue({ id: catId })
    prisma.category.updateMany.mockResolvedValue({})
    prisma.category.delete.mockResolvedValue({})
    const token = app.jwt.sign({ userId: 'user123' })
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/categories/${catId}`,
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().deleted).toBe(true)
  })

  it('DELETE /api/categories/:id — 404', async () => {
    const catId = '550e8400-e29b-41d4-a716-446655440006'
    prisma.category.findFirst.mockResolvedValue(null)
    const token = app.jwt.sign({ userId: 'user123' })
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/categories/${catId}`,
      headers: { authorization: `Bearer ${token}` }
    })
    expect(res.statusCode).toBe(404)
  })
})
