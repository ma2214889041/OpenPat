// Supabase Edge Function: serve dynamic SVG badges
// GET /functions/v1/badge/:username.svg
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const LEVELS = ['虾苗','小拍拍','大拍拍','霸王拍拍','拍拍神'];
const LEVEL_MINS = [0, 1000, 10000, 50000, 200000];

function getLevel(tasks: number): string {
  for (let i = LEVEL_MINS.length - 1; i >= 0; i--) {
    if (tasks >= LEVEL_MINS[i]) return LEVELS[i];
  }
  return LEVELS[0];
}

const STATUS_COLORS: Record<string, string> = {
  idle: '#22c55e',
  thinking: '#f59e0b',
  tool_call: '#3b82f6',
  done: '#10b981',
  error: '#ef4444',
  token_exhausted: '#f97316',
  offline: '#64748b',
};

const STATUS_LABELS: Record<string, string> = {
  idle: 'idle',
  thinking: 'thinking',
  tool_call: 'working',
  done: 'done ✔',
  error: 'error',
  token_exhausted: 'empty',
  offline: 'offline',
};

serve(async (req) => {
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const filenamePart = pathParts[pathParts.length - 1];
  const username = filenamePart.replace('.svg', '');

  if (!username) {
    return new Response('Not found', { status: 404 });
  }

  // Get profile and status
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, total_tasks')
    .eq('username', username)
    .single();

  let status = 'offline';
  if (profile) {
    const { data: agentStatus } = await supabase
      .from('agent_status')
      .select('status')
      .eq('user_id', profile.id)
      .single();
    status = agentStatus?.status ?? 'offline';
  }

  const levelName = getLevel(profile?.total_tasks ?? 0);
  const color = STATUS_COLORS[status] ?? '#64748b';
  const statusLabel = STATUS_LABELS[status] ?? 'offline';
  const leftText = `🐾 ${username}`;
  const rightText = statusLabel;

  const leftW = leftText.length * 7 + 18;
  const rightW = rightText.length * 7 + 18;
  const totalW = leftW + rightW;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="20" role="img" aria-label="open-pat: ${statusLabel}">
  <title>open-pat: ${username} ${statusLabel}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalW}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${leftW}" height="20" fill="#555"/>
    <rect x="${leftW}" width="${rightW}" height="20" fill="${color}"/>
    <rect width="${totalW}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="110">
    <text x="${Math.round(leftW/2 + 1) * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(leftW-10)*10}" lengthAdjust="spacing">${leftText}</text>
    <text x="${Math.round(leftW/2) * 10}" y="140" transform="scale(.1)" textLength="${(leftW-10)*10}" lengthAdjust="spacing">${leftText}</text>
    <text x="${(leftW + Math.round(rightW/2) + 1) * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(rightW-10)*10}" lengthAdjust="spacing">${rightText}</text>
    <text x="${(leftW + Math.round(rightW/2)) * 10}" y="140" transform="scale(.1)" textLength="${(rightW-10)*10}" lengthAdjust="spacing">${rightText}</text>
  </g>
</svg>`;

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache, max-age=0',
    },
  });
});
