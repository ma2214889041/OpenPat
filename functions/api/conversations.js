/**
 * GET /api/conversations — list user's conversations
 * DELETE /api/conversations?id=xxx — delete a conversation and its messages
 */
import { verifyJwt, cors, corsOptions } from '../_shared/auth.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestGet({ request, env }) {
  const user = await verifyJwt(request, env);
  if (!user) return cors({ error: 'Unauthorized' }, 401);

  const result = await env.DB.prepare(
    'SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 50'
  ).bind(user.id).all();

  return cors(result.results || []);
}

export async function onRequestDelete({ request, env }) {
  const user = await verifyJwt(request, env);
  if (!user) return cors({ error: 'Unauthorized' }, 401);

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return cors({ error: 'id required' }, 400);

  await env.DB.batch([
    env.DB.prepare('DELETE FROM messages WHERE conversation_id = ? AND user_id = ?').bind(id, user.id),
    env.DB.prepare('DELETE FROM conversations WHERE id = ? AND user_id = ?').bind(id, user.id),
  ]);

  return cors({ ok: true });
}
