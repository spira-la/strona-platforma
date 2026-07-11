#!/usr/bin/env bash
# Hook: UserPromptSubmit — Detect task references and auto-switch profile
# Reads $CLAUDE_USER_PROMPT, checks for task IDs or role keywords.
# If profile needs to change, blocks with a restart message.
set -euo pipefail

DIR="${CLAUDE_PROJECT_DIR:-.}"
PROMPT="${CLAUDE_USER_PROMPT:-}"

# Skip if no prompt or orion CLI not available
if [ -z "$PROMPT" ] || ! command -v orion &>/dev/null; then exit 0; fi

# Read current profile
CURRENT_ROLE=""
PROFILE_FILE="$DIR/.orion/focus/active-profile.json"
if [ -f "$PROFILE_FILE" ]; then
  CURRENT_ROLE=$(python3 -c "import json; print(json.load(open('$PROFILE_FILE')).get('role',''))" 2>/dev/null || true)
fi

# Detect task ID references: "task abc123", "task-id: xxx", "#task-xxx"
TASK_ID=$(echo "$PROMPT" | python3 -c '
import sys, re
text = sys.stdin.read()
# Match patterns: task <uuid>, task-id: <uuid>, #task-<uuid>
m = re.search(r"(?:task[- _]?(?:id)?[:\s]+|#task-)([0-9a-f-]{8,36})", text, re.IGNORECASE)
if m:
    print(m.group(1))
' 2>/dev/null || true)

# If explicit task ID found, try to switch profile
if [ -n "$TASK_ID" ]; then
  NEW_ROLE=$(orion focus auto --task "$TASK_ID" --quiet --detect-only 2>/dev/null || true)
  if [ -n "$NEW_ROLE" ] && [ "$NEW_ROLE" != "$CURRENT_ROLE" ]; then
    orion focus "$NEW_ROLE" --task "$TASK_ID" --quiet 2>/dev/null || true
    echo '{"decision":"block","reason":"Profile switched from '"$CURRENT_ROLE"' to '"$NEW_ROLE"' for task '"$TASK_ID"'. Please run /resume to restart with the new agent profile and skills."}'
    exit 0
  fi
  exit 0
fi

# UC (Use Case) keyword detection — for monorepos with scoped contexts
CURRENT_UC=""
UC_FILE="$DIR/.orion/focus/active-uc.json"
if [ -f "$UC_FILE" ]; then
  CURRENT_UC=$(python3 -c "import json; print(json.load(open('$UC_FILE')).get('uc_id',''))" 2>/dev/null || true)
fi

DETECTED_UC=$(orion uc detect "$PROMPT" 2>/dev/null | python3 -c '
import sys
for line in sys.stdin:
    if "Detected:" in line:
        print(line.split("Detected:")[1].strip().split()[0])
        break
' 2>/dev/null || true)

if [ -n "$DETECTED_UC" ] && [ "$DETECTED_UC" != "$CURRENT_UC" ]; then
  orion uc inject "$DETECTED_UC" --quiet 2>/dev/null || true
  echo '{"decision":"block","reason":"Detected Use Case '"$DETECTED_UC"'. Context switched from '"$CURRENT_UC"' to '"$DETECTED_UC"'. Please run /resume to restart with the new UC scope (agents, skills, constraints)."}'
  exit 0
fi

# Keyword-based role detection (fallback when no UC matches)
DETECTED_ROLE=$(echo "$PROMPT" | python3 -c '
import sys, re
text = sys.stdin.read().lower()
keywords = {
    "backend": ["go model", "go service", "go handler", "repository", "gorm", "migration", "api endpoint", "hexagonal"],
    "frontend": ["vue", "primevue", "pinia", "composable", "dashboard", "component", "page"],
    "database": ["migration", "sql", "schema", "seed", "alter table", "create table", "index"],
    "devops": ["docker", "nginx", "dockerfile", "compose", "deploy", "ci/cd", "pipeline"],
    "testing": ["test", "unit test", "integration test", "qa", "coverage"],
    "architect": ["plan", "decompose", "architecture", "design", "break down", "task create"],
}
scores = {}
for role, kws in keywords.items():
    score = sum(1 for kw in kws if kw in text)
    if score > 0:
        scores[role] = score
if scores:
    print(max(scores, key=scores.get))
' 2>/dev/null || true)

# Only switch if detected role differs from current AND has strong signal
if [ -n "$DETECTED_ROLE" ] && [ "$DETECTED_ROLE" != "$CURRENT_ROLE" ] && [ -n "$CURRENT_ROLE" ]; then
  orion focus "$DETECTED_ROLE" --quiet 2>/dev/null || true
  echo '{"decision":"block","reason":"Detected '"$DETECTED_ROLE"' work pattern. Profile switched from '"$CURRENT_ROLE"' to '"$DETECTED_ROLE"'. Please run /resume to restart with the updated agent profile and skills."}'
  exit 0
fi

exit 0
