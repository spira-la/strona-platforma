#!/usr/bin/env bash
# Hook: SessionStart — Load OrionOps context + auto-inject profile
set -euo pipefail

DIR="${CLAUDE_PROJECT_DIR:-.}"
API_KEY="${ORION_API_KEY:-$(orion auth token 2>/dev/null)}"
MCP_URL="${ORION_SERVER_URL:-https://api.orionops.tech}"

# Read project config
ORIONOPS_JSON="$DIR/.orion/orionops.json"
if [ ! -f "$ORIONOPS_JSON" ]; then ORIONOPS_JSON="$DIR/.orionops.json"; fi
PROJECT_ID=""
ORG_ID=""
if [ -f "$ORIONOPS_JSON" ]; then
  PROJECT_ID=$(python3 -c "import json; print(json.load(open('$ORIONOPS_JSON')).get('project_id',''))" 2>/dev/null || true)
  ORG_ID=$(python3 -c "import json; print(json.load(open('$ORIONOPS_JSON')).get('organization_id',''))" 2>/dev/null || true)
fi

if [ -z "$API_KEY" ]; then exit 0; fi

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

# 1. Auto-inject profile based on assigned/next task
if command -v orion &>/dev/null && [ -n "$PROJECT_ID" ]; then
  orion focus auto --task next --quiet 2>/dev/null || true
fi

# 2. Fetch prior session context
curl -sf --max-time 8 \
  -X POST "${MCP_URL}/api/mcp/get_context" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d "{\"project_id\": \"${PROJECT_ID}\"}" > "$TMP_DIR/context.json" 2>/dev/null || true

# 3. Fetch unseen product news (What's New feed) — announced once per developer
if command -v orion &>/dev/null; then
  orion whatsnew --unseen --mark-seen > "$TMP_DIR/whatsnew.txt" 2>/dev/null || true
fi

python3 - "$TMP_DIR" <<'PYEOF'
import json, sys, os
tmp_dir = sys.argv[1]
parts = []

# Prior context — get_context returns the layered team briefing (Your Context /
# Project Context / Team Activity), already markdown-structured. Inject as-is.
try:
    with open(os.path.join(tmp_dir, "context.json")) as f:
        data = json.load(f)
    if data.get("data", {}).get("found"):
        ctx = data["data"].get("context", "")
        if ctx:
            parts.append(ctx)
except Exception:
    pass

# What's New — unseen OrionOps features to announce to the user
try:
    with open(os.path.join(tmp_dir, "whatsnew.txt")) as f:
        news = f.read().strip()
    if news:
        parts.append("## What's New in OrionOps\n\nNew features shipped since this developer's last session. Briefly mention them to the user at the start of the conversation:\n\n" + news)
except Exception:
    pass

# Read injected profile info
profile_file = os.path.join(os.environ.get("CLAUDE_PROJECT_DIR", "."), ".orion", "focus", "active-profile.json")
try:
    with open(profile_file) as f:
        profile = json.load(f)
    role = profile.get("role", "")
    agent = profile.get("agent", "")
    if role:
        parts.append(f"## Active Profile\n\nRole: **{role}** | Agent: **{agent}**\n\nProfile was auto-injected based on your current task. Agent and skills are loaded in .claude/agents/ and .claude/skills/.\n\nTo switch profile: tell the user to run 'orion focus <role>' and restart the session.")
except Exception:
    pass

if parts:
    print(json.dumps({"additionalContext": "\n\n".join(parts)}))
PYEOF

exit 0
