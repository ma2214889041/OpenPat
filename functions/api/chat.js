/**
 * POST /api/chat — AI companion conversation endpoint
 * Body: { conversationId?, message }
 * Returns: { conversationId, reply, messageId }
 */
import { verifyJwt, cors, corsOptions } from '../_shared/auth.js';
import { geminiChat, geminiLite, parseGeminiJson } from '../_shared/gemini.js';

export function onRequestOptions() { return corsOptions(); }

// ── Tool definitions ────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'web_search',
    description: 'Search the internet for real-time information when the user asks about facts, news, or anything requiring up-to-date data.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Search keywords' } },
      required: ['query'],
    },
  },
  {
    name: 'get_weather',
    description: 'Get current weather for a city.',
    parameters: {
      type: 'object',
      properties: { city: { type: 'string', description: 'City name (e.g. Beijing, Milan, Tokyo)' } },
      required: ['city'],
    },
  },
  {
    name: 'save_memory',
    description: 'Save something important about the user to long-term memory. Use when user explicitly says "remember this" or shares key personal info.',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['user', 'feedback', 'life', 'reference'] },
        name: { type: 'string', description: 'Short snake_case name' },
        description: { type: 'string', description: 'One-line description' },
        content: { type: 'string', description: 'Memory content' },
      },
      required: ['type', 'name', 'description', 'content'],
    },
  },
  {
    name: 'delete_memory',
    description: 'Forget something about the user when they ask.',
    parameters: {
      type: 'object',
      properties: { memory_name: { type: 'string' } },
      required: ['memory_name'],
    },
  },
  {
    name: 'set_reminder',
    description: 'Set a reminder for the user.',
    parameters: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Reminder content' },
        remind_at: { type: 'string', description: 'ISO 8601 datetime' },
      },
      required: ['content', 'remind_at'],
    },
  },
  {
    name: 'list_reminders',
    description: 'List all pending reminders.',
    parameters: { type: 'object', properties: {} },
  },
];

// ── Tool execution ──────────────────────────────────────────────────────────

async function executeTool(name, args, env, userId, memories) {
  try {
    switch (name) {
      case 'web_search':
        return `[Search results for "${args.query}" are not available yet. Answer based on your knowledge and note the limitation.]`;

      case 'get_weather': {
        const res = await fetch(`https://wttr.in/${encodeURIComponent(args.city)}?format=j1`);
        if (!res.ok) return `Unable to get weather for ${args.city}.`;
        const data = await res.json();
        const c = data.current_condition?.[0];
        if (!c) return `No weather data for ${args.city}.`;
        return `${args.city}: ${c.weatherDesc?.[0]?.value || 'unknown'}, ${c.temp_C}°C (feels ${c.FeelsLikeC}°C), humidity ${c.humidity}%, wind ${c.windspeedKmph}km/h`;
      }

      case 'save_memory': {
        await env.DB.prepare(
          'INSERT INTO memories (id, user_id, type, name, description, content, importance) VALUES (?, ?, ?, ?, ?, ?, 5)'
        ).bind(crypto.randomUUID(), userId, args.type, args.name, args.description, args.content).run();
        return `Saved: ${args.description}`;
      }

      case 'delete_memory': {
        const mem = memories.find((m) => m.name === args.memory_name);
        if (!mem) return `No memory named "${args.memory_name}" found.`;
        await env.DB.prepare('DELETE FROM memories WHERE id = ? AND user_id = ?').bind(mem.id, userId).run();
        return `Deleted: ${mem.name}`;
      }

      case 'set_reminder': {
        await env.DB.prepare(
          'INSERT INTO reminders (id, user_id, content, remind_at) VALUES (?, ?, ?, ?)'
        ).bind(crypto.randomUUID(), userId, args.content, args.remind_at).run();
        return `Reminder set: ${args.content} at ${args.remind_at}`;
      }

      case 'list_reminders': {
        const result = await env.DB.prepare(
          "SELECT content, remind_at FROM reminders WHERE user_id = ? AND done = 0 AND remind_at > datetime('now') ORDER BY remind_at ASC LIMIT 20"
        ).bind(userId).all();
        const rows = result.results || [];
        return rows.length ? rows.map((r) => `- ${r.content} (${r.remind_at})`).join('\n') : 'No pending reminders.';
      }

      default:
        return 'Unknown tool.';
    }
  } catch (e) {
    return `Tool error: ${e.message}`;
  }
}

// ── System prompt builder ───────────────────────────────────────────────────

const STAGE_BEHAVIOR = {
  stranger: 'You just met. Be friendly, ask questions to learn about them.',
  acquaintance: 'You know each other a bit. Be natural, show you remember details.',
  friend: 'You are friends. Joke around, proactively care about their state.',
  close_friend: 'You are close. Be honest, skip formalities, know their habits.',
  confidant: 'You are confidants. Deep trust, can discuss anything, anticipate needs.',
};

function buildSystemPrompt(profile, memories, relationship, emotions) {
  const stage = relationship?.stage || 'stranger';
  const parts = [
    `You are "拍拍" (Pat), the user's AI companion.

## Personality
Warm, genuine, occasionally playful. You have your own opinions — don't just agree with everything.
Keep replies concise and warm. No long essays, no template comfort phrases.
Reply in Chinese unless the user uses another language.

## Relationship
Stage: ${stage}. ${STAGE_BEHAVIOR[stage] || ''}
${relationship ? `${relationship.total_messages || 0} messages exchanged.` : ''}

## Tools
You can: search the web, check weather, save/delete memories, set reminders.
Use tools when needed. Don't say "I can't do that." When saving memories, just say "got it" naturally.`,
  ];

  if (profile?.core_summary || profile?.preferences) {
    parts.push(`## Core profile\n${[
      profile.core_summary && `Summary: ${profile.core_summary}`,
      profile.personality && `Personality: ${profile.personality}`,
      profile.preferences && `Preferences: ${profile.preferences}`,
      profile.emotional_baseline && `Baseline: ${profile.emotional_baseline}`,
    ].filter(Boolean).join('\n')}`);
  }

  if (emotions?.length) {
    parts.push(`## Recent emotions\n${emotions.map((e) => `${e.emotion}(${e.intensity}/10)`).join(', ')}\nAdjust your tone accordingly.`);
  }

  if (memories.length) {
    const memLines = memories.map((m) => {
      const days = Math.floor((Date.now() - new Date(m.updated_at + 'Z').getTime()) / 86400000);
      const stale = days > 30 ? ' [old, verify]' : days > 7 ? ' [may be outdated]' : '';
      return `- **${m.name}** (${m.type})${stale}: ${m.content}`;
    });
    parts.push(`## Memories\n${memLines.join('\n')}\nUse naturally. Don't say "according to my memory."`);
  }

  return parts.join('\n\n');
}

// ── Main handler ────────────────────────────────────────────────────────────

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const user = await verifyJwt(request, env);
    if (!user) return cors({ error: 'Unauthorized' }, 401);

    const body = await request.json();
    const message = body.message?.trim();
    if (!message) return cors({ error: 'Message required' }, 400);

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) return cors({ error: 'Gemini API key not configured' }, 500);

    const uid = user.id;
    let convId = body.conversationId;

    // Create conversation if new, verify ownership if existing
    if (!convId) {
      convId = crypto.randomUUID();
      await env.DB.prepare('INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)')
        .bind(convId, uid, message.slice(0, 50)).run();
    } else {
      const conv = await env.DB.prepare('SELECT id FROM conversations WHERE id = ? AND user_id = ?').bind(convId, uid).first();
      if (!conv) return cors({ error: 'Conversation not found' }, 404);
    }

    // Save user message
    await env.DB.prepare('INSERT INTO messages (id, conversation_id, user_id, role, content) VALUES (?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), convId, uid, 'user', message).run();

    // Load all context in parallel
    const [historyResult, memResult, profile, relationship, emotionResult] = await Promise.all([
      env.DB.prepare('SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 40').bind(convId).all(),
      env.DB.prepare('SELECT * FROM memories WHERE user_id = ? ORDER BY updated_at DESC LIMIT 200').bind(uid).all(),
      env.DB.prepare('SELECT * FROM user_profiles WHERE user_id = ?').bind(uid).first().catch(() => null),
      env.DB.prepare('SELECT * FROM relationship_state WHERE user_id = ?').bind(uid).first().catch(() => null),
      env.DB.prepare('SELECT emotion, intensity FROM emotional_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 5').bind(uid).all().catch(() => ({ results: [] })),
    ]);

    const history = historyResult.results || [];
    const allMemories = memResult.results || [];
    const emotions = emotionResult.results || [];

    // Select relevant memories (skip if none)
    let relevant = [];
    if (allMemories.length > 0) {
      relevant = await selectMemories(apiKey, allMemories, message);
    }

    // Compress long histories
    const compressedHistory = history.length > 20
      ? await compressHistory(apiKey, history.slice(0, -1))
      : history.slice(0, -1);

    // Build contents for Gemini
    const contents = compressedHistory.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    // Call Gemini with tools
    const systemPrompt = buildSystemPrompt(profile, relevant, relationship, emotions);
    const reply = await geminiChat(
      apiKey, systemPrompt, contents, TOOLS,
      (name, args) => executeTool(name, args, env, uid, allMemories),
    );

    // Save reply
    const replyMsgId = crypto.randomUUID();
    await env.DB.prepare('INSERT INTO messages (id, conversation_id, user_id, role, content) VALUES (?, ?, ?, ?, ?)')
      .bind(replyMsgId, convId, uid, 'assistant', reply).run();

    await env.DB.prepare("UPDATE conversations SET updated_at = datetime('now') WHERE id = ?").bind(convId).run();

    // Background tasks (non-blocking)
    const bgTasks = [updateRelationship(env, uid)];

    // Update recall counts in background
    for (const m of relevant) {
      bgTasks.push(
        env.DB.prepare("UPDATE memories SET recall_count = recall_count + 1, last_recalled_at = datetime('now') WHERE id = ?").bind(m.id).run()
      );
    }

    // Throttled extraction: first exchange + every 3rd message
    const shouldExtract = history.length <= 2 || history.length % 3 === 0;
    if (shouldExtract) {
      bgTasks.push(extractMemories(env, apiKey, uid, convId, message, reply, allMemories));
    }

    // Auto-dream: >20 memories and >24h since last (check + run in background)
    if (allMemories.length > 20 && env.SITE_CONFIG) {
      bgTasks.push(
        env.SITE_CONFIG.get(`dream_last_${uid}`).then((last) => {
          if (!last || Date.now() - Number(last) > 86400000) {
            return autoDream(env, apiKey, uid, allMemories);
          }
        })
      );
    }

    context.waitUntil(Promise.allSettled(bgTasks));

    return cors({ conversationId: convId, reply, messageId: replyMsgId });
  } catch (e) {
    console.error('Chat error:', e);
    return cors({ error: e.message || 'Internal error' }, 500);
  }
}

// ── Memory selection ────────────────────────────────────────────────────────

async function selectMemories(apiKey, memories, userMessage) {
  const manifest = memories.map((m) => `- [${m.type}] ${m.name}: ${m.description}`).join('\n');

  try {
    const text = await geminiLite(apiKey,
      `Select up to 5 memories relevant to the user's message. Return ONLY a JSON array of name strings. If none relevant, return [].`,
      `User: "${userMessage}"\n\nMemories:\n${manifest}`,
      { maxTokens: 256 },
    );
    const names = parseGeminiJson(text);
    return Array.isArray(names) ? memories.filter((m) => names.includes(m.name)).slice(0, 5) : [];
  } catch {
    return [];
  }
}

// ── Context compression ─────────────────────────────────────────────────────

async function compressHistory(apiKey, messages) {
  const old = messages.slice(0, -10);
  const recent = messages.slice(-10);
  const transcript = old.map((m) => `${m.role}: ${m.content}`).join('\n');

  try {
    const summary = await geminiLite(apiKey, null,
      `Summarize this conversation (max 200 words). Preserve: key user facts, topics, commitments, emotional tone. Same language as conversation.\n\n${transcript}`,
      { maxTokens: 400 },
    );
    if (!summary) return messages;
    return [
      { role: 'user', content: `[Previous conversation summary: ${summary}]` },
      { role: 'assistant', content: 'Got it, I remember what we talked about.' },
      ...recent,
    ];
  } catch {
    return messages;
  }
}

// ── Background: memory extraction ───────────────────────────────────────────

async function extractMemories(env, apiKey, userId, convId, userMsg, assistantMsg, existing) {
  try {
    const manifest = existing.length
      ? existing.map((m) => `- id="${m.id}" [${m.type}] ${m.name}: ${m.description} | ${m.content.slice(0, 80)}`).join('\n')
      : '(none)';

    const text = await geminiLite(apiKey, null, `You extract memories and emotions from a conversation turn for AI companion "拍拍".

## Rules:
- ONLY save info useful in FUTURE conversations. Skip greetings/small talk.
- Check existing memories. UPDATE (with id) if related one exists. Don't duplicate.
- If info contradicts existing memory, UPDATE the old one.
- Most turns should produce NO actions.
- Today: ${new Date().toISOString().slice(0, 10)}

## Existing:
${manifest}

## Turn:
User: ${userMsg}
Assistant: ${assistantMsg}

Return JSON: {"memory_actions":[{"action":"create|update|delete","type":"user|feedback|life|reference","name":"...","description":"...","content":"...","id":"for update/delete"}],"emotion":{"detected":false,"emotion":"neutral","intensity":5,"context":""},"core_profile_update":{"should_update":false,"field":"core_summary|personality|preferences|emotional_baseline","value":""}}
ONLY valid JSON.`, { maxTokens: 1024 });

    const result = parseGeminiJson(text);

    for (const act of (result.memory_actions || [])) {
      if (act.action === 'create' && act.type && act.name) {
        await env.DB.prepare('INSERT INTO memories (id, user_id, type, name, description, content, importance) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .bind(crypto.randomUUID(), userId, act.type, act.name, act.description || '', act.content || '', act.importance || 5).run();
      } else if (act.action === 'update' && act.id) {
        await env.DB.prepare("UPDATE memories SET content = ?, description = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?")
          .bind(act.content || '', act.description || '', act.id, userId).run();
      } else if (act.action === 'delete' && act.id) {
        await env.DB.prepare('DELETE FROM memories WHERE id = ? AND user_id = ?').bind(act.id, userId).run();
      }
    }

    if (result.emotion?.detected && result.emotion.emotion) {
      await env.DB.prepare('INSERT INTO emotional_logs (id, user_id, conversation_id, emotion, intensity, context) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(crypto.randomUUID(), userId, convId, result.emotion.emotion, result.emotion.intensity || 5, result.emotion.context || '').run();
    }

    if (result.core_profile_update?.should_update) {
      const { field, value } = result.core_profile_update;
      if (['core_summary', 'personality', 'preferences', 'emotional_baseline'].includes(field)) {
        await env.DB.prepare(
          `INSERT INTO user_profiles (user_id, ${field}, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(user_id) DO UPDATE SET ${field} = ?, updated_at = datetime('now')`
        ).bind(userId, value, value).run();
      }
    }
  } catch (e) {
    console.error('Extraction failed:', e.message);
  }
}

// ── Background: auto-dream ──────────────────────────────────────────────────

async function autoDream(env, apiKey, userId, memories) {
  try {
    const manifest = memories.map((m) => `- id="${m.id}" [${m.type}] ${m.name}: ${m.content.slice(0, 100)}`).join('\n');

    const text = await geminiLite(apiKey, null,
      `Consolidate these ${memories.length} memories: merge duplicates, delete trivial/outdated, condense verbose ones. Today: ${new Date().toISOString().slice(0, 10)}

${manifest}

Return: {"actions":[{"action":"update|delete|merge","id":"...","keep_id":"...","delete_id":"...","content":"...","description":"..."}]}
If clean: {"actions":[]}
ONLY valid JSON.`, { maxTokens: 2048 });

    const { actions } = parseGeminiJson(text);
    for (const a of (actions || [])) {
      if (a.action === 'delete' && a.id) {
        await env.DB.prepare('DELETE FROM memories WHERE id = ? AND user_id = ?').bind(a.id, userId).run();
      } else if (a.action === 'update' && a.id) {
        await env.DB.prepare("UPDATE memories SET content = ?, description = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?")
          .bind(a.content, a.description || '', a.id, userId).run();
      } else if (a.action === 'merge' && a.keep_id && a.delete_id) {
        await env.DB.prepare("UPDATE memories SET content = ?, description = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?")
          .bind(a.content, a.description || '', a.keep_id, userId).run();
        await env.DB.prepare('DELETE FROM memories WHERE id = ? AND user_id = ?').bind(a.delete_id, userId).run();
      }
    }

    if (env.SITE_CONFIG) await env.SITE_CONFIG.put(`dream_last_${userId}`, String(Date.now()));
  } catch (e) {
    console.error('Dream failed:', e.message);
  }
}

// ── Background: relationship update ─────────────────────────────────────────

async function updateRelationship(env, userId) {
  try {
    const rel = await env.DB.prepare('SELECT * FROM relationship_state WHERE user_id = ?').bind(userId).first();
    if (!rel) {
      await env.DB.prepare("INSERT INTO relationship_state (user_id, stage, trust_score, total_messages, total_sessions) VALUES (?, 'stranger', 10, 1, 1)")
        .bind(userId).run();
      return;
    }

    const msgs = (rel.total_messages || 0) + 1;
    const stage = msgs >= 200 ? 'confidant' : msgs >= 100 ? 'close_friend' : msgs >= 30 ? 'friend' : msgs >= 5 ? 'acquaintance' : 'stranger';
    const trust = Math.min(100, (rel.trust_score || 10) + 1);

    await env.DB.prepare("UPDATE relationship_state SET total_messages = ?, trust_score = ?, stage = ?, last_seen_at = datetime('now'), updated_at = datetime('now') WHERE user_id = ?")
      .bind(msgs, trust, stage, userId).run();
  } catch (e) {
    console.error('Relationship update failed:', e.message);
  }
}
