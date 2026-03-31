/**
 * Tests d'intégration — routes /api/auth
 *
 * Utilise buildApp() avec un Prisma mocké pour isoler les tests
 * de la vraie base de données.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { buildApp } from '../src/app.js'
import { hashEmail, encryptEmail } from '../src/utils/crypto.js'

// ── MASTER_SECRET requis par les utils crypto ─────────────────
beforeAll(() => {
  process.env.MASTER_SECRET  = 'b'.repeat(64)
  process.env.JWT_SECRET     = 'test-jwt-secret'
})

// ── Helpers pour construire un user en DB mocké ───────────────
import bcrypt from 'bcryptjs'

async function makeFakeUser(email, password) {
  const passwordHash = await bcrypt.hash(password, 4) // rounds faibles pour la rapidité
  return {
    id:             'uuid-test-user',
    emailEncrypted: encryptEmail(email),
    passwordHash,
    authSalt:       'a'.repeat(32),
    keySalt:        'b'.repeat(32),
    keyFragment:    'c'.repeat(64),
  }
}

// ── Tests POST /api/auth/register ─────────────────────────────
describe('POST /api/auth/register', () => {
  let app
  let mockPrisma

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        create:     vi.fn(),
      },
      $disconnect: vi.fn(),
      $queryRaw:   vi.fn().mockResolvedValue([]),
    }

    app = await buildApp({ testing: true, prisma: mockPrisma })
    await app.ready()
  })

  afterAll(async () => {
    if (app) await app.close()
  })

  it('201 — créé avec email + password valides', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null) // email libre
    mockPrisma.user.create.mockResolvedValue({
      id:        'new-uuid',
      createdAt: new Date('2024-01-01'),
    })

    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/register',
      payload: { email: 'alice@example.com', password: 'SecureP@ss1' },
    })

    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body).toHaveProperty('id', 'new-uuid')
    expect(body).toHaveProperty('email', 'alice@example.com')
    expect(body).toHaveProperty('createdAt')
  })

  it('201 — normalise l\'email en lowercase', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({ id: 'uuid', createdAt: new Date() })

    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/register',
      payload: { email: 'Alice@Example.COM', password: 'SecureP@ss1' },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().email).toBe('alice@example.com')
  })

  it('201 — l\'email en clair n\'est PAS transmis à create() (blind index)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({ id: 'uuid', createdAt: new Date() })

    await app.inject({
      method:  'POST',
      url:     '/api/auth/register',
      payload: { email: 'alice@example.com', password: 'SecureP@ss1' },
    })

    const createCall = mockPrisma.user.create.mock.calls[0][0]
    // data ne doit PAS contenir email en clair
    expect(createCall.data).not.toHaveProperty('email')
    // mais doit avoir emailHash et emailEncrypted
    expect(createCall.data).toHaveProperty('emailHash')
    expect(createCall.data).toHaveProperty('emailEncrypted')
    // emailHash est le blind index attendu
    expect(createCall.data.emailHash).toBe(hashEmail('alice@example.com'))
  })

  it('409 — email déjà utilisé', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' })

    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/register',
      payload: { email: 'taken@example.com', password: 'SecureP@ss1' },
    })

    expect(res.statusCode).toBe(409)
    expect(res.json().code).toBe('EMAIL_ALREADY_EXISTS')
  })

  it('400 — body manquant', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/register',
      payload: {},
    })

    expect(res.statusCode).toBe(400)
  })

  it('400 — password trop court (< 8 chars)', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/register',
      payload: { email: 'alice@example.com', password: 'short' },
    })

    expect(res.statusCode).toBe(400)
  })
})

// ── Tests POST /api/auth/login ────────────────────────────────
describe('POST /api/auth/login', () => {
  let app
  let mockPrisma

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        create:     vi.fn(),
      },
      $disconnect: vi.fn(),
      $queryRaw:   vi.fn().mockResolvedValue([]),
    }

    app = await buildApp({ testing: true, prisma: mockPrisma })
    await app.ready()
  })

  afterAll(async () => {
    if (app) await app.close()
  })

  it('200 — retourne un JWT et l\'email déchiffré', async () => {
    const fakeUser = await makeFakeUser('alice@example.com', 'SecureP@ss1')
    mockPrisma.user.findUnique.mockResolvedValue(fakeUser)

    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/login',
      payload: { email: 'alice@example.com', password: 'SecureP@ss1' },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveProperty('token')
    expect(typeof body.token).toBe('string')
    expect(body.user).toMatchObject({ id: 'uuid-test-user', email: 'alice@example.com' })
  })

  it('200 — lookup via blind index (emailHash), jamais par email en clair', async () => {
    const fakeUser = await makeFakeUser('alice@example.com', 'SecureP@ss1')
    mockPrisma.user.findUnique.mockResolvedValue(fakeUser)

    await app.inject({
      method:  'POST',
      url:     '/api/auth/login',
      payload: { email: 'ALICE@Example.Com', password: 'SecureP@ss1' },
    })

    const callArgs = mockPrisma.user.findUnique.mock.calls[0][0]
    expect(callArgs.where).toEqual({ emailHash: hashEmail('alice@example.com') })
    expect(callArgs.where).not.toHaveProperty('email')
  })

  it('401 — email inconnu', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/login',
      payload: { email: 'nobody@example.com', password: 'AnyPass1' },
    })

    expect(res.statusCode).toBe(401)
    expect(res.json().code).toBe('INVALID_CREDENTIALS')
  })

  it('401 — mauvais mot de passe', async () => {
    const fakeUser = await makeFakeUser('alice@example.com', 'CorrectP@ss1')
    mockPrisma.user.findUnique.mockResolvedValue(fakeUser)

    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/login',
      payload: { email: 'alice@example.com', password: 'WrongPass!' },
    })

    expect(res.statusCode).toBe(401)
    expect(res.json().code).toBe('INVALID_CREDENTIALS')
  })

  it('401 — même message pour email inconnu et mauvais mdp (pas d\'enum)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const resUnknown = await app.inject({
      method: 'POST', url: '/api/auth/login',
      payload: { email: 'x@x.com', password: 'AnyP@ss1' },
    })

    const fakeUser = await makeFakeUser('y@y.com', 'RealP@ss1')
    mockPrisma.user.findUnique.mockResolvedValue(fakeUser)
    const resWrong = await app.inject({
      method: 'POST', url: '/api/auth/login',
      payload: { email: 'y@y.com', password: 'WrongP@ss1' },
    })

    // Messages identiques → impossible d'énumérer les comptes
    expect(resUnknown.json().error).toBe(resWrong.json().error)
  })

  it('400 — body manquant', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/login',
      payload: {},
    })

    expect(res.statusCode).toBe(400)
  })
})
