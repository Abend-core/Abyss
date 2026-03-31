/**
 * Tests d'intégration — routes infrastructure
 * GET /health et GET /api/db-status
 */

import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import { buildApp } from '../src/app.js'

describe('GET /health', () => {
  let app

  beforeEach(async () => {
    const mockPrisma = {
      $queryRaw:   vi.fn().mockResolvedValue([]),
      $disconnect: vi.fn(),
      user:        { findUnique: vi.fn(), create: vi.fn() },
    }
    app = await buildApp({ testing: true, prisma: mockPrisma })
    await app.ready()
  })

  afterAll(async () => {
    if (app) await app.close()
  })

  it('200 — status ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
  })

  it('retourne status, service et timestamp', async () => {
    const res  = await app.inject({ method: 'GET', url: '/health' })
    const body = res.json()
    expect(body.status).toBe('ok')
    expect(body.service).toBe('api')
    expect(body.timestamp).toBeDefined()
    expect(new Date(body.timestamp).getTime()).not.toBeNaN()
  })
})

describe('GET /api/db-status', () => {
  it('200 — retourne connected quand Prisma répond', async () => {
    const mockPrisma = {
      $queryRaw:   vi.fn().mockResolvedValue([{ 1: 1 }]),
      $disconnect: vi.fn(),
      user:        { findUnique: vi.fn(), create: vi.fn() },
    }
    const app  = await buildApp({ testing: true, prisma: mockPrisma })
    await app.ready()

    const res = await app.inject({ method: 'GET', url: '/api/db-status' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ status: 'connected', schema: 'dbo' })
    await app.close()
  })

  it('503 — retourne error quand Prisma lève une exception', async () => {
    const mockPrisma = {
      $queryRaw:   vi.fn().mockRejectedValue(new Error('DB unreachable')),
      $disconnect: vi.fn(),
      user:        { findUnique: vi.fn(), create: vi.fn() },
    }
    const app  = await buildApp({ testing: true, prisma: mockPrisma })
    await app.ready()

    const res = await app.inject({ method: 'GET', url: '/api/db-status' })
    expect(res.statusCode).toBe(503)
    expect(res.json().status).toBe('error')
    await app.close()
  })
})
