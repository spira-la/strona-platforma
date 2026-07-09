#!/usr/bin/env bash
# Hook: PreToolUse — warn when editing a file another developer is actively working on
set -euo pipefail

PAYLOAD=$(cat)

DIR="${CLAUDE_PROJECT_DIR:-.}"
API_KEY="${ORION_API_KEY:-$(orion auth token 2>/dev/null)}"
MCP_URL="${ORION_SERVER_URL:-https://api.orionops.tech}"

# Only act on file-editing tools with a non-empty file_path; otherwise exit fast.
PARSED=$(printf '%s' "$PAYLOAD" | python3 -c "
import json,sys
try:
    d=json.load(sys.stdin)
except Exception:
    d={}
tool=d.get('tool_name','') or ''
ti=d.get('tool_input') or {}
fp=ti.get('file_path','') or ''
sid=d.get('session_id','') or ''
print(tool)
print(fp)
print(sid)
print('___ORION_HOOK_EOF___')
" 2>/dev/null || true)

# NOTE: command substitution strips ALL trailing newlines, so if session_id
# were the last field and happened to be empty, the third read would hit
# EOF and (under set -e) abort the whole script. The sentinel line below
# guarantees there is always trailing non-newline content to read past.
TOOL_NAME=""
FILE_PATH=""
HOOK_SESSION_ID=""
if [ -n "$PARSED" ]; then
  { read -r TOOL_NAME; read -r FILE_PATH; read -r HOOK_SESSION_ID; read -r _EOF_MARKER; } <<< "$PARSED"
fi

case "$TOOL_NAME" in
  Edit|Write|MultiEdit|NotebookEdit) ;;
  *) exit 0 ;;
esac
[ -z "$FILE_PATH" ] && exit 0

# Resolve project + auth — fail open (never block) when either is missing.
ORIONOPS_JSON="$DIR/.orion/orionops.json"
if [ ! -f "$ORIONOPS_JSON" ]; then ORIONOPS_JSON="$DIR/.orionops.json"; fi
PROJECT_ID=""
if [ -f "$ORIONOPS_JSON" ]; then
  PROJECT_ID=$(python3 -c "import json; print(json.load(open('$ORIONOPS_JSON')).get('project_id',''))" 2>/dev/null || true)
fi

[ -z "$API_KEY" ] && exit 0
[ -z "$PROJECT_ID" ] && exit 0

# Repo-relative path for matching against backend-tracked files.
REL_PATH="$FILE_PATH"
case "$FILE_PATH" in
  "$DIR"/*) REL_PATH="${FILE_PATH#"$DIR"/}" ;;
esac

# Session id: prefer the hook payload's session_id, fall back to the local
# rolling snapshot written by the Stop hook.
SESSION_ID="$HOOK_SESSION_ID"
STATE_FILE="$DIR/.orion/session-state.json"
if [ -z "$SESSION_ID" ] && [ -f "$STATE_FILE" ]; then
  SESSION_ID=$(python3 -c "import json; print(json.load(open('$STATE_FILE')).get('session_id',''))" 2>/dev/null || true)
fi

# Warn-once guard — never nag twice for the same file in the same session.
WARNED_FILE="$DIR/.orion/conflicts-warned.json"
ALREADY_WARNED=$(python3 -c "
import json,sys
try:
    d=json.load(open(sys.argv[1]))
except Exception:
    d={}
print('1' if sys.argv[2] in d else '0')
" "$WARNED_FILE" "$REL_PATH" 2>/dev/null || echo "0")
[ "$ALREADY_WARNED" = "1" ] && exit 0

REQ_BODY=$(python3 -c "
import json,sys
body={'project_id':sys.argv[1],'files':[sys.argv[2]]}
if sys.argv[3]: body['session_id']=sys.argv[3]
print(json.dumps(body))
" "$PROJECT_ID" "$REL_PATH" "$SESSION_ID" 2>/dev/null)

CONFLICT_JSON=$(curl -sf --max-time 3 -X POST "${MCP_URL}/api/mcp/check_conflicts" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d "$REQ_BODY" 2>/dev/null || true)

[ -z "$CONFLICT_JSON" ] && exit 0

BLOCK_REASON=$(printf '%s' "$CONFLICT_JSON" | python3 -c "
import json,sys
try:
    d=json.load(sys.stdin)
except Exception:
    sys.exit(0)
if not d.get('success'):
    sys.exit(0)
conflicts=(d.get('data') or {}).get('conflicts') or []
for c in conflicts:
    if c.get('stale'):
        continue
    owner=c.get('owner') or 'someone'
    title=c.get('title') or ''
    updated=c.get('updated_at') or ''
    path=c.get('path') or sys.argv[1]
    print(u'⚠ TEAM CONFLICT: '+path+' is being worked on by '+owner+' ('+title+', updated '+updated+'). Coordinate via comment_task or confirm with the user before editing. If proceeding is intentional, retry the edit — this warning fires once per file per session.')
    break
" "$REL_PATH" 2>/dev/null || true)

# Stale-only (or no) conflicts — nothing to warn about.
[ -z "$BLOCK_REASON" ] && exit 0

# Record the warn-once state BEFORE emitting the block message.
mkdir -p "$DIR/.orion" 2>/dev/null || true
python3 -c "
import json,sys,datetime
path=sys.argv[1]; f=sys.argv[2]
try:
    d=json.load(open(f))
except Exception:
    d={}
d[path]=datetime.datetime.utcnow().isoformat()+'Z'
json.dump(d, open(f,'w'))
" "$REL_PATH" "$WARNED_FILE" 2>/dev/null || true

python3 -c "
import json,sys
print(json.dumps({'decision':'block','reason':sys.argv[1]}))
" "$BLOCK_REASON"

exit 0
