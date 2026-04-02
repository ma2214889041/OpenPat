/**
 * DELETE /api/achievements/:id — delete achievement (admin only)
 */
import { verifyJwt, cors, corsOptions } from '../../_shared/auth.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestDelete({ params, request, env }) {
  const user = await verifyJwt(request, env);
  if (!user) return cors({ error: 'Unauthorized' }, 401);

  const { id } = params;

  // Get icon URLs to clean up R2
  const row = await env.DB.prepare(
    'SELECT icon_locked_url, icon_unlocked_url FROM achievement_configs WHERE id = ?'
  ).bind(id).first();

  await env.DB.prepare('DELETE FROM achievement_configs WHERE id = ?').bind(id).run();

  // Clean up R2 assets
  if (row && env.R2_BUCKET) {
    for (const url of [row.icon_locked_url, row.icon_unlocked_url]) {
      if (!url) continue;
      const key = r2KeyFromUrl(url);
      if (key) {
        try { await env.R2_BUCKET.delete(key); } catch { /* ignore */ }
      }
    }
  }

  return cors({ ok: true });
}

function r2KeyFromUrl(url) {
  const marker = '/api/assets/';
  const idx = url.indexOf(marker);
  return idx >= 0 ? url.slice(idx + marker.length) : null;
}
