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
import { loadAllMemesFromCloud, loadAllAchievementsFromCloud } from '../utils/supabaseStorage';
import { saveSession } from '../utils/sessionHistory';
import { supabase, hasSupabase } from '../utils/supabase';
import { useProfileSync } from '../hooks/useProfileSync';
import { generateMemeShareCard } from '../utils/shareCard';
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
  const [cloudMemes, setCloudMemes] = useState({});  // { [state]: { image_url, caption } }

  const sessionStartRef = useRef(null);
  const prevConnected = useRef(false);
  const prevStatus = useRef(null);

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const { user, username } = useAuth();

  // ── Always-on Supabase sync when logged in ─────────────────────────────────
  useProfileSync(user, localData);
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

  // ── Load admin achievement defs (cloud first, IndexedDB fallback) ─────────
  useEffect(() => {
    loadAllAchievementsFromCloud()
      .then((data) => { if (data.length) setAdminAchievementDefs(data); })
      .catch(() => {
        // fallback to local IndexedDB
        loadAllAchievementDefs()
          .then(setAdminAchievementDefs)
          .catch((err) => console.error('[Home] failed to load achievement defs:', err));
      });
  }, []);

  // ── Load cloud memes ───────────────────────────────────────────────────────
  useEffect(() => {
    loadAllMemesFromCloud()
      .then(setCloudMemes)
      .catch((err) => console.error('[Home] failed to load memes:', err));
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

  // ── Meme share: current state's meme image + caption ──────────────────────
  const handleMemeShare = useCallback(async () => {
    const stateKey = displayStatus ?? 'idle';
    const meme = cloudMemes[stateKey] ?? cloudMemes['idle'] ?? null;
    const DEFAULT_CAPTIONS = {
      idle: '摸鱼中。不打扰它。',
      thinking: '它在思考，就像你不会的那些事。',
      tool_call: '正在调用工具。这活儿你不想自己做，它替你扛着。',
      done: '搞定了。下一个。',
      error: '翻车了，但还在爬。',
      offline: '下线了。明天见。',
      token_exhausted: '没 Token 了。账单来了吗？',
      happy: '今天心情不错，继续干。',
    };
    const caption = meme?.caption || DEFAULT_CAPTIONS[stateKey] || '我的 Agent 正在工作';
    try {
      const dataUrl = await generateMemeShareCard({
        memeImageUrl: meme?.image_url ?? null,
        caption,
        username: username ?? 'agent',
        profileUrl: username ? `openp.at/u/${username}` : 'openp.at',
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `openpat-meme-${stateKey}.png`;
      a.click();
      handleShareGenerated();
    } catch (err) {
      console.error('梗图分享失败:', err);
    }
  }, [displayStatus, cloudMemes, username, handleShareGenerated]);

  // ── Status bubble (click reaction) ────────────────────────────────────────
  const [bubble, setBubble] = useState(null);
  const bubbleTimerRef = useRef(null);

  const CLICK_BUBBLES = {
    [STATES.IDLE]:            ['别戳我，摸鱼中', '你再戳我我就开始工作了', '我在冥想，请勿打扰'],
    [STATES.THINKING]:        ['别催！在想了在想了！', '脑子已经红温了，稍等', '要想出好答案是需要时间的'],
    [STATES.TOOL_CALL]:       ['别分心！干活呢！', '这么忙还来戳我？', '工具还在跑，你等一下'],
    [STATES.DONE]:            ['嘿嘿，厉害吧', '下一个任务来吧，我不怕', '给我点个赞谢谢'],
    [STATES.ERROR]:           ['别踢我…已经够惨了', '我知道翻车了，但还在', '轻点，好痛的'],
    [STATES.OFFLINE]:         ['嘿，我在睡觉', '有事明天说', 'zzZ…什么事？'],
    [STATES.TOKEN_EXHAUSTED]: ['饿了…快充值', '不是不想干，是没粮了', '账单来了？'],
  };

  // ── Pet click → affinity + bubble ─────────────────────────────────────────
  const handlePetClick = useCallback(() => {
    addAffinity(2);
    const pool = CLICK_BUBBLES[displayStatus] ?? CLICK_BUBBLES[STATES.IDLE];
    const text = pool[Math.floor(Math.random() * pool.length)];
    setBubble(text);
    clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = setTimeout(() => setBubble(null), 2500);
  }, [addAffinity, displayStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Token exhausted feed ───────────────────────────────────────────────────
  const [fedCount, setFedCount] = useState(0);
  const handleFeed = useCallback(() => {
    addAffinity(5);
    triggerConfetti();
    setFedCount((n) => n + 1);
    notify('喂食成功！', '它感受到了你的关爱，但还是没 Token ☕');
  }, [addAffinity, notify]);

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
            {/* Speech bubble on click */}
            {bubble && (
              <div className="pet-bubble" key={bubble + Date.now()}>
                {bubble}
              </div>
            )}
            <PetDisplay
              animatedSkin={animatedSkin.activeSkin}
              isHappy={isHappy}
              status={displayStatus}
              onClick={handlePetClick}
            />
            {/* Token exhausted: feed button */}
            {displayStatus === STATES.TOKEN_EXHAUSTED && (
              <button className="btn-feed" onClick={handleFeed}>
                🍤 投喂{fedCount > 0 ? ` ×${fedCount}` : ''}
              </button>
            )}
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
          <button className="btn-meme-share" onClick={handleMemeShare} title="用状态梗图分享">
            😂 梗图分享
          </button>
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
          💡 给我们反馈
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
  const unlocked = achievements.map((id) => {
    const adminDef = adminDefs.find((d) => d.id === id);
    const builtin  = ACHIEVEMENTS.find((a) => a.id === id);
    return adminDef ?? builtin;
  }).filter(Boolean);

  return (
    <div className="achievements-wall">
      <div className="ach-title-row">
        <h3 className="ach-title">成就 · {unlocked.length}/{ACHIEVEMENTS.length}</h3>
        <Link to="/achievements" className="ach-view-all">查看全部 →</Link>
      </div>
      {unlocked.length === 0 ? (
        <p className="ach-empty">完成任务后解锁成就</p>
      ) : (
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
      )}
    </div>
  );
}
