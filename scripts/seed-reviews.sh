#!/bin/bash
# Seeds the running stack with a batch of reviews for manual/UI testing.
#
# Creates COUNT normal reviews (no forced scenario — subject to the mock
# API's natural FAIL_EVERY_N failures, which the worker retries and
# usually recovers from) plus FAIL_COUNT reviews forced to fail
# permanently via `x-mock-scenario: server-error`, so they exhaust all 5
# retry attempts and end up with status "failed" (useful for exercising
# the retry button, the negative-review alert, error states, etc).
#
# Usage:
#   ./scripts/seed-reviews.sh
#   COUNT=50 FAIL_COUNT=5 API_URL=http://localhost:3000 ./scripts/seed-reviews.sh
#
# Requires the stack to be up (docker compose up --build).

set -euo pipefail

API_URL="${API_URL:-http://localhost:3000}"
COUNT="${COUNT:-20}"
FAIL_COUNT="${FAIL_COUNT:-3}"

COMPANIES=(
  "Cantina da Serra" "Pizzaria Bella Napoli" "Sushi Kaizen" "Café Aroma"
  "Restaurante Sabor Caseiro" "Hamburgueria Fogo Alto" "Padaria Trigo Dourado"
  "Empório Verde Vida" "Churrascaria Fogo de Chão Jr" "Boteco do Zé"
)

GOOD_COMMENTS=(
  "Atendimento excelente, entrega rápida e comida quentinha. Recomendo muito!"
  "Melhor experiência que tive em muito tempo, voltarei com certeza."
  "Qualidade impecável, superou minhas expectativas."
  "Entrega no prazo, embalagem caprichada, tudo perfeito."
)

BAD_COMMENTS=(
  "Comida chegou fria e o atendimento foi péssimo."
  "Demorou mais de uma hora e ainda veio errado."
  "Não recomendo, qualidade muito abaixo do esperado."
  "Péssima experiência, atendente foi grosseiro ao telefone."
)

random_from() {
  local arr=("$@")
  echo "${arr[$RANDOM % ${#arr[@]}]}"
}

create_review() {
  local external_id="$1"
  local company="$2"
  local rating="$3"
  local comment="$4"
  local scenario="${5:-}"

  local headers=(-H "Content-Type: application/json")
  if [ -n "$scenario" ]; then
    headers+=(-H "x-mock-scenario: $scenario")
  fi

  local payload
  payload=$(printf '{"external_id":"%s","company_id":"%s","rating":%s,"comment":"%s"}' \
    "$external_id" "$company" "$rating" "$comment")

  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/reviews" "${headers[@]}" -d "$payload")
  echo "  [$status] $external_id — $company (rating $rating)${scenario:+, scenario=$scenario}"
}

echo "Seeding $COUNT normal reviews against $API_URL ..."
for i in $(seq 1 "$COUNT"); do
  company=$(random_from "${COMPANIES[@]}")
  rating=$(( (RANDOM % 5) + 1 ))
  if [ "$rating" -ge 4 ]; then
    comment=$(random_from "${GOOD_COMMENTS[@]}")
  else
    comment=$(random_from "${BAD_COMMENTS[@]}")
  fi
  create_review "seed-$(date +%s)-$i-$RANDOM" "$company" "$rating" "$comment"
done

echo "Seeding $FAIL_COUNT reviews that will fail permanently (exhausts all 5 retry attempts) ..."
for i in $(seq 1 "$FAIL_COUNT"); do
  company=$(random_from "${COMPANIES[@]}")
  comment=$(random_from "${BAD_COMMENTS[@]}")
  create_review "seed-fail-$(date +%s)-$i-$RANDOM" "$company" 1 "$comment" "server-error"
done

echo "Done. Permanently-failing reviews take ~30-40s each to exhaust retries (processed one at a time)."
