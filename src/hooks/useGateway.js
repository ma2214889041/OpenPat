import { useState, useEffect, useRef, useCallback } from 'react';

export const STATES = {
  OFFLINE: 'offline',
  IDLE: 'idle',
  THINKING: 'thinking',
  TOOL_CALL: 'tool_call',
  DONE: 'done',
  ERROR: 'error',
  TOKEN_EXHAUSTED: 'token_exhausted',
};

export function useGateway(wsUrl, token) {
  const [status, setStatus] = useState(STATES.OFFLINE);
  const [connected, setConnected] = useState(false);
  const [currentTool, setCurrentTool] = useState(null);
  const [errorLog, setErrorLog] = useState([]);
  const [stats, setStats] = useState({
    tokensInput: 0,
    tokensOutput: 0,
    toolCalls: 0,
    toolCallsSuccess: 0,
    sessionStart: null,
    modelName: null,
    uptime: 0,
  });
  const [events, setEvents] = useState([]);

  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const statsRef = useRef(stats);
  statsRef.current = stats;

  const addEvent = useCallback((evt) => {
    setEvents(prev => [evt, ...prev].slice(0, 100));
  }, []);

  const connect = useCallback(() => {
    if (!wsUrl || !token) return;
    if (wsRef.current) wsRef.current.close();

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Wait for challenge
    };

    ws.onmessage = (e) => {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }

      const type = msg.type || msg.event;

      // Gateway handshake
      if (type === 'connect.challenge') {
        ws.send(JSON.stringify({
          type: 'connect',
          token,
          role: 'operator',
          scopes: ['operator.read'],
          nonce: msg.nonce,
        }));
        return;
      }

      if (type === 'hello-ok' || type === 'connected') {
        setConnected(true);
        setStatus(STATES.IDLE);
        setStats(s => ({ ...s, sessionStart: Date.now() }));
        addEvent({ type: 'connected', time: Date.now() });
        return;
      }

      // State events
      if (type === 'agent.idle' || type === 'session.idle') {
        setStatus(STATES.IDLE);
        setCurrentTool(null);
      } else if (type === 'agent.thinking' || type === 'message.start') {
        setStatus(STATES.THINKING);
      } else if (type === 'tool.start' || type === 'tool_call.start') {
        setStatus(STATES.TOOL_CALL);
        const toolName = msg.tool_name || msg.data?.tool_name || 'unknown';
        setCurrentTool({ name: toolName, start: Date.now() });
        setStats(s => ({ ...s, toolCalls: s.toolCalls + 1 }));
      } else if (type === 'tool.end' || type === 'tool_call.end') {
        setStatus(STATES.IDLE);
        const success = msg.success !== false;
        if (success) setStats(s => ({ ...s, toolCallsSuccess: s.toolCallsSuccess + 1 }));
        setCurrentTool(null);
      } else if (type === 'task.done' || type === 'session.complete') {
        setStatus(STATES.DONE);
        setTimeout(() => setStatus(STATES.IDLE), 3000);
      } else if (type === 'error' || type === 'agent.error') {
        setStatus(STATES.ERROR);
        const errMsg = msg.message || msg.data?.message || 'Unknown error';
        setErrorLog(prev => [{ msg: errMsg, time: Date.now() }, ...prev].slice(0, 5));
      } else if (type === 'token.exhausted' || type === 'quota.exceeded') {
        setStatus(STATES.TOKEN_EXHAUSTED);
      }

      // Token usage
      if (msg.usage) {
        const inp = msg.usage.input_tokens || 0;
        const out = msg.usage.output_tokens || 0;
        setStats(s => ({
          ...s,
          tokensInput: s.tokensInput + inp,
          tokensOutput: s.tokensOutput + out,
          modelName: msg.model || s.modelName,
        }));
      }

      addEvent({ type, time: Date.now(), raw: msg });
    };

    ws.onerror = () => {
      setConnected(false);
      setStatus(STATES.OFFLINE);
    };

    ws.onclose = () => {
      setConnected(false);
      setStatus(STATES.OFFLINE);
      // Auto reconnect after 5s
      reconnectTimer.current = setTimeout(connect, 5000);
    };
  }, [wsUrl, token, addEvent]);

  useEffect(() => {
    if (wsUrl && token) connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
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

  return { status, connected, currentTool, errorLog, stats, events };
}
