# 🌑 Abyss - Gestionnaire de Dépenses Personnelles

Une application moderne de suivi des dépenses personnelles avec interface web élégante, API sécurisée et base de données chiffrée.

## ✨ Fonctionnalités

- 📊 **Dashboard financier** avec statistiques complètes (KPIs, graphiques Chart.js)
- 💰 **Suivi des dépenses** avec catégories hiérarchiques et couleurs personnalisées
- 🔄 **Opérations récurrentes** (quotidiennes, hebdomadaires, mensuelles...)
- 🔐 **Authentification sécurisée** avec JWT et chiffrement des données sensibles
- 🎨 **Interface moderne** avec thème sombre/clair et design responsive
- 📱 **Progressive Web App** (PWA) installable
- 🐳 **Infrastructure Docker** complète et orchestrée

## 🚀 Démarrage Rapide

### Prérequis

- **Docker** et **Docker Compose** installés
- **Git** pour cloner le repository
- **Navigateur web** moderne

### Installation en 3 étapes

```bash
# 1. Cloner le repository
git clone <repository-url>
cd abyss

# 2. Configurer l'environnement
make setup

# 3. Lancer tous les services
make up
```

🎉 **C'est tout !** L'application sera accessible sur :
- **Frontend** : http://localhost:5173
- **API** : http://localhost:3000

## 👤 Créer le compte de démonstration Alice2

Pour découvrir toutes les fonctionnalités avec des données réalistes, créez le profil Alice2 :

```bash
# Créer le compte Alice2 avec 4 mois de données
make alice2-demo
```

Cette commande va :
- ✅ Créer le compte `alice2@example.com` avec mot de passe `Alice123!!`
- ✅ Générer 9 catégories (Alimentation, Transport, Logement, etc.)
- ✅ Créer 113 transactions sur 4 mois avec patterns réalistes
- ✅ Inclure revenus, dépenses fixes et variables

### Se connecter avec Alice2

- **Email** : `alice2@example.com`
- **Mot de passe** : `Alice123!!`

## 📱 Utilisation de l'application

### Navigation principale

1. **🏠 Accueil** - Vue d'ensemble avec statistiques générales
2. **📊 Stats** - Dashboard détaillé avec graphiques (doughnut, bar, line)
3. **📝 Historique** - Liste paginée des transactions (scroll infini)
4. **🏷️ Catégories** - Gestion des catégories avec hiérarchie
5. **⚙️ Paramètres** - Configuration utilisateur

### Fonctionnalités clés

#### Ajouter une dépense
- Formulaire intuitif avec titre, montant, date, type (dépense/crédit)
- Sélection de catégorie avec hiérarchie
- Support des opérations récurrentes (quotidiennes, mensuelles...)

#### Visualiser les statistiques
- **KPIs principaux** : Solde net, total dépenses, total revenus, moyenne mensuelle
- **Graphiques interactifs** :
  - Répartition par catégories (camembert)
  - Évolution mensuelle (lignes)
  - Top catégories (barres)
- **Thème adaptatif** : couleurs des catégories utilisées dans les graphiques

#### Gérer les catégories
- Création/modification avec couleurs personnalisées
- Hiérarchie parent-enfant (sous-catégories)
- Interface drag & drop pour réorganiser

## 🏗️ Architecture Technique

### Services Docker

| Service     | Technologie          | Port  | Description                    |
|-------------|----------------------|-------|--------------------------------|
| **Frontend**| Vue.js 3 + Vite      | 5173  | Interface utilisateur moderne   |
| **API**     | Fastify + Node.js    | 3000  | API REST avec authentification  |
| **Database**| PostgreSQL 15        | 5432  | Base de données relationnelle   |

### Sécurité

- **Chiffrement** : Données sensibles chiffrées (noms de catégories, paramètres utilisateur)
- **Authentification** : JWT tokens avec expiration
- **Validation** : Schémas stricts et sanitisation des entrées
- **CORS** : Configuration sécurisée pour les requêtes cross-origin

### Base de données

Tables principales :
- `users` - Comptes utilisateur
- `userParams` - Paramètres chiffrés (devise, préférences)
- `categories` - Catégories avec hiérarchie et couleurs
- `items` - Transactions financières

## 🛠️ Commandes Make

### Commandes essentielles

```bash
make setup          # Configuration initiale (.env)
make up             # Démarrer tous les services
make down           # Arrêter les services
make restart        # Redémarrer les services
make services       # Afficher statut et URLs
make alice2-demo    # Créer le compte de démo Alice2
```

### Développement

```bash
make logs           # Logs de tous les services
make api-logs       # Logs API uniquement
make frontend-logs  # Logs frontend uniquement
make shell-api      # Shell dans conteneur API
make shell-frontend # Shell dans conteneur frontend
```

### Maintenance

```bash
make clean          # Nettoyer conteneurs et volumes
make db-reset       # Réinitialiser la base de données
make build          # Rebuild des images Docker
make test           # Tests de connectivité
```

## 🔧 Configuration

### Variables d'environnement (.env)

```env
# Base de données
DB_USER=abyss_user
DB_PASSWORD=SecureP@ssw0rd123!
DB_NAME=abyss_db
DB_PORT=5432

# API
JWT_SECRET=your-super-secret-jwt-key-here
MASTER_SECRET=your-master-encryption-key

# Frontend
VITE_API_URL=http://localhost:3000
```

### Personnalisation

- **Devise** : Configurable par utilisateur (EUR, USD, GBP, JPY, CHF, AUD)
- **Thème** : Automatique (sombre/clair) selon les préférences système
- **Langue** : Français (extensible)

## 📊 Données de démonstration

Le compte Alice2 inclut :

- **9 catégories** organisées hiérarchiquement
- **113 transactions** sur 4 mois (janvier-avril 2026)
- **Patterns réalistes** :
  - Courses : 3x/semaine (20-60€)
  - Transport : 2x/mois (20-100€)
  - Loyer : 1x/mois (400-600€)
  - Salaire : 2x/mois (2200-2500€)
  - Loisirs, santé, abonnements...

## 🐛 Dépannage

### Services ne démarrent pas

```bash
# Vérifier les logs détaillés
make logs

# Nettoyer et recommencer
make clean && make up
```

### Problème de connexion

```bash
# Vérifier la santé des services
make services

# Tester l'API directement
curl http://localhost:3000/api/health
```

### Données Alice2 non visibles

```bash
# Recréer le compte de démo
make alice2-demo

# Vérifier dans la base
make shell-postgres
psql -U abyss -d abyss_dev -c "SELECT COUNT(*) FROM \"User\" WHERE email = 'alice2@example.com';"
```

## 🚢 Production

Pour déployer en production :

1. **Sécurité** : Changer tous les secrets et mots de passe
2. **Reverse proxy** : Nginx/Traefik pour SSL et routage
3. **Base de données** : Utiliser un volume persistant externe
4. **Monitoring** : Logs centralisés et métriques
5. **Backup** : Sauvegarde automatique de la base de données

## 📝 Scripts disponibles

### Création de données personnalisées

```bash
# Créer un compte avec données personnalisées
./scripts/create-demo-user.sh <email> <password> <months>

# Exemple : 6 mois de données
./scripts/create-demo-user.sh "john@example.com" "John123!!" 6
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit atomiques (`git commit -m "Add amazing feature"`)
4. Push la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📄 Licence

MIT License - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

**Prêt à gérer vos finances ?** 🚀 Lancez `make up` et commencez avec Alice2 !