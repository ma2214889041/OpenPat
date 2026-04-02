/**
 * GET /api/site-config — load site config (public, from KV)
 * PUT /api/site-config — set site config (admin, to KV)
 */
import { verifyJwt, cors, corsOptions } from '../_shared/auth.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestGet({ env }) {
  if (!env.SITE_CONFIG) return cors({});

  const keys = ['hero_video_url', 'about_image_url'];
  const cfg = {};
  for (const key of keys) {
    const val = await env.SITE_CONFIG.get(key);
    if (val) cfg[key] = val;
  }
  return cors(cfg);
}

export async function onRequestPut({ request, env }) {
  const user = await verifyJwt(request, env);
  if (!user) return cors({ error: 'Unauthorized' }, 401);
  if (!env.SITE_CONFIG) return cors({ error: 'KV not configured' }, 500);

  const body = await request.json();
  if (body.key && body.value !== undefined) {
    await env.SITE_CONFIG.put(body.key, body.value);
  }
  return cors({ ok: true });
}
