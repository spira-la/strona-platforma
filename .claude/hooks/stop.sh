#!/usr/bin/env bash
# Hook: Stop — Write a rolling local snapshot after each assistant turn.
# Fast, no network. Errors logged to .orion/logs/hooks.log; always exits 0.

DIR="${CLAUDE_PROJECT_DIR:-.}"

LOGS_DIR="$DIR/.orion/logs"
mkdir -p "$LOGS_DIR" 2>/dev/null || true

_log_error() {
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) Stop $1" >> "$LOGS_DIR/hooks.log" 2>/dev/null || true
}

ORIONOPS_JSON="$DIR/.orion/orionops.json"
if [ ! -f "$ORIONOPS_JSON" ]; then ORIONOPS_JSON="$DIR/.orionops.json"; fi
PROJECT_ID=""
if [ -f "$ORIONOPS_JSON" ]; then
  PROJECT_ID=$(python3 -c "import json; print(json.load(open('$ORIONOPS_JSON')).get('project_id',''))" 2>/dev/null || true)
fi

# Resolve current task from active focus profile if available
CURRENT_TASK="in progress"
PROFILE_FILE="$DIR/.orion/focus/active-profile.json"
if [ -f "$PROFILE_FILE" ]; then
  TASK_ID=$(python3 -c "import json; print(json.load(open('$PROFILE_FILE')).get('task_id',''))" 2>/dev/null || true)
  TASK_TITLE=$(python3 -c "import json; print(json.load(open('$PROFILE_FILE')).get('task_title',''))" 2>/dev/null || true)
  if [ -n "$TASK_TITLE" ]; then
    CURRENT_TASK="$TASK_TITLE"
  elif [ -n "$TASK_ID" ]; then
    CURRENT_TASK="task:$TASK_ID"
  fi
fi

# Resolve git repo directory by walking up from DIR
_resolve_git_dir() {
  local d="$1"
  while [ "$d" != "/" ]; do
    if [ -d "$d/.git" ]; then echo "$d"; return; fi
    d="$(dirname "$d")"
  done
  echo ""
}

FILES_JSON="[]"
GIT_REPO=""
if command -v git &>/dev/null; then
  GIT_REPO=$(_resolve_git_dir "$DIR")
  if [ -n "$GIT_REPO" ]; then
    FILES_JSON=$(git -C "$GIT_REPO" diff --name-status HEAD 2>/dev/null | \
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

# Generate or reuse a stable session_id for this session
SESSION_ID=""
STATE_FILE="$DIR/.orion/session-state.json"
if [ -f "$STATE_FILE" ]; then
  SESSION_ID=$(python3 -c "import json; print(json.load(open('$STATE_FILE')).get('session_id',''))" 2>/dev/null || true)
fi
if [ -z "$SESSION_ID" ]; then
  SESSION_ID=$(python3 -c "import uuid; print(str(uuid.uuid4()))" 2>/dev/null || date -u +%s)
fi

mkdir -p "$DIR/.orion" 2>/dev/null || true

if ! python3 -c "
import json, sys, os
state = {
  'session_id': '$SESSION_ID',
  'project_id': '$PROJECT_ID',
  'current_task': sys.argv[1],
  'files_modified': json.loads(sys.argv[2]),
  'updated_at': __import__('datetime').datetime.utcnow().isoformat() + 'Z',
}
with open('$STATE_FILE', 'w') as f:
    json.dump(state, f, indent=2)
" "$CURRENT_TASK" "$FILES_JSON" 2>/dev/null; then
  _log_error "failed to write session-state.json"
fi

exit 0
