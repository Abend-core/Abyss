/**
 * Tests unitaires — utils/crypto.js
 *
 * Vérifie que le blind index HMAC et le chiffrement AES-256-GCM
 * fonctionnent correctement et de façon déterministe.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { hashEmail, encryptEmail, decryptEmail } from '../src/utils/crypto.js'

// MASTER_SECRET requis par les fonctions crypto
beforeAll(() => {
  process.env.MASTER_SECRET = 'a'.repeat(64) // 64 hex chars = 256 bits pour les tests
})

describe('hashEmail', () => {
  it('retourne un hash 64 chars (hex SHA-256)', () => {
    const hash = hashEmail('alice@example.com')
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]+$/)
  })

  it('est déterministe — même input → même output', () => {
    const h1 = hashEmail('alice@example.com')
    const h2 = hashEmail('alice@example.com')
    expect(h1).toBe(h2)
  })

  it('est case-insensitive et trim', () => {
    const h1 = hashEmail('Alice@Example.COM')
    const h2 = hashEmail('  alice@example.com  ')
    const h3 = hashEmail('alice@example.com')
    expect(h1).toBe(h3)
    expect(h2).toBe(h3)
  })

  it('deux emails différents → hashs différents', () => {
    const h1 = hashEmail('alice@example.com')
    const h2 = hashEmail('bob@example.com')
    expect(h1).not.toBe(h2)
  })
})

describe('encryptEmail + decryptEmail', () => {
  it('déchiffrement récupère l\'email original', () => {
    const email     = 'alice@example.com'
    const encrypted = encryptEmail(email)
    const decrypted = decryptEmail(encrypted)
    expect(decrypted).toBe(email)
  })

  it('format chiffré : iv:authTag:ciphertext (3 segments hex)', () => {
    const encrypted = encryptEmail('test@test.com')
    const parts     = encrypted.split(':')
    expect(parts).toHaveLength(3)
    parts.forEach(p => expect(p).toMatch(/^[0-9a-f]+$/))
  })

  it('IV aléatoire — deux chiffrements du même email sont différents', () => {
    const e1 = encryptEmail('alice@example.com')
    const e2 = encryptEmail('alice@example.com')
    expect(e1).not.toBe(e2) // IVs différents → ciphertexts différents
  })

  it('les deux se déchiffrent au même plaintext', () => {
    const email = 'alice@example.com'
    const e1    = encryptEmail(email)
    const e2    = encryptEmail(email)
    expect(decryptEmail(e1)).toBe(email)
    expect(decryptEmail(e2)).toBe(email)
  })

  it('altération du ciphertext lève une erreur', () => {
    const encrypted  = encryptEmail('test@test.com')
    const [iv, tag, _] = encrypted.split(':')
    const tampered   = `${iv}:${tag}:deadbeef`
    expect(() => decryptEmail(tampered)).toThrow()
  })

  it('format invalide lève une erreur', () => {
    expect(() => decryptEmail('notvalid')).toThrow('Invalid encrypted email format')
  })
})
