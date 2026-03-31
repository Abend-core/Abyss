# Architecture Abyss

## Vue d'ensemble de l'infrastructure

```
┌─────────────────────────────────────────────────────────────────┐
│                      DOCKER NETWORK                             │
│                       (abyss_network)                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         FRONTEND (Vue.js + Vite)                        │  │
│  │         Port: 5173                                      │  │
│  │         ✓ HMR (Hot Module Replacement)                  │  │
│  │         ✓ Volume mounted for dev                        │  │
│  └──────────────────┬───────────────────────────────────────┘  │
│                     │                                            │
│                     │ HTTP/REST                                 │
│                     ↓                                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         API (Fastify - Node.js)                         │  │
│  │         Port: 3000                                      │  │
│  │         ✓ High-performance HTTP server                  │  │
│  │         ✓ CORS enabled                                  │  │
│  │         ✓ Volume mounted for dev                        │  │
│  └──────────────────┬───────────────────────────────────────┘  │
│                     │                                            │
│                     │ TCP (pg client)                           │
│                     ↓                                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         DATABASE (PostgreSQL 15)                        │  │
│  │         Port: 5432                                      │  │
│  │         ✓ Persistent volume (postgres_data)             │  │
│  │         ✓ Health checks enabled                         │  │
│  │         ✓ Auto-initialization on startup                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Services détaillés

### 1. Frontend (Vue.js)
- **Image**: node:18-alpine
- **Port**: 5173
- **Technologie**: Vue 3 + Vite
- **Volumes**: 
  - `./frontend/src:/app/src` (développement)
- **Dépendances**: API
- **Features**:
  - Hot Module Replacement (HMR)
  - Dashboard de statut des services
  - Communication avec l'API via Axios

### 2. API (Fastify)
- **Image**: node:18-alpine  
- **Port**: 3000
- **Technologie**: Fastify (framework JS)
- **Volumes**:
  - `./backend/src:/app/src` (développement)
- **Dépendances**: PostgreSQL
- **Features**:
  - Routes health check
  - Connexion sécurisée à PostgreSQL
  - CORS activé
  - Watch mode en développement

### 3. Database (PostgreSQL)
- **Image**: postgres:15-alpine
- **Port**: 5432
- **Technologie**: PostgreSQL
- **Volumes**:
  - `postgres_data:/var/lib/postgresql/data` (données persistantes)
  - `./postgres/init.sql:/docker-entrypoint-initdb.d/init.sql` (init)
- **Features**:
  - Health checks
  - Credentials via variables d'environnement (sécurisé)
  - Auto-initialization
  - Tables: users, items

## Variables d'environnement

Fichier `.env` :
```
DB_USER=abyss_user             # Utilisateur PostgreSQL
DB_PASSWORD=SecureP@ssw0rd123! # Password PostgreSQL (chiffré via env)
DB_NAME=abyss_db               # Nom de la base
DB_PORT=5432                   # Port PostgreSQL
```

## Commandes principales

### Démarrage
```bash
make up        # Lancer tous les services
make build     # Builder les images
make services  # Voir statut avec URLs
```

### Arrêt et maintenance
```bash
make down      # Arrêter tous les services
make restart   # Redémarrer
make clean     # Nettoyer complètement
make db-reset  # Réinitialiser la BD
```

### Monitoring
```bash
make logs              # Tous les logs
make api-logs          # Logs API
make frontend-logs     # Logs Frontend
make postgres-logs     # Logs BD
make ps                # Status conteneurs
```

### Développement
```bash
make shell-api         # Shell dans le conteneur API
make shell-frontend    # Shell dans le conteneur Frontend
make shell-postgres    # Client PostgreSQL
```

## Flow de communication

```
Utilisateur (Browser)
    ↓ HTTP (5173)
Frontend (Vue.js)
    ↓ HTTP/REST (3000)
API (Fastify)
    ↓ TCP (5432)
Database (PostgreSQL)
```

## Installation et premiers pas

1. **Initialisation**
```bash
make setup   # Crée le .env
make build   # Build les images
make up      # Lance les services
```

2. **Vérification**
```bash
make services  # Voir les URLs des services
```

3. **Accès**
- Frontend: http://localhost:5173
- API: http://localhost:3000
- PostgreSQL: localhost:5432

## Sécurité

- ✓ Credentials de BD dans `.env` (non commité)
- ✓ Variables d'environnement injectées
- ✓ .gitignore inclus
- ✓ Pas de mots de passe en dur dans le code
- ✓ Health checks sur les services
- ✓ Network isolation avec Docker

### Pour production

- Utiliser Docker Secrets au lieu de .env
- Ajouter reverse proxy (Nginx/Traefik)
- Implémenter TLS/HTTPS
- Gestion des logs (ELK stack)
- Scaling avec Docker Swarm ou Kubernetes
