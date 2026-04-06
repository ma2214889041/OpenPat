/**
 * GET /api/check-in — Get proactive messages for the current user
 * Returns pending follow-ups and check-in messages from Pat
 *
 * POST /api/check-in — Generate a proactive check-in (called by cron or manually)
 * Body: { userId? } — if omitted, processes all users with pending follow-ups
 */
import { verifyJwt, cors, corsOptions } from '../_shared/auth.js';
import { geminiLite } from '../_shared/gemini.js';

export function onRequestOptions() { return corsOptions(); }

// GET: Fetch pending proactive messages for the current user
export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const user = await verifyJwt(request, env);
    if (!user) return cors({ error: 'Unauthorized' }, 401);

    // Get due follow-ups
    const followUps = await env.DB.prepare(
      "SELECT id, topic, context, follow_up_after FROM follow_ups WHERE user_id = ? AND done = 0 AND follow_up_after <= datetime('now') ORDER BY follow_up_after ASC LIMIT 5"
    ).bind(user.id).all();

    // Get days since last message
    const lastMsg = await env.DB.prepare(
      "SELECT created_at FROM messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 1"
    ).bind(user.id).first();

    const daysSinceLastMsg = lastMsg
      ? Math.floor((Date.now() - new Date(lastMsg.created_at + 'Z').getTime()) / 86400000)
      : null;

    // Get relationship stage
    const rel = await env.DB.prepare(
      'SELECT stage, trust_score FROM relationship_state WHERE user_id = ?'
    ).bind(user.id).first();

    return cors({
      follow_ups: (followUps.results || []),
      days_since_last_message: daysSinceLastMsg,
      relationship: rel ? { stage: rel.stage, trust_score: rel.trust_score } : null,
    });
  } catch (e) {
    return cors({ error: e.message }, 500);
  }
}

// POST: Generate a proactive message for a follow-up
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const user = await verifyJwt(request, env);
    if (!user) return cors({ error: 'Unauthorized' }, 401);

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) return cors({ error: 'Not configured' }, 500);

    const body = await request.json();
    const followUpId = body.followUpId;

    let topic, ctxText;

    if (followUpId) {
      // Generate message for a specific follow-up
      const fu = await env.DB.prepare(
        'SELECT * FROM follow_ups WHERE id = ? AND user_id = ? AND done = 0'
      ).bind(followUpId, user.id).first();
      if (!fu) return cors({ error: 'Follow-up not found' }, 404);
      topic = fu.topic;
      ctxText = fu.context;
    }

    // Load user profile for tone
    const [profile, rel] = await Promise.all([
      env.DB.prepare('SELECT core_summary, personality FROM user_profiles WHERE user_id = ?').bind(user.id).first().catch(() => null),
      env.DB.prepare('SELECT stage FROM relationship_state WHERE user_id = ?').bind(user.id).first().catch(() => null),
    ]);

    const stage = rel?.stage || 'acquaintance';
    const prompt = topic
      ? `You are "拍拍", an AI companion. The user previously mentioned: "${topic}" (context: ${ctxText}). It's now time to follow up. Write a short, warm check-in message in Chinese (1-2 sentences). Relationship stage: ${stage}. ${profile?.core_summary ? `About user: ${profile.core_summary}` : ''} Be natural, not robotic. Don't use templates like "嗨，我记得你说过...". Just ask naturally.`
      : `You are "拍拍", an AI companion. The user hasn't chatted in a while. Write a short, warm check-in message in Chinese (1 sentence). Relationship stage: ${stage}. ${profile?.core_summary ? `About user: ${profile.core_summary}` : ''} Be casual, not clingy.`;

    const message = await geminiLite(apiKey, null, prompt, { maxTokens: 200 });

    // Mark follow-up as done
    if (followUpId) {
      await env.DB.prepare('UPDATE follow_ups SET done = 1 WHERE id = ?').bind(followUpId).run();
    }

    return cors({ message: message.trim(), topic });
  } catch (e) {
    return cors({ error: e.message }, 500);
  }
}
