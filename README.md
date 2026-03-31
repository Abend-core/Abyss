# 🌑 Abyss - Docker Infrastructure

Infrastructure Docker complète pour le projet Abyss avec 3 services orchestrés.

## 📋 Services

- **API Fastify** (JavaScript/Node.js) - Port 3000
  - Framework HTTP haute performance
  - Endpoints pour communication avec la base de données
  
- **Frontend Vue.js** (Node.js + Vite) - Port 5173
  - Interface utilisateur moderne
  - Dashboard de statut des services
  
- **PostgreSQL** (Base de données) - Port 5432
  - Stockage des données
  - Credentials sécurisés via variables d'environnement

## 🚀 Démarrage rapide

### Installation initiale

```bash
# Copier et configurer le fichier d'environnement
make setup

# Construire les images Docker
make build

# Lancer tous les services
make up
```

### Commandes principales

```bash
# Voir le statut de tous les services avec leurs URLs
make services

# Lancer les services
make up

# Arrêter les services
make down

# Redémarrer les services
make restart

# Afficher les logs
make logs

# Aide détaillée
make help
```

## 📊 Monitoring

### Voir l'état des services avec URLs

```bash
make services
```

Exemple de résultat :
```
╔════════════════════════════════════════════════════════════════╗
║                  🌐 Abyss Services Status                      ║
╚════════════════════════════════════════════════════════════════╝

✓ API             🔗 http://localhost:3000
  └─ Status: Running

✓ Frontend        🔗 http://localhost:5173
  └─ Status: Running

✓ PostgreSQL      📍 localhost:5432
  └─ Status: Running
```

### Consulter les logs

```bash
# Tous les services
make logs

# Service spécifique
make api-logs
make frontend-logs
make postgres-logs
```

## 🔧 Configuration

### Variables d'environnement (.env)

Les credentials de la base de données sont stockés dans le fichier `.env` :

```env
DB_USER=abyss_user
DB_PASSWORD=SecureP@ssw0rd123!
DB_NAME=abyss_db
DB_PORT=5432
```

⚠️ **Sécurité** : Le fichier `.env` est exclu de git. Never commit credentials!

## 🗄️ Base de données

Pour accéder à PostgreSQL :

```bash
make shell-postgres
```

Tables créées automatiquement :
- `users` - Utilisateurs du système
- `items` - Éléments associés aux utilisateurs

## 🛠️ Commandes avancées

### Service spécifique

```bash
# Démarrer un service seul
make api
make frontend
make postgres

# Shell dans un conteneur
make shell-api
make shell-frontend
make shell-postgres
```

### Maintenance

```bash
# Réinitialiser la base de données (danger ⚠️)
make db-reset

# Nettoyer complètement (conteneurs, volumes, réseaux)
make clean

# Afficher le statut des conteneurs
make ps

# Tester la connectivité
make test
```

## 🌐 URLs d'accès

| Service    | URL                    | Description           |
|------------|------------------------|----------------------|
| Frontend   | http://localhost:5173  | Dashboard Vue.js      |
| API        | http://localhost:3000  | API Fastify           |
| PostgreSQL | localhost:5432         | Base de données       |

## 📁 Structure du projet

```
abyss/
├── Makefile                 # Orchestration et commandes
├── docker-compose.yml       # Configuration Docker Compose
├── .env                      # Variables d'environnement (git ignored)
├── .env.example             # Template .env
├── backend/                 # API Fastify
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       └── server.js
├── frontend/                # Frontend Vue.js
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.js
│       └── App.vue
└── postgres/                # Configuration PostgreSQL
    └── init.sql             # Script d'initialisation BD
```

## 🔐 Sécurité

- Les credentials de la base de données sont dans `.env` (non commité)
- Variables d'environnement injectées aux services via Docker Compose
- Les passwords doivent être changés en production
- Utilisez des secrets Docker pour les déploiements productifs

## 🐛 Dépannage

### Les services ne démarrent pas

```bash
# Vérifier les logs
make logs

# Nettoyer et recommencer
make clean && make up
```

### Problème de connexion API/BD

```bash
# Vérifier que PostgreSQL est en bonne santé
make postgres-logs

# Redémarrer la base
make db-reset
```

### Port déjà utilisé

Modifier les ports dans `docker-compose.yml` et `.env`

## 📝 Développement

### Apporter des modifications

Les volumes sont montés en développement, donc:
- Modifications du code frontend/backend appliquées en direct
- Pas besoin de rebuild, juste un refresh navigateur/redémarrage du service

```bash
# Exemple : modifier src du backend
# Les changements s'appliquent automatiquement grâce au watch mode
```

## 🚢 Production

Pour un déploiement production :

1. Retirer les volumes de développement du `docker-compose.yml`
2. Utiliser des secrets Docker pour les credentials
3. Configurer un reverse proxy (Nginx/Traefik)
4. Utiliser des images multi-stage optimisées
5. Implémenter la gestion des logs (ELK, etc.)

## 📞 Support

Pour plus d'infos sur :
- **Fastify** : https://www.fastify.io/
- **Vue.js** : https://vuejs.org/
- **PostgreSQL** : https://www.postgresql.org/
- **Docker** : https://www.docker.com/