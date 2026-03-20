---
name: openpat
version: 1.0.0
description: Report your agent's real-time state to OpenPat — your live AI companion page
author: OpenPat
tags: [companion, status, fun]
homepage: https://github.com/ma2214889041/OpenPat
metadata: {"openclaw":{"requires":{"bins":["curl"]}}}
---

# OpenPat Skill

OpenPat is a real-time AI companion that lives in your browser and reacts to everything you do.
This skill pushes your OpenClaw agent's state to OpenPat so your companion stays in sync — even when no browser tab is open.

## Setup

1. Log in to your OpenPat account and go to **Settings → Agent Skill**.
2. Click **Generate Token** to create your API token.
3. Copy the config JSON shown and save it to `~/.openclaw/openpat.json`:
   ```json
   {
     "endpoint": "https://<your-project>.supabase.co/functions/v1/event",
     "token": "<your-token>"
   }
   ```
4. Run `/openpat status` to confirm the connection.

## Commands

- `/openpat status` — show connection status and last event sent
- `/openpat test` — send a test `idle` event and confirm it reached your profile
- `/openpat disconnect` — remove `~/.openclaw/openpat.json` and stop sending events

## Reporting Agent State

Read config from `~/.openclaw/openpat.json`. If the file does not exist, skip silently.

After each significant action, fire-and-forget a POST to the endpoint. **Never block on the response.**

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

### Shell helper (used internally)

```bash
_openpat_send() {
  local cfg="$HOME/.openclaw/openpat.json"
  [ -f "$cfg" ] || return 0
  local endpoint token
  endpoint=$(python3 -c "import json;d=json.load(open('$cfg'));print(d['endpoint'])" 2>/dev/null) || return 0
  token=$(python3 -c "import json;d=json.load(open('$cfg'));print(d['token'])" 2>/dev/null) || return 0
  curl -sf -X POST "$endpoint" \
    -H "Authorization: Bearer $token" \
    -H "Content-Type: application/json" \
    -d "$1" > /dev/null 2>&1 &
}

# Usage:
_openpat_send '{"type":"thinking"}'
_openpat_send '{"type":"tool_start","tool_name":"Bash"}'
_openpat_send '{"type":"done"}'
```

Always send requests in the background (non-blocking). Never wait for the response.
Never let a failed request interrupt the agent's work.

## Notes

- Requests resolve in < 200ms (Supabase Edge Function, global CDN).
- All data stays between you and your OpenPat account. No third-party tracking.
- The skill updates your public profile page even when no browser tab is watching.
- Source: https://github.com/ma2214889041/OpenPat
