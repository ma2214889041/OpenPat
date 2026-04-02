/**
 * GET /api/skins — list active skins (public)
 */
import { cors, corsOptions } from '../_shared/auth.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM skins WHERE is_active = 1'
  ).all();

  // Parse colors JSON
  const skins = (results || []).map(s => ({
    ...s,
    colors: s.colors ? JSON.parse(s.colors) : null,
  }));

  return cors(skins);
}
