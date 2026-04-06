import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { apiGet, apiPost, apiDelete, apiStream } from '../utils/api';
import './Chat.css';

const STAGE_LABELS = {
  stranger: { label: '初识', emoji: '👋', next: '多聊几句，拍拍正在认识你' },
  acquaintance: { label: '熟悉中', emoji: '🌱', next: '继续分享，拍拍在记住你的喜好' },
  friend: { label: '朋友', emoji: '🤝', next: '拍拍已经很了解你了' },
  close_friend: { label: '好友', emoji: '💛', next: '拍拍是你的知心好友' },
  confidant: { label: '知己', emoji: '✨', next: '拍拍完全懂你' },
};

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
  const [dark, setDark] = useState(() => localStorage.getItem('chat-theme') === 'dark');
  const [relationship, setRelationship] = useState(null);
  const [checkInMsg, setCheckInMsg] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { document.title = 'Chat — OpenPat'; return () => { document.title = 'OpenPat — AI Companion with Memory'; }; }, []);

  // Load conversations list + relationship info + check-ins
  useEffect(() => {
    if (!user) return;
    apiGet('/api/conversations').then(setConversations).catch(() => {});
    // Load relationship and check-in data
    apiGet('/api/check-in').then((data) => {
      if (data.relationship) setRelationship(data.relationship);
      // Show proactive check-in if user hasn't chatted in 2+ days
      if (data.days_since_last_message >= 2 || (data.follow_ups && data.follow_ups.length > 0)) {
        const followUp = data.follow_ups?.[0];
        if (followUp) {
          // Generate proactive message for the follow-up
          apiPost('/api/check-in', { followUpId: followUp.id })
            .then((res) => setCheckInMsg(res.message))
            .catch(() => {});
        } else if (data.days_since_last_message >= 3) {
          apiPost('/api/check-in', {})
            .then((res) => setCheckInMsg(res.message))
            .catch(() => {});
        }
      }
    }).catch(() => {});
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

  // Parse SSE stream from response body
  const readStream = useCallback(async (body, onText, onMeta, onDone) => {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'text') onText(data.text);
            else if (data.type === 'meta') onMeta(data);
            else if (data.type === 'done') onDone();
          } catch { /* skip */ }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setLoading(true);
    setCheckInMsg(null); // dismiss check-in on first message

    // Optimistic user message
    const tempId = 'temp-' + Date.now();
    const streamId = 'stream-' + Date.now();
    setMessages((prev) => [...prev, { id: tempId, role: 'user', content: text }]);

    try {
      // Try streaming first
      const body = await apiStream('/api/chat', { conversationId: activeConvId, message: text });

      let convIdFromServer = activeConvId;
      let msgIdFromServer = null;

      // Add empty assistant bubble for streaming
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        { id: tempId, role: 'user', content: text },
        { id: streamId, role: 'assistant', content: '' },
      ]);

      await readStream(
        body,
        // onText: append text chunks
        (chunk) => {
          setMessages((prev) => prev.map((m) =>
            m.id === streamId ? { ...m, content: m.content + chunk } : m
          ));
        },
        // onMeta: capture conversation ID
        (meta) => {
          convIdFromServer = meta.conversationId;
          msgIdFromServer = meta.messageId;
        },
        // onDone
        () => {},
      );

      // Update conversation ID if new
      if (!activeConvId && convIdFromServer) {
        setActiveConvId(convIdFromServer);
        setConversations((prev) => [
          { id: convIdFromServer, title: text.slice(0, 50), updated_at: new Date().toISOString() },
          ...prev,
        ]);
      }

      // Replace stream ID with final message ID
      if (msgIdFromServer) {
        setMessages((prev) => prev.map((m) => {
          if (m.id === tempId) return { ...m, id: msgIdFromServer + '-u' };
          if (m.id === streamId) return { ...m, id: msgIdFromServer };
          return m;
        }));
      }
    } catch (e) {
      // Fallback to non-streaming
      try {
        const data = await apiPost('/api/chat', { conversationId: activeConvId, message: text });
        if (!activeConvId) {
          setActiveConvId(data.conversationId);
          setConversations((prev) => [
            { id: data.conversationId, title: text.slice(0, 50), updated_at: new Date().toISOString() },
            ...prev,
          ]);
        }
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempId && m.id !== 'stream-' + Date.now()),
          { id: data.messageId + '-u', role: 'user', content: text },
          { id: data.messageId, role: 'assistant', content: data.reply },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempId),
          { id: tempId, role: 'user', content: text },
          { id: 'err-' + Date.now(), role: 'assistant', content: '抱歉，出了点问题，请稍后再试。' },
        ]);
      }
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

  function autoResize(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }

  async function loadMemories() {
    try {
      const data = await apiGet('/api/memories');
      setMemories(Array.isArray(data) ? data : []);
    } catch { setMemories([]); }
  }

  async function deleteMemory(id) {
    try {
      await apiDelete(`/api/memories?id=${id}`);
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch {}
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
    try {
      await apiDelete(`/api/conversations?id=${id}`);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvId === id) startNewChat();
    } catch {}
  }

  if (!user) {
    return (
      <div className={`chat-page ${dark ? 'dark' : ''}`}>
        <div className="chat-login">
          <p>登录后开始与拍拍聊天</p>
          <Link to="/signin" className="chat-login-btn">登录 / 注册</Link>
        </div>
      </div>
    );
  }

  const stageInfo = STAGE_LABELS[relationship?.stage] || STAGE_LABELS.stranger;

  return (
    <div className={`chat-page ${dark ? 'dark' : ''}`}>
      {/* Sidebar */}
      <div className={`chat-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <button className="chat-new-btn" onClick={startNewChat}>+ 新对话</button>

        {/* Relationship stage indicator */}
        {relationship && (
          <div className="chat-relationship">
            <div className="chat-relationship-stage">
              <span className="chat-relationship-emoji">{stageInfo.emoji}</span>
              <span className="chat-relationship-label">{stageInfo.label}</span>
              <span className="chat-relationship-trust">({relationship.trust_score}/100)</span>
            </div>
            <div className="chat-relationship-bar">
              <div className="chat-relationship-fill" style={{ width: `${relationship.trust_score}%` }} />
            </div>
            <p className="chat-relationship-hint">{stageInfo.next}</p>
          </div>
        )}

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
          <span className="chat-header-title">Pat {stageInfo.emoji}</span>
          <button
            className="chat-theme-btn"
            onClick={() => { setDark((v) => { const next = !v; localStorage.setItem('chat-theme', next ? 'dark' : 'light'); return next; }); }}
            title={dark ? 'Light mode' : 'Dark mode'}
          >{dark ? '☀️' : '🌙'}</button>
          <button
            className="chat-memory-btn"
            onClick={() => { setMemoryPanel((v) => !v); if (!memoryPanel) loadMemories(); }}
            title="拍拍的记忆"
          >🧠</button>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 && !checkInMsg && (
            <div className="chat-empty">
              <div className="chat-empty-emoji">🐾</div>
              <p>你好呀，我是拍拍。</p>
              <p className="chat-empty-sub">跟我聊聊吧，我会记住你说的每一件重要的事。</p>
              {!conversations.length && (
                <div className="chat-onboarding">
                  <p className="chat-onboarding-title">试试跟我说：</p>
                  <div className="chat-onboarding-suggestions">
                    {['介绍一下你自己吧', '我最近有点焦虑', '帮我记住一件事'].map((s) => (
                      <button key={s} className="chat-suggestion" onClick={() => { setInput(s); inputRef.current?.focus(); }}>{s}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Proactive check-in banner */}
          {messages.length === 0 && checkInMsg && (
            <div className="chat-checkin">
              <span className="chat-avatar">🐾</span>
              <div className="chat-checkin-content">
                <p>{checkInMsg}</p>
              </div>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-bubble ${msg.role}`}>
              {msg.role === 'assistant' && <span className="chat-avatar">🐾</span>}
              <div className="chat-bubble-content">{msg.content}</div>
            </div>
          ))}
          {loading && !messages.some((m) => m.id?.startsWith('stream-') && m.content) && (
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
            onChange={(e) => { setInput(e.target.value); autoResize(e.target); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
            }}
            placeholder="Say something..."
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
