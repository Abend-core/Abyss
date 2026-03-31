# Workflow de chiffrement — Guide détaillé

## Vue d'ensemble

```
Utilisateur
    │
    │ email + password
    ▼
[INSCRIPTION]
    ├─ Argon2id(password, authSalt) → passwordHash (stocké)
    ├─ crypto.randomBytes(32) → keyFragment (stocké)
    ├─ derive PK = Argon2id(password, keySalt)
    └─ derive DEK = HKDF(PK ‖ MASTER_SECRET, keyFragment)

    ▼
[CHIFFREMENT DONNÉES]
    └─ AES-256-GCM(data, DEK, nonce) → ciphertext + tag (stocké)

         │
         │ Later: utilisateur revient
         ▼
[CONNEXION]
    ├─ bcrypt.compare(password, passwordHash) → ✓
    ├─ derive PK = Argon2id(password, keySalt)
    └─ derive DEK = HKDF(PK ‖ MASTER_SECRET, keyFragment)

    ▼
[DÉCHIFFREMENT DONNÉES]
    └─ AES-256-GCM.decrypt(ciphertext, DEK, tag, nonce) → data
```

---

## Exemple complet : Alice crée un compte

### 1️⃣ Inscription

```
Alice choisit :
  email    = "alice@abyss.dev"
  password = "MySecurePassw0rd!123#Abyss"
```

#### A. Génération des sels

```javascript
const authSalt = crypto.randomBytes(16).toString('hex')
// authSalt = "a7f2e9d1c4b8e5f3a0d2c1e4b7f8a3d6"

const keySalt = crypto.randomBytes(16).toString('hex')
// keySalt = "b3f4d8e2a1c6f9e4d7a0f2c5e8b1d4a7"

const keyFragment = crypto.randomBytes(32).toString('hex')
// keyFragment = "
//   a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6
//   e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2"
```

#### B. Hash du mot de passe (authentification)

```javascript
import argon2 from 'argon2'

passwordHash = await argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 65536,     // 64 MB
  timeCost: 3,           // 3 itérations
  parallelism: 4,
  salt: Buffer.from(authSalt, 'hex'),
  hashLength: 32,
  raw: true,             // retourne Buffer, pas string
})
// passwordHash (32 bytes) = <Buffer a3f8 e2d1 c5b7 ...>
// Stocké en base : "a3f8e2d1c5b7..."
```

#### C. Dérivation de la clé de chiffrement (DEK)

```javascript
// Étape 1 : dériver la clé maîtresse depuis le password
const PK = await argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
  salt: Buffer.from(keySalt, 'hex'),  // ← différent de authSalt !
  hashLength: 32,
  raw: true,
})
// PK (32 bytes) = <Buffer b4g7 f1e8 d2c9 ...>

// Étape 2 : combiner PK + MASTER_SECRET
const input = Buffer.concat([PK, Buffer.from(MASTER_SECRET, 'hex')])
// input (64 bytes) = PK(32) ‖ MASTER_SECRET(32)

// Étape 3 : HKDF pour dériver DEK
import { hkdf } from 'node:crypto'

const DEK = hkdf(
  'sha256',
  input,                              // IKM = PK ‖ MASTER_SECRET
  Buffer.from(keyFragment, 'hex'),    // salt = keyFragment
  Buffer.alloc(0),                    // info = "" (optionnel)
  32                                  // extractedSecretLength = 32 (256 bits)
)
// DEK (32 bytes) = <Buffer c9x1 a5b8 e3d7 ...>
// ⚠️ JAMAIS STOCKÉE — dérivée à la volée à chaque session
```

#### D. Stockage en base

```sql
INSERT INTO dbo.users (
  id, 
  email, 
  password_hash, 
  key_fragment,
  auth_salt,
  key_salt,
  created_at
) VALUES (
  'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5',
  'alice@abyss.dev',
  'a3f8e2d1c5b7...',                    -- 64 chars (32 bytes hex)
  'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6...',-- 64 chars
  'a7f2e9d1c4b8e5f3a0d2c1e4b7f8a3d6',   -- 32 chars (16 bytes hex)
  'b3f4d8e2a1c6f9e4d7a0f2c5e8b1d4a7',   -- 32 chars (16 bytes hex)
  NOW()
);
```

---

### 2️⃣ Alice crée une donnée sensible (ex: clé API)

Elle veut stocker une clé API privée : `api_key_secret = "sk-proj-abc123xyz789..."`

#### A. Génération du nonce (pour chaque chiffrement)

```javascript
const nonce = crypto.randomBytes(12)  // 96 bits = 12 bytes (standard GCM)
// nonce = <Buffer d3a1 f4e8 b2c9 ...>
```

#### B. Chiffrement avec AES-256-GCM

```javascript
import { createCipheriv } from 'node:crypto'

const cipher = createCipheriv(
  'aes-256-gcm',
  DEK,                           // clé de chiffrement (32 bytes)
  nonce                          // nonce (12 bytes)
)

let ciphertext = cipher.update('sk-proj-abc123xyz789...', 'utf8', 'hex')
ciphertext += cipher.final('hex')
const tag = cipher.getAuthTag()   // tag d'authentification (16 bytes)

// Résultat :
// ciphertext = "f7a8e3d1c5b9..."    (même longueur que plaintext)
// tag = <Buffer a1b2 c3d4 e5f6 a7b8>
```

#### C. Stockage du ciphertext + nonce + tag

```sql
INSERT INTO dbo.encrypted_data (
  id,
  user_id,
  type,
  ciphertext,
  nonce,
  tag
) VALUES (
  'data-id-uuid',
  'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5',
  'api_key',
  'f7a8e3d1c5b9...',                    -- nécessaire pour déchiffrer
  'd3a1f4e8b2c9...',                    -- nécessaire pour déchiffrer
  'a1b2c3d4e5f6a7b8'                    -- vérifie l'intégrité + l'authentification
);

-- ⚠️ JAMAIS stocké : DEK, PK, nonce(non — nonce est stocké!)
-- Le DEK et PK sont re-dérivés à chaque session depuis password + MASTER_SECRET + keyFragment
```

---

### 3️⃣ Alice se reconnecte

Elle se connecte plus tard avec `email` et `password`.

#### A. Authentification

```javascript
const user = await db.users.findUnique({ where: { email: 'alice@abyss.dev' } })
// user = {
//   id: 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5',
//   email: 'alice@abyss.dev',
//   password_hash: 'a3f8e2d1c5b7...',
//   auth_salt: 'a7f2e9d1c4b8...',
//   key_salt: 'b3f4d8e2a1c6...',
//   key_fragment: 'a1b2c3d4e5f6...'
// }

const isValid = await bcrypt.compare(password, user.password_hash)
// isValid = true → Alice a le bon mot de passe
```

#### B. Re-dérivation de la DEK

Exactement le même processus qu'à l'inscription, mais avec les sels stockés en BD :

```javascript
const PK = await argon2.hash(password, {
  // ... options identiques ...
  salt: Buffer.from(user.key_salt, 'hex'),  // ← depuis la base
})
// PK = <Buffer b4g7 f1e8 d2c9 ...>  (identique à avant!)

const input = Buffer.concat([PK, Buffer.from(MASTER_SECRET, 'hex')])

const DEK = hkdf(
  'sha256',
  input,
  Buffer.from(user.key_fragment, 'hex'),    // ← depuis la base
  Buffer.alloc(0),
  32
)
// DEK = <Buffer c9x1 a5b8 e3d7 ...>  (identique à avant!)
```

---

### 4️⃣ Alice récupère sa clé API

#### A. Fetch du ciphertext depuis la base

```javascript
const encrypted = await db.encrypted_data.findFirst({
  where: { user_id: user.id, type: 'api_key' }
})
// encrypted = {
//   ciphertext: 'f7a8e3d1c5b9...',
//   nonce: 'd3a1f4e8b2c9...',
//   tag: 'a1b2c3d4e5f6a7b8'
// }
```

#### B. Déchiffrement avec AES-256-GCM

```javascript
import { createDecipheriv } from 'node:crypto'

const decipher = createDecipheriv(
  'aes-256-gcm',
  DEK,                                      // identique à avant (re-dérivée)
  Buffer.from(encrypted.nonce, 'hex')       // depuis la base
)

decipher.setAuthTag(Buffer.from(encrypted.tag, 'hex'))  // vérifie l'intégrité

let plaintext = decipher.update(encrypted.ciphertext, 'hex', 'utf8')
plaintext += decipher.final('utf8')

// plaintext = "sk-proj-abc123xyz789..."
// Si tag ne correspond pas ou données corrompues → throws l'exception !
```

---

## Tableau comparatif : Scénarios de sécurité

| Scénario | Attaquant a... | Alice peut récupérer sa clé API ? | Pourquoi |
|----------|---|---|---|
| **Cas normal** | Rien | ✅ OUI | Elle a password + serveur a MASTER_SECRET + DB |
| **DB volée seule** | passwordHash, keyFragment, nonce, tag | ❌ NON | Sans password ni MASTER_SECRET → pas de DEK |
| **MASTER_SECRET volé** | MASTER_SECRET, passwordHash, keyFragment | ❌ NON | Sans password → pas de DEK (Argon2id non réversible) |
| **Password divulgué** | Plaintext password email | ❌ NON | Sans MASTER_SECRET ni keyFragment → pas de DEK |
| **DB + MASTER_SECRET volés** | Tous les secrets côté serveur | ❌ NON | Sans password → impossible d'estimer la clé |
| **Password + MASTER_SECRET volés** | Les deux secrets | ❌ NON | Sans keyFragment → pas possible d'utiliser HKDF |
| **DB + password + MASTER_SECRET volés** | TOUT | ⚠️ COMPROMIS | 3 vecteurs attaque simultanés → données déchiffrables |

---

## Structure de table complète

```sql
CREATE TABLE dbo.users (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email          VARCHAR(255) UNIQUE NOT NULL,
  
  -- Authentification (password = password_hash, jamais stocké)
  password_hash  TEXT NOT NULL,          -- Argon2id(password, auth_salt)
  auth_salt      VARCHAR(32) NOT NULL,   -- 16 bytes hex (utilisé une seule fois)
  
  -- Dérivation de clé
  key_salt       VARCHAR(32) NOT NULL,   -- 16 bytes hex (utilisé pour PK)
  key_fragment   VARCHAR(64) NOT NULL,   -- 32 bytes hex (split-key, salt HKDF)
  
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dbo.encrypted_data (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   UUID NOT NULL REFERENCES dbo.users(id) ON DELETE CASCADE,
  
  type      VARCHAR(50) NOT NULL,  -- 'api_key', 'notes', 'documents', etc.
  
  -- Données chiffrées
  ciphertext TEXT NOT NULL,        -- AES-256-GCM encrypted bytes (hex)
  nonce      VARCHAR(24) NOT NULL, -- 12 bytes hex (96 bits)
  tag        VARCHAR(32) NOT NULL, -- 16 bytes hex (authentification + intégrité)
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_user_type (user_id, type)
);
```

---

## Code exemple complet : Classe E2E

```javascript
import argon2 from 'argon2'
import { hkdf, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

export class E2EEncryption {
  constructor(masterSecret) {
    this.masterSecret = Buffer.from(masterSecret, 'hex')
  }

  // ────── INSCRIPTION ──────
  async setupUser(password) {
    const authSalt = randomBytes(16).toString('hex')
    const keySalt = randomBytes(16).toString('hex')
    const keyFragment = randomBytes(32).toString('hex')

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
      salt: Buffer.from(authSalt, 'hex'),
      hashLength: 32,
      raw: true
    })

    return {
      passwordHash: passwordHash.toString('hex'),
      authSalt,
      keySalt,
      keyFragment
    }
  }

  // ────── DÉRIVATION DE CLÉ ──────
  async deriveKey(password, keySalt, keyFragment) {
    const PK = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
      salt: Buffer.from(keySalt, 'hex'),
      hashLength: 32,
      raw: true
    })

    const input = Buffer.concat([PK, this.masterSecret])
    const DEK = hkdf(
      'sha256',
      input,
      Buffer.from(keyFragment, 'hex'),
      Buffer.alloc(0),
      32
    )

    return DEK
  }

  // ────── CHIFFREMENT ──────
  async encrypt(plaintext, DEK) {
    const nonce = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', DEK, nonce)

    let ciphertext = cipher.update(plaintext, 'utf8', 'hex')
    ciphertext += cipher.final('hex')
    const tag = cipher.getAuthTag()

    return {
      ciphertext,
      nonce: nonce.toString('hex'),
      tag: tag.toString('hex')
    }
  }

  // ────── DÉCHIFFREMENT ──────
  async decrypt(encrypted, DEK) {
    const decipher = createDecipheriv(
      'aes-256-gcm',
      DEK,
      Buffer.from(encrypted.nonce, 'hex')
    )

    decipher.setAuthTag(Buffer.from(encrypted.tag, 'hex'))

    let plaintext = decipher.update(encrypted.ciphertext, 'hex', 'utf8')
    plaintext += decipher.final('utf8')

    return plaintext
  }
}
```

### Utilisation

```javascript
const e2e = new E2EEncryption(process.env.MASTER_SECRET)

// Inscription
const creds = await e2e.setupUser('MyPassword123!')
// → {
//   passwordHash: 'a3f8e2d1c5b7...',
//   authSalt: 'a7f2e9d1...',
//   keySalt: 'b3f4d8e2...',
//   keyFragment: 'a1b2c3d4...'
// }
// Stocké en DB

// Plus tard, connexion
const DEK = await e2e.deriveKey(password, creds.keySalt, creds.keyFragment)

// Chiffrer une donnée
const secret = 'sk-proj-abc123xyz789...'
const encrypted = await e2e.encrypt(secret, DEK)
// → { ciphertext: 'f7a8e3d1...', nonce: 'd3a1f4e8...', tag: 'a1b2c3d4...' }
// Stocké en DB

// Plus tard, récupérer
const decrypted = await e2e.decrypt(encrypted, DEK)
// → 'sk-proj-abc123xyz789...'
```

---

## Points clés à retenir

1. **DEK jamais stockée** — toujours dérivée à la volée depuis password + secrets serveur
2. **Nonce unique par chiffrement** — jamais réutilisé avec la même clé (sinon sécurité nulle)
3. **Sels distincts** — `authSalt` pour auth, `keySalt` pour dérivation → pas de cross-derivation
4. **Tag vérifie l'intégrité** — si données corrompues ou attaquant modifie le ciphertext → déchiffrement échoue
5. **Résilience à 2 compromis** — il faut **au minimum 3 vecteurs simultanés** pour vraiment déchiffrer (DB + MASTER_SECRET + password)

---

## Timeline de déploiement

| Phase | Quand | Quoi |
|-------|-------|------|
| **1 (ACTUEL)** | v1.0 | Hash password bcryptjs, setup fragments. Zéro chiffrement de données. |
| **2** | v1.1 | Tables `encrypted_data`. Routes API pour `GET /api/v1/encrypted/{id}` (chiffré). Impl E2EEncryption classe. |
| **3** | v1.2 | UI pour créer/afficher secrets chiffrés (notes, clés API, etc). |
| **4** | v2.0 | Argon2id à la place bcryptjs (+ performant pour dérivation clé). Key rotation. |
