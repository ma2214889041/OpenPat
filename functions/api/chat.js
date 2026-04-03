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

// ── Tool definitions ────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'web_search',
    description: '搜索互联网获取最新信息。当用户问你不确定的事实、最新新闻、或任何需要实时数据的问题时使用。',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '搜索关键词' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_weather',
    description: '查询指定城市的天气。用户问天气时使用。',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string', description: '城市名称（英文，如 Beijing, Shanghai, Tokyo）' },
      },
      required: ['city'],
    },
  },
  {
    name: 'save_memory',
    description: '主动保存一条关于用户的记忆。当用户明确说"记住这个"、分享重要个人信息、或你判断某事值得长期记住时使用。',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['user', 'feedback', 'life', 'reference'], description: '记忆类型' },
        name: { type: 'string', description: '简短名称（snake_case）' },
        description: { type: 'string', description: '一句话描述' },
        content: { type: 'string', description: '记忆内容' },
      },
      required: ['type', 'name', 'description', 'content'],
    },
  },
  {
    name: 'delete_memory',
    description: '删除一条记忆。当用户说"忘掉这个"或某条记忆不再准确时使用。',
    parameters: {
      type: 'object',
      properties: {
        memory_name: { type: 'string', description: '要删除的记忆名称' },
      },
      required: ['memory_name'],
    },
  },
  {
    name: 'set_reminder',
    description: '为用户设置提醒。用户说"提醒我..."、"别忘了..."时使用。',
    parameters: {
      type: 'object',
      properties: {
        content: { type: 'string', description: '提醒内容' },
        remind_at: { type: 'string', description: '提醒时间，ISO 8601格式（如 2026-04-05T09:00:00）' },
      },
      required: ['content', 'remind_at'],
    },
  },
  {
    name: 'list_reminders',
    description: '列出用户所有未完成的提醒。',
    parameters: { type: 'object', properties: {} },
  },
];

// ── Tool execution ──────────────────────────────────────────────────────────

async function executeTool(toolName, args, env, userId, memories) {
  switch (toolName) {
    case 'web_search': {
      // Use Google Custom Search API or fallback to a simple approach
      try {
        const res = await fetch(
          `https://www.googleapis.com/customsearch/v1?key=${env.GEMINI_API_KEY}&cx=partner-pub-0000000000000000:000000&q=${encodeURIComponent(args.query)}&num=3`
        );
        if (res.ok) {
          const data = await res.json();
          const results = (data.items || []).map((i) => `${i.title}: ${i.snippet} (${i.link})`).join('\n\n');
          return results || '没有找到相关结果。';
        }
      } catch {}
      // Fallback: use Gemini grounding
      return `[搜索"${args.query}"的结果暂不可用，请根据你已有的知识回答]`;
    }

    case 'get_weather': {
      try {
        const res = await fetch(
          `https://wttr.in/${encodeURIComponent(args.city)}?format=j1`
        );
        if (res.ok) {
          const data = await res.json();
          const current = data.current_condition?.[0];
          if (current) {
            return `${args.city} 当前天气：${current.weatherDesc?.[0]?.value || '未知'}，温度 ${current.temp_C}°C，体感 ${current.FeelsLikeC}°C，湿度 ${current.humidity}%，风速 ${current.windspeedKmph}km/h`;
          }
        }
      } catch {}
      return `无法获取 ${args.city} 的天气信息。`;
    }

    case 'save_memory': {
      await env.DB.prepare(
        'INSERT INTO memories (id, user_id, type, name, description, content) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(crypto.randomUUID(), userId, args.type, args.name, args.description, args.content).run();
      return `已记住：${args.description}`;
    }

    case 'delete_memory': {
      const mem = memories.find((m) => m.name === args.memory_name);
      if (mem) {
        await env.DB.prepare('DELETE FROM memories WHERE id = ? AND user_id = ?').bind(mem.id, userId).run();
        return `已忘记：${mem.name}`;
      }
      return `没有找到名为"${args.memory_name}"的记忆。`;
    }

    case 'set_reminder': {
      await env.DB.prepare(
        'INSERT INTO reminders (id, user_id, content, remind_at) VALUES (?, ?, ?, ?)'
      ).bind(crypto.randomUUID(), userId, args.content, args.remind_at).run();
      return `已设置提醒：${args.content}（${args.remind_at}）`;
    }

    case 'list_reminders': {
      const result = await env.DB.prepare(
        "SELECT content, remind_at FROM reminders WHERE user_id = ? AND remind_at > datetime('now') ORDER BY remind_at ASC LIMIT 20"
      ).bind(userId).all();
      const rows = result.results || [];
      if (!rows.length) return '没有待办提醒。';
      return rows.map((r) => `- ${r.content}（${r.remind_at}）`).join('\n');
    }

    default:
      return '未知工具。';
  }
}

// ── Gemini call with function calling ───────────────────────────────────────

async function callGemini(apiKey, systemPrompt, history, userMessage, env, userId, memories) {
  const contents = [];

  for (const msg of history.slice(-20)) {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    });
  }

  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    tools: [{
      function_declarations: TOOLS,
    }],
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 1024,
    },
  };

  // Loop to handle tool calls (max 3 rounds)
  for (let round = 0; round < 3; round++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    // Check if model wants to call a function
    const functionCall = parts.find((p) => p.functionCall);

    if (!functionCall) {
      // No function call — return text response
      const textPart = parts.find((p) => p.text);
      return textPart?.text || '';
    }

    // Execute the tool
    const { name, args } = functionCall.functionCall;
    const toolResult = await executeTool(name, args || {}, env, userId, memories);

    // Add model's function call + result to contents for next round
    body.contents.push({
      role: 'model',
      parts: [{ functionCall: { name, args: args || {} } }],
    });
    body.contents.push({
      role: 'user',
      parts: [{ functionResponse: { name, response: { result: toolResult } } }],
    });
  }

  // If we exhausted rounds, return last text or fallback
  return '抱歉，处理过程中出了点问题。';
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
- 用中文回复，除非用户用其他语言。

## 你的能力
你不只能聊天，你还有以下工具可以使用：
- **搜索**：可以搜索互联网获取最新信息
- **天气**：可以查询任何城市的实时天气
- **记忆管理**：可以主动记住或忘记关于用户的事情
- **提醒**：可以帮用户设置提醒

当用户需要这些能力时，主动使用工具，不要说"我无法访问互联网"之类的话。
使用记忆工具时，不需要告诉用户你在"保存记忆"，自然地说"我记住了"就好。`;

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

    // Compress history if too long
    const contextHistory = await compressHistory(apiKey, historyRows.slice(0, -1));

    // Build prompt & call Gemini
    const systemPrompt = buildSystemPrompt(relevantMemories);
    const reply = await callGemini(apiKey, systemPrompt, contextHistory, message, env, uid, memRows);

    // Save assistant reply
    const replyMsgId = crypto.randomUUID();
    await env.DB.prepare(
      'INSERT INTO messages (id, conversation_id, user_id, role, content) VALUES (?, ?, ?, ?, ?)'
    ).bind(replyMsgId, convId, uid, 'assistant', reply).run();

    // Update conversation timestamp
    await env.DB.prepare(
      "UPDATE conversations SET updated_at = datetime('now') WHERE id = ?"
    ).bind(convId).run();

    // ── Throttled memory extraction (every 3 messages) ──
    const msgCount = historyRows.length; // includes the user msg we just added
    const shouldExtract = msgCount <= 2 || msgCount % 3 === 0; // first exchange + every 3rd

    // ── Detect if reply contains explicit memory operations (mutex) ──
    const replyHandledMemory = /我(记住了|会记住|已经记下|不会忘记|忘掉了|已经忘记)/.test(reply);

    if (shouldExtract && !replyHandledMemory) {
      context.waitUntil(extractMemories(env, apiKey, uid, message, reply, memRows));
    }

    // ── Auto-dream: consolidate if >20 memories and last consolidation >24h ago ──
    if (memRows.length > 20 && env.SITE_CONFIG) {
      const lastTime = await env.SITE_CONFIG.get(`dream_last_${uid}`);
      if (!lastTime || Date.now() - Number(lastTime) > 86400000) {
        context.waitUntil(autoDream(env, apiKey, uid, memRows));
      }
    }

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

// ── Auto-dream (background consolidation) ───────────────────────────────────

async function autoDream(env, apiKey, userId, memories) {
  try {
    // Import and call the consolidation logic
    const manifest = memories.map((m) =>
      `- id="${m.id}" [${m.type}] ${m.name}: ${m.description}\n  content: ${m.content}`
    ).join('\n\n');

    const prompt = `You are performing automatic memory consolidation for an AI companion.
Review these ${memories.length} memories and clean up:
1. Merge duplicates (same topic, different entries)
2. Delete memories that are trivially obvious or no longer useful
3. Condense overly verbose memories
Today: ${new Date().toISOString().slice(0, 10)}

## Memories:
${manifest}

Return: {"actions":[...]}
Actions: {"action":"update","id":"ID","content":"...","description":"..."}
or {"action":"delete","id":"ID"}
or {"action":"merge","keep_id":"ID","delete_id":"ID","content":"...","description":"..."}
If clean, return: {"actions":[]}
ONLY valid JSON.`;

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

    if (!res.ok) return;

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    const { actions } = JSON.parse(cleaned);

    if (actions?.length) {
      for (const act of actions) {
        if (act.action === 'update' && act.id) {
          await env.DB.prepare(
            "UPDATE memories SET content = ?, description = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?"
          ).bind(act.content, act.description, act.id, userId).run();
        } else if (act.action === 'delete' && act.id) {
          await env.DB.prepare('DELETE FROM memories WHERE id = ? AND user_id = ?').bind(act.id, userId).run();
        } else if (act.action === 'merge' && act.keep_id && act.delete_id) {
          await env.DB.prepare(
            "UPDATE memories SET content = ?, description = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?"
          ).bind(act.content, act.description, act.keep_id, userId).run();
          await env.DB.prepare('DELETE FROM memories WHERE id = ? AND user_id = ?').bind(act.delete_id, userId).run();
        }
      }
    }

    // Record consolidation time
    if (env.SITE_CONFIG) {
      await env.SITE_CONFIG.put(`dream_last_${userId}`, String(Date.now()));
    }
  } catch (e) {
    console.error('Auto-dream failed:', e);
  }
}

// ── Context compression ─────────────────────────────────────────────────────

async function compressHistory(apiKey, messages) {
  // Only compress if more than 20 messages
  if (messages.length <= 20) return messages;

  const oldMessages = messages.slice(0, -10); // compress everything except last 10
  const recentMessages = messages.slice(-10);  // keep last 10 intact

  const transcript = oldMessages.map((m) => `${m.role}: ${m.content}`).join('\n');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{
            text: `Summarize this conversation history into a concise summary (max 300 words) preserving:
- Key facts the user shared about themselves
- Important topics discussed
- Any commitments or promises made
- The emotional tone of the conversation

Conversation:
${transcript}

Write the summary in the same language as the conversation. Return ONLY the summary, no labels or formatting.`
          }],
        }],
        generationConfig: { temperature: 0, maxOutputTokens: 512 },
      }),
    }
  );

  if (!res.ok) return messages; // fallback to uncompressed

  const data = await res.json();
  const summary = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  if (!summary) return messages;

  return [
    { role: 'user', content: `[Previous conversation summary: ${summary}]` },
    { role: 'assistant', content: '好的，我记住了之前我们聊过的内容。' },
    ...recentMessages,
  ];
}
