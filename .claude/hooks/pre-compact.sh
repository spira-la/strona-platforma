#!/usr/bin/env bash
# Hook: PreCompact — Flush local session-state.json to the OrionOps backend.
# Called before context compaction; also triggered explicitly at session end.
# Deduplicates by session_id — same session always updates the same row.
# Errors logged to .orion/logs/hooks.log; always exits 0.

DIR="${CLAUDE_PROJECT_DIR:-.}"
API_KEY="${ORION_API_KEY:-$(orion auth token 2>/dev/null)}"
MCP_URL="${ORION_SERVER_URL:-https://api.orionops.tech}"

LOGS_DIR="$DIR/.orion/logs"
mkdir -p "$LOGS_DIR" 2>/dev/null || true

_log_error() {
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) PreCompact $1" >> "$LOGS_DIR/hooks.log" 2>/dev/null || true
}

if [ -z "$API_KEY" ]; then exit 0; fi

STATE_FILE="$DIR/.orion/session-state.json"
if [ ! -f "$STATE_FILE" ]; then
  _log_error "no session-state.json — nothing to flush"
  exit 0
fi

PROJECT_ID=$(python3 -c "import json; print(json.load(open('$STATE_FILE')).get('project_id',''))" 2>/dev/null || true)
CURRENT_TASK=$(python3 -c "import json; print(json.load(open('$STATE_FILE')).get('current_task','in progress'))" 2>/dev/null || echo "in progress")
FILES_JSON=$(python3 -c "import json; print(json.dumps(json.load(open('$STATE_FILE')).get('files_modified',[])))" 2>/dev/null || echo "[]")
SESSION_ID=$(python3 -c "import json; print(json.load(open('$STATE_FILE')).get('session_id',''))" 2>/dev/null || true)

if [ -z "$PROJECT_ID" ]; then _log_error "no project_id in session-state.json"; exit 0; fi

# Attribute the context to this developer so teammates can tell sessions apart
DEV_NAME="${ORION_DEV_NAME:-$(git config user.name 2>/dev/null)}"
if [ -z "$DEV_NAME" ]; then DEV_NAME="${USER:-unknown}"; fi
AGENT_ID="claude-code:${DEV_NAME}"

PAYLOAD=$(python3 -c "
import json, sys
payload = {
  'project_id': sys.argv[1],
  'current_task': sys.argv[2],
  'status': 'in_progress',
  'files_modified': json.loads(sys.argv[3]),
  'agent_id': sys.argv[5],
  'origin': 'hook',
}
if sys.argv[4]:
  payload['session_id'] = sys.argv[4]
print(json.dumps(payload))
" "$PROJECT_ID" "$CURRENT_TASK" "$FILES_JSON" "$SESSION_ID" "$AGENT_ID" 2>/dev/null)

if ! curl -sf --max-time 10 \
    -X POST "${MCP_URL}/api/mcp/save_context" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: ${API_KEY}" \
    -d "$PAYLOAD" >/dev/null 2>&1; then
  _log_error "save_context POST failed (curl exit $?)"
fi

exit 0
