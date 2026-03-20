// Supabase Edge Function: receive OpenClaw skill events
// POST /functions/v1/event
// Authorization: Bearer <api_token>
// Body: { type, tool_name? }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

const VALID_TYPES = new Set([
  'thinking', 'tool_start', 'tool_end', 'done', 'idle', 'error', 'offline',
]);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS });
  }

  // Auth: Bearer token
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return new Response('Missing token', { status: 401, headers: CORS });
  }

  // Lookup token → user_id
  const { data: tokenRow } = await supabase
    .from('api_tokens')
    .select('id, user_id')
    .eq('token', token)
    .single();

  if (!tokenRow) {
    return new Response('Invalid token', { status: 401, headers: CORS });
  }

  // Parse body
  let body: { type?: string; tool_name?: string } = {};
  try { body = await req.json(); } catch { /* ignore */ }

  const eventType = body.type ?? 'idle';
  if (!VALID_TYPES.has(eventType)) {
    return new Response('Invalid event type', { status: 400, headers: CORS });
  }

  // Map event type to agent status
  const STATUS_MAP: Record<string, string> = {
    thinking:   'thinking',
    tool_start: 'tool_call',
    tool_end:   'idle',
    done:       'done',
    idle:       'idle',
    error:      'error',
    offline:    'offline',
  };
  const status = STATUS_MAP[eventType];

  // Upsert agent_status
  await supabase.from('agent_status').upsert({
    user_id:      tokenRow.user_id,
    status,
    current_tool: eventType === 'tool_start' ? (body.tool_name ?? null) : null,
    updated_at:   new Date().toISOString(),
  }, { onConflict: 'user_id' });

  // Update token last_used_at
  await supabase
    .from('api_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', tokenRow.id);

  // On done/tool_end: bump stats in profiles
  if (eventType === 'done') {
    await supabase.rpc('increment_tasks', { uid: tokenRow.user_id });
  }
  if (eventType === 'tool_end') {
    await supabase.rpc('increment_tool_calls', { uid: tokenRow.user_id });
  }

  return new Response(JSON.stringify({ ok: true, status }), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
});
