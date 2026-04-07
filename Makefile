.PHONY: help up down build logs services restart clean ps api api-logs frontend frontend-logs postgres postgres-logs seed

# Variables
COMPOSE := docker compose
ENV_FILE := .env
API_URL := http://localhost:3000
FRONTEND_URL := http://localhost:5173
DB_URL := localhost:5432

help:
	@echo "╔════════════════════════════════════════════════════════════════╗"
	@echo "║                    🌑 ABYSS - Docker Commands                  ║"
	@echo "╚════════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "Core Commands:"
	@echo "  make up              - Start all services"
	@echo "  make down            - Stop all services"
	@echo "  make build           - Build all Docker images"
	@echo "  make restart         - Restart all services"
	@echo "  make clean           - Remove containers, volumes and networks"
	@echo ""
	@echo "Demo & Data:"
	@echo "  make alice2-demo     - Create Alice2 demo account with 4 months data"
	@echo "  make seed            - Load test data (legacy)"
	@echo "  make setup           - Initial setup with .env file"
	@echo ""
	@echo "Monitoring:"
	@echo "  make services        - List running services with URLs"
	@echo "  make ps              - Show container status"
	@echo "  make logs            - View all services logs"
	@echo ""
	@echo "Service-specific:"
	@echo "  make api             - Start only API"
	@echo "  make api-logs        - View API logs"
	@echo "  make frontend        - Start only Frontend"
	@echo "  make frontend-logs   - View Frontend logs"
	@echo "  make postgres        - Start only PostgreSQL"
	@echo "  make postgres-logs   - View PostgreSQL logs"
	@echo ""
	@echo "Maintenance:"
	@echo "  make db-reset        - Reset database (remove all data)"
	@echo ""

# Main commands
up:
	@echo "🚀 Launching Abyss services..."
	@$(COMPOSE) -f docker-compose.yml --env-file $(ENV_FILE) up -d
	@echo "✓ Services started!"
	@sleep 3
	@make services

down:
	@echo "🛑 Stopping Abyss services..."
	@$(COMPOSE) -f docker-compose.yml down
	@echo "✓ Services stopped!"

build:
	@echo "🔨 Building Docker images..."
	@$(COMPOSE) -f docker-compose.yml build
	@echo "✓ Build completed!"

restart:
	@echo "🔄 Restarting services..."
	@make down
	@sleep 2
	@make up

logs:
	@$(COMPOSE) -f docker-compose.yml logs -f

ps:
	@echo "📊 Container Status:"
	@$(COMPOSE) -f docker-compose.yml ps

# Service monitoring command
services:
	@echo ""
	@echo "╔════════════════════════════════════════════════════════════════╗"
	@echo "║                  🌐 Abyss Services Status                      ║"
	@echo "╚════════════════════════════════════════════════════════════════╝"
	@echo ""
	@if $(COMPOSE) -f docker-compose.yml ps api 2>/dev/null | grep -q "Up"; then \
		echo "✓ API             🔗 $(API_URL)"; \
		echo "  └─ Status: Running"; \
	else \
		echo "✗ API             🔗 $(API_URL)"; \
		echo "  └─ Status: Down"; \
	fi
	@echo ""
	@if $(COMPOSE) -f docker-compose.yml ps frontend 2>/dev/null | grep -q "Up"; then \
		echo "✓ Frontend        🔗 $(FRONTEND_URL)"; \
		echo "  └─ Status: Running"; \
	else \
		echo "✗ Frontend        🔗 $(FRONTEND_URL)"; \
		echo "  └─ Status: Down"; \
	fi
	@echo ""
	@if $(COMPOSE) -f docker-compose.yml ps postgres 2>/dev/null | grep -q "Up"; then \
		echo "✓ PostgreSQL      📍 $(DB_URL)"; \
		echo "  └─ Status: Running"; \
	else \
		echo "✗ PostgreSQL      📍 $(DB_URL)"; \
		echo "  └─ Status: Down"; \
	fi
	@echo ""

# Maintenance commands
clean:
	@echo "🗑️  Cleaning up Docker resources..."
	@$(COMPOSE) -f docker-compose.yml down -v
	@echo "✓ Cleanup completed!"

db-reset:
	@echo "⚠️  Resetting database..."
	@$(COMPOSE) -f docker-compose.yml down -v postgres
	@sleep 2
	@$(COMPOSE) -f docker-compose.yml up -d postgres
	@echo "✓ Database reset completed!"

seed:
	@echo "🌱 Chargement des données de test (alice@example.com / password123)..."
	@$(COMPOSE) -f docker-compose.yml exec api node prisma/seed.js
	@echo "✓ Seed terminé !"

alice2-demo:
	@echo "👤 Création du compte de démonstration Alice2..."
	@echo "🔐 Création du profil Alice2..."
	@bash << 'EOF'
	# Register Alice2
	RESPONSE=$$(curl -s -X POST $(API_URL)/api/auth/register \
	  -H 'Content-Type: application/json' \
	  -d '{"email":"alice2@example.com","password":"Alice123!!"}')

	echo "Réponse inscription : $RESPONSE" | head -1

	# Login
	TOKEN=$$(curl -s -X POST $(API_URL)/api/auth/login \
	  -H 'Content-Type: application/json' \
	  -d '{"email":"alice2@example.com","password":"Alice123!!"}' | jq -r '.token // empty')

	if [ -z "$$TOKEN" ] || [ "$$TOKEN" = "null" ]; then
	  echo "❌ Impossible de se connecter avec Alice2"
	  exit 1
	fi

	echo "✓ Alice2 connectée avec succès"

	# Create categories
	declare -a DEFAULT_CATS=("Alimentation" "Transport" "Logement" "Santé" "Loisirs" "Habillement" "Épargne" "Abonnements" "Divers")
	declare -a CAT_IDS

	echo "📝 Création des catégories..."
	for CAT_NAME in "$${DEFAULT_CATS[@]}"; do
	  RESPONSE=$$(curl -s -X POST $(API_URL)/api/categories \
	    -H "Authorization: Bearer $$TOKEN" \
	    -H 'Content-Type: application/json' \
	    -d "{\"name\":\"$$CAT_NAME\"}")
	  
	  CAT_ID=$$(echo "$$RESPONSE" | jq -r '.id // empty')
	  if [ -n "$$CAT_ID" ] && [ "$$CAT_ID" != "null" ]; then
	    CAT_IDS+=("$$CAT_ID")
	    echo "  ✓ $$CAT_NAME"
	  fi
	done

	echo "✓ $${#CAT_IDS[@]} catégories créées"

	add_expense() {
	  local title=$$1
	  local amount=$$2
	  local date=$$3
	  local cat_idx=$$4
	  local type=$${5:-expense}
	  
	  if [ $$cat_idx -ge $${#CAT_IDS[@]} ]; then
	    cat_idx=0
	  fi
	  
	  curl -s -X POST $(API_URL)/api/user/expenses \
	    -H "Authorization: Bearer $$TOKEN" \
	    -H 'Content-Type: application/json' \
	    -d "{\"title\":\"$$title\",\"amount\":$$amount,\"date\":\"$$date\",\"type\":\"$$type\",\"categoryId\":\"$${CAT_IDS[$$cat_idx]}\"}" > /dev/null 2>&1
	}

	echo "💰 Création de 4 mois de données..."
	COUNTER=0

	# 4 mois = 120 jours
	for DAY in {0..119}; do
	  DATE=$$(date -d "$$DAY days ago" +%Y-%m-%d)
	  
	  # Alimentation - 3x/semaine
	  if [ $$$((DAY % 3)) -eq 0 ]; then
	    add_expense "Courses" $$$((RANDOM % 40 + 20)) "$$DATE" 0
	    ((COUNTER++))
	  fi
	  
	  # Transport
	  if [ $$$((DAY % 15)) -eq 0 ]; then
	    add_expense "Carburant" $$$((RANDOM % 80 + 20)) "$$DATE" 1
	    ((COUNTER++))
	  fi
	  
	  # Logement
	  if [ $$$((DAY % 30)) -eq 0 ]; then
	    add_expense "Loyer" $$$((RANDOM % 200 + 400)) "$$DATE" 2
	    ((COUNTER++))
	  fi
	  
	  # Santé
	  if [ $$$((RANDOM % 50)) -eq 0 ]; then
	    add_expense "Pharmacie" $$$((RANDOM % 60 + 20)) "$$DATE" 3
	    ((COUNTER++))
	  fi
	  
	  # Loisirs
	  if [ $$$((DAY % 3)) -eq 1 ]; then
	    add_expense "Loisir" $$$((RANDOM % 50 + 15)) "$$DATE" 4
	    ((COUNTER++))
	  fi
	  
	  # Habillement
	  if [ $$$((DAY % 20)) -eq 10 ]; then
	    add_expense "Vetements" $$$((RANDOM % 80 + 40)) "$$DATE" 5
	    ((COUNTER++))
	  fi
	  
	  # Abonnements
	  if [ $$$((DAY % 30)) -eq 7 ]; then
	    add_expense "Abonnement" $$$((RANDOM % 20 + 10)) "$$DATE" 7
	    ((COUNTER++))
	  fi
	  
	  # Salaire (revenus)
	  if [ $$$((DAY % 15)) -eq 1 ]; then
	    add_expense "Salaire" $$$((RANDOM % 300 + 2200)) "$$DATE" 0 "credit"
	    ((COUNTER++))
	  fi
	  
	  # Divers
	  if [ $$$((RANDOM % 60)) -eq 0 ]; then
	    add_expense "Divers" $$$((RANDOM % 30 + 10)) "$$DATE" 8
	    ((COUNTER++))
	  fi
	done

	echo "✓ $$COUNTER opérations créées !"
	echo ""
	TOTAL=$$(curl -s $(API_URL)/api/user/expenses -H "Authorization: Bearer $$TOKEN" | jq '.total // 0')
	echo "📊 Total opérations d'Alice2 : $$TOTAL"
	EOF
	@echo "✓ Compte Alice2 créé avec succès !"
	@echo ""
	@echo "🔑 Identifiants Alice2 :"
	@echo "   Email: alice2@example.com"
	@echo "   Mot de passe: Alice123!!"
	@echo ""
	@echo "🌐 Connectez-vous sur http://localhost:5173"

setup:
	@if [ ! -f $(ENV_FILE) ]; then \
		echo "Creating .env file from .env.example..."; \
		cp .env.example $(ENV_FILE); \
		echo "✓ .env file created! Update with your secure passwords."; \
	else \
		echo "✓ .env file already exists"; \
	fi
