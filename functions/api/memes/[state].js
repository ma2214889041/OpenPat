/**
 * DELETE /api/memes/:state — delete a meme (admin only)
 */
import { verifyJwt, cors, corsOptions } from '../../_shared/auth.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestDelete({ params, request, env }) {
  const user = await verifyJwt(request, env);
  if (!user) return cors({ error: 'Unauthorized' }, 401);

  const { state } = params;

  // Get image_url to clean up R2
  const row = await env.DB.prepare(
    'SELECT image_url FROM state_memes WHERE state = ?'
  ).bind(state).first();

  await env.DB.prepare('DELETE FROM state_memes WHERE state = ?').bind(state).run();

  // Clean up R2 asset
  if (row?.image_url && env.R2_BUCKET) {
    const key = r2KeyFromUrl(row.image_url);
    if (key) {
      try { await env.R2_BUCKET.delete(key); } catch { /* ignore */ }
    }
  }

  return cors({ ok: true });
}

function r2KeyFromUrl(url) {
  const marker = '/api/assets/';
  const idx = url.indexOf(marker);
  return idx >= 0 ? url.slice(idx + marker.length) : null;
}
