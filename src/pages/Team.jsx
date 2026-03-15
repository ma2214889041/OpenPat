import { useState } from 'react';
import { useTeam } from '../hooks/useTeam';
import AgentCard from '../components/AgentCard';
import './Team.css';

export default function Team() {
  const { agents, addAgent, removeAgent, renameAgent } = useTeam();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', wsUrl: 'ws://localhost:18789', token: '' });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!form.wsUrl.trim()) return;
    addAgent(
      form.name.trim() || `龙虾 ${agents.length + 1}`,
      form.wsUrl.trim(),
      form.token.trim()
    );
    setForm({ name: '', wsUrl: 'ws://localhost:18789', token: '' });
    setShowAdd(false);
  };

  return (
    <div className="team-page">
      <div className="team-header">
        <div className="team-title-row">
          <h1>🦞 团队看板</h1>
          <span className="team-count">{agents.length} 只龙虾</span>
        </div>
        <p>同时监控多个 OpenClaw Agent，统一查看团队状态</p>
      </div>

      {agents.length === 0 ? (
        <div className="team-empty">
          <div className="team-empty-icon">🦞🦞🦞</div>
          <h2>还没有龙虾</h2>
          <p>添加你的第一个 Agent，开始团队养虾</p>
          <button className="add-btn" onClick={() => setShowAdd(true)}>+ 添加 Agent</button>
        </div>
      ) : (
        <>
          <div className="team-grid">
            {agents.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onRemove={removeAgent}
                onRename={renameAgent}
              />
            ))}
            <button className="add-card" onClick={() => setShowAdd(true)}>
              <span className="add-card-icon">+</span>
              <span>添加 Agent</span>
            </button>
          </div>

          {/* Summary bar */}
          <TeamSummary agents={agents} />
        </>
      )}

      {showAdd && (
        <div className="add-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="add-modal" onClick={e => e.stopPropagation()}>
            <h2>添加 Agent</h2>
            <form onSubmit={handleAdd} className="add-form">
              <label>
                <span>名称（可选）</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="龙虾 1"
                />
              </label>
              <label>
                <span>Gateway WebSocket 地址</span>
                <input
                  type="text"
                  value={form.wsUrl}
                  onChange={e => setForm(f => ({ ...f, wsUrl: e.target.value }))}
                  placeholder="ws://localhost:18789"
                  required
                />
              </label>
              <label>
                <span>Token</span>
                <input
                  type="password"
                  value={form.token}
                  onChange={e => setForm(f => ({ ...f, token: e.target.value }))}
                  placeholder="Gateway Token"
                />
              </label>
              <div className="add-form-actions">
                <button type="submit" className="add-btn">添加</button>
                <button type="button" className="cancel-btn" onClick={() => setShowAdd(false)}>取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TeamSummary({ agents }) {
  // This component just shows static counts since we'd need
  // to aggregate from all AgentCard's useGateway hooks.
  // For now, show agent count and invite to check individual cards.
  return (
    <div className="team-summary">
      <div className="ts-item">
        <span className="ts-val">{agents.length}</span>
        <span className="ts-label">龙虾总数</span>
      </div>
      <div className="ts-divider" />
      <div className="ts-item">
        <span className="ts-val ts-hint">点击卡片名称可重命名</span>
        <span className="ts-label">双击拖动可排序（即将支持）</span>
      </div>
    </div>
  );
}
