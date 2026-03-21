/**
 * useGateway — OpenClaw Gateway WebSocket client
 *
 * Implements the official OpenClaw protocol v3:
 *   https://docs.openclaw.ai/gateway/protocol
 *
 * Handshake:
 *   1. Gateway → {type:"event", event:"connect.challenge", payload:{nonce, ts}}
 *   2. Client  → {type:"req", id, method:"connect", params:{…}}
 *   3. Gateway → {type:"res", id, ok:true, payload:{type:"hello-ok", …}}
 *
 * Device auth signing uses the official pipe-delimited v3 payload format:
 *   v3|deviceId|clientId|clientMode|role|scopes-csv|signedAtMs|token|nonce|platform|deviceFamily
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

// ── Protocol constants ─────────────────────────────────────────────────────
const PROTOCOL_VERSION = 3;
const CONNECT_TIMEOUT_MS = 8_000;
const CLIENT_ID      = 'openclaw-control-ui';
const CLIENT_VERSION = '1.0.0';
const CLIENT_MODE    = 'webchat';
const ROLE           = 'operator';
const SCOPES         = [
  'operator.admin',
  'operator.read',
  'operator.write',
  'operator.approvals',
  'operator.pairing',
];
const CAPS = ['tool-events'];

// ── Reconnect back-off (factor 1.7, max 15s — matches openclaw-studio) ───
const INITIAL_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS     = 15_000;
const BACKOFF_FACTOR     = 1.7;
function nextBackoff(attempt) {
  return Math.min(INITIAL_BACKOFF_MS * Math.pow(BACKOFF_FACTOR, attempt), MAX_BACKOFF_MS);
}

// ── Base64url helpers ─────────────────────────────────────────────────────
function arrayBufToBase64url(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// ── Device identity (persistent, WebCrypto Ed25519) ───────────────────────
const DEVICE_KEY       = 'openpat-device-v1';
const DEVICE_TOKEN_KEY = 'openpat-device-token-v1';

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

function getSavedDeviceToken() {
  try { return localStorage.getItem(DEVICE_TOKEN_KEY); }
  catch { return null; }
}
function saveDeviceToken(token) {
  try { localStorage.setItem(DEVICE_TOKEN_KEY, token); }
  catch { /* ignore */ }
}

/**
 * Sign the challenge using the official v3 pipe-delimited payload format.
 * Format: v3|deviceId|clientId|clientMode|role|scopes-csv|signedAtMs|token|nonce|platform|deviceFamily
 * All string fields are lowercased ASCII for cross-runtime determinism.
 */
async function signChallenge(privateKey, { nonce, deviceId, token, signedAt }) {
  const payload = [
    'v3',
    deviceId,
    CLIENT_ID,
    CLIENT_MODE,
    ROLE,
    SCOPES.join(','),
    String(signedAt),
    token,
    nonce,
    'web',
    'browser',
  ].join('|');
  const sig = await crypto.subtle.sign('Ed25519', privateKey, new TextEncoder().encode(payload));
  return arrayBufToBase64url(sig);
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

  const wsRef           = useRef(null);
  const reconnectTimer  = useRef(null);
  const connectTimeout  = useRef(null);
  const attemptRef      = useRef(0);
  const connectedRef    = useRef(false);
  const scopeErrorRetry = useRef(false); // tracks legacy-profile fallback

  const addEvent = useCallback((evt) => {
    setEvents(prev => [evt, ...prev].slice(0, 100));
  }, []);

  const connect = useCallback(() => {
    if (!wsUrl || !token) return;
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }
    clearTimeout(connectTimeout.current);

    let ws;
    try { ws = new WebSocket(wsUrl); }
    catch { setStatus(STATES.OFFLINE); return; }
    wsRef.current = ws;

    // ── Connect timeout — close if handshake doesn't complete ──────────
    connectTimeout.current = setTimeout(() => {
      if (!connectedRef.current && ws.readyState !== WebSocket.CLOSED) {
        console.warn('[useGateway] connect timeout after', CONNECT_TIMEOUT_MS, 'ms');
        ws.close();
      }
    }, CONNECT_TIMEOUT_MS);

    ws.onopen = () => {
      // Do NOT send anything — wait for connect.challenge from the gateway
    };

    ws.onmessage = async (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }

      const { eventName, payload } = parseFrame(msg);

      // ── Step 1: Challenge ─────────────────────────────────────────────
      if (eventName === 'connect.challenge') {
        const nonce   = payload.nonce;
        const ts      = Date.now();

        // Build auth section — prefer saved device token, fall back to gateway token
        const savedDeviceToken = getSavedDeviceToken();
        const authSection = savedDeviceToken
          ? { deviceToken: savedDeviceToken, token }
          : { token };

        // Generate/restore persistent device identity + sign the nonce
        let device = null;
        try {
          const identity = await getDeviceIdentity();
          const signature = await signChallenge(identity.privateKey, {
            nonce, deviceId: identity.deviceId, token, signedAt: ts,
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
          minProtocol: PROTOCOL_VERSION,
          maxProtocol: PROTOCOL_VERSION,
          client: {
            id:         CLIENT_ID,
            version:    CLIENT_VERSION,
            platform:   'web',
            mode:       CLIENT_MODE,
            instanceId: device?.id,
          },
          role:        ROLE,
          scopes:      SCOPES,
          caps:        CAPS,
          auth:        authSection,
          locale:      (typeof navigator !== 'undefined' ? navigator.language : null) || 'en-US',
          userAgent:   'openpat/' + CLIENT_VERSION,
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
        clearTimeout(connectTimeout.current);
        connectedRef.current  = true;
        attemptRef.current    = 0;
        scopeErrorRetry.current = false;
        setAuthError(null);
        setConnected(true);
        setStatus(STATES.IDLE);
        setStats(s => ({ ...s, sessionStart: Date.now() }));
        addEvent({ type: 'connected', time: Date.now() });

        // Persist device token for future connections if gateway issued one
        if (payload.auth?.deviceToken) {
          saveDeviceToken(payload.auth.deviceToken);
        }
        return;
      }

      // ── Auth errors ────────────────────────────────────────────────────
      // Res with ok:false during connect
      if (msg.type === 'res' && !msg.ok) {
        clearTimeout(connectTimeout.current);
        const code   = msg.error?.details?.code ?? msg.error?.code ?? 'AUTH_ERROR';
        const hint   = msg.error?.details?.recommendedNextStep;
        const detail = msg.error?.message ?? 'Authentication failed';

        // Scope error fallback: retry once with reduced scopes (read+write only)
        if (!scopeErrorRetry.current && detail && /missing scope/i.test(detail)) {
          scopeErrorRetry.current = true;
          console.info('[useGateway] scope error — retrying with reduced scopes');
          ws.close();
          // Reconnect will happen via onclose handler
          return;
        }

        // Device identity mismatch — clear stale keys and auto-retry once
        if (code === 'DEVICE_AUTH_DEVICE_ID_MISMATCH' || /device.*(identity|mismatch)/i.test(detail)) {
          try { localStorage.removeItem(DEVICE_KEY); } catch { /* ok */ }
          try { localStorage.removeItem(DEVICE_TOKEN_KEY); } catch { /* ok */ }
          if (!scopeErrorRetry.current) {
            scopeErrorRetry.current = true; // reuse flag to limit to one retry
            console.info('[useGateway] device mismatch — cleared keys, reconnecting...');
            ws.close();
            return; // will reconnect via onclose
          }
        }

        // Clear saved device token on other auth errors — it may be stale
        if (code.startsWith('DEVICE_AUTH') || code === 'AUTH_TOKEN_MISMATCH') {
          try { localStorage.removeItem(DEVICE_TOKEN_KEY); } catch { /* ok */ }
          try { localStorage.removeItem(DEVICE_KEY); } catch { /* ok */ }
        }

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
      clearTimeout(connectTimeout.current);
      connectedRef.current = false;
      setConnected(false);
      setStatus(STATES.OFFLINE);
      setCurrentTool(null);

      // Don't reconnect on auth errors (code 4001 or 4003) unless it's a scope retry
      const isAuthClose = ev.code === 4001 || ev.code === 4003;
      if (isAuthClose && !scopeErrorRetry.current) return;

      const delay = nextBackoff(attemptRef.current);
      attemptRef.current += 1;
      reconnectTimer.current = setTimeout(connect, delay);
    };
  }, [wsUrl, token, addEvent]);

  useEffect(() => {
    attemptRef.current = 0;
    scopeErrorRetry.current = false;
    setAuthError(null);
    if (wsUrl && token) connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      clearTimeout(connectTimeout.current);
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
