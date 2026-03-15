import { useState, useEffect, useRef } from 'react';
import { STATES } from './useGateway';

// Auto-cycle through states to show off the lobster when not connected
const DEMO_SEQUENCE = [
  { status: STATES.IDLE,           duration: 2000,  tool: null },
  { status: STATES.THINKING,       duration: 2500,  tool: null },
  { status: STATES.TOOL_CALL,      duration: 2000,  tool: { name: 'read_file', start: 0 } },
  { status: STATES.THINKING,       duration: 1500,  tool: null },
  { status: STATES.TOOL_CALL,      duration: 1800,  tool: { name: 'bash', start: 0 } },
  { status: STATES.DONE,           duration: 2000,  tool: null },
  { status: STATES.IDLE,           duration: 1500,  tool: null },
  { status: STATES.TOOL_CALL,      duration: 1500,  tool: { name: 'write_file', start: 0 } },
  { status: STATES.ERROR,          duration: 2000,  tool: null },
  { status: STATES.THINKING,       duration: 1500,  tool: null },
  { status: STATES.DONE,           duration: 2000,  tool: null },
  { status: STATES.TOKEN_EXHAUSTED,duration: 2000,  tool: null },
  { status: STATES.IDLE,           duration: 1000,  tool: null },
];

export function useDemoMode(enabled) {
  const [demoStatus, setDemoStatus] = useState(STATES.OFFLINE);
  const [demoTool, setDemoTool] = useState(null);
  const [demoStats, setDemoStats] = useState({
    tokensInput: 0, tokensOutput: 0,
    toolCalls: 0, toolCallsSuccess: 0,
    uptime: 0, sessionStart: Date.now(),
    modelName: 'claude-sonnet-4-6',
  });
  const stepRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      setDemoStatus(STATES.OFFLINE);
      setDemoTool(null);
      return;
    }

    let tokenInterval;
    let uptimeInterval;

    function next() {
      const step = DEMO_SEQUENCE[stepRef.current % DEMO_SEQUENCE.length];
      stepRef.current++;
      setDemoStatus(step.status);
      if (step.tool) {
        setDemoTool({ ...step.tool, start: Date.now() });
      } else {
        setDemoTool(null);
      }
      // Add some tokens on tool calls
      if (step.status === STATES.TOOL_CALL) {
        setDemoStats(s => ({
          ...s,
          tokensInput: s.tokensInput + Math.floor(Math.random() * 800 + 200),
          tokensOutput: s.tokensOutput + Math.floor(Math.random() * 300 + 100),
          toolCalls: s.toolCalls + 1,
          toolCallsSuccess: step.duration > 1700 ? s.toolCallsSuccess + 1 : s.toolCallsSuccess,
        }));
      }
      timerRef.current = setTimeout(next, step.duration);
    }

    // Start after brief pause
    timerRef.current = setTimeout(next, 500);
    uptimeInterval = setInterval(() => {
      setDemoStats(s => ({ ...s, uptime: Math.floor((Date.now() - s.sessionStart) / 1000) }));
    }, 1000);

    return () => {
      clearTimeout(timerRef.current);
      clearInterval(uptimeInterval);
    };
  }, [enabled]);

  return { demoStatus, demoTool, demoStats };
}
