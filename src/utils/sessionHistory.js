const HISTORY_KEY = 'lobster-pet-history';
const MAX_SESSIONS = 20;

export function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch { return []; }
}

export function saveSession(session) {
  const history = loadHistory();
  history.unshift({
    id: String(Date.now()),
    startTime: session.startTime,
    endTime: Date.now(),
    durationMs: Date.now() - session.startTime,
    tokensInput: session.tokensInput,
    tokensOutput: session.tokensOutput,
    toolCalls: session.toolCalls,
    toolCallsSuccess: session.toolCallsSuccess,
    errorCount: session.errorCount || 0,
    modelName: session.modelName || null,
    status: session.status, // how it ended
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_SESSIONS)));
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}
