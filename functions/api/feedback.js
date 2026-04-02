/**
 * POST /api/feedback — submit feedback (optional JWT)
 */
import { verifyJwt, cors, corsOptions } from '../_shared/auth.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost({ request, env }) {
  const user = await verifyJwt(request, env);
  const body = await request.json();

  if (!body.content?.trim()) return cors({ error: 'Empty content' }, 400);

  await env.DB.prepare(
    'INSERT INTO feedback_submissions (id, user_id, content) VALUES (?, ?, ?)'
  ).bind(crypto.randomUUID(), user?.id || null, body.content.trim()).run();

  return cors({ ok: true });
}
