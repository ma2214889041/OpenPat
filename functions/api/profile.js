/**
 * GET  /api/profile — get own profile (requires JWT)
 * PUT  /api/profile — upsert own profile (requires JWT)
 */
import { verifyJwt, cors, corsOptions } from '../_shared/auth.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestGet({ request, env }) {
  const user = await verifyJwt(request, env);
  if (!user) return cors({ error: 'Unauthorized' }, 401);

  let profile = await env.DB.prepare(
    'SELECT * FROM profiles WHERE id = ?'
  ).bind(user.id).first();

  // Auto-create profile for new users
  if (!profile) {
    const baseUsername = user.user_metadata?.user_name
      || user.user_metadata?.preferred_username
      || user.email?.split('@')[0]
      || `user_${user.id.substring(0, 8)}`;

    let username = baseUsername;
    let suffix = 0;
    while (await env.DB.prepare('SELECT 1 FROM profiles WHERE username = ?').bind(username).first()) {
      suffix++;
      username = `${baseUsername}_${suffix}`;
    }

    await env.DB.prepare(`
      INSERT INTO profiles (id, username, avatar_url) VALUES (?, ?, ?)
    `).bind(user.id, username, user.user_metadata?.avatar_url || null).run();

    profile = await env.DB.prepare('SELECT * FROM profiles WHERE id = ?').bind(user.id).first();
  }

  return cors(profile);
}

export async function onRequestPut({ request, env }) {
  const user = await verifyJwt(request, env);
  if (!user) return cors({ error: 'Unauthorized' }, 401);

  const body = await request.json();

  await env.DB.prepare(`
    INSERT INTO profiles (id, username, avatar_url, total_tasks, total_tool_calls,
      total_tokens_input, total_tokens_output, level, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      username = COALESCE(excluded.username, profiles.username),
      avatar_url = COALESCE(excluded.avatar_url, profiles.avatar_url),
      total_tasks = excluded.total_tasks,
      total_tool_calls = excluded.total_tool_calls,
      total_tokens_input = excluded.total_tokens_input,
      total_tokens_output = excluded.total_tokens_output,
      level = excluded.level,
      updated_at = excluded.updated_at
  `).bind(
    body.id || user.id,
    body.username || null,
    body.avatar_url || null,
    body.total_tasks || 0,
    body.total_tool_calls || 0,
    body.total_tokens_input || 0,
    body.total_tokens_output || 0,
    body.level || 0,
    body.updated_at || new Date().toISOString(),
  ).run();

  return cors({ ok: true });
}
