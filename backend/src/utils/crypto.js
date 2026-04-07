/**
 * Utilitaires cryptographiques pour Abyss
 *
 * BLIND INDEX pour l'email :
 *   - HMAC-SHA256(email, MASTER_SECRET) → emailHash  (64 hex, indexé, unique)
 *   - AES-256-GCM(email, clé dérivée)  → emailEncrypted (pour affichage)
 *
 * La clé AES est dérivée du MASTER_SECRET via scrypt (jamais stockée).
 * Le HMAC permet le lookup sans exposer l'email en clair en base.
 */

import crypto from 'node:crypto'

/**
 * Retourne le MASTER_SECRET depuis les variables d'environnement.
 * Lance une erreur au démarrage si absent (fail-fast).
 */
function getMasterSecret() {
  const secret = process.env.MASTER_SECRET
  if (!secret) throw new Error('MASTER_SECRET env var is required')
  return secret
}

/**
 * Dérive une clé AES-256 (32 bytes) depuis le MASTER_SECRET.
 * Le `salt` est un string statique propre à l'usage — non cryptographique ici,
 * juste pour séparer les usages (email vs futures clés).
 *
 * @param {string} usage - identifiant de l'usage ex: 'email-encryption'
 * @returns {Buffer} 32 bytes
 */
function deriveKey(usage) {
  return crypto.scryptSync(getMasterSecret(), `abyss:${usage}`, 32)
}
function encryptSecret(value, usage) {
  const key = deriveKey(usage)
  const iv  = crypto.randomBytes(12)

  const cipher    = crypto.createCipheriv('aes-256-gcm', key, iv)
  let   encrypted = cipher.update(value, 'utf8', 'hex')
  encrypted      += cipher.final('hex')
  const authTag   = cipher.getAuthTag()

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

function decryptSecret(encryptedValue, usage) {
  const parts = encryptedValue.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted value format')

  const [ivHex, authTagHex, ciphertext] = parts
  const key     = deriveKey(usage)
  const iv      = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)

  let decrypted  = decipher.update(ciphertext, 'hex', 'utf8')
  decrypted     += decipher.final('utf8')

  return decrypted
}
// ── Blind index ──────────────────────────────────────────────

/**
 * Calcule le blind index de l'email (HMAC-SHA256).
 * Identique pour la même adresse email → permet la recherche en base.
 * Ne révèle pas l'email en clair même si la DB est compromise.
 *
 * @param {string} email - email en clair (sera lowercased/trimmed)
 * @returns {string} 64 hex chars
 */
export function hashEmail(email) {
  return crypto
    .createHmac('sha256', getMasterSecret())
    .update(email.toLowerCase().trim())
    .digest('hex')
}

// ── Chiffrement AES-256-GCM ──────────────────────────────────

/**
 * Chiffre l'email avec AES-256-GCM.
 * Format retourné : "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 * L'IV est aléatoire (12 bytes) à chaque chiffrement.
 *
 * @param {string} email - email en clair
 * @returns {string}
 */
export function encryptValue(value, usage = 'user-settings') {
  return encryptSecret(value, usage)
}

export function decryptValue(encryptedValue, usage = 'user-settings') {
  return decryptSecret(encryptedValue, usage)
}

export function encryptEmail(email) {
  return encryptValue(email.toLowerCase().trim(), 'email-encryption')
}

/**
 * Déchiffre un email chiffré par encryptEmail().
 * Lance une erreur si le contenu est altéré (authTag invalide).
 *
 * @param {string} encryptedEmail - format "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 * @returns {string} email en clair
 */
export function decryptEmail(encryptedEmail) {
  return decryptValue(encryptedEmail, 'email-encryption')
}
