/**
 * GET /api/achievements — list all achievements (public)
 * PUT /api/achievements — upsert achievement (admin only)
 */
import { verifyJwt, cors, corsOptions } from '../_shared/auth.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM achievement_configs WHERE is_active = 1 ORDER BY created_at ASC'
  ).all();
  return cors((results || []).map(r => ({ ...r, desc: r.description })));
}

export async function onRequestPut({ request, env }) {
  const user = await verifyJwt(request, env);
  if (!user) return cors({ error: 'Unauthorized' }, 401);

  const body = await request.json();
  const now = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO achievement_configs (id, name, description, emoji, rarity, unlock_type,
      unlock_threshold, unlock_caption, share_caption, icon_locked_url, icon_unlocked_url,
      is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      emoji = excluded.emoji,
      rarity = excluded.rarity,
      unlock_type = excluded.unlock_type,
      unlock_threshold = excluded.unlock_threshold,
      unlock_caption = excluded.unlock_caption,
      share_caption = excluded.share_caption,
      icon_locked_url = excluded.icon_locked_url,
      icon_unlocked_url = excluded.icon_unlocked_url,
      is_active = excluded.is_active
  `).bind(
    body.id, body.name, body.description || '', body.emoji, body.rarity,
    body.unlock_type, body.unlock_threshold || null,
    body.unlock_caption || '', body.share_caption || '',
    body.icon_locked_url || null, body.icon_unlocked_url || null,
    body.is_active ?? 1, body.created_at || now,
  ).run();

  return cors({ ok: true });
}
