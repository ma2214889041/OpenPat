/**
 * GET /api/conversations/:id — get messages for a conversation
 */
import { verifyJwt, cors, corsOptions } from '../../_shared/auth.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestGet({ params, request, env }) {
  const user = await verifyJwt(request, env);
  if (!user) return cors({ error: 'Unauthorized' }, 401);

  const convId = params.id;

  // Verify conversation belongs to user
  const conv = await env.DB.prepare(
    'SELECT * FROM conversations WHERE id = ? AND user_id = ?'
  ).bind(convId, user.id).first();

  if (!conv) return cors({ error: 'Not found' }, 404);

  const messages = await env.DB.prepare(
    'SELECT id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC'
  ).bind(convId).all();

  return cors({
    ...conv,
    messages: messages.results || [],
  });
}
