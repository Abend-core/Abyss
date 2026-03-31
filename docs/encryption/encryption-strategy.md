# Stratégie de chiffrement — Abyss

## Le problème identifié

L'idée initiale :
```
clé_utilisateur = MASTER_SECRET + keyFragment (stocké en DB)
```

**Faille** : si le serveur est compromis (DB + variables d'env), l'attaquant a **les deux** éléments. Il peut reconstruire toutes les clés utilisateur. La diversité par fragment n'apporte pas de vraie protection.

---

## Proposition : Clé à double composante (Split Key)

### Principe

La clé de chiffrement réelle d'un utilisateur ne peut être reconstituée que si l'on possède **simultanément** :

1. **Le mot de passe de l'utilisateur** (jamais stocké, connu uniquement de lui)
2. **Le secret serveur + le fragment utilisateur** (stocké côté serveur)

Si l'un des deux manque → impossible de déchiffrer.

---

### Flux à l'inscription

```
password (fourni) + emailSalt (généré, stocké DB)
        │
        ▼
  Argon2id → PK (Password-derived Key) — jamais stocké
        │
        │    serverFragment (32 bytes aléatoires, stocké DB)
        │    MASTER_SECRET  (variable d'env)
        │
        ▼
  HKDF-SHA256(ikm = PK ‖ MASTER_SECRET, salt = serverFragment)
        │
        ▼
      DEK (Data Encryption Key, 256 bits) — jamais stocké
        │
        ▼
  Utilisé pour AES-256-GCM de toutes les données sensibles
```

### Ce qui est stocké en base

| Champ          | Valeur                                  | Secret ? |
|----------------|-----------------------------------------|----------|
| `password_hash`| Argon2id(password, authSalt)            | Oui (hash) |
| `auth_salt`    | Sel aléatoire pour l'auth               | Non |
| `key_fragment` | 32 bytes aléatoires (serverFragment)    | Non critique |
| `key_salt`     | Sel pour HKDF                           | Non |

> `key_fragment` n'est pas le mot de passe et ne permet pas à lui seul de reconstruire la clé.

---

### Propriétés de sécurité

| Scénario d'attaque                          | Résultat |
|---------------------------------------------|----------|
| DB volée (fragments, hashes)                | ❌ Impossible — pas le mot de passe ni MASTER_SECRET |
| MASTER_SECRET volé (env serveur)            | ❌ Impossible — pas le mot de passe utilisateur |
| Mot de passe utilisateur divulgué           | ❌ Impossible — pas le MASTER_SECRET |
| DB + MASTER_SECRET + mot de passe volés     | ⚠️ Compromis — mais nécessite 3 vecteurs simultanés |

---

### Flux à la connexion

```
1. Récupérer authSalt + key_fragment en DB
2. Vérifier Argon2id(password, authSalt) == password_hash
3. Dériver PK = Argon2id(password, keySalt)  ← nouveau sel dédié
4. DEK = HKDF(PK ‖ MASTER_SECRET, key_fragment)
5. Utiliser DEK pour decrypt des données en session
```

> La DEK est dérivée à la volée à chaque session. Elle n'est jamais persistée.

---

## Implémentation — librairies

| Besoin           | Lib Node.js           |
|------------------|-----------------------|
| Hash password    | `argon2` (argon2id)   |
| Dérivation HKDF  | `node:crypto` natif   |
| Chiffrement data | `node:crypto` AES-256-GCM natif |
| Génération sel   | `crypto.randomBytes()` |

---

## Variables d'environnement requises

```env
# Clé principale 256 bits (32 bytes en hex ou base64)
MASTER_SECRET=<générer avec: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
```

---

## Limites et compromis

- **Perte de mot de passe = perte de données chiffrées** (pas de recovery possible sans third-party escrow)
- La DEK est re-dérivée à chaque requête authentifiée → overhead Argon2 (~100ms acceptable en auth, à cacher en session)
- Pour une API REST classique : stocker la DEK encryptée dans le JWT session (courte durée) pour éviter de re-dériver à chaque requête

---

## Phase 1 (actuelle) — Inscription simple

En attendant l'implémentation complète du chiffrement des données :

1. ✅ Hash du mot de passe avec **bcrypt** (argon2 en phase 2)
2. ✅ Génération d'un `keyFragment` (32 bytes hex) à l'inscription → posera les bases
3. ⏳ Chiffrement des données métier avec split-key en phase 2
