# Rules — Général (Projet Abyss)

## Architecture
- 3 services Docker orchestrés via `docker-compose.yml` et `Makefile`
- Réseau interne Docker `abyss_network` — seuls les ports exposés sont accessibles depuis l'hôte
- Chaque service a son propre `Dockerfile`

## Git

- `user.name`: Rudy
- `user.email`: rudyalvs@gmail.com
- Branches : `main` (production), `dev` (développement), `feat/<nom>` (features)
- Messages de commit : `type(scope): description` (Conventional Commits)
  - `feat(frontend): add service status page`
  - `fix(api): handle db connection timeout`
  - `chore(docker): update postgres version`

## Variables d'environnement
- Stockées dans `.env` (git ignoré)
- `.env.example` toujours à jour et commité
- Jamais de valeurs sensibles dans le code source ou les commits

## Sécurité
- `.gitignore` couvre `.env`, `node_modules/`, `dist/`, logs
- Secrets Docker pour les déploiements en production
- Pas de credentials en dur dans aucun fichier

## Commandes Make (référence rapide)

| Commande            | Description                              |
|---------------------|------------------------------------------|
| `make up`           | Lancer tous les services                 |
| `make down`         | Arrêter tous les services                |
| `make services`     | Voir statut des services avec URLs       |
| `make build`        | Rebuild les images Docker                |
| `make restart`      | Redémarrer                               |
| `make clean`        | Tout supprimer (conteneurs + volumes)    |
| `make logs`         | Logs de tous les services                |
| `make api-logs`     | Logs de l'API uniquement                 |
| `make db-reset`     | Réinitialiser la base de données         |
| `make shell-api`    | Shell dans le conteneur API              |
| `make shell-postgres`| Client psql PostgreSQL                  |

## URLs de développement

| Service    | URL                            |
|------------|--------------------------------|
| Frontend   | http://localhost:5173           |
| API        | http://localhost:3000           |
| PostgreSQL | localhost:5432                  |

## Ports

| Service    | Port interne | Port exposé |
|------------|-------------|-------------|
| PostgreSQL | 5432        | 5432        |
| API        | 3000        | 3000        |
| Frontend   | 5173        | 5173        |
