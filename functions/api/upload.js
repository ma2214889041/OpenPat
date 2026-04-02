/**
 * POST /api/upload — upload file to R2
 * Expects multipart/form-data with fields: file, path
 * Returns: { url }
 */
import { verifyJwt, cors, corsOptions } from '../_shared/auth.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost({ request, env }) {
  const user = await verifyJwt(request, env);
  if (!user) return cors({ error: 'Unauthorized' }, 401);
  if (!env.R2_BUCKET) return cors({ error: 'R2 not configured' }, 500);

  const formData = await request.formData();
  const file = formData.get('file');
  const path = formData.get('path');

  if (!file || !path) return cors({ error: 'Missing file or path' }, 400);

  await env.R2_BUCKET.put(path, file.stream(), {
    httpMetadata: {
      contentType: file.type || 'application/octet-stream',
      cacheControl: 'public, max-age=3600',
    },
  });

  // Build public URL using the assets endpoint
  const origin = new URL(request.url).origin;
  const url = `${origin}/api/assets/${path}`;

  return cors({ url });
}
