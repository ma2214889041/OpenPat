/**
 * useGateway — OpenClaw Gateway WebSocket client
 *
 * Implements the official OpenClaw protocol v3:
 *   https://docs.openclaw.ai/gateway/protocol
 *
 * Handshake:
 *   1. Gateway → {type:"event", event:"connect.challenge", payload:{nonce, ts}}
 *   2. Client  → {type:"req", id, method:"connect", params:{minProtocol:3, maxProtocol:3,
 *                  client:{id,version,platform,mode}, role:"operator",
 *                  scopes:["operator.read","operator.write"],
 *                  auth:{token}, device:{id,publicKey,signature,signedAt,nonce}, …}}
 *   3. Gateway → {type:"res", id, ok:true, payload:{type:"hello-ok", protocol:3,
 *                  policy:{tickIntervalMs:15000}}}
 *
 * Ongoing events (all wrapped as {type:"event", event:"…", payload:{…}}):
 *   agent    — agent lifecycle/tool/assistant stream events
 *   tick     — periodic health tick (every tickIntervalMs ms)
 *   presence — connected-client presence
 *   health   — health snapshot
 *   shutdown — gateway shutting down
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export const STATES = {
  OFFLINE:         'offline',
  IDLE:            'idle',
  THINKING:        'thinking',
  TOOL_CALL:       'tool_call',
  DONE:            'done',
  ERROR:           'error',
  TOKEN_EXHAUSTED: 'token_exhausted',
};

// ── Reconnect back-off ─────────────────────────────────────────────────────
const MIN_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;
function nextBackoff(attempt) {
  return Math.min(MIN_BACKOFF_MS * Math.pow(2, attempt), MAX_BACKOFF_MS);
}

// ── Device identity (persistent, WebCrypto Ed25519) ───────────────────────
const DEVICE_KEY = 'openpat-device-v1';

async function getDeviceIdentity() {
  try {
    const stored = localStorage.getItem(DEVICE_KEY);
    if (stored) {
      const { deviceId, privJwk, pubJwk } = JSON.parse(stored);
      const privateKey = await crypto.subtle.importKey(
        'jwk', privJwk, { name: 'Ed25519' }, false, ['sign']
      );
      return { deviceId, privateKey, pubRaw: pubJwk.x }; // x = base64url public key
    }
  } catch { /* fall through to generate */ }

  const kp = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  const privJwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
  const pubJwk  = await crypto.subtle.exportKey('jwk', kp.publicKey);
  const deviceId = crypto.randomUUID();

  try {
    localStorage.setItem(DEVICE_KEY, JSON.stringify({ deviceId, privJwk, pubJwk }));
  } catch { /* storage full — ephemeral key is fine */ }

  return { deviceId, privateKey: kp.privateKey, pubRaw: pubJwk.x };
}

/**
 * Sign the challenge using the v3 payload format.
 * The exact serialization is not fully specified in the public docs, so we use
 * a stable JSON encoding of the key connect params. If the gateway rejects with
 * DEVICE_AUTH_SIGNATURE_INVALID the user needs to enable permissive auth or
 * update to a matching gateway version.
 */
async function signChallenge(privateKey, { nonce, deviceId, token, role, scopes }) {
  const payload = JSON.stringify({
    v:      'v3',
    nonce,
    device: deviceId,
    platform:     'web',
    deviceFamily: 'browser',
    client:       'openpat',
    role,
    scopes,
    token,
  });
  const sig = await crypto.subtle.sign('Ed25519', privateKey, new TextEncoder().encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

// ── Frame parser ───────────────────────────────────────────────────────────
function parseFrame(msg) {
  if (msg.type === 'event') {
    return { eventName: msg.event || '', payload: msg.payload ?? {} };
  }
  if (msg.type === 'res') {
    const inner = msg.payload ?? {};
    if (msg.ok && inner.type === 'hello-ok') {
      return { eventName: 'hello-ok', payload: inner };
    }
    return { eventName: 'res', payload: inner };
  }
  // Legacy flat frames (older gateway versions)
  return { eventName: msg.type || msg.event || '', payload: msg };
}

let _reqId = 1;
function nextId() { return String(_reqId++); }

// ── Hook ───────────────────────────────────────────────────────────────────
export function useGateway(wsUrl, token) {
  const [status,      setStatus]      = useState(STATES.OFFLINE);
  const [connected,   setConnected]   = useState(false);
  const [currentTool, setCurrentTool] = useState(null);
  const [errorLog,    setErrorLog]    = useState([]);
  const [authError,   setAuthError]   = useState(null); // DEVICE_AUTH_* codes
  const [stats,       setStats]       = useState({
    tokensInput:      0,
    tokensOutput:     0,
    toolCalls:        0,
    toolCallsSuccess: 0,
    sessionStart:     null,
    modelName:        null,
    uptime:           0,
  });
  const [events, setEvents] = useState([]);

  const wsRef          = useRef(null);
  const reconnectTimer = useRef(null);
  const attemptRef     = useRef(0);
  const connectedRef   = useRef(false);

  const addEvent = useCallback((evt) => {
    setEvents(prev => [evt, ...prev].slice(0, 100));
  }, []);

  const connect = useCallback(() => {
    if (!wsUrl || !token) return;
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    let ws;
    try { ws = new WebSocket(wsUrl); }
    catch { setStatus(STATES.OFFLINE); return; }
    wsRef.current = ws;

    ws.onopen = () => {
      // Do NOT send anything — wait for connect.challenge from the gateway
    };

    ws.onmessage = async (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }

      const { eventName, payload } = parseFrame(msg);

      // ── Step 1: Challenge ─────────────────────────────────────────────
      if (eventName === 'connect.challenge') {
        const nonce = payload.nonce;
        const role   = 'operator';
        const scopes = ['operator.read', 'operator.write'];
        const ts     = Date.now();

        // Generate/restore persistent device identity + sign the nonce
        let device = null;
        try {
          const identity = await getDeviceIdentity();
          const signature = await signChallenge(identity.privateKey, {
            nonce, deviceId: identity.deviceId, token, role, scopes,
          });
          device = {
            id:        identity.deviceId,
            publicKey: identity.pubRaw,   // base64url Ed25519 public key
            signature,
            signedAt:  ts,
            nonce,
          };
        } catch (err) {
          console.warn('[useGateway] device signing failed:', err);
          // Proceed without device section — works if gateway has
          // gateway.controlUi.allowInsecureAuth=true
        }

        const connectParams = {
          minProtocol: 3,
          maxProtocol: 3,
          client: {
            id:         'openclaw-control-ui',
            version:    '1.0.0',
            platform:   'web',
            mode:       'webchat',
            instanceId: device?.id,
          },
          role,
          scopes,
          caps:        [],
          commands:    [],
          permissions: {},
          auth:        { token },
          locale:      (typeof navigator !== 'undefined' ? navigator.language : null) || 'en-US',
          userAgent:   'openpat/1.0.0',
        };

        if (device) connectParams.device = device;

        ws.send(JSON.stringify({
          type:   'req',
          id:     nextId(),
          method: 'connect',
          params: connectParams,
        }));
        return;
      }

      // ── Step 2: Hello-OK ──────────────────────────────────────────────
      if (eventName === 'hello-ok') {
        connectedRef.current = true;
        attemptRef.current   = 0;
        setAuthError(null);
        setConnected(true);
        setStatus(STATES.IDLE);
        setStats(s => ({ ...s, sessionStart: Date.now() }));
        addEvent({ type: 'connected', time: Date.now() });
        return;
      }

      // ── Auth errors ────────────────────────────────────────────────────
      // Res with ok:false during connect
      if (msg.type === 'res' && !msg.ok) {
        const code   = msg.error?.details?.code ?? msg.error?.code ?? 'AUTH_ERROR';
        const hint   = msg.error?.details?.recommendedNextStep;
        const detail = msg.error?.message ?? 'Authentication failed';
        setAuthError({ code, detail, hint });
        addEvent({ type: 'auth-error', code, time: Date.now() });
        // Don't reconnect immediately for auth failures
        ws.close();
        return;
      }

      // ── Agent events (the real event name is "agent") ─────────────────
      // Payload: { stream: "lifecycle"|"tool"|"assistant", phase?, … }
      if (eventName === 'agent') {
        const stream = payload.stream;
        const phase  = payload.phase;

        if (stream === 'lifecycle') {
          if (phase === 'start') {
            setStatus(STATES.THINKING);
          } else if (phase === 'end') {
            setStatus(STATES.DONE);
            setTimeout(() => {
              if (connectedRef.current) setStatus(STATES.IDLE);
            }, 3000);
          } else if (phase === 'error') {
            setStatus(STATES.ERROR);
            const errMsg = payload.error ?? payload.message ?? 'Agent error';
            setErrorLog(prev => [{ msg: errMsg, time: Date.now() }, ...prev].slice(0, 5));
          }
        } else if (stream === 'tool') {
          if (phase === 'start' || payload.event === 'start') {
            setStatus(STATES.TOOL_CALL);
            const toolName = payload.tool_name ?? payload.name ?? payload.tool ?? 'unknown';
            setCurrentTool({ name: toolName, start: Date.now() });
            setStats(s => ({ ...s, toolCalls: s.toolCalls + 1 }));
          } else if (phase === 'end' || payload.event === 'end') {
            // Tool ended — still in a run, back to thinking
            setStatus(STATES.THINKING);
            const success = payload.success !== false && payload.error == null;
            if (success) setStats(s => ({ ...s, toolCallsSuccess: s.toolCallsSuccess + 1 }));
            setCurrentTool(null);
          }
        }
        // "assistant" stream = text deltas; we don't need to update state for those
      }

      // ── Tick event (periodic gateway heartbeat, every ~15s) ────────────
      if (eventName === 'tick') {
        // tick contains uptime/health snapshot; use to detect if agent is idle
        // If the gateway sends idle state here, reflect it
        if (payload.agentIdle === true && connectedRef.current) {
          setStatus(STATES.IDLE);
          setCurrentTool(null);
        }
      }

      // ── Graceful shutdown ──────────────────────────────────────────────
      if (eventName === 'shutdown') {
        connectedRef.current = false;
        setConnected(false);
        setStatus(STATES.OFFLINE);
        addEvent({ type: 'shutdown', time: Date.now() });
      }

      // ── Token usage tracking ───────────────────────────────────────────
      // Can appear in agent events or as top-level payload fields
      const usage = payload?.usage ?? msg.usage;
      if (usage) {
        const inp = usage.input_tokens  ?? usage.prompt_tokens     ?? 0;
        const out = usage.output_tokens ?? usage.completion_tokens ?? 0;
        if (inp || out) {
          setStats(s => ({
            ...s,
            tokensInput:  s.tokensInput  + inp,
            tokensOutput: s.tokensOutput + out,
            modelName:    payload?.model ?? msg.model ?? s.modelName,
          }));
        }
        // Detect token exhaustion from usage events
        if (usage.exceeded || usage.exhausted) {
          setStatus(STATES.TOKEN_EXHAUSTED);
        }
      }

      addEvent({ type: eventName, time: Date.now(), raw: msg });
    };

    ws.onerror = () => {
      // onclose fires right after; handle reconnect there
    };

    ws.onclose = (ev) => {
      connectedRef.current = false;
      setConnected(false);
      setStatus(STATES.OFFLINE);
      setCurrentTool(null);

      // Don't reconnect on auth errors (code 4001 or explicit auth error set)
      const isAuthClose = ev.code === 4001 || ev.code === 4003;
      if (isAuthClose) return;

      const delay = nextBackoff(attemptRef.current);
      attemptRef.current += 1;
      reconnectTimer.current = setTimeout(connect, delay);
    };
  }, [wsUrl, token, addEvent]);

  useEffect(() => {
    attemptRef.current = 0;
    setAuthError(null);
    if (wsUrl && token) connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [wsUrl, token]); // eslint-disable-line

  // Uptime counter
  useEffect(() => {
    if (!stats.sessionStart) return;
    const t = setInterval(() => {
      setStats(s => ({ ...s, uptime: Math.floor((Date.now() - s.sessionStart) / 1000) }));
    }, 1000);
    return () => clearInterval(t);
  }, [stats.sessionStart]);

  return { status, connected, currentTool, errorLog, authError, stats, events };
}
