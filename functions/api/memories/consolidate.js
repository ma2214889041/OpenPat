/**
 * POST /api/memories/consolidate — "Dream" consolidation
 * Merges duplicate memories, removes stale ones, condenses related memories.
 * Can be called manually or on a schedule.
 */
import { verifyJwt, cors, corsOptions } from '../../_shared/auth.js';

export async function onRequestOptions() {
  return corsOptions();
}

export async function onRequestPost({ request, env }) {
  const user = await verifyJwt(request, env);
  if (!user) return cors({ error: 'Unauthorized' }, 401);

  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) return cors({ error: 'Not configured' }, 500);

  try {
    // Load all memories
    const result = await env.DB.prepare(
      'SELECT * FROM memories WHERE user_id = ? ORDER BY type, updated_at DESC'
    ).bind(user.id).all();
    const memories = result.results || [];

    if (memories.length < 3) {
      return cors({ message: 'Too few memories to consolidate', count: memories.length });
    }

    const manifest = memories.map((m) =>
      `- id="${m.id}" [${m.type}] ${m.name}: ${m.description}\n  content: ${m.content}`
    ).join('\n\n');

    const prompt = `You are performing memory consolidation ("dreaming") for an AI companion called "拍拍".

Review all memories below and clean them up. Your goals:

1. **Merge duplicates**: If two memories cover the same topic, merge them into one (keep the better id, delete the other)
2. **Remove stale/contradicted**: If memories contradict each other, keep the newer one, delete the old
3. **Remove trivial**: Delete memories that are too vague or useless for future conversations
4. **Condense**: If a memory is overly verbose, update it to be concise
5. **Fix types**: If a memory has the wrong type, update it

Today's date: ${new Date().toISOString().slice(0, 10)}

## All memories (${memories.length} total):

${manifest}

Return a JSON object: {"actions":[...], "summary":"one line summary of what you did"}
Each action:
- {"action":"update","id":"ID","content":"new content","description":"new desc"}
- {"action":"delete","id":"ID","reason":"why"}
- {"action":"merge","keep_id":"ID_TO_KEEP","delete_id":"ID_TO_DELETE","content":"merged content","description":"merged desc"}

For "merge": the keep_id memory will be updated, delete_id will be deleted.
If memories are already clean, return: {"actions":[],"summary":"No changes needed"}
Return ONLY valid JSON.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 2048 },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return cors({ error: `Gemini error: ${err}` }, 500);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    const { actions, summary } = JSON.parse(cleaned);

    let updated = 0, deleted = 0, merged = 0;

    if (actions?.length) {
      for (const act of actions) {
        if (act.action === 'update' && act.id) {
          await env.DB.prepare(
            "UPDATE memories SET content = ?, description = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?"
          ).bind(act.content, act.description, act.id, user.id).run();
          updated++;
        } else if (act.action === 'delete' && act.id) {
          await env.DB.prepare(
            'DELETE FROM memories WHERE id = ? AND user_id = ?'
          ).bind(act.id, user.id).run();
          deleted++;
        } else if (act.action === 'merge' && act.keep_id && act.delete_id) {
          await env.DB.prepare(
            "UPDATE memories SET content = ?, description = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?"
          ).bind(act.content, act.description, act.keep_id, user.id).run();
          await env.DB.prepare(
            'DELETE FROM memories WHERE id = ? AND user_id = ?'
          ).bind(act.delete_id, user.id).run();
          merged++;
        }
      }
    }

    return cors({ summary, updated, deleted, merged });
  } catch (e) {
    console.error('Consolidation error:', e);
    return cors({ error: e.message }, 500);
  }
}
