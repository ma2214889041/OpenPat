/**
 * GET /api/memes — list all memes (public)
 * PUT /api/memes — upsert meme (admin only)
 */
import { verifyJwt, cors, corsOptions } from '../_shared/auth.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare('SELECT * FROM state_memes').all();
  return cors(results || []);
}

export async function onRequestPut({ request, env }) {
  const user = await verifyJwt(request, env);
  if (!user) return cors({ error: 'Unauthorized' }, 401);

  const body = await request.json();
  const now = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO state_memes (state, image_url, caption, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(state) DO UPDATE SET
      image_url = COALESCE(excluded.image_url, state_memes.image_url),
      caption = excluded.caption,
      updated_at = excluded.updated_at
  `).bind(body.state, body.image_url || null, body.caption || '', now).run();

  return cors({ ok: true });
}
