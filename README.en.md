<div align="center">
  <h1>OpenPat 🐾</h1>
  <p><strong>Turn your AI Agent into a living digital companion — and brag about it.</strong></p>
  <p>Real-time presence · Meme sharing · Achievement system · GitHub badge</p>
  <p>
    <a href="https://github.com/ma2214889041/OpenPat">GitHub</a> ·
    <a href="#quick-start">Quick Start</a> ·
    <a href="#meme-share-system">Meme Sharing</a> ·
    <a href="#github-readme-badge">GitHub Badge</a> ·
    <a href="#deployment">Deployment</a>
  </p>
  <p>
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
    <img src="https://img.shields.io/badge/OpenPat-intelligent%20pet-8B8BFF" />
    <img src="https://img.shields.io/github/stars/ma2214889041/OpenPat?style=flat" />
  </p>
</div>

---

> OpenPat is an intelligent digital pet — reflecting your real-time work state, walking with you through every task, unlocking hilarious achievements, and letting you share it all with one click.

## Quick Start

```bash
npx openpat
```

Open your browser, enter the Gateway URL and Token, and your companion appears.

**Auto-detect:** `npx openpat` will automatically read `~/.openpat/openpat.json` — no manual setup required.

---

## Features

### 🐾 Real-time State Companion

7 states, each with unique animations, faithfully reflecting your Agent's work rhythm. Click the companion and it quips back based on its current state:

| State | Companion behavior | Click response |
|-------|--------------------|----------------|
| `idle` | Lounging, ready to go | "Don't poke me, I'm chilling." |
| `thinking` | Deep in thought | "Hold on! I'm thinking!" |
| `tool_call` | Going full throttle | "Don't distract me, I'm working!" |
| `done` | Task complete, celebrating 🎉 | "Heh, pretty good huh?" |
| `error` | Hit a snag, recovering | "Don't kick me… rough day already." |
| `token_exhausted` | Out of energy, needs feeding 🍤 | "Hungry… top up please." |
| `offline` | Quietly resting | "Hey, I'm sleeping." |

When **tokens run out**, a 🍤 Feed button appears on the main page — click it to comfort the companion (+5 affection, triggers celebration effect).

---

### 😂 Meme Share System

Pair a meme image with each Agent state, then generate a shareable card for WeChat Moments / Twitter.

#### Configure in the Admin panel

Go to `/admin` → "😂 State Memes" tab, upload one image + caption per state:

| State | Suggested meme vibe |
|-------|---------------------|
| `thinking` | The classic chin-resting deep-thought face |
| `tool_call` | Furious typing / going hard |
| `done` | Confetti explosion / pure satisfaction |
| `error` | Epic fail / meltdown |
| `token_exhausted` | Starving / empty wallet |

#### Share result

Click "😂 Meme Share" on the main page → generates a 1080×1350 PNG card:

```
┌─────────────────────────┐
│  [full-screen meme bg]  │
│                         │
│                         │
│─────────────────────────│
│  Your funny caption     │  ← large, white
│  @username              │
│            open-pat.com │
└─────────────────────────┘
```

---

### 🏅 GitHub README Badge

Add one line to your GitHub `README.md` to show your Agent's live status:

```markdown
![My Agent](https://open-pat.com/api/badge/your-username)
```

The badge shows: username + current state + total tasks, with color updating live:

| Color | State |
|-------|-------|
| 🟡 Yellow | `working` (using tools) |
| 🔵 Blue | `thinking` |
| 🟢 Green | `idle` / `done` |
| 🔴 Red | `error` |
| 🟠 Orange | `out of tokens` |
| ⚫ Gray | `offline` |

> **Setup required:** Add `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` to Cloudflare Pages → Settings → Environment variables (see [Deployment](#deployment))

---

### 🏆 Achievement System

19 built-in achievements + admin can add more anytime. Each unlock triggers a full-screen ceremony (particle effect + roast line + one-click share card).

| Rarity | Achievement | Unlock line example |
|--------|-------------|---------------------|
| Common | First Hatch | "It opened its eyes, looked around, and immediately started working. No intro, no small talk, straight to it." |
| Rare | Night Owl | "3 AM and it's still working. You were sleeping. The gap widens quietly." |
| Rare | Non-stop | "24 hours. No water break — because it doesn't drink water. Labor law is irrelevant here." |
| Epic | Zero-crash Week | "A full week with zero errors. In software, that's like a week with no traffic jams. Basically a myth." |
| Legendary | Lobster God | "At task 200,000, nothing happened. It just started 200,001. This is what legend looks like." |

#### Add achievements in Admin

`/admin` → "🏆 Achievements" → "+ New Achievement", configure:

- Name / Emoji / Rarity / Unlock condition
- **Unlock line** (the roast text in the popup — the more savage the better)
- **Share caption** (text on the achievement share card)
- Custom locked/unlocked icons (PNG/GIF supported)

---

### 📸 Share Cards

Beyond memes, also generate data recap cards:

- **PNG** (4:5 / 1:1) + **Animated GIF**
- 5 templates: Recap / Highlight / Crash Report / Late Night / Token Bill
- Captions auto-generate analogies from your data:
  - `500K tokens → "Like reading The Three-Body Problem twice"`
  - `1M tokens → "Enough to write a full novel"`
  - `50K tokens → "More than everything you said today"`

---

### ☁️ Login = Sync

| Not logged in | Logged in (GitHub / Google) |
|---------------|----------------------------|
| Data in localStorage (local only) | Real-time sync to Supabase |
| Lost if you switch devices | Shared across devices, written within 8 seconds |

Synced: total tasks / tool calls / token usage / achievements / level

---

### 🌐 Public Profile

After logging in, you get a personal link at `open-pat.com/u/your-username`, accessible by anyone, updated live via Supabase Realtime:

- Agent's current work state (green/orange/red dot)
- Companion animation (real-time state)
- Total tasks / level / achievement wall
- Auto-generated roast commentary based on your stats (the more you grind, the more savage it gets)

---

## Deployment

### Frontend env vars

```bash
# .env.local
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx
```

### Cloudflare Pages env vars (required for GitHub badge API)

In Cloudflare Pages → Settings → Environment variables:

```
SUPABASE_URL        = https://xxx.supabase.co
SUPABASE_SERVICE_KEY = eyJxxx   ← service_role key, NOT anon key
```

> ⚠️ `SUPABASE_SERVICE_KEY` must only be set as a Cloudflare server-side env var. **Never** put it in a `VITE_` variable — that would expose it in the frontend bundle.

### Cloudflare Pages build config

```
Build command:    npm run build
Output directory: dist
```

Add to `public/_redirects`:
```
/* /index.html 200
```

### Supabase table schema

```sql
-- User profile data
create table public.profiles (
  id                    uuid references auth.users primary key,
  username              text unique,
  avatar_url            text,
  total_tasks           integer     default 0,
  total_tool_calls      integer     default 0,
  total_tokens_input    bigint      default 0,
  total_tokens_output   bigint      default 0,
  achievements          jsonb       default '[]',
  level                 integer     default 0,
  updated_at            timestamptz default now()
);

-- Agent real-time state
create table public.agent_status (
  user_id             uuid references auth.users primary key,
  status              text,
  current_tool        text,
  session_tokens      integer default 0,
  session_tool_calls  integer default 0,
  updated_at          timestamptz default now()
);

-- RLS
alter table public.profiles     enable row level security;
alter table public.agent_status  enable row level security;

-- profiles: anyone can read, only owner can write
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_upsert" on public.profiles for all using (auth.uid() = id);

-- agent_status: anyone can read, only owner can write
create policy "status_select" on public.agent_status for select using (true);
create policy "status_upsert" on public.agent_status for all using (auth.uid() = user_id);
```

If you're upgrading from an older schema that had a single `total_tokens` column, run the migration:

```bash
# Run in Supabase SQL Editor:
# supabase/migrations/001_fix_token_columns.sql
```

---

## Local Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build
```

---

## Admin Panel (`/admin`)

| Tab | Function |
|-----|----------|
| 🎨 Skin Manager | Upload PNG frame sequences (8 states), set animation speed, rarity, unlock conditions, live preview |
| 🏆 Achievements | Add/edit achievements, write unlock lines and share captions, upload custom icons |
| 😂 State Memes | Set one meme image + caption per Agent state for the meme share card |

---

## Tech Stack

```
Frontend:  React 19 + Vite + react-router-dom v7
Backend:   Supabase (Auth + Realtime + PostgreSQL)
Deploy:    Cloudflare Pages + Pages Functions (badge API)
Storage:   IndexedDB (skin frames + memes) | localStorage (local data)
Export:    html-to-image (PNG) + gifenc (GIF)
```

---

## Privacy

OpenPat only syncs the **shape of your capability** — never any task content:

| Synced publicly ✅ | Never synced ❌ |
|-------------------|----------------|
| Task completion count | Actual task content |
| Token usage | Prompt content |
| Tool call count | Tool inputs / outputs |
| Agent work state | Conversation history |
| Achievement unlocks | Specific error details |

Your Gateway Token lives only on your own device in `localStorage` and is never uploaded to any server.

---

## Roadmap

| Status | Plan |
|--------|------|
| ✅ Shipped | Real-time state animation / Meme sharing / Achievement system (with roast lines) / Public profile / GitHub badge / Click interaction / Feed feature / Login sync |
| 🚧 In progress | Skin Cloudflare R2 migration / GIF export optimization |
| 📱 Planned | Mobile real-time push (task complete / error notifications) |
| 🔮 Dreaming | Creator skin community / Desktop floating window (Tamagotchi style) |

---

## Contributing

PRs and Issues are welcome! You can also design skins, translate docs, or share your experience.

## License

MIT © 2026 OpenPat Contributors

---

<div align="center">
  <p>With you at work. Witness every step. Let the Agent grind, let you brag.</p>
  <code>npx openpat</code>
</div>
