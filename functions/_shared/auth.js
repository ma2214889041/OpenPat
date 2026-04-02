/**
 * Verify Supabase JWT using JWKS endpoint (supports both ES256 and HS256).
 * Fetches public keys from Supabase automatically — no manual secret needed.
 */

let jwksCache = null;
let jwksCacheTime = 0;
const JWKS_CACHE_TTL = 3600_000; // 1 hour

function base64UrlDecode(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  return new Uint8Array([...binary].map(c => c.charCodeAt(0)));
}

function decodeJwtPart(b64) {
  return JSON.parse(new TextDecoder().decode(base64UrlDecode(b64)));
}

async function fetchJwks(supabaseUrl) {
  const now = Date.now();
  if (jwksCache && now - jwksCacheTime < JWKS_CACHE_TTL) return jwksCache;

  const res = await fetch(`${supabaseUrl}/auth/v1/.well-known/jwks.json`);
  if (!res.ok) return null;
  const data = await res.json();
  jwksCache = data.keys || [];
  jwksCacheTime = now;
  return jwksCache;
}

async function importJwk(jwk) {
  if (jwk.kty === 'EC') {
    return crypto.subtle.importKey(
      'jwk', jwk, { name: 'ECDSA', namedCurve: jwk.crv || 'P-256' }, false, ['verify']
    );
  }
  if (jwk.kty === 'oct') {
    return crypto.subtle.importKey(
      'jwk', jwk, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    );
  }
  return null;
}

async function verifyWithJwks(headerB64, payloadB64, signatureB64, keys) {
  const header = decodeJwtPart(headerB64);
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlDecode(signatureB64);

  // Find matching key by kid, or try all
  const candidates = header.kid
    ? keys.filter(k => k.kid === header.kid)
    : keys;

  for (const jwk of candidates) {
    try {
      const key = await importJwk(jwk);
      if (!key) continue;

      let algo;
      if (header.alg === 'ES256' || jwk.kty === 'EC') {
        algo = { name: 'ECDSA', hash: 'SHA-256' };
      } else {
        algo = 'HMAC';
      }

      const valid = await crypto.subtle.verify(algo, key, signature, data);
      if (valid) return true;
    } catch { /* try next key */ }
  }
  return false;
}

async function verifyWithSecret(headerB64, payloadB64, signatureB64, secret) {
  const keyData = new TextEncoder().encode(secret);
  const key = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
  );
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlDecode(signatureB64);
  return crypto.subtle.verify('HMAC', key, signature, data);
}

export async function verifyJwt(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    if (!headerB64 || !payloadB64 || !signatureB64) return null;

    let valid = false;

    // Try JWKS verification first (works with ES256 and newer keys)
    if (env.SUPABASE_URL) {
      const keys = await fetchJwks(env.SUPABASE_URL);
      if (keys && keys.length > 0) {
        valid = await verifyWithJwks(headerB64, payloadB64, signatureB64, keys);
      }
    }

    // Fallback: HS256 with shared secret
    if (!valid && env.SUPABASE_JWT_SECRET) {
      valid = await verifyWithSecret(headerB64, payloadB64, signatureB64, env.SUPABASE_JWT_SECRET);
    }

    if (!valid) return null;

    // Decode payload
    const payload = decodeJwtPart(payloadB64);

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return {
      id: payload.sub,
      email: payload.email,
      user_metadata: payload.user_metadata || {},
    };
  } catch {
    return null;
  }
}

export function cors(body, status = 200) {
  return new Response(body ? JSON.stringify(body) : null, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
  });
}

export function corsOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
  });
}
