#!/bin/bash

# Script pour créer le compte de démonstration Alice2 avec 4 mois de données
# Usage: ./scripts/create-alice2-demo.sh

set -e

API_URL="http://localhost:3000"

echo "👤 Création du compte de démonstration Alice2..."

echo "🔐 Connexion au compte Alice2..."

TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice2@example.com","password":"Alice123!!"}' | jq -r '.token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "Compte Alice2 introuvable, création en cours..."
  RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
    -H 'Content-Type: application/json' \
    -d '{"email":"alice2@example.com","password":"Alice123!!"}')

  echo "Réponse inscription : $RESPONSE" | head -1

  TOKEN=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H 'Content-Type: application/json' \
    -d '{"email":"alice2@example.com","password":"Alice123!!"}' | jq -r '.token // empty')

  if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo "❌ Impossible de se connecter avec Alice2"
    exit 1
  fi
else
  echo "✓ Le compte Alice2 existe déjà, ajout des données manquantes"
fi

echo "✓ Alice2 connectée avec succès"

TARGET_OPS=300

declare -a DEFAULT_CATS=("Alimentation" "Transport" "Logement" "Santé" "Loisirs" "Habillement" "Épargne" "Abonnements" "Divers")
declare -a CAT_IDS

CATEGORIES_JSON=$(curl -s -X GET "$API_URL/api/categories" \
  -H "Authorization: Bearer $TOKEN")

echo "📝 Vérification des catégories existantes..."
for CAT_NAME in "${DEFAULT_CATS[@]}"; do
  CAT_ID=$(echo "$CATEGORIES_JSON" | jq -r --arg name "$CAT_NAME" '.[] | select(.name == $name) | .id' | head -n 1)
  if [ -n "$CAT_ID" ] && [ "$CAT_ID" != "null" ]; then
    CAT_IDS+=("$CAT_ID")
    echo "  ✓ $CAT_NAME (existante)"
    continue
  fi

  RESPONSE=$(curl -s -X POST "$API_URL/api/categories" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d "{\"name\":\"$CAT_NAME\"}")

  CAT_ID=$(echo "$RESPONSE" | jq -r '.id // empty')
  if [ -n "$CAT_ID" ] && [ "$CAT_ID" != "null" ]; then
    CAT_IDS+=("$CAT_ID")
    echo "  ✓ $CAT_NAME (créée)"
  else
    echo "  ⚠️ Échec création catégorie $CAT_NAME"
  fi
done

echo "✓ ${#CAT_IDS[@]} catégories disponibles"

EXISTING_COUNT=$(curl -s "$API_URL/api/user/expenses" -H "Authorization: Bearer $TOKEN" | jq '.total // 0')
echo "✓ Alice2 a déjà $EXISTING_COUNT opération(s)"

if [ "$EXISTING_COUNT" -ge "$TARGET_OPS" ]; then
  echo "✓ Alice2 a déjà $EXISTING_COUNT opérations, aucune création supplémentaire nécessaire."
  echo ""
  echo "🔑 Identifiants Alice2 :"
  echo "   Email: alice2@example.com"
  echo "   Mot de passe: Alice123!!"
  echo ""
  echo "🌐 Connectez-vous sur http://localhost:5173"
  exit 0
fi

REMAINING=$((TARGET_OPS - EXISTING_COUNT))
COUNTER=0

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

create_expense() {
  add_expense "$1" "$2" "$3" "$4" "$5"
  ((COUNTER++))
  [ "$COUNTER" -lt "$REMAINING" ]
}

echo "💰 Création de $REMAINING opérations sur 4 mois..."
MAX_DAYS=119

for DAY in {0..119}; do
  DATE=$(date -d "$DAY days ago" +%Y-%m-%d)

  # Courses et repas récurrents
  if [ $((DAY % 2)) -eq 0 ]; then
    create_expense "Courses" $((RANDOM % 40 + 20)) "$DATE" 0 || break
  fi

  if [ $((DAY % 3)) -eq 0 ]; then
    create_expense "Restaurant" $((RANDOM % 35 + 15)) "$DATE" 0 || break
  fi

  if [ $((DAY % 4)) -eq 1 ]; then
    create_expense "Café" $((RANDOM % 10 + 5)) "$DATE" 0 || break
  fi

  # Transport
  if [ $((DAY % 15)) -eq 0 ]; then
    create_expense "Carburant" $((RANDOM % 80 + 20)) "$DATE" 1 || break
  fi

  if [ $((DAY % 14)) -eq 5 ]; then
    create_expense "Taxi" $((RANDOM % 30 + 10)) "$DATE" 1 || break
  fi

  # Logement
  if [ $((DAY % 30)) -eq 0 ]; then
    create_expense "Loyer" $((RANDOM % 200 + 400)) "$DATE" 2 || break
  fi

  # Santé
  if [ $((DAY % 25)) -eq 3 ]; then
    create_expense "Pharmacie" $((RANDOM % 60 + 20)) "$DATE" 3 || break
  fi

  if [ $((DAY % 45)) -eq 10 ]; then
    create_expense "Médecin" $((RANDOM % 70 + 30)) "$DATE" 3 || break
  fi

  # Loisirs
  if [ $((DAY % 7)) -eq 2 ]; then
    create_expense "Cinéma" $((RANDOM % 30 + 10)) "$DATE" 4 || break
  fi

  if [ $((DAY % 10)) -eq 4 ]; then
    create_expense "Musique" $((RANDOM % 15 + 5)) "$DATE" 4 || break
  fi

  # Habillement
  if [ $((DAY % 20)) -eq 10 ]; then
    create_expense "Vetements" $((RANDOM % 80 + 40)) "$DATE" 5 || break
  fi

  # Abonnements
  if [ $((DAY % 30)) -eq 7 ]; then
    create_expense "Abonnement" $((RANDOM % 20 + 10)) "$DATE" 7 || break
  fi

  if [ $((DAY % 14)) -eq 8 ]; then
    create_expense "Streaming" $((RANDOM % 10 + 5)) "$DATE" 7 || break
  fi

  # Revenus et épargne
  if [ $((DAY % 15)) -eq 1 ]; then
    create_expense "Salaire" $((RANDOM % 300 + 2200)) "$DATE" 6 "credit" || break
  fi

  if [ $((DAY % 30)) -eq 14 ]; then
    create_expense "Épargne" $((RANDOM % 150 + 150)) "$DATE" 6 "credit" || break
  fi

  # Divers
  if [ $((RANDOM % 4)) -eq 0 ]; then
    create_expense "Divers" $((RANDOM % 30 + 10)) "$DATE" 8 || break
  fi
done

while [ "$COUNTER" -lt "$REMAINING" ]; do
  DAY=$((RANDOM % (MAX_DAYS + 1)))
  DATE=$(date -d "$DAY days ago" +%Y-%m-%d)

  case $((RANDOM % 8)) in
    0)
      create_expense "Taxi" $((RANDOM % 25 + 10)) "$DATE" 1 || break
      ;;
    1)
      create_expense "Cinéma" $((RANDOM % 20 + 10)) "$DATE" 4 || break
      ;;
    2)
      create_expense "Livre" $((RANDOM % 30 + 10)) "$DATE" 4 || break
      ;;
    3)
      create_expense "Pharmacie" $((RANDOM % 60 + 20)) "$DATE" 3 || break
      ;;
    4)
      create_expense "Abonnement" $((RANDOM % 20 + 10)) "$DATE" 7 || break
      ;;
    5)
      create_expense "Courses en ligne" $((RANDOM % 40 + 20)) "$DATE" 0 || break
      ;;
    6)
      create_expense "Autres" $((RANDOM % 30 + 10)) "$DATE" 8 || break
      ;;
    7)
      create_expense "Prime" $((RANDOM % 200 + 100)) "$DATE" 6 "credit" || break
      ;;
  esac
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