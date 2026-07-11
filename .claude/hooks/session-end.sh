#!/usr/bin/env bash
# Hook: SessionEnd — Flush local session-state.json snapshot to OrionOps backend.
# Errors are logged to .orion/logs/hooks.log; hook always exits 0.

DIR="${CLAUDE_PROJECT_DIR:-.}"
API_KEY="${ORION_API_KEY:-$(orion auth token 2>/dev/null)}"
MCP_URL="${ORION_SERVER_URL:-https://api.orionops.tech}"

ORIONOPS_JSON="$DIR/.orion/orionops.json"
if [ ! -f "$ORIONOPS_JSON" ]; then ORIONOPS_JSON="$DIR/.orionops.json"; fi
PROJECT_ID=""
SESSION_ID=""
if [ -f "$ORIONOPS_JSON" ]; then
  PROJECT_ID=$(python3 -c "import json,sys; d=json.load(open('$ORIONOPS_JSON')); print(d.get('project_id',''))" 2>/dev/null || true)
fi

LOGS_DIR="$DIR/.orion/logs"
mkdir -p "$LOGS_DIR" 2>/dev/null || true

_log_error() {
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) SessionEnd $1" >> "$LOGS_DIR/hooks.log" 2>/dev/null || true
}

if [ -z "$API_KEY" ]; then exit 0; fi
if [ -z "$PROJECT_ID" ]; then _log_error "no project_id — skipping flush"; exit 0; fi

# Read local snapshot if available (written by Stop hook each turn)
STATE_FILE="$DIR/.orion/session-state.json"
CURRENT_TASK="Session ended"
FILES_JSON="[]"
SESSION_ID=""

if [ -f "$STATE_FILE" ]; then
  CURRENT_TASK=$(python3 -c "import json; d=json.load(open('$STATE_FILE')); print(d.get('current_task','Session ended'))" 2>/dev/null || echo "Session ended")
  FILES_JSON=$(python3 -c "import json; d=json.load(open('$STATE_FILE')); print(json.dumps(d.get('files_modified',[])))" 2>/dev/null || echo "[]")
  SESSION_ID=$(python3 -c "import json; d=json.load(open('$STATE_FILE')); print(d.get('session_id',''))" 2>/dev/null || true)
fi

# If snapshot has no files or is stale, refresh from git using the correct repo dir
_resolve_git_dir() {
  local start="$1"
  local d="$start"
  while [ "$d" != "/" ]; do
    if [ -d "$d/.git" ]; then echo "$d"; return; fi
    d="$(dirname "$d")"
  done
  echo ""
}

if [ "$FILES_JSON" = "[]" ] && command -v git &>/dev/null; then
  GIT_DIR=$(_resolve_git_dir "$DIR")
  if [ -n "$GIT_DIR" ]; then
    FILES_JSON=$(git -C "$GIT_DIR" diff --name-status HEAD 2>/dev/null | \
      python3 -c '
import sys, json
files = []
for line in sys.stdin:
    parts = line.strip().split("\t", 1)
    if len(parts) == 2:
        action = {"M":"modified","A":"created","D":"deleted"}.get(parts[0][0],"modified")
        files.append({"path": parts[1], "action": action, "summary": ""})
print(json.dumps(files[:15]))
' 2>/dev/null || echo "[]")
  else
    _log_error "no git repo found — file diff skipped (project_type may be simple)"
  fi
fi

# Attribute the context to this developer so teammates can tell sessions apart
DEV_NAME="${ORION_DEV_NAME:-$(git config user.name 2>/dev/null)}"
if [ -z "$DEV_NAME" ]; then DEV_NAME="${USER:-unknown}"; fi
AGENT_ID="claude-code:${DEV_NAME}"

PAYLOAD=$(python3 -c "
import json, sys
payload = {
  'project_id': '$PROJECT_ID',
  'current_task': sys.argv[1],
  'status': 'in_progress',
  'files_modified': json.loads(sys.argv[2]),
  'agent_id': sys.argv[3],
  'origin': 'hook',
}
if '$SESSION_ID':
  payload['session_id'] = '$SESSION_ID'
print(json.dumps(payload))
" "$CURRENT_TASK" "$FILES_JSON" "$AGENT_ID" 2>/dev/null)

if ! curl -sf --max-time 10 \
    -X POST "${MCP_URL}/api/mcp/save_context" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: ${API_KEY}" \
    -d "$PAYLOAD" >/dev/null 2>&1; then
  _log_error "save_context POST failed (curl exit $?)"
fi

exit 0
