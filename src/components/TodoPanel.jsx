import { useState, useRef } from 'react';
import './TodoPanel.css';

export default function TodoPanel({
  todos, onAdd, onToggle, onRemove, onClearCompleted,
  pendingCount, doneCount,
}) {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onAdd(input);
    setInput('');
    inputRef.current?.focus();
  };

  const activeTodos = todos.filter((t) => !t.done);
  const completedTodos = todos.filter((t) => t.done);

  return (
    <div className="todo-panel">
      <div className="todo-header">
        <h3 className="todo-title">
          待办事项
        </h3>
        <span className="todo-count">
          {doneCount > 0 && <span className="todo-done-count">{doneCount} 已完成</span>}
          {pendingCount > 0 && <span className="todo-pending-count">{pendingCount} 待办</span>}
        </span>
      </div>

      {/* Add form */}
      <form className="todo-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="todo-input"
          type="text"
          placeholder="添加新任务..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={100}
        />
        <button className="todo-add-btn" type="submit" disabled={!input.trim()}>
          +
        </button>
      </form>

      {/* Active todos */}
      <div className="todo-list">
        {activeTodos.length === 0 && completedTodos.length === 0 && (
          <p className="todo-empty">还没有任务，添加一个吧</p>
        )}
        {activeTodos.map((t) => (
          <div key={t.id} className="todo-item">
            <button
              className="todo-check"
              onClick={() => onToggle(t.id)}
              aria-label="完成任务"
            >
              <span className="todo-check-box" />
            </button>
            <span className="todo-text">{t.text}</span>
            <button
              className="todo-remove"
              onClick={() => onRemove(t.id)}
              aria-label="删除任务"
            >
              ×
            </button>
          </div>
        ))}

        {/* Completed todos */}
        {completedTodos.length > 0 && (
          <>
            {completedTodos.map((t) => (
              <div key={t.id} className="todo-item todo-item--done">
                <button
                  className="todo-check todo-check--done"
                  onClick={() => onToggle(t.id)}
                  aria-label="取消完成"
                >
                  <span className="todo-check-box todo-check-box--done">✓</span>
                </button>
                <span className="todo-text todo-text--done">{t.text}</span>
                <button
                  className="todo-remove"
                  onClick={() => onRemove(t.id)}
                  aria-label="删除任务"
                >
                  ×
                </button>
              </div>
            ))}
            <button className="todo-clear-btn" onClick={onClearCompleted}>
              清除已完成
            </button>
          </>
        )}
      </div>
    </div>
  );
}
