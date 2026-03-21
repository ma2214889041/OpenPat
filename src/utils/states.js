/**
 * Agent state constants — shared across the entire app.
 * Extracted to avoid circular dependencies between hooks and utils.
 */
export const STATES = {
  OFFLINE:         'offline',
  IDLE:            'idle',
  THINKING:        'thinking',
  TOOL_CALL:       'tool_call',
  DONE:            'done',
  ERROR:           'error',
  TOKEN_EXHAUSTED: 'token_exhausted',
};
