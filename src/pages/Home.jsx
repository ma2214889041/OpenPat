import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LobsterSVG from '../components/LobsterSVG';
import StatsPanel from '../components/StatsPanel';
import ConnectModal from '../components/ConnectModal';
import ErrorLog from '../components/ErrorLog';
import ShareButton from '../components/ShareButton';
import GifButton from '../components/GifButton';
import LevelProgress from '../components/LevelProgress';
import SkinSelector from '../components/SkinSelector';
import BadgePanel from '../components/BadgePanel';
import CostEstimator from '../components/CostEstimator';
import SessionHistory from '../components/SessionHistory';
import KeyboardHints from '../components/KeyboardHints';
import AchievementToast, { useAchievementToast } from '../components/AchievementToast';
import DemoModeBanner from '../components/DemoModeBanner';
import { triggerConfetti } from '../components/Confetti';
import { useGateway, STATES } from '../hooks/useGateway';
import { useAuth } from '../hooks/useAuth';
import { useSkins } from '../hooks/useSkins';
import { useNotifications } from '../hooks/useNotifications';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useDynamicFavicon } from '../hooks/useDynamicFavicon';
import { useDemoMode } from '../hooks/useDemoMode';
import { useCloudSkins } from '../hooks/useCloudSkins';
import { loadData, saveData, ACHIEVEMENTS, onGatewayConnect, tickUptimeCheck, recordError, checkNoErrorWeek } from '../utils/storage';
import { estimateCost, costToFatness } from '../utils/cost';
import { saveSession } from '../utils/sessionHistory';
import { supabase, hasSupabase } from '../utils/supabase';
import './Home.css';

const CONN_KEY = 'lobster-pet-connection';

function loadConn() {
  try { return JSON.parse(localStorage.getItem(CONN_KEY) || 'null'); }
  catch { return null; }
}

export default function Home() {
  const navigate = useNavigate();
  const saved = loadConn();
  const [wsUrl, setWsUrl] = useState(saved?.url || '');
  const [token, setToken] = useState(saved?.token || '');
  const [showModal, setShowModal] = useState(!saved);
  const [showError, setShowError] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showKbHints, setShowKbHints] = useState(false);
  const [localData, setLocalData] = useState(loadData);
  const sessionStartRef = useRef(null);
  const prevConnected = useRef(false);
  const prevStatus = useRef(null);

  const { user, username } = useAuth();
  const { activeSkin, activeSkinId, ownedIds, selectSkin, unlockSkin, skinStyle, setOwnedIds } = useSkins();
  const { notify, requestPermission } = useNotifications();
  const { status, connected, currentTool, errorLog, stats } = useGateway(wsUrl, token);

  // Demo mode when not connected
  const { demoStatus, demoTool, demoStats } = useDemoMode(!connected);
  const displayStatus = connected ? status : demoStatus;
  const displayTool = connected ? currentTool : demoTool;

  // Dynamic favicon
  useDynamicFavicon(displayStatus);

  // Sync cloud-owned skins when logged in
  useCloudSkins(user, setOwnedIds);

  const { toast, dismiss } = useAchievementToast(localData.achievements);

  // Auto-detect CLI config
  useEffect(() => {
    if (saved) return;
    fetch('/lobster-config.json')
      .then(r => r.json())
      .then(cfg => {
        if (cfg.autoDetected && cfg.wsUrl && cfg.token) {
          setWsUrl(cfg.wsUrl);
          setToken(cfg.token);
          localStorage.setItem(CONN_KEY, JSON.stringify({ url: cfg.wsUrl, token: cfg.token }));
          setShowModal(false);
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line

  const handleConnect = useCallback((url, tok) => {
    setWsUrl(url);
    setToken(tok);
    localStorage.setItem(CONN_KEY, JSON.stringify({ url, token: tok }));
    setShowModal(false);
  }, []);

  // Track session start/end for history + marathon tracking
  useEffect(() => {
    if (connected && !prevConnected.current) {
      sessionStartRef.current = Date.now();
      // Marathon: record connect time
      setLocalData(prev => {
        const updated = onGatewayConnect(prev);
        saveData(updated);
        return updated;
      });
    }
    if (!connected && prevConnected.current && sessionStartRef.current) {
      // Save session when disconnected
      saveSession({
        startTime: sessionStartRef.current,
        tokensInput: stats.tokensInput,
        tokensOutput: stats.tokensOutput,
        toolCalls: stats.toolCalls,
        toolCallsSuccess: stats.toolCallsSuccess,
        errorCount: errorLog.length,
        modelName: stats.modelName,
        status: 'disconnected',
      });
      // 把本次 session 的 token 累加到今日计数，保证重连后 fatness 计算延续
      setLocalData(prev => {
        const today = new Date().toDateString();
        const base = prev.todayDate === today ? prev : { ...prev, todayTokensInput: 0, todayTokensOutput: 0, todayDate: today };
        const updated = {
          ...base,
          todayTokensInput:  base.todayTokensInput  + stats.tokensInput,
          todayTokensOutput: base.todayTokensOutput + stats.tokensOutput,
          totalToolCalls:    base.totalToolCalls    + stats.toolCalls,
          totalTokensInput:  base.totalTokensInput  + stats.tokensInput,
          totalTokensOutput: base.totalTokensOutput + stats.tokensOutput,
        };
        saveData(updated);
        return updated;
      });
      sessionStartRef.current = null;
    }
    prevConnected.current = connected;
  }, [connected]); // eslint-disable-line

  // Uptime tick (60s) — marathon achievement check
  useEffect(() => {
    if (!connected) return;
    const id = setInterval(() => {
      setLocalData(prev => {
        const { data: updated, newAch } = tickUptimeCheck(prev);
        if (newAch) saveData(updated);
        return updated;
      });
    }, 60_000);
    return () => clearInterval(id);
  }, [connected]);

  // Count completed tasks + check achievements
  useEffect(() => {
    if (status === prevStatus.current) return;
    const prev_ = prevStatus.current;
    prevStatus.current = status;

    if (status === STATES.DONE) {
      triggerConfetti();
      setLocalData(prev => {
        const sessionErrors = prev._sessionErrors || 0;
        const newAch = [];
        if (!prev.achievements.includes('perfect_task') && sessionErrors === 0) {
          newAch.push('perfect_task');
        }
        // Check no_error_week on each DONE (may cross week boundary)
        const withWeekCheck = checkNoErrorWeek(prev);
        const updated = {
          ...withWeekCheck,
          totalTasks: withWeekCheck.totalTasks + 1,
          _sessionErrors: 0,
          achievements: [...withWeekCheck.achievements, ...newAch.filter(id => !withWeekCheck.achievements.includes(id))],
        };
        saveData(updated);
        return updated;
      });
      notify('🦞 任务完成！', '龙虾完成了一个任务 ✔');
    }
    if (status === STATES.ERROR && prev_ !== STATES.ERROR) {
      setLocalData(prev => {
        const updated = recordError({ ...prev, _sessionErrors: (prev._sessionErrors || 0) + 1 });
        return updated;
      });
      notify('🦞 龙虾翻车了', '点击查看错误日志');
    }
  }, [status]); // eslint-disable-line

  // Tool calls → saver achievement
  useEffect(() => {
    setLocalData(prev => {
      if (!prev.achievements.includes('saver') &&
          stats.toolCalls >= 50 &&
          stats.toolCallsSuccess === stats.toolCalls &&
          stats.tokensInput < 50000) {
        const updated = { ...prev, achievements: [...prev.achievements, 'saver'] };
        saveData(updated);
        return updated;
      }
      return prev;
    });
  }, [stats.toolCalls]);

  // Night owl
  useEffect(() => {
    if (!connected) return;
    const h = new Date().getHours();
    if (h >= 2 && h < 5) {
      setLocalData(prev => {
        if (prev.achievements.includes('night_owl')) return prev;
        const updated = { ...prev, achievements: [...prev.achievements, 'night_owl'] };
        saveData(updated);
        return updated;
      });
    }
  }, [connected]);

  // Sync status to Supabase
  useEffect(() => {
    if (!hasSupabase || !user || !connected) return;
    supabase.from('agent_status').upsert({
      user_id: user.id,
      status,
      current_tool: currentTool?.name || null,
      session_tokens: stats.tokensInput + stats.tokensOutput,
      session_tool_calls: stats.toolCalls,
      updated_at: new Date().toISOString(),
    });
  }, [status, user, connected, currentTool, stats]);

  // 终身累计花费决定胖瘦（$0→瘦 0.6，$50→圆滚滚 1.5）
  const totalUsd = estimateCost(
    localData.totalTokensInput + stats.tokensInput,
    localData.totalTokensOutput + stats.tokensOutput,
    stats.modelName
  );
  const fatness = costToFatness(totalUsd);

  // Interactions
  const handleLobsterClick = useCallback(() => {
    if (status === STATES.ERROR) setShowError(v => !v);
  }, [status]);

  const handleLobsterDblClick = useCallback(() => {
    const summary = [
      '🦞 Lobster Pet 状态摘要',
      `状态: ${status}`,
      `Tokens: ${stats.tokensInput + stats.tokensOutput}`,
      `工具调用: ${stats.toolCalls} (成功: ${stats.toolCallsSuccess})`,
      `运行时长: ${stats.uptime}s`,
    ].join('\n');
    navigator.clipboard?.writeText(summary);
  }, [status, stats]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    's': () => document.querySelector('.share-btn')?.click(),
    'h': () => setShowHistory(v => !v),
    'c': handleLobsterDblClick,
    'm': () => setShowModel(v => !v),
    'n': () => requestPermission(),
    '?': () => setShowKbHints(v => !v),
  });

  // Dynamic title
  useEffect(() => {
    const titles = {
      [STATES.ERROR]: '[Error] Lobster is crying... 🦞',
      [STATES.TOOL_CALL]: '[Working] Lobster is busy 🦞⚡',
      [STATES.DONE]: '[Done] Lobster crushed it! 🦞✔',
    };
    document.title = titles[displayStatus] || 'Lobster Pet 🦞';
  }, [displayStatus]);

  return (
    <div className="home">
      {showModal && <ConnectModal onConnect={handleConnect} />}
      <AchievementToast toast={toast} onDismiss={dismiss} />
      <KeyboardHints visible={showKbHints} onClose={() => setShowKbHints(false)} />
      {!connected && !showModal && (
        <DemoModeBanner onConnect={() => setShowModal(true)} />
      )}

      <main className="home-layout">
        {/* Lobster column */}
        <section className="home-lobster-col">
          <div
            className="home-lobster-wrapper"
            style={skinStyle}
            onDoubleClick={handleLobsterDblClick}
          >
            <LobsterSVG status={displayStatus} onClick={handleLobsterClick} fatness={fatness} />
            {showError && (
              <ErrorLog errors={errorLog} onClose={() => setShowError(false)} />
            )}
          </div>

          <StatusCaption status={displayStatus} currentTool={displayTool} />

          {connected && (
            <div className="home-share-stack">
              <ShareButton stats={stats} status={status} skinColors={activeSkin.colors} />
              <GifButton stats={stats} skinColors={activeSkin.colors} />
            </div>
          )}

          <div className="home-lobster-footer">
            <button className="btn-ghost" onClick={() => setShowModal(true)}>
              {connected ? '🔄 切换连接' : '🔌 连接 Gateway'}
            </button>
            <button className="btn-ghost" onClick={() => setShowKbHints(true)} title="键盘快捷键">
              ⌨️
            </button>
          </div>
        </section>

        {/* Stats column */}
        {connected && (
          <section className="home-stats-col">
            <StatsPanel
              status={status}
              stats={stats}
              currentTool={currentTool}
              totalTasks={localData.totalTasks}
              showModel={showModel}
              onToggleModel={() => setShowModel(v => !v)}
            />
            <LevelProgress totalTasks={localData.totalTasks} />
            <CostEstimator
              tokensInput={stats.tokensInput}
              tokensOutput={stats.tokensOutput}
              detectedModel={stats.modelName}
            />
            <SkinSelector
              activeSkinId={activeSkinId}
              ownedIds={ownedIds}
              onSelect={selectSkin}
              onShop={() => navigate('/shop')}
            />
            <AchievementsPanel achievements={localData.achievements} />
            {showHistory
              ? <SessionHistory onClose={() => setShowHistory(false)} />
              : <button className="btn-ghost btn-full" onClick={() => setShowHistory(true)}>
                  📋 查看历史会话
                </button>
            }
            <BadgePanel
              username={username}
              status={status}
              totalTasks={localData.totalTasks}
            />
          </section>
        )}

        {/* Demo stats column when offline */}
        {!connected && !showModal && (
          <section className="home-stats-col">
            <StatsPanel
              status={demoStatus}
              stats={demoStats}
              currentTool={demoTool}
              totalTasks={0}
              showModel={false}
              onToggleModel={() => {}}
            />
          </section>
        )}
      </main>
    </div>
  );
}

function StatusCaption({ status, currentTool }) {
  const captions = {
    [STATES.OFFLINE]: '龙虾正在休息...',
    [STATES.IDLE]: '龙虾在悠闲地等待任务',
    [STATES.THINKING]: '龙虾在认真思考中...',
    [STATES.TOOL_CALL]: currentTool ? `龙虾正在调用 ${currentTool.name}` : '龙虾正在使用工具',
    [STATES.DONE]: '龙虾完成任务了！🎉',
    [STATES.ERROR]: '龙虾翻车了，点击查看错误',
    [STATES.TOKEN_EXHAUSTED]: 'Token 吃完了，龙虾饿晕了 💸',
  };
  return <p className="status-caption">{captions[status]}</p>;
}

function AchievementsPanel({ achievements }) {
  if (!achievements.length) return null;
  const found = ACHIEVEMENTS.filter(a => achievements.includes(a.id));
  return (
    <div className="achievements-panel">
      <h3 className="ach-title">成就</h3>
      <div className="ach-grid">
        {found.map(a => (
          <div key={a.id} className="ach-item" title={a.desc}>
            <span>{a.emoji}</span>
            <span>{a.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
