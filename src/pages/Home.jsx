import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import PetDisplay from '../components/PetDisplay';
import StatsPanel from '../components/StatsPanel';
import LobsterReport from '../components/LobsterReport';
import ConnectModal from '../components/ConnectModal';
import ShareButton from '../components/ShareButton';
import GifButton from '../components/GifButton';
import LevelProgress from '../components/LevelProgress';
import AchievementCeremony from '../components/AchievementCeremony';
import DemoModeBanner from '../components/DemoModeBanner';
import { triggerConfetti } from '../components/Confetti';
import { useGateway, STATES } from '../hooks/useGateway';
import { useAuth } from '../hooks/useAuth';
import { useAnimatedSkin } from '../hooks/useAnimatedSkin';
import { useAffinity } from '../hooks/useAffinity';
import { useNotifications } from '../hooks/useNotifications';
import { useDynamicFavicon } from '../hooks/useDynamicFavicon';
import { useDemoMode } from '../hooks/useDemoMode';
import {
  loadData, saveData, ACHIEVEMENTS, RARITY_COLORS,
  onGatewayConnect, tickUptimeCheck, recordError, checkNoErrorWeek,
  checkAchievements,
} from '../utils/storage';
import { loadAllAchievementDefs } from '../utils/skinStorage';
import { saveSession } from '../utils/sessionHistory';
import { supabase, hasSupabase } from '../utils/supabase';
import './Home.css';

const CONN_KEY = 'openpat-connection';

function loadConn() {
  try { return JSON.parse(localStorage.getItem(CONN_KEY) || 'null'); }
  catch { return null; }
}

// ─── Achievement ceremony hook ────────────────────────────────────────────────
// Watches the achievements array for newly unlocked entries.
// Admin-uploaded achievement defs take priority over built-ins for rich display.
function useCeremony(achievements, adminDefs) {
  const [ceremony, setCeremony] = useState(null);
  const prevRef = useRef(achievements);

  useEffect(() => {
    const newIds = achievements.filter((id) => !prevRef.current.includes(id));
    prevRef.current = achievements;
    if (!newIds.length) return;

    const id = newIds[0];
    const adminDef = adminDefs.find((d) => d.id === id && d.is_active);
    const builtin = ACHIEVEMENTS.find((a) => a.id === id);
    const def = adminDef ?? builtin;
    if (def) setCeremony(def);
  }, [achievements, adminDefs]);

  const dismiss = useCallback(() => setCeremony(null), []);
  return { ceremony, dismiss };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const saved = loadConn();
  const [wsUrl, setWsUrl] = useState(saved?.url ?? '');
  const [token, setToken] = useState(saved?.token ?? '');
  const [showModal, setShowModal] = useState(!saved);
  const [localData, setLocalData] = useState(loadData);
  const [adminAchievementDefs, setAdminAchievementDefs] = useState([]);

  const sessionStartRef = useRef(null);
  const prevConnected = useRef(false);
  const prevStatus = useRef(null);

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const { user, username } = useAuth();
  const animatedSkin = useAnimatedSkin();
  const { affinity, addAffinity, isHappy } = useAffinity();
  const { notify } = useNotifications();
  const { status, connected, currentTool, errorLog, stats } = useGateway(wsUrl, token);
  const { demoStatus, demoTool, demoStats } = useDemoMode(!connected);

  useDynamicFavicon(connected ? status : demoStatus);

  // ── Derived display values ─────────────────────────────────────────────────
  const displayStatus = connected ? status : demoStatus;
  const displayTool   = connected ? currentTool : demoTool;
  const displayStats  = connected ? stats : demoStats;

  const activeSkinId = animatedSkin.activeId;

  // Current pet frame for share card / GIF (first idle frame of active skin)
  const currentPetFrameUrl = animatedSkin.activeSkin?.frames?.idle?.[0] ?? null;
  const currentPetFrameUrls = animatedSkin.activeSkin?.frames?.idle ?? null;

  // ── Achievement ceremony ───────────────────────────────────────────────────
  const { ceremony, dismiss: dismissCeremony } = useCeremony(
    localData.achievements,
    adminAchievementDefs,
  );

  // ── Load admin achievement defs from IndexedDB ────────────────────────────
  useEffect(() => {
    loadAllAchievementDefs()
      .then(setAdminAchievementDefs)
      .catch((err) => console.error('[Home] failed to load achievement defs:', err));
  }, []);

  // ── Auto-detect CLI config ─────────────────────────────────────────────────
  useEffect(() => {
    if (saved) return;
    fetch('/lobster-config.json')
      .then((r) => r.json())
      .then((cfg) => {
        if (cfg.autoDetected && cfg.wsUrl && cfg.token) {
          setWsUrl(cfg.wsUrl);
          setToken(cfg.token);
          localStorage.setItem(CONN_KEY, JSON.stringify({ url: cfg.wsUrl, token: cfg.token }));
          setShowModal(false);
        }
      })
      .catch(() => { });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = useCallback((url, tok) => {
    setWsUrl(url);
    setToken(tok);
    localStorage.setItem(CONN_KEY, JSON.stringify({ url, token: tok }));
    setShowModal(false);
  }, []);

  // ── Session start / end ────────────────────────────────────────────────────
  useEffect(() => {
    if (connected && !prevConnected.current) {
      sessionStartRef.current = Date.now();
      addAffinity(10); // daily connect bonus
      setLocalData((prev) => {
        const updated = onGatewayConnect(prev);
        const withAch = checkAchievements(updated, {});
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
      setLocalData((prev) => {
        const today = new Date().toDateString();
        const base = prev.todayDate === today
          ? prev
          : { ...prev, todayTokensInput: 0, todayTokensOutput: 0, todayDate: today };
        const updated = {
          ...base,
          todayTokensInput:  base.todayTokensInput  + stats.tokensInput,
          todayTokensOutput: base.todayTokensOutput + stats.tokensOutput,
          totalToolCalls:    base.totalToolCalls    + stats.toolCalls,
          totalTokensInput:  base.totalTokensInput  + stats.tokensInput,
          totalTokensOutput: base.totalTokensOutput + stats.tokensOutput,
        };
        const withAch = checkAchievements(updated, {});
        saveData(withAch);
        return withAch;
      });
      sessionStartRef.current = null;
    }

    prevConnected.current = connected;
  }, [connected]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Uptime tick (marathon achievement) ────────────────────────────────────
  useEffect(() => {
    if (!connected) return;
    const id = setInterval(() => {
      setLocalData((prev) => {
        const { data: updated, newAch } = tickUptimeCheck(prev);
        if (newAch) saveData(updated);
        return updated;
      });
    }, 60_000);
    return () => clearInterval(id);
  }, [connected]);

  // ── Task complete / error ──────────────────────────────────────────────────
  useEffect(() => {
    if (status === prevStatus.current) return;
    const prevSt = prevStatus.current;
    prevStatus.current = status;

    if (status === STATES.DONE) {
      triggerConfetti();
      addAffinity(5);
      setLocalData((prev) => {
        const sessionErrors = prev._sessionErrors ?? 0;
        const extras = [];
        if (!prev.achievements.includes('perfect_task') && sessionErrors === 0) {
          extras.push('perfect_task');
        }
        const withWeek = checkNoErrorWeek(prev);
        const updated = {
          ...withWeek,
          totalTasks: withWeek.totalTasks + 1,
          _sessionErrors: 0,
          achievements: [
            ...withWeek.achievements,
            ...extras.filter((id) => !withWeek.achievements.includes(id)),
          ],
        };
        const withAch = checkAchievements(updated, {});
        saveData(withAch);
        return withAch;
      });
      notify('任务完成！', '伙伴完成了一个任务 ✔');
    }

    if (status === STATES.ERROR && prevSt !== STATES.ERROR) {
      setLocalData((prev) => {
        const updated = recordError({ ...prev, _sessionErrors: (prev._sessionErrors ?? 0) + 1 });
        return updated;
      });
      notify('遇到了问题', '不用担心，伙伴还在努力');
    }
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tool calls → saver achievement ────────────────────────────────────────
  useEffect(() => {
    setLocalData((prev) => {
      if (
        !prev.achievements.includes('saver') &&
        stats.toolCalls >= 50 &&
        stats.toolCallsSuccess === stats.toolCalls &&
        stats.tokensInput < 50_000
      ) {
        const updated = { ...prev, achievements: [...prev.achievements, 'saver'] };
        saveData(updated);
        return updated;
      }
      return prev;
    });
  }, [stats.toolCalls]);

  // ── Night owl ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!connected) return;
    const h = new Date().getHours();
    if (h >= 2 && h < 5) {
      setLocalData((prev) => {
        if (prev.achievements.includes('night_owl')) return prev;
        const updated = { ...prev, achievements: [...prev.achievements, 'night_owl'] };
        saveData(updated);
        return updated;
      });
    }
  }, [connected]);


  // ── Sync to Supabase ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!hasSupabase || !user || !connected) return;
    supabase.from('agent_status').upsert({
      user_id: user.id,
      status,
      current_tool: currentTool?.name ?? null,
      session_tokens: stats.tokensInput + stats.tokensOutput,
      session_tool_calls: stats.toolCalls,
      updated_at: new Date().toISOString(),
    });
  }, [status, user, connected, currentTool, stats]);

  // ── Dynamic title ──────────────────────────────────────────────────────────
  useEffect(() => {
    const titles = {
      [STATES.ERROR]:     '[Error] 出错了',
      [STATES.TOOL_CALL]: '[Working] 正在工作中 ⚡',
      [STATES.DONE]:      '[Done] 任务完成 ✔',
    };
    document.title = titles[displayStatus] ?? 'OpenPat 🦞';
  }, [displayStatus]);

  // ── Share ──────────────────────────────────────────────────────────────────
  const handleShareGenerated = useCallback(() => {
    setLocalData((prev) => {
      const withAch = checkAchievements(prev, { didShare: true });
      saveData(withAch);
      return withAch;
    });
  }, []);

  // ── Pet click → affinity ───────────────────────────────────────────────────
  const handlePetClick = useCallback(() => {
    addAffinity(2);
  }, [addAffinity]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="home">
      {showModal && (
        <ConnectModal
          onConnect={handleConnect}
          onSkip={() => setShowModal(false)}
        />
      )}

      {ceremony && (
        <AchievementCeremony
          achievement={ceremony}
          onClose={dismissCeremony}
        />
      )}

      {!connected && !showModal && (
        <DemoModeBanner onConnect={() => setShowModal(true)} />
      )}

      <main className="home-main">

        {/* ── Companion card: pet + report + affinity ── */}
        <div className="home-companion-card">
          <div className="home-lobster-wrap">
            <PetDisplay
              animatedSkin={animatedSkin.activeSkin}
              isHappy={isHappy}
              status={displayStatus}
              onClick={handlePetClick}
            />
          </div>
          <div className="home-companion-footer">
            <LobsterReport status={displayStatus} currentTool={displayTool} />
            {affinity > 0 && (
              <AffinityBar affinity={affinity} isHappy={isHappy} />
            )}
          </div>
        </div>

        {/* ── Stats ── */}
        <StatsPanel
          status={displayStatus}
          stats={displayStats}
          totalTasks={localData.totalTasks}
        />

        {/* ── Share actions ── */}
        <div className="home-actions">
          <ShareButton
            stats={connected ? stats : demoStats}
            status={displayStatus}
            skinId={activeSkinId}
            petFrameUrl={currentPetFrameUrl}
            onGenerated={handleShareGenerated}
          />
          <GifButton
            stats={connected ? stats : demoStats}
            skinColors={null}
            petFrameUrls={currentPetFrameUrls}
          />
        </div>

        {/* ── Level progress ── */}
        <LevelProgress totalTasks={localData.totalTasks} />

        {/* ── Achievements ── */}
        <AchievementsWall
          achievements={localData.achievements}
          adminDefs={adminAchievementDefs}
        />

        {/* ── Connect ── */}
        <button className="btn-connect" onClick={() => setShowModal(true)}>
          {connected ? '切换连接' : '连接 Gateway'}
        </button>

        {/* ── Feedback ── */}
        <Link to="/feedback" className="btn-feedback">
          💡 建议功能 · 查看路线图
        </Link>
      </main>
    </div>
  );
}

// ─── Affinity bar ─────────────────────────────────────────────────────────────
function AffinityBar({ affinity, isHappy }) {
  return (
    <div className="affinity-bar-wrap">
      <span className="affinity-label">
        {isHappy ? '😊' : '🦞'} 好感度
      </span>
      <div className="affinity-track">
        <div
          className={`affinity-fill${isHappy ? ' affinity-fill--happy' : ''}`}
          style={{ width: `${affinity}%` }}
        />
      </div>
      <span className="affinity-value">{affinity}</span>
    </div>
  );
}

// ─── Achievements wall ────────────────────────────────────────────────────────
// Admin-uploaded defs take priority for icon + name display.
function AchievementsWall({ achievements, adminDefs }) {
  if (!achievements.length) return null;

  const unlocked = achievements.map((id) => {
    const adminDef = adminDefs.find((d) => d.id === id);
    const builtin  = ACHIEVEMENTS.find((a) => a.id === id);
    return adminDef ?? builtin;
  }).filter(Boolean);

  return (
    <div className="achievements-wall">
      <h3 className="ach-title">
        成就 · {unlocked.length}/{ACHIEVEMENTS.length}
      </h3>
      <div className="ach-grid">
        {unlocked.map((a) => {
          const colors = RARITY_COLORS[a.rarity] ?? RARITY_COLORS.common;
          return (
            <div
              key={a.id}
              className="ach-item"
              title={a.desc}
              style={{
                background: colors.bg,
                borderColor: colors.border,
                color: colors.text,
              }}
            >
              {a.icon_unlocked ? (
                <img src={a.icon_unlocked} alt={a.name} className="ach-icon-img" />
              ) : (
                <span className="ach-emoji">{a.emoji}</span>
              )}
              <span className="ach-name">{a.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
