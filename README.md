<div align="center">
  <h1>OpenPat 🐾</h1>
  <p><strong>一个真正记得你的 AI 宠物伴侣</strong></p>
  <p>An AI pet companion that actually remembers you</p>
  <p>
    <a href="https://open-pat.com">Website</a> ·
    <a href="https://open-pat.com/chat">Start Chatting</a> ·
    <a href="https://github.com/ma2214889041/OpenPat">GitHub</a>
  </p>
  <p>
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
    <img src="https://img.shields.io/badge/OpenPat-AI%20companion-8B8BFF" />
    <img src="https://img.shields.io/github/stars/ma2214889041/OpenPat?style=flat" />
  </p>
</div>

---

## What is OpenPat?

OpenPat (拍拍) is an open-source AI pet companion with persistent memory. Unlike typical AI chatbots that start fresh every conversation, Pat remembers who you are, what you've shared, and how you're feeling — and it grows to understand you over time.

- **Remembers you** — personal facts, preferences, life events, goals
- **Understands emotions** — tracks emotional patterns and adapts its tone
- **Grows with you** — relationship evolves from stranger to confidant
- **Respects your wallet** — 3-tier memory architecture, ~0.15 LLM calls per message
- **Fully open source** — every line of code is visible

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)               │
│  Chat UI · Streaming SSE · Relationship stage · Memory    │
├──────────────────────────────────────────────────────────┤
│              Cloudflare Pages Functions (JS)               │
│  /api/chat · /api/check-in · /api/conversations · ...     │
├──────────────────────────────────────────────────────────┤
│  D1 (SQLite)  │  R2 (Storage)  │  KV (Config/Cache)      │
│  Memories     │  Assets        │  Site config             │
│  Profiles     │                │  Dream timestamps        │
│  Messages     │                │                          │
├──────────────────────────────────────────────────────────┤
│                   Gemini API (LLM)                        │
│  Chat · Function Calling · Batch Extraction · Dreams      │
└──────────────────────────────────────────────────────────┘
```

## 3-Tier Memory System

Inspired by [OpenClaw](https://github.com/openclaw/openclaw), [Hermes Agent](https://github.com/NousResearch/hermes-agent), and [Letta/MemGPT](https://github.com/letta-ai/letta).

| Tier | What | How | Cost |
|------|------|-----|------|
| **Core Profile** | `user_profiles` — who they are, personality, preferences, emotional baseline | Always loaded in system prompt. Rebuilt during daily "dream" cycle. | 0 per message |
| **Active Memories** | Top 8 memories by score (importance × recency × keyword match) | Pure function scoring, no LLM call. Injected with XML fencing. | 0 per message |
| **Archive** | All memories in D1 | Batch extraction every 5 exchanges. Daily consolidation merges/prunes. | ~0.15 calls/msg |

**How memories are created:**
1. **LLM self-directed** — During conversation, the LLM calls `save_memory` / `update_memory` tools when it notices important info. Zero extra API calls.
2. **Batch extraction** — Every 5 exchanges, a background job scans recent turns for anything the LLM missed. One cheap call.
3. **User explicit** — User says "remember this" and the LLM uses the save tool.

## Features

### Core
- **Streaming chat** — SSE streaming responses, feels instant
- **Persistent memory** — AUDN protocol (Add/Update/Delete/Noop) prevents duplicates
- **Emotional tracking** — Detects emotions, computes trends (escalating/stable/calming)
- **Relationship stages** — Stranger → Acquaintance → Friend → Close Friend → Confidant
- **Quality-based trust** — Trust score from message count, memories shared, emotional openness, time span

### Proactive
- **Follow-up system** — Detects future events ("interview tomorrow") and follows up later
- **Check-in API** — Generates warm proactive messages when user hasn't chatted in a while
- **Conversation summaries** — Auto-saves "what we talked about" for longer conversations

### Safety
- **Memory injection scanning** — 14 regex patterns detect prompt injection in memory content
- **XML fencing** — `<memory-context>` tags prevent LLM from confusing memories with user input
- **Conversation ownership** — JWT + conversation-level authorization check
- **API key in headers** — Gemini API key sent via `x-goog-api-key`, not URL params

## Tech Stack

| Layer | Technology |
|-------|-----------|
| LLM | Gemini 3.1 Flash Lite (function calling) |
| Backend | Cloudflare Pages Functions (serverless JS) |
| Database | Cloudflare D1 (SQLite) |
| Storage | Cloudflare R2 |
| Cache | Cloudflare KV |
| Frontend | React 19 + Vite 8 |
| Auth | Supabase Auth (GitHub / Google OAuth) |

## Quick Start

```bash
# Clone
git clone https://github.com/ma2214889041/OpenPat.git
cd OpenPat

# Install
npm install

# Configure
cp .env.example .env
# Edit .env with your Supabase keys

# Set Cloudflare secrets
wrangler secret put GEMINI_API_KEY
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_JWT_SECRET

# Init database
wrangler d1 execute openpat-db --file=d1/schema.sql

# Dev
npm run dev

# Deploy
npm run build
wrangler pages deploy dist
```

## Project Structure

```
functions/
  api/
    chat.js              # Core chat endpoint (streaming + memory + tools)
    check-in.js          # Proactive follow-up system
    conversations.js     # List/delete conversations
    conversations/[id].js
    memories.js           # View/manage memories
    memories/consolidate.js
    profile.js            # User profile CRUD
    status.js             # Agent status
    ...
  _shared/
    auth.js              # JWT verification (JWKS + HS256)
    gemini.js            # Gemini API wrapper (chat + stream + lite)
src/
  pages/
    Chat.jsx             # Chat UI with streaming, memory panel, relationship indicator
    Landing.jsx          # Marketing page (bilingual zh/en)
  utils/
    api.js               # HTTP client with streaming support
d1/
  schema.sql             # Database schema
```

## Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `memories` | Long-term user facts with importance scoring |
| `user_profiles` | Core profile (summary, personality, preferences, emotional baseline) |
| `emotional_logs` | Per-conversation emotion tracking |
| `relationship_state` | Stage + trust score (0-100) |
| `conversations` / `messages` | Chat history |
| `follow_ups` | Proactive follow-up triggers |

## How the Pet Learns

```
Day 1:  "Hi, I'm Pat! What do you do?"
        → Saves: job, name (via save_memory tool)
        → Relationship: stranger (trust: 10)

Day 3:  "How was your day?"
        → User shares: stressed about deadline
        → Saves: current_stress, work_deadline
        → Emotion: anxious (7/10)

Day 7:  Proactive: "那个 deadline 过了吗？"
        → follow_up triggered
        → Relationship: acquaintance (trust: 25)

Day 30: "You seem more relaxed lately"
        → Emotional trend: calming down
        → References past conversations naturally
        → Relationship: friend (trust: 45)
```

## Contributing

PRs and issues welcome! Please read [CLAUDE.md](./CLAUDE.md) for project guidelines.

## License

MIT © 2026 OpenPat Contributors
