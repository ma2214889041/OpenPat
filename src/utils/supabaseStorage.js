/**
 * Supabase Storage + DB helpers for cloud-synced assets.
 * Replaces IndexedDB for memes and custom achievements.
 */
import { supabase, hasSupabase } from './supabase';

const BUCKET = 'openpat-assets';

// ─── Generic upload ───────────────────────────────────────────────────────────

async function uploadFile(storagePath, file) {
  if (!hasSupabase) throw new Error('Supabase not configured');
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { upsert: true, cacheControl: '3600' });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

function pathFromUrl(url) {
  // Extract the storage path from a full public URL
  const marker = `/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  return idx >= 0 ? url.slice(idx + marker.length) : null;
}

// ─── Memes ────────────────────────────────────────────────────────────────────

/**
 * Upload a meme image file + save caption to state_memes table.
 * Returns the saved row { state, image_url, caption }.
 */
export async function saveMemeToCloud(state, file, caption) {
  if (!hasSupabase) throw new Error('Supabase not configured');

  const ext = file.name?.split('.').pop() || 'png';
  const imageUrl = await uploadFile(`memes/${state}.${ext}`, file);

  const { error } = await supabase
    .from('state_memes')
    .upsert(
      { state, image_url: imageUrl, caption, updated_at: new Date().toISOString() },
      { onConflict: 'state' }
    );
  if (error) throw error;

  return { state, image_url: imageUrl, caption };
}

/**
 * Update only the caption (no new image upload).
 */
export async function updateMemeCaptionInCloud(state, caption) {
  if (!hasSupabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('state_memes')
    .upsert(
      { state, caption, updated_at: new Date().toISOString() },
      { onConflict: 'state' }
    );
  if (error) throw error;
}

/**
 * Load all memes as a map: { [state]: { state, image_url, caption } }
 */
export async function loadAllMemesFromCloud() {
  if (!hasSupabase) return {};
  const { data, error } = await supabase.from('state_memes').select('*');
  if (error) throw error;
  const map = {};
  (data || []).forEach((m) => { map[m.state] = m; });
  return map;
}

/**
 * Delete meme row + storage file.
 */
export async function deleteMemeFromCloud(state) {
  if (!hasSupabase) throw new Error('Supabase not configured');

  // Get current image_url to clean up storage
  const { data } = await supabase
    .from('state_memes')
    .select('image_url')
    .eq('state', state)
    .single();

  const { error } = await supabase.from('state_memes').delete().eq('state', state);
  if (error) throw error;

  if (data?.image_url) {
    const p = pathFromUrl(data.image_url);
    if (p) await supabase.storage.from(BUCKET).remove([p]);
  }
}

// ─── Custom Achievements ──────────────────────────────────────────────────────

/**
 * Save (upsert) a custom achievement. Icon File objects are uploaded first.
 * form fields: id, name, description, emoji, rarity, unlock_type,
 *              unlock_threshold, unlock_caption, share_caption,
 *              icon_locked (File|string|null), icon_unlocked (File|string|null),
 *              icon_locked_url, icon_unlocked_url, is_active
 */
export async function saveAchievementToCloud(form) {
  if (!hasSupabase) throw new Error('Supabase not configured');

  let icon_locked_url   = typeof form.icon_locked   === 'string' ? form.icon_locked   : (form.icon_locked_url   ?? null);
  let icon_unlocked_url = typeof form.icon_unlocked === 'string' ? form.icon_unlocked : (form.icon_unlocked_url ?? null);

  if (form.icon_locked instanceof File) {
    const ext = form.icon_locked.name.split('.').pop() || 'png';
    icon_locked_url = await uploadFile(`achievements/${form.id}_locked.${ext}`, form.icon_locked);
  }
  if (form.icon_unlocked instanceof File) {
    const ext = form.icon_unlocked.name.split('.').pop() || 'png';
    icon_unlocked_url = await uploadFile(`achievements/${form.id}_unlocked.${ext}`, form.icon_unlocked);
  }

  const record = {
    id:               form.id,
    name:             form.name,
    description:      form.desc ?? form.description ?? '',
    emoji:            form.emoji,
    rarity:           form.rarity,
    unlock_type:      form.unlock_type,
    unlock_threshold: form.unlock_threshold ?? null,
    unlock_caption:   form.unlock_caption ?? '',
    share_caption:    form.share_caption ?? '',
    icon_locked_url,
    icon_unlocked_url,
    is_active:        form.is_active ?? true,
  };

  const { data, error } = await supabase
    .from('achievement_configs')
    .upsert(record, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;

  // Normalize back so the rest of the app can use .desc
  return { ...data, desc: data.description };
}

/**
 * Load all custom achievements from Supabase.
 * Returns array with .desc aliased from .description for compatibility.
 */
export async function loadAllAchievementsFromCloud() {
  if (!hasSupabase) return [];
  const { data, error } = await supabase
    .from('achievement_configs')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map((r) => ({ ...r, desc: r.description }));
}

// ─── Site Config ──────────────────────────────────────────────────────────────

/**
 * Load all site config as a plain object: { hero_video_url: '...', ... }
 */
export async function loadSiteConfig() {
  if (!hasSupabase) return {};
  const { data, error } = await supabase.from('site_config').select('key, value');
  if (error) throw error;
  const cfg = {};
  (data || []).forEach(({ key, value }) => { cfg[key] = value; });
  return cfg;
}

/**
 * Set a single site config value. If value is a File, uploads to Storage first.
 * storagePath is used only when value is a File (e.g. 'site/hero.mp4').
 */
export async function setSiteConfig(key, value, storagePath) {
  if (!hasSupabase) throw new Error('Supabase not configured');

  let finalValue = value;
  if (value instanceof File) {
    finalValue = await uploadFile(storagePath || `site/${key}`, value);
  }

  const { error } = await supabase
    .from('site_config')
    .upsert({ key, value: finalValue, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) throw error;
  return finalValue;
}

/**
 * Delete achievement row + storage icons.
 */
export async function deleteAchievementFromCloud(id) {
  if (!hasSupabase) throw new Error('Supabase not configured');

  const { data } = await supabase
    .from('achievement_configs')
    .select('icon_locked_url, icon_unlocked_url')
    .eq('id', id)
    .single();

  const { error } = await supabase.from('achievement_configs').delete().eq('id', id);
  if (error) throw error;

  if (data) {
    const paths = [data.icon_locked_url, data.icon_unlocked_url]
      .filter(Boolean)
      .map(pathFromUrl)
      .filter(Boolean);
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
  }
}
