/**
 * GET /api/assets/* — serve R2 assets publicly
 */
export async function onRequestGet({ params, env }) {
  if (!env.R2_BUCKET) {
    return new Response('Not configured', { status: 500 });
  }

  const key = (params.path || []).join('/');
  if (!key) return new Response('Not found', { status: 404 });

  const object = await env.R2_BUCKET.get(key);
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
  headers.set('Cache-Control', object.httpMetadata?.cacheControl || 'public, max-age=3600');
  headers.set('Access-Control-Allow-Origin', '*');

  return new Response(object.body, { headers });
}
