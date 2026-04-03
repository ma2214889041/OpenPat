/**
 * POST /api/chat — send message to companion, get AI response
 * Body: { conversationId?, message }
 * Returns: { conversationId, reply, messageId }
 */
import { verifyJwt, cors, corsOptions } from '../_shared/auth.js';

export async function onRequestOptions() {
  return corsOptions();
}

// ── Gemini call ─────────────────────────────────────────────────────────────

async function callGemini(apiKey, systemPrompt, history, userMessage) {
  const contents = [];

  // conversation history (last 20 messages for context window)
  for (const msg of history.slice(-20)) {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    });
  }

  // current user message
  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 1024,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ── Memory selection ────────────────────────────────────────────────────────

async function selectRelevantMemories(apiKey, memories, userMessage, alreadySurfacedIds = []) {
  if (!memories.length) return [];

  // Filter out memories already shown in this conversation
  const candidates = alreadySurfacedIds.length > 0
    ? memories.filter((m) => !alreadySurfacedIds.includes(m.id))
    : memories;

  if (!candidates.length) return [];

  const manifest = candidates.map(
    (m) => `- [${m.type}] ${m.name}: ${m.description}`
  ).join('\n');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{
            text: `You select memories relevant to a user's message for an AI companion.
Given the user's message and a list of memories about them, return a JSON array of memory names that are clearly relevant (up to 5).
Be selective — only include memories you are certain will help the companion understand or respond better.
Prioritize: user preferences > current life situation > reference info.
Return ONLY a JSON array of name strings, nothing else. Example: ["mem1","mem2"]
If no memories are relevant, return: []`
          }],
        },
        contents: [{
          role: 'user',
          parts: [{ text: `User message: "${userMessage}"\n\nAvailable memories:\n${manifest}` }],
        }],
        generationConfig: { temperature: 0, maxOutputTokens: 256 },
      }),
    }
  );

  if (!res.ok) return [];

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    const names = JSON.parse(cleaned);
    return candidates.filter((m) => names.includes(m.name));
  } catch {
    return [];
  }
}

// ── Build system prompt ─────────────────────────────────────────────────────

function getMemoryAge(updatedAt) {
  const now = Date.now();
  const updated = new Date(updatedAt + 'Z').getTime();
  const days = Math.floor((now - updated) / 86400000);
  if (days < 1) return null;
  if (days < 7) return `${days}天前更新`;
  if (days < 30) return `${Math.floor(days / 7)}周前更新，可能已过时`;
  return `${Math.floor(days / 30)}个月前更新，较旧，请验证后再使用`;
}

function buildSystemPrompt(relevantMemories) {
  let prompt = `你是用户的 AI 伴侣"拍拍"。你有自己的性格：温暖、真诚、偶尔俏皮，但从不敷衍。

核心原则：
- 你不是助手，你是伙伴。用户不需要你解决所有问题，但需要你真正在意他们说的话。
- 记住用户告诉你的事情。如果他们之前提到过什么，自然地引用它，让他们感到被记住。
- 回复简洁有温度。不要写长篇大论，不要用模板化的安慰语。
- 可以有自己的想法和反应，不用总是顺着用户说。
- 如果用户需要帮助解决具体问题，你有能力认真分析和回答。
- 用中文回复，除非用户用其他语言。`;

  if (relevantMemories.length > 0) {
    prompt += `\n\n## 你对这位用户的了解\n\n`;
    for (const mem of relevantMemories) {
      const age = getMemoryAge(mem.updated_at);
      const ageNote = age ? ` ⚠️ ${age}` : '';
      prompt += `### ${mem.name} (${mem.type})${ageNote}\n${mem.content}\n\n`;
    }
    prompt += `自然地运用这些了解，不要直接说"根据我的记忆"。如果某条了解标注了"可能已过时"或"较旧"，在使用前通过对话自然地确认是否仍然准确。`;
  }

  return prompt;
}

// ── Main handler ────────────────────────────────────────────────────────────

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const user = await verifyJwt(request, env);
    if (!user) return cors({ error: 'Unauthorized' }, 401);

    const { conversationId, message } = await request.json();
    if (!message?.trim()) return cors({ error: 'Message required' }, 400);

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) return cors({ error: 'Gemini API key not configured' }, 500);

    const uid = user.id;
    let convId = conversationId;

    // Create new conversation if needed
    if (!convId) {
      convId = crypto.randomUUID();
      const title = message.slice(0, 50) + (message.length > 50 ? '...' : '');
      await env.DB.prepare(
        'INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)'
      ).bind(convId, uid, title).run();
    }

    // Save user message
    const userMsgId = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO messages (id, conversation_id, user_id, role, content) VALUES (?, ?, ?, ?, ?)'
    ).bind(userMsgId, convId, uid, 'user', message).run();

    // Load conversation history
    const history = await env.DB.prepare(
      'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 40'
    ).bind(convId).all();
    const historyRows = history.results || [];

    // Load & select relevant memories (skip selection if no memories yet)
    const allMemories = await env.DB.prepare(
      'SELECT * FROM memories WHERE user_id = ? ORDER BY updated_at DESC LIMIT 200'
    ).bind(uid).all();
    const memRows = allMemories.results || [];

    // Always include user-type memories (core identity), select others dynamically
    const alwaysInclude = memRows.filter((m) => m.type === 'user');
    const selectFrom = memRows.filter((m) => m.type !== 'user');

    let relevantMemories = [...alwaysInclude];
    if (selectFrom.length > 0) {
      const selected = await selectRelevantMemories(apiKey, selectFrom, message);
      relevantMemories = [...relevantMemories, ...selected];
    }
    // Cap at 8 to avoid bloating prompt
    relevantMemories = relevantMemories.slice(0, 8);

    // Build prompt & call Gemini
    const systemPrompt = buildSystemPrompt(relevantMemories);
    const reply = await callGemini(apiKey, systemPrompt, historyRows.slice(0, -1), message);

    // Save assistant reply
    const replyMsgId = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO messages (id, conversation_id, user_id, role, content) VALUES (?, ?, ?, ?, ?)'
    ).bind(replyMsgId, convId, uid, 'assistant', reply).run();

    // Update conversation timestamp
    await env.DB.prepare(
      "UPDATE conversations SET updated_at = datetime('now') WHERE id = ?"
    ).bind(convId).run();

    // Trigger memory extraction in background (non-blocking)
    context.waitUntil(extractMemories(env, apiKey, uid, message, reply, memRows));

    return cors({ conversationId: convId, reply, messageId: replyMsgId });
  } catch (e) {
    console.error('Chat error:', e);
    return cors({ error: e.message || 'Internal error' }, 500);
  }
}

// ── Background memory extraction ────────────────────────────────────────────

async function extractMemories(env, apiKey, userId, userMessage, assistantReply, existingMemories) {
  try {
    const manifest = existingMemories.length > 0
      ? existingMemories.map((m) => `- id="${m.id}" [${m.type}] ${m.name}: ${m.description} (content: ${m.content.slice(0, 100)}${m.content.length > 100 ? '...' : ''})`).join('\n')
      : '(no existing memories)';

    const extractionPrompt = `You are a memory extraction agent for an AI companion called "拍拍". Analyze this conversation and decide what to remember about the user.

## Memory types:
- **user**: Who they are — role, preferences, personality, knowledge, habits, name, age, occupation
- **feedback**: How they want to be treated — communication style, things they like/dislike about the companion's responses
- **life**: What's happening — events, goals, emotions, relationships, ongoing situations. ALWAYS use absolute dates (today is ${new Date().toISOString().slice(0, 10)})
- **reference**: External info — places, tools, people, links, resources they mentioned

## Critical rules:
1. ONLY extract info useful in FUTURE conversations. Skip: greetings, small talk, trivial exchanges
2. DEDUPLICATION IS CRITICAL: Before creating, check if an existing memory covers the same topic. If yes, USE UPDATE with the existing id instead of creating a duplicate
3. If new info CONTRADICTS an existing memory, UPDATE that memory with corrected info
4. If a memory is no longer true (user says "I quit my job" but memory says "works at X"), UPDATE it
5. One memory = one topic. Don't combine unrelated facts
6. If nothing worth saving, return empty actions — most casual exchanges should result in NO actions
7. Write memory content in the same language the user uses

## Existing memories (check these BEFORE creating new ones):
${manifest}

## This conversation turn:
User: ${userMessage}
Assistant: ${assistantReply}

Return a JSON object: {"actions":[...]}
Each action is ONE of:
- {"action":"create","type":"user|feedback|life|reference","name":"short_snake_name","description":"one line","content":"the memory"}
- {"action":"update","id":"EXISTING_MEMORY_ID","content":"updated content","description":"updated description"}
- {"action":"delete","id":"EXISTING_MEMORY_ID"}

Return ONLY valid JSON, no markdown, no explanation.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: extractionPrompt }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!res.ok) return;

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    const { actions } = JSON.parse(cleaned);

    if (!actions?.length) return;

    for (const act of actions) {
      if (act.action === 'create') {
        await env.DB.prepare(
          'INSERT INTO memories (id, user_id, type, name, description, content) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(crypto.randomUUID(), userId, act.type, act.name, act.description, act.content).run();
      } else if (act.action === 'update' && act.id) {
        await env.DB.prepare(
          "UPDATE memories SET content = ?, description = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?"
        ).bind(act.content, act.description || '', act.id, userId).run();
      } else if (act.action === 'delete' && act.id) {
        await env.DB.prepare(
          'DELETE FROM memories WHERE id = ? AND user_id = ?'
        ).bind(act.id, userId).run();
      }
    }
  } catch (e) {
    console.error('Memory extraction failed:', e);
  }
}
