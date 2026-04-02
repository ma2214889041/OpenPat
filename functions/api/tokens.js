/**
 * GET    /api/tokens — list own tokens
 * POST   /api/tokens — create new token
 * DELETE /api/tokens — delete own tokens by label
 */
import { verifyJwt, cors, corsOptions } from '../_shared/auth.js';

function generateToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestGet({ request, env }) {
  const user = await verifyJwt(request, env);
  if (!user) return cors({ error: 'Unauthorized' }, 401);

  const { results } = await env.DB.prepare(
    'SELECT id, token, label, created_at, last_used_at FROM api_tokens WHERE user_id = ?'
  ).bind(user.id).all();

  return cors(results || []);
}

export async function onRequestPost({ request, env }) {
  const user = await verifyJwt(request, env);
  if (!user) return cors({ error: 'Unauthorized' }, 401);

  const body = await request.json().catch(() => ({}));
  const label = body.label || 'OpenPat';
  const id = crypto.randomUUID();
  const token = generateToken();

  await env.DB.prepare(
    'INSERT INTO api_tokens (id, user_id, token, label) VALUES (?, ?, ?, ?)'
  ).bind(id, user.id, token, label).run();

  return cors({ id, token, label });
}

export async function onRequestDelete({ request, env }) {
  const user = await verifyJwt(request, env);
  if (!user) return cors({ error: 'Unauthorized' }, 401);

  const url = new URL(request.url);
  const label = url.searchParams.get('label') || 'OpenPat';

  await env.DB.prepare(
    'DELETE FROM api_tokens WHERE user_id = ? AND label = ?'
  ).bind(user.id, label).run();

  return cors({ ok: true });
}
