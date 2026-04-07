#!/bin/bash

# Script pour créer le compte de démonstration Alice2 avec 4 mois de données
# Usage: ./scripts/create-alice2-demo.sh

set -e

API_URL="http://localhost:3000"

echo "👤 Création du compte de démonstration Alice2..."

# Vérifier que les services sont démarrés
if ! curl -s "$API_URL/api/health" > /dev/null; then
    echo "❌ L'API n'est pas accessible sur $API_URL"
    echo "   Lancez d'abord: make up"
    exit 1
fi

echo "🔐 Création du profil Alice2..."

# Register Alice2
RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice2@example.com","password":"Alice123!!"}')

echo "Réponse inscription : $RESPONSE" | head -1

# Login
TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice2@example.com","password":"Alice123!!"}' | jq -r '.token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Impossible de se connecter avec Alice2"
  exit 1
fi

echo "✓ Alice2 connectée avec succès"

# Create categories
declare -a DEFAULT_CATS=("Alimentation" "Transport" "Logement" "Santé" "Loisirs" "Habillement" "Épargne" "Abonnements" "Divers")
declare -a CAT_IDS

echo "📝 Création des catégories..."
for CAT_NAME in "${DEFAULT_CATS[@]}"; do
  RESPONSE=$(curl -s -X POST "$API_URL/api/categories" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d "{\"name\":\"$CAT_NAME\"}")

  CAT_ID=$(echo "$RESPONSE" | jq -r '.id // empty')
  if [ -n "$CAT_ID" ] && [ "$CAT_ID" != "null" ]; then
    CAT_IDS+=("$CAT_ID")
    echo "  ✓ $CAT_NAME"
  fi
done

echo "✓ ${#CAT_IDS[@]} catégories créées"

add_expense() {
  local title=$1
  local amount=$2
  local date=$3
  local cat_idx=$4
  local type=${5:-expense}

  if [ $cat_idx -ge ${#CAT_IDS[@]} ]; then
    cat_idx=0
  fi

  curl -s -X POST "$API_URL/api/user/expenses" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d "{\"title\":\"$title\",\"amount\":$amount,\"date\":\"$date\",\"type\":\"$type\",\"categoryId\":\"${CAT_IDS[$cat_idx]}\"}" > /dev/null 2>&1
}

echo "💰 Création de 4 mois de données..."
COUNTER=0

# 4 mois = 120 jours
for DAY in {0..119}; do
  DATE=$(date -d "$DAY days ago" +%Y-%m-%d)

  # Alimentation - 3x/semaine
  if [ $((DAY % 3)) -eq 0 ]; then
    add_expense "Courses" $((RANDOM % 40 + 20)) "$DATE" 0
    ((COUNTER++))
  fi

  # Transport
  if [ $((DAY % 15)) -eq 0 ]; then
    add_expense "Carburant" $((RANDOM % 80 + 20)) "$DATE" 1
    ((COUNTER++))
  fi

  # Logement
  if [ $((DAY % 30)) -eq 0 ]; then
    add_expense "Loyer" $((RANDOM % 200 + 400)) "$DATE" 2
    ((COUNTER++))
  fi

  # Santé
  if [ $((RANDOM % 50)) -eq 0 ]; then
    add_expense "Pharmacie" $((RANDOM % 60 + 20)) "$DATE" 3
    ((COUNTER++))
  fi

  # Loisirs
  if [ $((DAY % 3)) -eq 1 ]; then
    add_expense "Loisir" $((RANDOM % 50 + 15)) "$DATE" 4
    ((COUNTER++))
  fi

  # Habillement
  if [ $((DAY % 20)) -eq 10 ]; then
    add_expense "Vetements" $((RANDOM % 80 + 40)) "$DATE" 5
    ((COUNTER++))
  fi

  # Abonnements
  if [ $((DAY % 30)) -eq 7 ]; then
    add_expense "Abonnement" $((RANDOM % 20 + 10)) "$DATE" 7
    ((COUNTER++))
  fi

  # Salaire (revenus)
  if [ $((DAY % 15)) -eq 1 ]; then
    add_expense "Salaire" $((RANDOM % 300 + 2200)) "$DATE" 0 "credit"
    ((COUNTER++))
  fi

  # Divers
  if [ $((RANDOM % 60)) -eq 0 ]; then
    add_expense "Divers" $((RANDOM % 30 + 10)) "$DATE" 8
    ((COUNTER++))
  fi
done

echo "✓ $COUNTER opérations créées !"
echo ""
TOTAL=$(curl -s "$API_URL/api/user/expenses" -H "Authorization: Bearer $TOKEN" | jq '.total // 0')
echo "📊 Total opérations d'Alice2 : $TOTAL"

echo ""
echo "🎉 Compte Alice2 créé avec succès !"
echo ""
echo "🔑 Identifiants Alice2 :"
echo "   Email: alice2@example.com"
echo "   Mot de passe: Alice123!!"
echo ""
echo "🌐 Connectez-vous sur http://localhost:5173"