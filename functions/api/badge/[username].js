/**
 * Cloudflare Pages Function: GET /api/badge/:username
 *
 * Returns an SVG badge showing the user's agent real-time status + task count.
 * Designed to be embedded in GitHub READMEs:
 *
 *   ![My Agent](https://your-domain.pages.dev/api/badge/username)
 *
 * Required env vars (Cloudflare Pages → Settings → Environment variables):
 *   SUPABASE_URL          — e.g. https://xxx.supabase.co
 *   SUPABASE_SERVICE_KEY  — service_role key (bypasses RLS)
 */

const STATUS_META = {
  idle:            { label: 'idle',           color: '#22c55e', dot: '●' },
  thinking:        { label: 'thinking',        color: '#3b82f6', dot: '◉' },
  tool_call:       { label: 'working',         color: '#f59e0b', dot: '⚡' },
  done:            { label: 'done',            color: '#86efac', dot: '✓'  },
  error:           { label: 'error',           color: '#ef4444', dot: '✕'  },
  offline:         { label: 'offline',         color: '#6b7280', dot: '○'  },
  token_exhausted: { label: 'out of tokens',   color: '#f97316', dot: '⚠'  },
};

function fmtTasks(n) {
  if (!n) return '';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M tasks';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'k tasks';
  return `${n} tasks`;
}

function buildSvg(username, statusKey, totalTasks) {
  const meta = STATUS_META[statusKey] ?? STATUS_META.offline;
  const leftText  = `🐾 ${username}`;
  const rightText = totalTasks
    ? `${meta.label} · ${fmtTasks(totalTasks)}`
    : meta.label;

  // Rough char-width estimate (monospace-ish)
  const charW = 6.5;
  const padX  = 10;
  const leftW  = Math.ceil(leftText.length  * charW) + padX * 2;
  const rightW = Math.ceil(rightText.length * charW) + padX * 2;
  const totalW = leftW + rightW;
  const h = 20;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${h}" role="img" aria-label="OpenPat agent badge">
  <title>${username}'s OpenPat agent: ${meta.label}</title>
  <defs>
    <linearGradient id="g" x2="0" y2="100%">
      <stop offset="0"  stop-color="#fff" stop-opacity=".12"/>
      <stop offset="1"  stop-color="#000" stop-opacity=".08"/>
    </linearGradient>
    <clipPath id="c"><rect width="${totalW}" height="${h}" rx="4"/></clipPath>
  </defs>
  <g clip-path="url(#c)">
    <rect width="${leftW}"  height="${h}" fill="#1e293b"/>
    <rect x="${leftW}" width="${rightW}" height="${h}" fill="${meta.color}"/>
    <rect width="${totalW}" height="${h}" fill="url(#g)"/>
  </g>
  <g font-family="'Segoe UI',Helvetica,Arial,sans-serif" font-size="11" fill="#fff">
    <text x="${padX}" y="14" fill="#000" fill-opacity=".25">${leftText}</text>
    <text x="${padX}" y="13">${leftText}</text>
    <text x="${leftW + padX}" y="14" fill="#000" fill-opacity=".2">${rightText}</text>
    <text x="${leftW + padX}" y="13" fill="${statusKey === 'offline' ? '#fff' : '#000'}">${rightText}</text>
  </g>
</svg>`;
}

export async function onRequestGet({ params, env }) {
  const { username } = params;

  if (!username || typeof username !== 'string' || username.length > 60) {
    return new Response('Bad Request', { status: 400 });
  }

  let statusKey   = 'offline';
  let totalTasks  = 0;

  if (env.DB) {
    try {
      // 1. Look up profile by username (D1)
      const profile = await env.DB.prepare(
        'SELECT id, total_tasks FROM profiles WHERE username = ?'
      ).bind(username).first();

      if (profile) {
        totalTasks = profile.total_tasks ?? 0;

        // 2. Get live agent status (D1)
        const row = await env.DB.prepare(
          'SELECT status, updated_at FROM agent_status WHERE user_id = ?'
        ).bind(profile.id).first();

        if (row) {
          const updatedAt     = new Date(row.updated_at).getTime();
          const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
          statusKey = updatedAt > tenMinutesAgo ? (row.status ?? 'offline') : 'offline';
        }
      }
    } catch {
      // Query error → show offline badge
    }
  }

  const svg = buildSvg(username, statusKey, totalTasks);

  return new Response(svg, {
    headers: {
      'Content-Type':                'image/svg+xml; charset=utf-8',
      'Cache-Control':               'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma':                      'no-cache',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
