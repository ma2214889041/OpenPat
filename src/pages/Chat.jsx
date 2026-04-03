import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { apiGet, apiPost, apiDelete } from '../utils/api';
import './Chat.css';

export default function Chat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [memoryPanel, setMemoryPanel] = useState(false);
  const [memories, setMemories] = useState([]);
  const [consolidating, setConsolidating] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Load conversations list
  useEffect(() => {
    if (!user) return;
    apiGet('/api/conversations').then(setConversations).catch(() => {});
  }, [user]);

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConvId) { setMessages([]); return; }
    apiGet(`/api/conversations/${activeConvId}`)
      .then((data) => setMessages(data.messages || []))
      .catch(() => {});
  }, [activeConvId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setLoading(true);

    // Optimistic user message
    const tempId = 'temp-' + Date.now();
    setMessages((prev) => [...prev, { id: tempId, role: 'user', content: text }]);

    try {
      const data = await apiPost('/api/chat', { conversationId: activeConvId, message: text });

      // Set conversation ID if new
      if (!activeConvId) {
        setActiveConvId(data.conversationId);
        setConversations((prev) => [
          { id: data.conversationId, title: text.slice(0, 50), updated_at: new Date().toISOString() },
          ...prev,
        ]);
      }

      // Replace temp message + add reply
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        { id: data.messageId + '-u', role: 'user', content: text },
        { id: data.messageId, role: 'assistant', content: data.reply },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        { id: tempId, role: 'user', content: text },
        { id: 'err-' + Date.now(), role: 'assistant', content: '抱歉，出了点问题，请稍后再试。' },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function startNewChat() {
    setActiveConvId(null);
    setMessages([]);
    setSidebarOpen(false);
  }

  function selectConv(id) {
    setActiveConvId(id);
    setSidebarOpen(false);
  }

  async function loadMemories() {
    try {
      const data = await apiGet('/api/memories');
      setMemories(data);
    } catch {}
  }

  async function deleteMemory(id) {
    await apiDelete(`/api/memories?id=${id}`);
    setMemories((prev) => prev.filter((m) => m.id !== id));
  }

  async function consolidateMemories() {
    setConsolidating(true);
    try {
      await apiPost('/api/memories/consolidate', {});
      await loadMemories();
    } catch {}
    setConsolidating(false);
  }

  async function deleteConv(e, id) {
    e.stopPropagation();
    await apiDelete(`/api/conversations?id=${id}`);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) startNewChat();
  }

  if (!user) {
    return (
      <div className="chat-page">
        <div className="chat-login">
          <p>登录后开始与拍拍聊天</p>
          <Link to="/signin" className="chat-login-btn">登录 / 注册</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      {/* Sidebar */}
      <div className={`chat-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <button className="chat-new-btn" onClick={startNewChat}>+ 新对话</button>
        <div className="chat-conv-list">
          {conversations.map((c) => (
            <div
              key={c.id}
              className={`chat-conv-item ${c.id === activeConvId ? 'active' : ''}`}
              onClick={() => selectConv(c.id)}
            >
              <span className="chat-conv-title">{c.title || '新对话'}</span>
              <button className="chat-conv-del" onClick={(e) => deleteConv(e, c.id)}>×</button>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="chat-main">
        {/* Header */}
        <div className="chat-header">
          <button className="chat-menu-btn" onClick={() => setSidebarOpen((v) => !v)}>☰</button>
          <span className="chat-header-title">拍拍</span>
          <button
            className="chat-memory-btn"
            onClick={() => { setMemoryPanel((v) => !v); if (!memoryPanel) loadMemories(); }}
            title="拍拍的记忆"
          >🧠</button>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <div className="chat-empty-emoji">🐾</div>
              <p>你好呀，我是拍拍。</p>
              <p className="chat-empty-sub">跟我聊聊吧，我会记住你说的每一件重要的事。</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-bubble ${msg.role}`}>
              {msg.role === 'assistant' && <span className="chat-avatar">🐾</span>}
              <div className="chat-bubble-content">{msg.content}</div>
            </div>
          ))}
          {loading && (
            <div className="chat-bubble assistant">
              <span className="chat-avatar">🐾</span>
              <div className="chat-bubble-content chat-typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="chat-input-wrap">
          <textarea
            ref={inputRef}
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder="说点什么..."
            rows={1}
            disabled={loading}
          />
          <button className="chat-send-btn" onClick={send} disabled={loading || !input.trim()}>
            ↑
          </button>
        </div>
      </div>

      {/* Memory panel */}
      {memoryPanel && (
        <div className="chat-memory-panel">
          <div className="chat-memory-header">
            <span>拍拍的记忆 ({memories.length})</span>
            <div className="chat-memory-actions">
              <button
                className="chat-memory-consolidate"
                onClick={consolidateMemories}
                disabled={consolidating || memories.length < 3}
              >
                {consolidating ? '整理中...' : '整理记忆'}
              </button>
              <button className="chat-memory-close" onClick={() => setMemoryPanel(false)}>×</button>
            </div>
          </div>
          <div className="chat-memory-list">
            {memories.length === 0 && (
              <p className="chat-memory-empty">还没有记忆。多聊几句，拍拍会慢慢记住你。</p>
            )}
            {memories.map((m) => (
              <div key={m.id} className="chat-memory-item">
                <div className="chat-memory-item-header">
                  <span className={`chat-memory-type chat-memory-type--${m.type}`}>{m.type}</span>
                  <span className="chat-memory-name">{m.name}</span>
                  <button className="chat-memory-del" onClick={() => deleteMemory(m.id)}>×</button>
                </div>
                <p className="chat-memory-content">{m.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
