/**
 * GET /api/status/:userId — public status lookup (no auth)
 */
import { cors, corsOptions } from '../../_shared/auth.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestGet({ params, env }) {
  const { userId } = params;
  if (!userId) return cors({ error: 'Missing userId' }, 400);

  const status = await env.DB.prepare(
    'SELECT * FROM agent_status WHERE user_id = ? AND is_public = 1'
  ).bind(userId).first();

  return cors(status || { status: 'offline' });
}
