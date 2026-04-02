/**
 * GET /api/profile/:username — public profile lookup (no auth needed)
 */
import { cors, corsOptions } from '../../_shared/auth.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestGet({ params, env }) {
  const { username } = params;
  if (!username) return cors({ error: 'Missing username' }, 400);

  const profile = await env.DB.prepare(
    'SELECT * FROM profiles WHERE username = ?'
  ).bind(username).first();

  if (!profile) return cors({ error: 'Not found' }, 404);

  if (typeof profile.achievements === 'string') {
    try { profile.achievements = JSON.parse(profile.achievements); } catch { profile.achievements = []; }
  }

  return cors(profile);
}
