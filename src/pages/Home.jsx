import { useState, useEffect, useCallback, useRef } from 'react';
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
import { useMemeShare } from '../hooks/useMemeShare';
import { useCloudMemes } from '../hooks/useCloudMemes';
import { useSessionTracking } from '../hooks/useSessionTracking';
import { useStatusEffects } from '../hooks/useStatusEffects';
import {
  loadData, saveData, ACHIEVEMENTS, RARITY_COLORS,
  checkAchievements, checkCloudAchievements,
} from '../utils/storage';
import { loadAllAchievementsFromCloud } from '../utils/supabaseStorage';
import { loadAllAchievementDefs } from '../utils/skinStorage';
import { useProfileSync } from '../hooks/useProfileSync';
import { STORAGE_KEYS } from '../utils/constants';
import './Home.css';

const CONN_KEY = STORAGE_KEYS.GATEWAY_CONNECTION;

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

// Read ?gateway=...&token=... from URL (one-click connect from CLI)
function getUrlParams() {
  try {
    const p = new URLSearchParams(window.location.search);
    const gateway = p.get('gateway');
    const token = p.get('token');
    if (gateway && token) {
      const wsUrl = gateway.startsWith('ws') ? gateway : `ws://${gateway}`;
      return { url: wsUrl, token };
    }
  } catch { /* ignore */ }
  return null;
}

export default function Home() {
  const urlParams = getUrlParams();
  const saved = urlParams || loadConn();
  const [wsUrl, setWsUrl] = useState(saved?.url ?? '');
  const [token, setToken] = useState(saved?.token ?? '');
  const [showModal, setShowModal] = useState(!saved);
  const [localData, setLocalData] = useState(loadData);
  const [adminAchievementDefs, setAdminAchievementDefs] = useState([]);
  const { cloudMemes } = useCloudMemes();

  const adminAchDefsRef = useRef([]); // ref so setLocalData callbacks can access latest defs

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const { user, username } = useAuth();

  // ── Always-on Supabase sync when logged in ─────────────────────────────────
  useProfileSync(user, localData);
  const animatedSkin = useAnimatedSkin();
  const { affinity, addAffinity, isHappy } = useAffinity();
  const { notify } = useNotifications();
  const { status, connected, currentTool, errorLog, authError, stats } = useGateway(wsUrl, token);
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
      .then((data) => {
        if (data.length) {
          setAdminAchievementDefs(data);
          adminAchDefsRef.current = data;
        }
      })
      .catch(() => {
        // fallback to local IndexedDB
        loadAllAchievementDefs()
          .then((data) => {
            setAdminAchievementDefs(data);
            adminAchDefsRef.current = data;
          })
          .catch((err) => console.error('[Home] failed to load achievement defs:', err));
      });
  }, []);

  // ── Reload from localStorage after bidirectional sync pull ────────────────
  useEffect(() => {
    const onSync = () => setLocalData(loadData());
    window.addEventListener('openpat-sync', onSync);
    return () => window.removeEventListener('openpat-sync', onSync);
  }, []);

  // ── One-click connect from URL params (CLI generates this URL) ──────────────
  useEffect(() => {
    if (urlParams) {
      localStorage.setItem(CONN_KEY, JSON.stringify(urlParams));
      // Clean URL params so token isn't visible in address bar / history
      const clean = window.location.pathname + window.location.hash;
      window.history.replaceState(null, '', clean);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-detect OpenClaw gateway config ────────────────────────────────────
  useEffect(() => {
    if (urlParams) return; // already connected via URL params
    async function autoDetect() {
      const urls = ['/api/gateway-config', 'http://localhost:4242/lobster-config.json'];
      for (const url of urls) {
        try {
          const r = await fetch(url);
          const cfg = await r.json();
          if (cfg.autoDetected && cfg.wsUrl && cfg.token) {
            setWsUrl(cfg.wsUrl);
            setToken(cfg.token);
            localStorage.setItem(CONN_KEY, JSON.stringify({ url: cfg.wsUrl, token: cfg.token }));
            setShowModal(false);
            return;
          }
        } catch { /* try next */ }
      }
    }
    autoDetect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = useCallback((url, tok) => {
    setWsUrl(url);
    setToken(tok);
    localStorage.setItem(CONN_KEY, JSON.stringify({ url, token: tok }));
    setShowModal(false);
  }, []);

  // ── Session tracking (connect/disconnect, uptime, periodic checkpoint) ────
  useSessionTracking({
    connected, stats, errorLog, addAffinity,
    adminAchDefsRef, setLocalData,
  });

  // ── Status effects (task complete, error, night owl, supabase sync, title) ─
  useStatusEffects({
    status, displayStatus, connected, stats, user, currentTool,
    addAffinity, notify, adminAchDefsRef, setLocalData,
  });

  // ── Share ──────────────────────────────────────────────────────────────────
  const handleShareGenerated = useCallback(() => {
    setLocalData((prev) => {
      const withBuiltin = checkAchievements(prev, { didShare: true });
      const withAch = checkCloudAchievements(withBuiltin, adminAchDefsRef.current);
      saveData(withAch);
      return withAch;
    });
  }, []);

  // ── Meme share (shared hook) ───────────────────────────────────────────────
  const { handleMemeShare } = useMemeShare({
    cloudMemes,
    username,
    status: displayStatus,
    onGenerated: handleShareGenerated,
  });

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

      {authError && !showModal && (
        <AuthErrorBanner error={authError} onReconnect={() => setShowModal(true)} />
      )}

      {!connected && !authError && !showModal && (
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
      </main>
    </div>
  );
}

// ─── Auth error banner ────────────────────────────────────────────────────────
const DEVICE_AUTH_HINTS = {
  DEVICE_AUTH_NONCE_REQUIRED:       '设备认证失败：未提供 nonce。请更新 OpenPat 或在 gateway 配置中设置 gateway.controlUi.allowInsecureAuth=true',
  DEVICE_AUTH_NONCE_MISMATCH:       '设备 nonce 不匹配，请重新连接',
  DEVICE_AUTH_SIGNATURE_INVALID:    '设备签名无效。请在 gateway 配置中设置 gateway.controlUi.allowInsecureAuth=true 或联系支持',
  DEVICE_AUTH_SIGNATURE_EXPIRED:    '设备签名已过期，请重新连接',
  AUTH_TOKEN_MISMATCH:              'Token 不匹配，请检查 ~/.openclaw/openclaw.json 中的 gateway.auth.token',
  DEVICE_AUTH_DEVICE_ID_MISMATCH:   '设备身份不匹配，已自动清除旧密钥并重试。如仍失败，请清除浏览器 localStorage 后刷新',
  CONTROL_UI_ORIGIN_NOT_ALLOWED:    'Origin 未被允许。请运行 npx openpat（会自动配置），或手动在 ~/.openclaw/openclaw.json 的 gateway.controlUi.allowedOrigins 中添加本站地址',
};

function AuthErrorBanner({ error, onReconnect }) {
  const friendly = DEVICE_AUTH_HINTS[error.code] ?? error.detail ?? '认证失败，请检查 Token';
  const isOriginError = error.code === 'CONTROL_UI_ORIGIN_NOT_ALLOWED';
  const isDeviceError = error.code?.startsWith('DEVICE_AUTH');
  return (
    <div className="auth-error-banner">
      <span className="auth-error-icon">🔑</span>
      <div className="auth-error-body">
        <strong>连接认证失败</strong>
        <p>{friendly}</p>
        {isDeviceError && (
          <code>openclaw config set gateway.controlUi.allowInsecureAuth true</code>
        )}
        {isOriginError && (
          <code>npx openpat</code>
        )}
      </div>
      <button className="auth-error-btn" onClick={onReconnect}>重新配置</button>
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
