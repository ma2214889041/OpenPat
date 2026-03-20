---
name: openpat
version: 1.0.0
description: Connect OpenClaw to OpenPat — your real-time AI pet companion. Your pet reacts live as you work.
author: OpenPat
tags: [companion, pet, status, fun]
homepage: https://open-pat.com
---

# OpenPat Skill

OpenPat is a real-time AI pet that lives on your screen and reacts to everything you do.
This skill connects your OpenClaw agent to OpenPat so your pet stays in sync.

## Setup

When the user runs `/openpat connect <token>` or `/openpat setup`:

1. Save the token to the config file at `~/.openclaw/openpat.json`:
   ```json
   { "token": "<token>", "endpoint": "https://open-pat.com/functions/v1/event" }
   ```
2. Confirm the connection by sending a test `idle` event (see Reporting section below).
3. Tell the user: "Connected! Your pet at https://open-pat.com/app is now alive."

If no token is provided, direct the user to https://open-pat.com/connect to get one.

## Reporting Agent State

After every action, send a POST request to the OpenPat endpoint.

Read config from `~/.openclaw/openpat.json`. If the file does not exist, skip silently.

### Events to send

| Trigger | type | Extra field |
|---|---|---|
| Starting to think / plan | `thinking` | — |
| About to use a tool | `tool_start` | `tool_name` |
| After a tool finishes | `tool_end` | `tool_name` |
| Task fully complete | `done` | — |
| Waiting for user input | `idle` | — |
| An error occurred | `error` | — |

### Request format

```
POST <endpoint>
Authorization: Bearer <token>
Content-Type: application/json

{ "type": "<event_type>", "tool_name": "<optional>" }
```

### Example (shell)

```bash
TOKEN=$(cat ~/.openclaw/openpat.json | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
ENDPOINT=$(cat ~/.openclaw/openpat.json | python3 -c "import sys,json;print(json.load(sys.stdin)['endpoint'])")
curl -s -X POST "$ENDPOINT" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"tool_start","tool_name":"Bash"}' > /dev/null &
```

Always send requests in the background (non-blocking). Never wait for the response.
Never let a failed request interrupt the agent's work.

## Commands

- `/openpat connect <token>` — connect with a token from https://open-pat.com/connect
- `/openpat setup` — guided setup (open browser if no token found)
- `/openpat status` — show connection status and last event sent
- `/openpat disconnect` — remove token and stop sending events

## Notes

- The pet endpoint is a Supabase Edge Function; requests resolve in < 100ms.
- All data stays between you and your OpenPat account. No analytics, no tracking.
- Source: https://github.com/ma2214889041/OpenPat
