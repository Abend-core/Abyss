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
	@./scripts/create-alice2-demo.sh

setup:
	@if [ ! -f $(ENV_FILE) ]; then \
		echo "Creating .env file from .env.example..."; \
		cp .env.example $(ENV_FILE); \
		echo "✓ .env file created! Update with your secure passwords."; \
	else \
		echo "✓ .env file already exists"; \
	fi
