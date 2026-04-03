/**
 * GET  /api/memories — list user's memories
 * DELETE /api/memories?id=xxx — delete a memory
 */
import { verifyJwt, cors, corsOptions } from '../_shared/auth.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestGet({ request, env }) {
  const user = await verifyJwt(request, env);
  if (!user) return cors({ error: 'Unauthorized' }, 401);

  const url = new URL(request.url);
  const type = url.searchParams.get('type'); // optional filter

  let query = 'SELECT * FROM memories WHERE user_id = ?';
  const params = [user.id];

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }

  query += ' ORDER BY updated_at DESC LIMIT 200';

  const result = await env.DB.prepare(query).bind(...params).all();
  return cors(result.results || []);
}

export async function onRequestDelete({ request, env }) {
  const user = await verifyJwt(request, env);
  if (!user) return cors({ error: 'Unauthorized' }, 401);

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return cors({ error: 'id required' }, 400);

  await env.DB.prepare(
    'DELETE FROM memories WHERE id = ? AND user_id = ?'
  ).bind(id, user.id).run();

  return cors({ ok: true });
}
