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
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  content     TEXT NOT NULL,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_memories_user ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(user_id, type);

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
