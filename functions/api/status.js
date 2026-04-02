/**
 * PUT /api/status — upsert own agent status (requires JWT)
 */
import { verifyJwt, cors, corsOptions } from '../_shared/auth.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPut({ request, env }) {
  const user = await verifyJwt(request, env);
  if (!user) return cors({ error: 'Unauthorized' }, 401);

  const body = await request.json();
  const now = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO agent_status (user_id, status, current_tool, session_tokens, session_tool_calls, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      status = excluded.status,
      current_tool = excluded.current_tool,
      session_tokens = excluded.session_tokens,
      session_tool_calls = excluded.session_tool_calls,
      updated_at = excluded.updated_at
  `).bind(
    user.id,
    body.status || 'offline',
    body.current_tool || null,
    body.session_tokens || 0,
    body.session_tool_calls || 0,
    now,
  ).run();

  // Dual-write to Supabase for Realtime subscribers
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
    try {
      await fetch(`${env.SUPABASE_URL}/rest/v1/agent_status`, {
        method: 'POST',
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          user_id: user.id,
          status: body.status || 'offline',
          current_tool: body.current_tool || null,
          session_tokens: body.session_tokens || 0,
          session_tool_calls: body.session_tool_calls || 0,
          updated_at: now,
        }),
      });
    } catch { /* best-effort */ }
  }

  return cors({ ok: true });
}
