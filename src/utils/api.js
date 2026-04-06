/**
 * API client — all D1/R2/KV calls go through Pages Functions.
 * Auth uses the existing Supabase JWT from the user's session.
 */
import { supabase } from './supabase';

async function getAuthHeaders() {
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiGet(path) {
  const headers = await getAuthHeaders();
  const res = await fetch(path, { headers });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function apiPut(path, body) {
  const headers = { ...(await getAuthHeaders()), 'Content-Type': 'application/json' };
  const res = await fetch(path, { method: 'PUT', headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function apiPost(path, body) {
  const headers = { ...(await getAuthHeaders()), 'Content-Type': 'application/json' };
  const res = await fetch(path, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function apiDelete(path) {
  const headers = await getAuthHeaders();
  const res = await fetch(path, { method: 'DELETE', headers });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

/**
 * Streaming POST: sends request with Accept: text/event-stream
 * Returns an async iterator of parsed SSE data objects.
 */
export async function apiStream(path, body) {
  const headers = {
    ...(await getAuthHeaders()),
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
  };
  const res = await fetch(path, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.body;
}

export async function apiUpload(storagePath, file) {
  const headers = await getAuthHeaders();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('path', storagePath);
  const res = await fetch('/api/upload', { method: 'POST', headers, body: formData });
  if (!res.ok) throw new Error(`Upload ${res.status}`);
  const data = await res.json();
  return data.url;
}
