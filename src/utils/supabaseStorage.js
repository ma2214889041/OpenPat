/**
 * Cloud storage + DB helpers — now backed by Cloudflare Pages Functions (D1/R2/KV).
 * API calls replace direct Supabase queries.
 */
import { apiGet, apiPut, apiPost, apiDelete, apiUpload } from './api';

// ─── Memes ────────────────────────────────────────────────────────────────────

export async function saveMemeToCloud(state, file, caption) {
  const ext = file.name?.split('.').pop() || 'png';
  const imageUrl = await apiUpload(`memes/${state}.${ext}`, file);
  await apiPut('/api/memes', { state, image_url: imageUrl, caption });
  return { state, image_url: imageUrl, caption };
}

export async function updateMemeCaptionInCloud(state, caption) {
  await apiPut('/api/memes', { state, caption });
}

export async function loadAllMemesFromCloud() {
  try {
    const data = await apiGet('/api/memes');
    const map = {};
    (data || []).forEach((m) => { map[m.state] = m; });
    return map;
  } catch {
    return {};
  }
}

export async function deleteMemeFromCloud(state) {
  await apiDelete(`/api/memes/${state}`);
}

// ─── Custom Achievements ──────────────────────────────────────────────────────

export async function saveAchievementToCloud(form) {
  let icon_locked_url = typeof form.icon_locked === 'string' ? form.icon_locked : (form.icon_locked_url ?? null);
  let icon_unlocked_url = typeof form.icon_unlocked === 'string' ? form.icon_unlocked : (form.icon_unlocked_url ?? null);

  if (form.icon_locked instanceof File) {
    const ext = form.icon_locked.name.split('.').pop() || 'png';
    icon_locked_url = await apiUpload(`achievements/${form.id}_locked.${ext}`, form.icon_locked);
  }
  if (form.icon_unlocked instanceof File) {
    const ext = form.icon_unlocked.name.split('.').pop() || 'png';
    icon_unlocked_url = await apiUpload(`achievements/${form.id}_unlocked.${ext}`, form.icon_unlocked);
  }

  const record = {
    id: form.id,
    name: form.name,
    description: form.desc ?? form.description ?? '',
    emoji: form.emoji,
    rarity: form.rarity,
    unlock_type: form.unlock_type,
    unlock_threshold: form.unlock_threshold ?? null,
    unlock_caption: form.unlock_caption ?? '',
    share_caption: form.share_caption ?? '',
    icon_locked_url,
    icon_unlocked_url,
    is_active: form.is_active ?? true,
  };

  await apiPut('/api/achievements', record);
  return { ...record, desc: record.description };
}

export async function loadAllAchievementsFromCloud() {
  try {
    return await apiGet('/api/achievements');
  } catch {
    return [];
  }
}

export async function deleteAchievementFromCloud(id) {
  await apiDelete(`/api/achievements/${id}`);
}

// ─── Site Config ──────────────────────────────────────────────────────────────

export async function loadSiteConfig() {
  try {
    return await apiGet('/api/site-config');
  } catch {
    return {};
  }
}

export async function setSiteConfig(key, value, storagePath) {
  let finalValue = value;
  if (value instanceof File) {
    finalValue = await apiUpload(storagePath || `site/${key}`, value);
  }
  await apiPut('/api/site-config', { key, value: finalValue });
  return finalValue;
}
