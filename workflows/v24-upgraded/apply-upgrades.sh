#!/bin/bash
# apply-upgrades.sh
# Pushes all v24 Maxed workflow upgrades to your n8n instance via REST API.
# Usage:
#   export N8N_BASE_URL=https://your-n8n-instance.com
#   export N8N_API_KEY=your_api_key
#   bash apply-upgrades.sh

set -e

if [ -z "$N8N_BASE_URL" ] || [ -z "$N8N_API_KEY" ]; then
  echo "ERROR: N8N_BASE_URL and N8N_API_KEY must be set."
  echo "Usage: N8N_BASE_URL=https://... N8N_API_KEY=... bash apply-upgrades.sh"
  exit 1
fi

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

apply_workflow() {
  local file="$1"
  local workflow_id
  workflow_id=$(python3 -c "import json,sys; d=json.load(sys.stdin); print(d['id'])" < "$file")
  local name
  name=$(python3 -c "import json,sys; d=json.load(sys.stdin); print(d['name'])" < "$file")

  echo "Upgrading: $name ($workflow_id)..."

  # Build the PUT payload (strip the id field from body, use it in URL)
  python3 -c "
import json, sys
with open('$file') as f:
    d = json.load(f)
d.pop('id', None)
print(json.dumps(d))
" > /tmp/wf_payload.json

  response=$(curl -s -w "\n%{http_code}" \
    -X PUT \
    -H "X-N8N-API-KEY: $N8N_API_KEY" \
    -H "Content-Type: application/json" \
    --data @/tmp/wf_payload.json \
    "$N8N_BASE_URL/api/v1/workflows/$workflow_id")

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)

  if [ "$http_code" = "200" ]; then
    echo "  OK: $name updated"
  else
    echo "  WARN ($http_code): $name — $body" | head -c 300
    echo ""
  fi
}

echo "=== v24 Maxed Upgrade Pack — Applying to $N8N_BASE_URL ==="
echo ""

# Apply in dependency order: engines first, then config, then scheduler, then wrappers
apply_workflow "$DIR/ZHXBmDQ7mhI8lEoH-content-engine.json"
apply_workflow "$DIR/pMFr3Sgak21AIOPx-strategy-engine.json"
apply_workflow "$DIR/7MbU3Q9mCewtH7xw-analytics-engine.json"
apply_workflow "$DIR/nCqSXq1cTt9L6QCe-central-config.json"
apply_workflow "$DIR/xCDUZHCgBIA6rzQF-master-scheduler.json"
apply_workflow "$DIR/D2wqVr1AEI8Fiwo8-local-stack-wrapper.json"
apply_workflow "$DIR/M8EMulezJ9dhESuM-lead-systems-wrapper.json"

echo ""
echo "=== Done. Next steps: ==="
echo "1. Fill in real API keys in Central Config (Groq, Fliki, Google Sheet ID, etc.)"
echo "2. Activate Master Scheduler (xCDUZHCgBIA6rzQF) once your credentials are set"
echo "3. Run a manual CONTENT_DAILY to verify the Groq AI content pipeline"
echo "4. Watch Slack for daily win alerts once analytics detects velocity targets"
