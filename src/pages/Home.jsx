import { useState, useEffect, useCallback, useRef } from 'react';
import LobsterSVG from '../components/LobsterSVG';
import StatsPanel from '../components/StatsPanel';
import LobsterReport from '../components/LobsterReport';
import ConnectModal from '../components/ConnectModal';
import ShareButton from '../components/ShareButton';
import GifButton from '../components/GifButton';
import LevelProgress from '../components/LevelProgress';
import SkinSelector from '../components/SkinSelector';
import AchievementToast, { useAchievementToast } from '../components/AchievementToast';
import DemoModeBanner from '../components/DemoModeBanner';
import { triggerConfetti } from '../components/Confetti';
import { useGateway, STATES } from '../hooks/useGateway';
import { useAuth } from '../hooks/useAuth';
import { useSkins } from '../hooks/useSkins';
import { useNotifications } from '../hooks/useNotifications';
import { useDynamicFavicon } from '../hooks/useDynamicFavicon';
import { useDemoMode } from '../hooks/useDemoMode';
import { useCloudSkins } from '../hooks/useCloudSkins';
import {
  loadData, saveData, ACHIEVEMENTS, RARITY_COLORS,
  onGatewayConnect, tickUptimeCheck, recordError, checkNoErrorWeek,
  checkAchievements,
} from '../utils/storage';
import { saveSession } from '../utils/sessionHistory';
import { supabase, hasSupabase } from '../utils/supabase';
import './Home.css';

const CONN_KEY = 'openpat-connection';

function loadConn() {
  try { return JSON.parse(localStorage.getItem(CONN_KEY) || 'null'); }
  catch { return null; }
}

export default function Home() {
  const saved = loadConn();
  const [wsUrl, setWsUrl] = useState(saved?.url || '');
  const [token, setToken] = useState(saved?.token || '');
  const [showModal, setShowModal] = useState(!saved);
  const [localData, setLocalData] = useState(loadData);
  const sessionStartRef = useRef(null);
  const prevConnected = useRef(false);
  const prevStatus = useRef(null);

  const { user, username } = useAuth();
  const { activeSkin, activeSkinId, selectSkin, skinStyle, setOwnedIds } = useSkins();
  const { notify } = useNotifications();
  const { status, connected, currentTool, errorLog, stats } = useGateway(wsUrl, token);

  const { demoStatus, demoTool, demoStats } = useDemoMode(!connected);
  const displayStatus = connected ? status : demoStatus;
  const displayTool = connected ? currentTool : demoTool;
  const displayStats = connected ? stats : demoStats;

  useDynamicFavicon(displayStatus);
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

  // Track session start/end
  useEffect(() => {
    if (connected && !prevConnected.current) {
      sessionStartRef.current = Date.now();
      setLocalData(prev => {
        const updated = onGatewayConnect(prev);
        const withAch = checkAchievements(updated, { activeSkinId });
        saveData(withAch);
        return withAch;
      });
    }
    if (!connected && prevConnected.current && sessionStartRef.current) {
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
        const withAch = checkAchievements(updated, { activeSkinId });
        saveData(withAch);
        return withAch;
      });
      sessionStartRef.current = null;
    }
    prevConnected.current = connected;
  }, [connected]); // eslint-disable-line

  // Uptime tick
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

  // Count completed tasks + achievements
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
        const withWeekCheck = checkNoErrorWeek(prev);
        const updated = {
          ...withWeekCheck,
          totalTasks: withWeekCheck.totalTasks + 1,
          _sessionErrors: 0,
          achievements: [...withWeekCheck.achievements, ...newAch.filter(id => !withWeekCheck.achievements.includes(id))],
        };
        const withAch = checkAchievements(updated, { activeSkinId });
        saveData(withAch);
        return withAch;
      });
      notify('🦞 任务完成！', '龙虾完成了一个任务 ✔');
    }
    if (status === STATES.ERROR && prev_ !== STATES.ERROR) {
      setLocalData(prev => {
        const updated = recordError({ ...prev, _sessionErrors: (prev._sessionErrors || 0) + 1 });
        return updated;
      });
      notify('🦞 龙虾翻车了', '不用担心，龙虾还在战斗');
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

  // Track active skin for achievements
  useEffect(() => {
    setLocalData(prev => {
      const withAch = checkAchievements(prev, { activeSkinId });
      if (withAch.achievements.length !== prev.achievements.length || withAch.usedSkinIds?.length !== prev.usedSkinIds?.length) {
        saveData(withAch);
        return withAch;
      }
      return prev;
    });
  }, [activeSkinId]);

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

  // Dynamic title
  useEffect(() => {
    const titles = {
      [STATES.ERROR]: '[Error] 龙虾翻车了 🦞',
      [STATES.TOOL_CALL]: '[Working] 龙虾正在忙 🦞⚡',
      [STATES.DONE]: '[Done] 龙虾搞定了！🦞✔',
    };
    document.title = titles[displayStatus] || 'OpenPat 🦞';
  }, [displayStatus]);

  const handleShareGenerated = useCallback(() => {
    setLocalData(prev => {
      const withAch = checkAchievements(prev, { didShare: true });
      saveData(withAch);
      return withAch;
    });
  }, []);

  return (
    <div className="home">
      {showModal && <ConnectModal onConnect={handleConnect} />}
      <AchievementToast toast={toast} onDismiss={dismiss} />
      {!connected && !showModal && (
        <DemoModeBanner onConnect={() => setShowModal(true)} />
      )}

      <main className="home-main">
        {/* Big lobster */}
        <div className="home-lobster-wrap" style={skinStyle}>
          <LobsterSVG status={displayStatus} fatness={1} onClick={() => {}} />
        </div>

        {/* Narration text */}
        <LobsterReport status={displayStatus} currentTool={displayTool} />

        {/* Compact stats bar */}
        <StatsPanel
          status={displayStatus}
          stats={displayStats}
          totalTasks={localData.totalTasks}
        />

        {/* Share buttons */}
        <div className="home-actions">
          <ShareButton
            stats={connected ? stats : demoStats}
            status={displayStatus}
            skinColors={activeSkin.colors}
            onGenerated={handleShareGenerated}
          />
          <GifButton stats={connected ? stats : demoStats} skinColors={activeSkin.colors} />
        </div>

        {/* Skin selector */}
        <SkinSelector
          activeSkinId={activeSkinId}
          onSelect={selectSkin}
        />

        {/* Level progress */}
        <LevelProgress totalTasks={localData.totalTasks} />

        {/* Achievements wall */}
        <AchievementsWall achievements={localData.achievements} />

        {/* Connect button */}
        <button className="btn-connect" onClick={() => setShowModal(true)}>
          {connected ? '🔄 切换连接' : '🔌 连接 Gateway'}
        </button>
      </main>
    </div>
  );
}

function AchievementsWall({ achievements }) {
  if (!achievements.length) return null;
  const found = ACHIEVEMENTS.filter(a => achievements.includes(a.id));
  return (
    <div className="achievements-wall">
      <h3 className="ach-title">成就 · {found.length}/{ACHIEVEMENTS.length}</h3>
      <div className="ach-grid">
        {found.map(a => {
          const colors = RARITY_COLORS[a.rarity] || RARITY_COLORS.common;
          return (
            <div
              key={a.id}
              className="ach-item"
              title={a.desc}
              style={{ background: colors.bg, borderColor: colors.border, color: colors.text }}
            >
              <span className="ach-emoji">{a.emoji}</span>
              <span className="ach-name">{a.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
