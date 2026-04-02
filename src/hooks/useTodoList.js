import { useState, useCallback } from 'react';

const STORAGE_KEY = 'openpat-todos';
const STATS_KEY = 'openpat-todo-stats';

function loadTodos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveTodos(todos) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(todos)); } catch { /* full */ }
}

function loadTodoStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { totalCompleted: 0, todayCompleted: 0, todayDate: null };
    const data = JSON.parse(raw);
    const today = new Date().toDateString();
    if (data.todayDate !== today) {
      data.todayCompleted = 0;
      data.todayDate = today;
    }
    return data;
  } catch { return { totalCompleted: 0, todayCompleted: 0, todayDate: null }; }
}

function saveTodoStats(stats) {
  try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch { /* full */ }
}

let _nextId = Date.now();

/**
 * Simple localStorage-based todo list.
 * Completing tasks triggers brief TOOL_CALL animation in the companion.
 */
export function useTodoList() {
  const [todos, setTodos] = useState(loadTodos);
  const [stats, setStats] = useState(loadTodoStats);

  const addTodo = useCallback((text) => {
    if (!text.trim()) return;
    setTodos((prev) => {
      const updated = [...prev, { id: ++_nextId, text: text.trim(), done: false, createdAt: Date.now() }];
      saveTodos(updated);
      return updated;
    });
  }, []);

  const toggleTodo = useCallback((id) => {
    let justCompleted = false;
    setTodos((prev) => {
      const updated = prev.map((t) => {
        if (t.id !== id) return t;
        if (!t.done) {
          justCompleted = true;
          return { ...t, done: true, completedAt: Date.now() };
        }
        return { ...t, done: false, completedAt: undefined };
      });
      saveTodos(updated);
      return updated;
    });
    if (justCompleted) {
      setStats((prev) => {
        const today = new Date().toDateString();
        const updated = {
          totalCompleted: prev.totalCompleted + 1,
          todayCompleted: (prev.todayDate === today ? prev.todayCompleted : 0) + 1,
          todayDate: today,
        };
        saveTodoStats(updated);
        return updated;
      });
    }
    return justCompleted;
  }, []);

  const removeTodo = useCallback((id) => {
    setTodos((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      saveTodos(updated);
      return updated;
    });
  }, []);

  const editTodo = useCallback((id, text) => {
    setTodos((prev) => {
      const updated = prev.map((t) => t.id === id ? { ...t, text } : t);
      saveTodos(updated);
      return updated;
    });
  }, []);

  const clearCompleted = useCallback(() => {
    setTodos((prev) => {
      const updated = prev.filter((t) => !t.done);
      saveTodos(updated);
      return updated;
    });
  }, []);

  const todayCompleted = stats.todayCompleted;
  const totalCompleted = stats.totalCompleted;
  const pendingCount = todos.filter((t) => !t.done).length;
  const doneCount = todos.filter((t) => t.done).length;

  return {
    todos,
    addTodo,
    toggleTodo,
    removeTodo,
    editTodo,
    clearCompleted,
    todayCompleted,
    totalCompleted,
    pendingCount,
    doneCount,
  };
}
