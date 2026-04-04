/**
 * POST /api/memories/consolidate — manual "Dream" consolidation
 */
import { verifyJwt, cors, corsOptions } from '../../_shared/auth.js';
import { geminiLite, parseGeminiJson } from '../../_shared/gemini.js';

export function onRequestOptions() { return corsOptions(); }

export async function onRequestPost({ request, env }) {
  const user = await verifyJwt(request, env);
  if (!user) return cors({ error: 'Unauthorized' }, 401);

  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) return cors({ error: 'Not configured' }, 500);

  try {
    const result = await env.DB.prepare(
      'SELECT * FROM memories WHERE user_id = ? ORDER BY type, updated_at DESC'
    ).bind(user.id).all();
    const memories = result.results || [];

    if (memories.length < 3) {
      return cors({ message: 'Too few memories', count: memories.length });
    }

    const manifest = memories.map((m) =>
      `- id="${m.id}" [${m.type}] ${m.name}: ${m.content.slice(0, 120)}`
    ).join('\n');

    const text = await geminiLite(apiKey, null,
      `Consolidate these ${memories.length} memories: merge duplicates, delete trivial/outdated, condense verbose. Today: ${new Date().toISOString().slice(0, 10)}

${manifest}

Return: {"actions":[...],"summary":"what you did"}
Actions: {"action":"update|delete|merge","id":"...","keep_id":"...","delete_id":"...","content":"...","description":"..."}
If clean: {"actions":[],"summary":"No changes needed"}
ONLY valid JSON.`, { maxTokens: 2048 });

    const { actions, summary } = parseGeminiJson(text);
    let updated = 0, deleted = 0, merged = 0;

    for (const a of (actions || [])) {
      if (a.action === 'update' && a.id) {
        await env.DB.prepare("UPDATE memories SET content = ?, description = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?")
          .bind(a.content, a.description || '', a.id, user.id).run();
        updated++;
      } else if (a.action === 'delete' && a.id) {
        await env.DB.prepare('DELETE FROM memories WHERE id = ? AND user_id = ?').bind(a.id, user.id).run();
        deleted++;
      } else if (a.action === 'merge' && a.keep_id && a.delete_id) {
        await env.DB.prepare("UPDATE memories SET content = ?, description = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?")
          .bind(a.content, a.description || '', a.keep_id, user.id).run();
        await env.DB.prepare('DELETE FROM memories WHERE id = ? AND user_id = ?').bind(a.delete_id, user.id).run();
        merged++;
      }
    }

    return cors({ summary, updated, deleted, merged });
  } catch (e) {
    return cors({ error: e.message }, 500);
  }
}
