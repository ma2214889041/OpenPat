/**
 * POST /api/event — receive agent skill events
 * Authorization: Bearer <api_token>
 * Body: { type, tool_name? }
 */
import { cors, corsOptions } from '../_shared/auth.js';

const VALID_TYPES = new Set([
  'thinking', 'tool_start', 'tool_end', 'done', 'idle', 'error', 'offline',
]);

const STATUS_MAP = {
  thinking:   'thinking',
  tool_start: 'tool_call',
  tool_end:   'idle',
  done:       'done',
  idle:       'idle',
  error:      'error',
  offline:    'offline',
};

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost({ request, env }) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) return cors({ error: 'Missing token' }, 401);

  // Look up API token in D1
  const tokenRow = await env.DB.prepare(
    'SELECT id, user_id FROM api_tokens WHERE token = ?'
  ).bind(token).first();

  if (!tokenRow) return cors({ error: 'Invalid token' }, 401);

  let body = {};
  try { body = await request.json(); } catch { /* ignore */ }

  const eventType = body.type || 'idle';
  if (!VALID_TYPES.has(eventType)) return cors({ error: 'Invalid event type' }, 400);

  const status = STATUS_MAP[eventType];
  const now = new Date().toISOString();

  // Upsert agent_status
  await env.DB.prepare(`
    INSERT INTO agent_status (user_id, status, current_tool, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      status = excluded.status,
      current_tool = excluded.current_tool,
      updated_at = excluded.updated_at
  `).bind(
    tokenRow.user_id,
    status,
    eventType === 'tool_start' ? (body.tool_name || null) : null,
    now
  ).run();

  // Update token last_used_at
  await env.DB.prepare(
    'UPDATE api_tokens SET last_used_at = ? WHERE id = ?'
  ).bind(now, tokenRow.id).run();

  // Also update Supabase for Realtime subscribers (dual-write during transition)
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
          user_id: tokenRow.user_id,
          status,
          current_tool: eventType === 'tool_start' ? (body.tool_name || null) : null,
          updated_at: now,
        }),
      });
    } catch { /* best-effort */ }
  }

  return cors({ ok: true, status });
}
