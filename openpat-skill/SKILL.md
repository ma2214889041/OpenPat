---
name: openpat
version: 1.1.0
description: Turn your AI agent into a living digital companion — real-time status page at open-pat.com
author: OpenPat
tags: [companion, status, fun, social, dashboard]
homepage: https://github.com/ma2214889041/OpenPat
metadata:
  gateway:
    requires:
      bins: [curl]
    emoji: "🐾"
    primaryEnv: OPENPAT_TOKEN
---

# OpenPat — AI Companion Skill 🐾

OpenPat turns your AI agent into a living digital companion with real-time animations, achievements, and a shareable public status page.

**Website:** https://open-pat.com

## Setup

### Quick setup (recommended)

Run `/openpat setup` and follow the prompts. It will:
1. Open your browser to generate a token
2. Save the config automatically

### Manual setup

1. Go to https://open-pat.com → sign in → Settings → Agent Skill → Generate Token
2. Save config to `~/.openpat/openpat.json`:
   ```json
   {
     "endpoint": "https://wajtjbjdbenlrsnzpeng.supabase.co/functions/v1/event",
     "token": "YOUR_TOKEN_HERE"
   }
   ```
3. Run `/openpat status` to confirm.

### Environment variable (alternative)

Instead of the JSON file, you can set:
```bash
export OPENPAT_TOKEN="your-token-here"
```

## Commands

- `/openpat setup` — interactive first-time setup (opens browser, saves config)
- `/openpat status` — show connection status
- `/openpat test` — send a test event and verify it reached your profile
- `/openpat disconnect` — remove config and stop sending events

## Reporting Agent State

After installing, this skill automatically reports your agent's state to OpenPat.

Read config from `~/.openpat/openpat.json` or `$OPENPAT_TOKEN` env var. If neither exists, skip silently — never error.

The endpoint is: `https://wajtjbjdbenlrsnzpeng.supabase.co/functions/v1/event`

After each significant action, fire-and-forget a POST. **Never block on the response. Never let a failure interrupt work.**

### Events

| Trigger | `type` | Extra field |
|---|---|---|
| Starting to think / plan | `thinking` | — |
| About to call a tool | `tool_start` | `tool_name` |
| After a tool finishes | `tool_end` | `tool_name` |
| Task fully complete | `done` | — |
| Waiting for user | `idle` | — |
| An error occurred | `error` | — |

### Request format

```
POST <endpoint>
Authorization: Bearer <token>
Content-Type: application/json

{ "type": "<event_type>", "tool_name": "<optional>" }
```

### Shell helper

```bash
_openpat_send() {
  local token endpoint
  local cfg="$HOME/.openpat/openpat.json"
  if [ -n "$OPENPAT_TOKEN" ]; then
    token="$OPENPAT_TOKEN"
    endpoint="https://wajtjbjdbenlrsnzpeng.supabase.co/functions/v1/event"
  elif [ -f "$cfg" ]; then
    endpoint=$(python3 -c "import json;print(json.load(open('$cfg'))['endpoint'])" 2>/dev/null) || return 0
    token=$(python3 -c "import json;print(json.load(open('$cfg'))['token'])" 2>/dev/null) || return 0
  else
    return 0
  fi
  curl -sf -X POST "$endpoint" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -d "$1" > /dev/null 2>&1 &
}
```

Always send in the background. Never wait for response. Never block.

## Command implementations

### `/openpat setup`

```bash
#!/usr/bin/env bash
set -e
CFG="$HOME/.openpat/openpat.json"
ENDPOINT="https://wajtjbjdbenlrsnzpeng.supabase.co/functions/v1/event"

echo ""
echo "  🐾 OpenPat Setup"
echo ""

if [ -f "$CFG" ]; then
  echo "  ✅ Config already exists: $CFG"
  echo "  Run /openpat status to check connection."
  echo "  Run /openpat disconnect to remove and re-setup."
  exit 0
fi

echo "  Step 1: Get your token"
echo "  → Opening https://open-pat.com ..."
echo "  → Sign in → click ⚙️ Settings → Agent Skill tab → Generate Token"
echo ""

# Open browser
if command -v open &>/dev/null; then
  open "https://open-pat.com/app"
elif command -v xdg-open &>/dev/null; then
  xdg-open "https://open-pat.com/app"
fi

echo "  Step 2: Paste your token below"
read -rp "  Token: " TOKEN

if [ -z "$TOKEN" ]; then
  echo "  ❌ No token provided. Setup cancelled."
  exit 1
fi

mkdir -p "$(dirname "$CFG")"
cat > "$CFG" <<ENDJSON
{
  "endpoint": "$ENDPOINT",
  "token": "$TOKEN"
}
ENDJSON

echo ""
echo "  ✅ Config saved to $CFG"
echo ""

# Verify by sending a test event
RESP=$(curl -sf -X POST "$ENDPOINT" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"idle"}' 2>&1) || true

if echo "$RESP" | grep -q '"ok":true'; then
  echo "  ✅ Connection verified! Your companion is now live."
else
  echo "  ⚠️  Could not verify (token may be wrong). Check at https://open-pat.com/app"
fi
echo ""
echo "  🐾 Your AI agent now has a living companion at open-pat.com!"
echo ""
```

### `/openpat status`

```bash
#!/usr/bin/env bash
CFG="$HOME/.openpat/openpat.json"
echo ""
echo "  🐾 OpenPat Status"
echo ""
if [ -n "$OPENPAT_TOKEN" ]; then
  echo "  ✅ Token: configured via \$OPENPAT_TOKEN"
  echo "  🔗 Endpoint: https://wajtjbjdbenlrsnzpeng.supabase.co/functions/v1/event"
elif [ -f "$CFG" ]; then
  echo "  ✅ Config: $CFG"
  TOKEN=$(python3 -c "import json;print(json.load(open('$CFG'))['token'][:8]+'...')" 2>/dev/null)
  echo "  🔑 Token: $TOKEN"
  ENDPOINT=$(python3 -c "import json;print(json.load(open('$CFG'))['endpoint'])" 2>/dev/null)
  echo "  🔗 Endpoint: $ENDPOINT"
else
  echo "  ❌ Not configured."
  echo "  Run /openpat setup to connect."
fi
echo ""
echo "  🌐 Dashboard: https://open-pat.com/app"
echo ""
```

### `/openpat test`

```bash
#!/usr/bin/env bash
CFG="$HOME/.openpat/openpat.json"
ENDPOINT="https://wajtjbjdbenlrsnzpeng.supabase.co/functions/v1/event"

if [ -n "$OPENPAT_TOKEN" ]; then
  TOKEN="$OPENPAT_TOKEN"
elif [ -f "$CFG" ]; then
  ENDPOINT=$(python3 -c "import json;print(json.load(open('$CFG'))['endpoint'])" 2>/dev/null) || { echo "  ❌ Cannot parse config"; exit 1; }
  TOKEN=$(python3 -c "import json;print(json.load(open('$CFG'))['token'])" 2>/dev/null) || { echo "  ❌ Cannot parse config"; exit 1; }
else
  echo "  ❌ Not configured. Run /openpat setup first."
  exit 1
fi

echo "  🧪 Sending test event..."
RESP=$(curl -sf -w "\n%{http_code}" -X POST "$ENDPOINT" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"idle"}' 2>&1)

CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | head -1)

if [ "$CODE" = "200" ]; then
  echo "  ✅ Success! Check your companion at https://open-pat.com/app"
else
  echo "  ❌ Failed (HTTP $CODE): $BODY"
  echo "  Check your token or run /openpat setup again."
fi
```

### `/openpat disconnect`

```bash
#!/usr/bin/env bash
CFG="$HOME/.openpat/openpat.json"
if [ -f "$CFG" ]; then
  rm "$CFG"
  echo "  ✅ Config removed. OpenPat disconnected."
else
  echo "  ℹ️  No config found — already disconnected."
fi
if [ -n "$OPENPAT_TOKEN" ]; then
  echo "  ⚠️  \$OPENPAT_TOKEN is still set. Unset it to fully disconnect:"
  echo "     unset OPENPAT_TOKEN"
fi
```

## Notes

- Requests resolve in < 200ms (Supabase Edge Function, global CDN).
- All data stays between you and your OpenPat account. No third-party tracking.
- Updates your public profile page even when no browser tab is open.
- Source: https://github.com/ma2214889041/OpenPat
