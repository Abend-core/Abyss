# Rules — API (Fastify + ORM)

## Stack
- **Node.js 18+** (ES Modules)
- **Fastify** — framework HTTP
- **Prisma** — ORM avec migrations
- **PostgreSQL** — base de données via schéma `dbo`

---

## Structure des dossiers

```
src/
  plugins/          # Plugins Fastify (db, cors, auth…)
  routes/           # Déclaration des routes par domaine
  services/         # Logique métier (appelés par les routes)
  schemas/          # JSON Schemas Fastify pour validation
  middlewares/      # Hooks et middlewares personnalisés
prisma/
  schema.prisma     # Schéma Prisma (source de vérité DB)
  migrations/       # Migrations générées automatiquement
```

---

## ORM — Prisma

- **Prisma est la source de vérité** — ne jamais modifier la DB manuellement
- Une migration par changement de schéma : `prisma migrate dev`
- Les modèles Prisma correspondent au schéma `dbo` PostgreSQL
- Pas d'accès direct à `pg` ou SQL brut sauf cas exceptionnel documenté
- Le `PrismaClient` est instancié **une seule fois** en tant que plugin Fastify

### Workflow migration
```bash
# Modifier prisma/schema.prisma
# Générer la migration
npx prisma migrate dev --name <nom_descriptif>

# En production
npx prisma migrate deploy
```

---

## Swagger — RÈGLE ABSOLUE

- **Chaque nouvelle route DOIT avoir un schéma Fastify** (`schema: { summary, tags, response }`).
- Le Swagger est disponible à `/docs` (Swagger UI) et `/docs/json` (OpenAPI JSON).
- Les tags regroupent les routes par domaine (`auth`, `users`, `health`, etc.).
- Ne jamais déclarer une route sans son `schema` → aucune exception.

### Exemple de route documentée
```js
fastify.get('/api/users', {
  schema: {
    summary: 'Liste des utilisateurs',
    tags: ['users'],
    response: {
      200: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { type: 'object' } }
        }
      }
    }
  }
}, async () => { ... })
```

---

## Routes

- Préfixe `/api/v1/` pour toutes les routes métier
- Routes `/health` et `/api/db-status` sans préfixe (infra)
- Route `GET /` → page HTML de présentation de l'API
- Route `GET /docs` → Swagger UI (auto-généré)
- Chaque route est déclarée dans son propre fichier dans `routes/`
- Validation des inputs via JSON Schema Fastify (pas de Joi, pas de Yup)
- Réponses standardisées :
  ```json
  { "data": {...}, "meta": {} }
  { "error": "message", "code": "ERROR_CODE" }
  ```

---

## Sécurité
- Credentials DB uniquement via variables d'environnement
- Ne jamais logger les mots de passe ou tokens
- CORS configuré explicitement (pas `origin: true` en production)
- Rate limiting via `@fastify/rate-limit`
- Helmet via `@fastify/helmet`

---

## Logs
- Utiliser le logger natif de Fastify (`fastify.log`)
- Format JSON en production, pretty en développement
- Niveau `info` par défaut, `debug` en développement

---

## Erreurs
- Toutes les erreurs passent par le `setErrorHandler` global
- Codes d'erreur métier en majuscules snake_case : `USER_NOT_FOUND`
- Ne jamais exposer les stack traces en production
