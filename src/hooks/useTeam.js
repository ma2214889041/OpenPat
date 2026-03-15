import { useState, useCallback } from 'react';

const STORAGE_KEY = 'lobster-pet-team';

function loadTeam() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveTeam(agents) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
}

let nextId = Date.now();

export function useTeam() {
  const [agents, setAgents] = useState(loadTeam);

  const addAgent = useCallback((name, wsUrl, token) => {
    const agent = { id: String(nextId++), name, wsUrl, token, createdAt: Date.now() };
    setAgents(prev => {
      const next = [...prev, agent];
      saveTeam(next);
      return next;
    });
    return agent.id;
  }, []);

  const removeAgent = useCallback((id) => {
    setAgents(prev => {
      const next = prev.filter(a => a.id !== id);
      saveTeam(next);
      return next;
    });
  }, []);

  const renameAgent = useCallback((id, name) => {
    setAgents(prev => {
      const next = prev.map(a => a.id === id ? { ...a, name } : a);
      saveTeam(next);
      return next;
    });
  }, []);

  return { agents, addAgent, removeAgent, renameAgent };
}
