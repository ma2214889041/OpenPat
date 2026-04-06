-- OpenPat D1 Schema (SQLite)
-- Run: wrangler d1 execute openpat-db --file=d1/schema.sql

CREATE TABLE IF NOT EXISTS profiles (
  id                  TEXT PRIMARY KEY,
  username            TEXT UNIQUE NOT NULL,
  avatar_url          TEXT,
  total_tasks         INTEGER DEFAULT 0,
  total_tool_calls    INTEGER DEFAULT 0,
  total_tokens_input  INTEGER DEFAULT 0,
  total_tokens_output INTEGER DEFAULT 0,
  achievements        TEXT DEFAULT '[]',
  level               INTEGER DEFAULT 0,
  created_at          TEXT DEFAULT (datetime('now')),
  updated_at          TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agent_status (
  user_id            TEXT PRIMARY KEY,
  status             TEXT NOT NULL DEFAULT 'offline',
  current_tool       TEXT,
  session_tokens     INTEGER DEFAULT 0,
  session_tool_calls INTEGER DEFAULT 0,
  is_public          INTEGER DEFAULT 1,
  updated_at         TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS api_tokens (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL,
  token        TEXT UNIQUE NOT NULL,
  label        TEXT DEFAULT 'OpenPat',
  created_at   TEXT DEFAULT (datetime('now')),
  last_used_at TEXT
);

CREATE TABLE IF NOT EXISTS feedback_submissions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT,
  content    TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS state_memes (
  state      TEXT PRIMARY KEY,
  image_url  TEXT,
  caption    TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS achievement_configs (
  id                TEXT PRIMARY KEY,
  name              TEXT,
  description       TEXT DEFAULT '',
  emoji             TEXT,
  rarity            TEXT,
  unlock_type       TEXT,
  unlock_threshold  INTEGER,
  unlock_caption    TEXT DEFAULT '',
  share_caption     TEXT DEFAULT '',
  icon_locked_url   TEXT,
  icon_unlocked_url TEXT,
  is_active         INTEGER DEFAULT 1,
  created_at        TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS skins (
  id           TEXT PRIMARY KEY,
  name         TEXT,
  description  TEXT,
  emoji        TEXT,
  rarity       TEXT,
  display_type TEXT,
  colors       TEXT,
  pixelated    INTEGER DEFAULT 0,
  is_active    INTEGER DEFAULT 1,
  created_at   TEXT DEFAULT (datetime('now'))
);

-- ── Companion Chat & Memory ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS memories (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  type        TEXT NOT NULL CHECK(type IN ('user','feedback','life','reference')),
  layer       TEXT NOT NULL DEFAULT 'archival' CHECK(layer IN ('core','archival')),
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  content     TEXT NOT NULL,
  importance  INTEGER DEFAULT 5 CHECK(importance BETWEEN 1 AND 10),
  recall_count INTEGER DEFAULT 0,
  last_recalled_at TEXT,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(user_id, type);
CREATE INDEX IF NOT EXISTS idx_memories_layer ON memories(user_id, layer);

-- Core user profile: single structured document per user (MemGPT-style)
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id       TEXT PRIMARY KEY,
  core_summary  TEXT DEFAULT '',
  personality   TEXT DEFAULT '',
  preferences   TEXT DEFAULT '',
  emotional_baseline TEXT DEFAULT '',
  updated_at    TEXT DEFAULT (datetime('now'))
);

-- Emotional state tracking per conversation
CREATE TABLE IF NOT EXISTS emotional_logs (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  emotion         TEXT NOT NULL,
  intensity       INTEGER DEFAULT 5 CHECK(intensity BETWEEN 1 AND 10),
  context         TEXT,
  created_at      TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_emotional_user ON emotional_logs(user_id, created_at DESC);

-- Relationship tracking
CREATE TABLE IF NOT EXISTS relationship_state (
  user_id          TEXT PRIMARY KEY,
  stage            TEXT DEFAULT 'stranger' CHECK(stage IN ('stranger','acquaintance','friend','close_friend','confidant')),
  trust_score      INTEGER DEFAULT 10 CHECK(trust_score BETWEEN 0 AND 100),
  total_messages   INTEGER DEFAULT 0,
  total_sessions   INTEGER DEFAULT 0,
  first_met_at     TEXT DEFAULT (datetime('now')),
  last_seen_at     TEXT DEFAULT (datetime('now')),
  updated_at       TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS conversations (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  title      TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id              TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  user_id         TEXT NOT NULL,
  role            TEXT NOT NULL CHECK(role IN ('user','assistant')),
  content         TEXT NOT NULL,
  created_at      TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at ASC);

CREATE TABLE IF NOT EXISTS reminders (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  content    TEXT NOT NULL,
  remind_at  TEXT NOT NULL,
  done       INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id, remind_at);

-- Proactive follow-ups: things Pat should ask about later
CREATE TABLE IF NOT EXISTS follow_ups (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  conversation_id TEXT,
  topic           TEXT NOT NULL,
  context         TEXT NOT NULL,
  follow_up_after TEXT NOT NULL,
  done            INTEGER DEFAULT 0,
  created_at      TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_follow_ups_pending ON follow_ups(done, follow_up_after);
CREATE INDEX IF NOT EXISTS idx_follow_ups_user ON follow_ups(user_id, done);
