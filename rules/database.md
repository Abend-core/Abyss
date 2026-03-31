# Rules — Base de données (PostgreSQL)

## Stack
- **PostgreSQL 15**
- **Schéma `dbo`** — toutes les tables sont dans ce schéma
- **Prisma** — gestion des migrations (côté backend)

---

## Schéma `dbo`

Toutes les tables doivent être préfixées par le schéma `dbo` :
```sql
CREATE SCHEMA IF NOT EXISTS dbo;
SET search_path TO dbo, public;
```

### Conventions de nommage
| Élément        | Convention             | Exemple                    |
|----------------|------------------------|---------------------------|
| Schéma         | `dbo`                  | `dbo`                     |
| Table          | snake_case, pluriel    | `users`, `refresh_tokens` |
| Colonne        | snake_case             | `created_at`, `user_id`   |
| Clé primaire   | `id SERIAL` ou `UUID`  | `id`                      |
| Clé étrangère  | `<table_singulier>_id` | `user_id`                 |
| Index          | `idx_<table>_<colonne>`| `idx_users_email`         |

### Colonnes systèmes obligatoires sur chaque table
```sql
id         SERIAL PRIMARY KEY,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

---

## Migrations

- Les migrations sont générées par **Prisma** (`prisma migrate dev`)
- Ne **jamais** modifier la base de données manuellement hors migration
- Les fichiers de migration sont commités dans le dépôt git
- `init.sql` sert uniquement à créer le schéma initial et les extensions

---

## Sécurité
- L'utilisateur de l'app a uniquement les droits `SELECT, INSERT, UPDATE, DELETE` sur `dbo.*`
- Pas de droits `DROP` ou `CREATE` pour l'utilisateur applicatif
- Credentials dans `.env`, jamais dans le code ou les migrations
- Connexions chiffrées via SSL en production

---

## Performance
- Index sur toutes les clés étrangères
- Index sur les colonnes fréquemment filtrées (`email`, `status`…)
- `EXPLAIN ANALYZE` avant de merger une requête complexe
- Limiter les colonnes sélectionnées (`SELECT col1, col2` plutôt que `SELECT *`)

---

## Backup
- Snapshot du volume Docker avant chaque migration en production
- `pg_dump` journalier minimum

---

## Schéma actuel (`dbo`)

```
dbo.users    — Utilisateurs
dbo.items    — Éléments liés aux utilisateurs
```
