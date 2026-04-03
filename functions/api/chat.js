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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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

async function selectRelevantMemories(apiKey, memories, userMessage) {
  if (!memories.length) return [];

  const manifest = memories.map(
    (m) => `- [${m.type}] ${m.name}: ${m.description}`
  ).join('\n');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{
            text: `You select memories relevant to a user's message.
Given the user's message and a list of memories, return a JSON array of memory names that are clearly relevant (up to 5).
Be selective — only include memories you are certain will help understand or respond to the user.
Return ONLY a JSON array of name strings, nothing else. Example: ["mem1","mem2"]`
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
    return memories.filter((m) => names.includes(m.name));
  } catch {
    return [];
  }
}

// ── Build system prompt ─────────────────────────────────────────────────────

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
      prompt += `### ${mem.name} (${mem.type})\n${mem.content}\n\n`;
    }
    prompt += `自然地运用这些了解，不要直接说"根据我的记忆"。`;
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

    let relevantMemories = [];
    if (memRows.length > 0) {
      relevantMemories = await selectRelevantMemories(apiKey, memRows, message);
    }

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
      ? existingMemories.map((m) => `- [${m.type}] ${m.name}: ${m.description}`).join('\n')
      : '(no existing memories)';

    const extractionPrompt = `You are a memory extraction agent. Analyze this conversation exchange and decide if anything should be saved to long-term memory about the user.

## Memory types:
- **user**: Who they are — role, preferences, personality, knowledge, habits
- **feedback**: How they want to be treated — communication style preferences, things they like/dislike
- **life**: What's happening in their life — events, goals, emotions, relationships, ongoing situations
- **reference**: External info they mentioned — places, tools, people, resources

## Rules:
- Only extract information that will be useful in FUTURE conversations
- Do NOT save: greetings, small talk, trivial exchanges, task-specific details
- If the exchange reveals nothing worth remembering long-term, return empty actions
- Check existing memories before creating new ones — UPDATE if related memory exists
- Keep each memory focused on ONE topic

## Existing memories:
${manifest}

## Conversation:
User: ${userMessage}
Assistant: ${assistantReply}

Return a JSON object with an "actions" array. Each action is one of:
- {"action":"create","type":"user|feedback|life|reference","name":"short_name","description":"one line description","content":"memory content"}
- {"action":"update","id":"existing_memory_id","content":"updated content","description":"updated description"}
- {"action":"delete","id":"existing_memory_id"}

If nothing worth saving, return: {"actions":[]}
Return ONLY valid JSON, nothing else.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
