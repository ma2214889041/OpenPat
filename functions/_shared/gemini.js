/**
 * Shared Gemini API helpers.
 * Single source of truth for model names and API calls.
 */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL_CHAT = 'gemini-3.1-pro-preview';
const MODEL_LITE = 'gemini-3.1-flash-lite-preview';

/** Call Gemini and return the raw response JSON. */
async function callRaw(model, apiKey, body) {
  const res = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini ${model} ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

/** Extract text from a Gemini response. */
function extractText(data) {
  return data.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text || '';
}

/** Call the lite model for a simple text completion, return text. */
export async function geminiLite(apiKey, systemPrompt, userPrompt, opts = {}) {
  const body = {
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: { temperature: 0, maxOutputTokens: opts.maxTokens || 1024 },
  };
  if (systemPrompt) {
    body.system_instruction = { parts: [{ text: systemPrompt }] };
  }
  const data = await callRaw(MODEL_LITE, apiKey, body);
  return extractText(data);
}

/** Parse JSON from Gemini text output, stripping markdown fences. */
export function parseGeminiJson(text) {
  const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(cleaned);
}

/**
 * Call the chat model with function calling support.
 * Loops up to `maxRounds` times to handle tool calls.
 * `executeTool(name, args)` should return a string result.
 */
export async function geminiChat(apiKey, systemPrompt, contents, tools, executeTool, maxRounds = 3) {
  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    tools: tools.length > 0 ? [{ function_declarations: tools }] : undefined,
    generationConfig: { temperature: 0.9, maxOutputTokens: 1024 },
  };

  for (let round = 0; round < maxRounds; round++) {
    const data = await callRaw(MODEL_CHAT, apiKey, body);
    const parts = data.candidates?.[0]?.content?.parts || [];
    const fc = parts.find((p) => p.functionCall);

    if (!fc) {
      return parts.find((p) => p.text)?.text || '';
    }

    const { name, args } = fc.functionCall;
    const result = await executeTool(name, args || {});

    // Preserve full parts (including thoughtSignature required by Gemini 3.1)
    body.contents.push({ role: 'model', parts });
    body.contents.push({
      role: 'user',
      parts: [{ functionResponse: { name, response: { result } } }],
    });
  }

  return '抱歉，处理过程中出了点问题。';
}
