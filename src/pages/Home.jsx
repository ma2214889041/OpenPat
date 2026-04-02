import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import PetDisplay from '../components/PetDisplay';
import StatsPanel from '../components/StatsPanel';
import PetReport from '../components/PetReport';
import ConnectModal from '../components/ConnectModal';
import ShareButton from '../components/ShareButton';
import GifButton from '../components/GifButton';
import LevelProgress from '../components/LevelProgress';
import AchievementCeremony from '../components/AchievementCeremony';
import PomodoroTimer from '../components/PomodoroTimer';
import TodoPanel from '../components/TodoPanel';
import OnboardingModal from '../components/OnboardingModal';
import TimeGreeting from '../components/TimeGreeting';
import { triggerConfetti } from '../components/Confetti';
import { useGateway, STATES } from '../hooks/useGateway';
import { useAuth } from '../hooks/useAuth';
import { useAnimatedSkin } from '../hooks/useAnimatedSkin';
import { useAffinity } from '../hooks/useAffinity';
import { useNotifications } from '../hooks/useNotifications';
import { useDynamicFavicon } from '../hooks/useDynamicFavicon';
import { useMemeShare } from '../hooks/useMemeShare';
import { useCloudMemes } from '../hooks/useCloudMemes';
import { useSessionTracking } from '../hooks/useSessionTracking';
import { useStatusEffects } from '../hooks/useStatusEffects';
import { usePomodoro } from '../hooks/usePomodoro';
import { useTodoList } from '../hooks/useTodoList';
import { useTimeAwareness } from '../hooks/useTimeAwareness';
import { useCompanion } from '../hooks/useCompanion';
import { useActivity } from '../hooks/useActivity';
import { useProactiveChat } from '../hooks/useProactiveChat';
import { usePersonality, RELATIONSHIP_STAGES } from '../hooks/usePersonality';
import ActivitySelector from '../components/ActivitySelector';
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

// ─── URL params for one-click agent connect ─────────────────────────────────
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

// ═══════════════════════════════════════════════════════════════════════════════
// Home — standalone office companion with optional agent enhancement
// ═══════════════════════════════════════════════════════════════════════════════

export default function Home() {
  const urlParams = getUrlParams();
  const saved = urlParams || loadConn();
  const [wsUrl, setWsUrl] = useState(saved?.url ?? '');
  const [token, setToken] = useState(saved?.token ?? '');
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [localData, setLocalData] = useState(loadData);
  const [adminAchievementDefs, setAdminAchievementDefs] = useState([]);
  const { cloudMemes } = useCloudMemes();
  const [taskFlash, setTaskFlash] = useState(false);
  const taskFlashTimer = useRef(null);

  const adminAchDefsRef = useRef([]);

  // ── Core hooks ──────────────────────────────────────────────────────────────
  const { user, username } = useAuth();
  useProfileSync(user, localData);
  const animatedSkin = useAnimatedSkin();
  const { affinity, addAffinity, isHappy } = useAffinity();
  const { notify } = useNotifications();

  // ── Personality (behavior tracking + evolving dialogue) ─────────────────────
  const personality = usePersonality();

  // ── Agent (optional) ──────────────────────────────────────────────────────
  const { status: gwStatus, connected: gwConnected, currentTool, errorLog, authError, stats: gwStats } = useGateway(wsUrl, token);

  // ── Pomodoro timer ──────────────────────────────────────────────────────────
  const pomodoro = usePomodoro();

  // ── Todo list ───────────────────────────────────────────────────────────────
  const todoList = useTodoList();

  // ── Companion orchestrator ──────────────────────────────────────────────────
  const companion = useCompanion({
    pomodoroPhase: pomodoro.phase,
    paused: pomodoro.paused,
    gatewayConnected: gwConnected,
    gatewayStatus: gwStatus,
    timeMood: useTimeAwareness(undefined).mood,  // temp: we set petName below
    taskFlash,
  });

  const timeInfo = useTimeAwareness(companion.petName);

  // ── Activity (idle animations) ──────────────────────────────────────────────
  const idleAnim = useActivity(pomodoro.totalPomodoros);

  // Track idle animation in personality
  const prevAnimRef = useRef(idleAnim.currentAnim);
  useEffect(() => {
    if (idleAnim.currentAnim !== prevAnimRef.current) {
      personality.recordIdleAnim(idleAnim.currentAnim);
      prevAnimRef.current = idleAnim.currentAnim;
    }
  }, [idleAnim.currentAnim]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-derive display status with correct time mood
  const { displayStatus, source } = (() => {
    if (gwConnected && gwStatus && gwStatus !== STATES.IDLE) {
      return { displayStatus: gwStatus, source: 'agent' };
    }
    if (taskFlash) {
      return { displayStatus: STATES.TOOL_CALL, source: 'pomodoro' };
    }
    if (pomodoro.phase !== 'idle') {
      const map = { working: STATES.THINKING, shortBreak: STATES.DONE, longBreak: STATES.DONE };
      return { displayStatus: pomodoro.paused ? STATES.IDLE : (map[pomodoro.phase] || STATES.IDLE), source: 'pomodoro' };
    }
    if (timeInfo.mood === 'asleep') {
      return { displayStatus: STATES.OFFLINE, source: 'ambient' };
    }
    return { displayStatus: STATES.IDLE, source: 'ambient' };
  })();

  // ── Proactive chat (personality-driven) ─────────────────────────────────────
  const proactiveChat = useProactiveChat({
    petName: companion.petName,
    pomodoroPhase: pomodoro.phase,
    completedPomodoros: pomodoro.completedPomodoros,
    personality: personality.profile,
    displayStatus,
  });

  const displayTool   = source === 'agent' ? currentTool : null;
  const displayStats  = source === 'agent' ? gwStats : { tokensInput: 0, tokensOutput: 0, toolCalls: 0, toolCallsSuccess: 0, uptime: 0, sessionStart: null, modelName: null };

  useDynamicFavicon(displayStatus);

  const activeSkinId = animatedSkin.activeId;
  const currentPetFrameUrl = animatedSkin.activeSkin?.frames?.idle?.[0] ?? null;
  const currentPetFrameUrls = animatedSkin.activeSkin?.frames?.idle ?? null;

  // ── Achievement ceremony ───────────────────────────────────────────────────
  const { ceremony, dismiss: dismissCeremony } = useCeremony(
    localData.achievements,
    adminAchievementDefs,
  );

  // ── Load admin achievement defs ───────────────────────────────────────────
  useEffect(() => {
    loadAllAchievementsFromCloud()
      .then((data) => {
        if (data.length) { setAdminAchievementDefs(data); adminAchDefsRef.current = data; }
      })
      .catch(() => {
        loadAllAchievementDefs()
          .then((data) => { setAdminAchievementDefs(data); adminAchDefsRef.current = data; })
          .catch(() => {});
      });
  }, []);

  // ── Reload from localStorage after sync ─────────────────────────────────────
  useEffect(() => {
    const onSync = () => setLocalData(loadData());
    window.addEventListener('openpat-sync', onSync);
    return () => window.removeEventListener('openpat-sync', onSync);
  }, []);

  // ── One-click connect from URL params ──────────────────────────────────────
  useEffect(() => {
    if (urlParams) {
      localStorage.setItem(CONN_KEY, JSON.stringify(urlParams));
      const clean = window.location.pathname + window.location.hash;
      window.history.replaceState(null, '', clean);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-detect gateway ───────────────────────────────────────────
  useEffect(() => {
    if (urlParams) return;
    async function autoDetect() {
      const urls = ['/api/gateway-config', 'http://localhost:4242/pet-config.json'];
      for (const url of urls) {
        try {
          const r = await fetch(url);
          const cfg = await r.json();
          if (cfg.autoDetected && cfg.wsUrl && cfg.token) {
            setWsUrl(cfg.wsUrl);
            setToken(cfg.token);
            localStorage.setItem(CONN_KEY, JSON.stringify({ url: cfg.wsUrl, token: cfg.token }));
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
    setShowGatewayModal(false);
  }, []);

  // ── Sync Agent data to personality ──────────────────────────────────────────
  useEffect(() => {
    if (gwConnected && gwStats.toolCalls > 0) {
      personality.syncAgentData({
        totalTasks: localData.totalTasks,
        totalTokens: (localData.totalTokensInput || 0) + (localData.totalTokensOutput || 0),
        totalToolCalls: localData.totalToolCalls,
        errorCount: localData.weeklyErrors,
      });
    }
  }, [gwConnected, gwStats.toolCalls]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Session tracking (agent sessions) ──────────────────────────────────
  useSessionTracking({
    connected: gwConnected, stats: gwStats, errorLog, addAffinity,
    adminAchDefsRef, setLocalData,
  });

  // ── Status effects (agent task complete, error, night owl, etc.) ────────
  useStatusEffects({
    status: gwStatus, displayStatus, connected: gwConnected, stats: gwStats, user, currentTool,
    addAffinity, notify, adminAchDefsRef, setLocalData,
  });

  // ── Pomodoro completion → achievements + affinity + personality ──────────
  useEffect(() => {
    pomodoro.onCompleteRef.current = () => {
      triggerConfetti();
      addAffinity(8);
      notify('番茄钟完成！', '休息一下吧～');
      personality.recordWorkEnd(pomodoro.settings.workMinutes || 25);

      // Record active day
      const today = new Date().toDateString();
      setLocalData((prev) => {
        const activeDays = prev.activeDays || [];
        const updatedDays = activeDays.includes(today) ? activeDays : [...activeDays, today];

        const newStreak = (prev.pomodoroStreak || 0) + 1;
        const updated = {
          ...prev,
          totalTasks: prev.totalTasks + 1,
          totalPomodoros: (prev.totalPomodoros || 0) + 1,
          totalFocusMinutes: (prev.totalFocusMinutes || 0) + (pomodoro.settings.workMinutes || 25),
          pomodoroStreak: newStreak,
          bestPomodoroStreak: Math.max(prev.bestPomodoroStreak || 0, newStreak),
          activeDays: updatedDays,
        };
        const withBuiltin = checkAchievements(updated, {});
        const withAch = checkCloudAchievements(withBuiltin, adminAchDefsRef.current);
        saveData(withAch);
        return withAch;
      });
    };
  }, [pomodoro.settings.workMinutes]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track work start in personality
  const prevPhase = useRef(pomodoro.phase);
  useEffect(() => {
    if (prevPhase.current === 'idle' && pomodoro.phase === 'working') {
      personality.recordWorkStart();
    }
    if (prevPhase.current === 'working' && pomodoro.phase === 'idle') {
      // Skipped — reset streak
      setLocalData((prev) => {
        const updated = { ...prev, pomodoroStreak: 0 };
        saveData(updated);
        return updated;
      });
    }
    prevPhase.current = pomodoro.phase;
  }, [pomodoro.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Todo completion → brief TOOL_CALL flash + achievements ────────────────
  const handleTodoToggle = useCallback((id) => {
    const justCompleted = todoList.toggleTodo(id);
    if (justCompleted) {
      addAffinity(3);
      // Brief TOOL_CALL animation flash
      setTaskFlash(true);
      clearTimeout(taskFlashTimer.current);
      taskFlashTimer.current = setTimeout(() => setTaskFlash(false), 1500);
      // Proactive chat reaction
      const taskReactions = ['划掉了！爽不爽！', '又少了一个任务！', '完成！继续保持！', '这个也搞定了！'];
      proactiveChat.showMessage(taskReactions[Math.floor(Math.random() * taskReactions.length)]);

      setLocalData((prev) => {
        const today = new Date().toDateString();
        const activeDays = prev.activeDays || [];
        const updatedDays = activeDays.includes(today) ? activeDays : [...activeDays, today];
        const updated = {
          ...prev,
          totalTasks: prev.totalTasks + 1,
          totalTodosCompleted: (prev.totalTodosCompleted || 0) + 1,
          activeDays: updatedDays,
        };
        const withBuiltin = checkAchievements(updated, {});
        const withAch = checkCloudAchievements(withBuiltin, adminAchDefsRef.current);
        saveData(withAch);
        return withAch;
      });
    }
  }, [todoList.toggleTodo, addAffinity]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Onboarding ────────────────────────────────────────────────────────────
  const handleOnboardingComplete = useCallback((name) => {
    companion.renamePet(name);
    companion.setOnboarded();
    addAffinity(10);

    // Mark active day
    const today = new Date().toDateString();
    setLocalData((prev) => {
      const activeDays = prev.activeDays || [];
      const updatedDays = activeDays.includes(today) ? activeDays : [...activeDays, today];
      const updated = { ...prev, activeDays: updatedDays };
      saveData(updated);
      return updated;
    });
  }, [companion.renamePet, companion.setOnboarded, addAffinity]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Share ─────────────────────────────────────────────────────────────────
  const handleShareGenerated = useCallback(() => {
    setLocalData((prev) => {
      const withBuiltin = checkAchievements(prev, { didShare: true });
      const withAch = checkCloudAchievements(withBuiltin, adminAchDefsRef.current);
      saveData(withAch);
      return withAch;
    });
  }, []);

  const { handleMemeShare } = useMemeShare({
    cloudMemes,
    username,
    status: displayStatus,
    onGenerated: handleShareGenerated,
  });

  // ── Speech bubble (click + proactive) ──────────────────────────────────
  const [bubble, setBubble] = useState(null);
  const bubbleTimerRef = useRef(null);

  // Show proactive messages as bubbles
  useEffect(() => {
    if (proactiveChat.message) {
      setBubble(proactiveChat.message);
      clearTimeout(bubbleTimerRef.current);
      bubbleTimerRef.current = setTimeout(() => setBubble(null), 4500);
    }
  }, [proactiveChat.message]);

  const CLICK_BUBBLES = {
    [STATES.IDLE]:            ['戳我干嘛~', '要不要开个番茄钟？', '我在等你发号施令', '别闲着，开始干活！'],
    [STATES.THINKING]:        ['嘘！别打扰！在专注呢！', '你也在认真工作对吧？', '加油！还有几分钟！', '别分心！'],
    [STATES.TOOL_CALL]:       ['又完成一个！', '划掉的感觉真好！', '继续继续！'],
    [STATES.DONE]:            ['休息一下吧！', '去喝杯水！', '站起来活动活动！', '你真棒！'],
    [STATES.ERROR]:           ['没事没事，休息下就好', '别太累了...', '要不要休息一会儿？'],
    [STATES.OFFLINE]:         ['嘿，我在睡觉呢', 'zzZ...什么事？', '太晚了，你也该休息了'],
    [STATES.TOKEN_EXHAUSTED]: ['饿了…快投喂', '没力气了...', '需要能量补给！'],
  };

  const handlePetClick = useCallback(() => {
    addAffinity(2);
    personality.recordClick();
    const pool = CLICK_BUBBLES[displayStatus] ?? CLICK_BUBBLES[STATES.IDLE];
    const text = pool[Math.floor(Math.random() * pool.length)];
    setBubble(text);
    clearTimeout(bubbleTimerRef.current);
    bubbleTimerRef.current = setTimeout(() => setBubble(null), 2500);
  }, [addAffinity, displayStatus, personality.recordClick]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Feed button ─────────────────────────────────────────────────────────
  const [fedCount, setFedCount] = useState(0);
  const handleFeed = useCallback(() => {
    addAffinity(5);
    triggerConfetti();
    setFedCount((n) => n + 1);
    notify('投喂成功！', `${companion.petName} 感受到了你的关爱`);
  }, [addAffinity, notify, companion.petName]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="home">
      {/* Onboarding (first visit) */}
      {companion.isFirstVisit && (
        <OnboardingModal
          defaultName={companion.petName}
          onComplete={handleOnboardingComplete}
        />
      )}

      {/* Gateway connect modal (optional) */}
      {showGatewayModal && (
        <ConnectModal
          onConnect={handleConnect}
          onSkip={() => setShowGatewayModal(false)}
        />
      )}

      {/* Achievement ceremony */}
      {ceremony && (
        <AchievementCeremony
          achievement={ceremony}
          onClose={dismissCeremony}
        />
      )}

      <main className="home-main">

        {/* ── Time greeting + relationship stage ── */}
        <TimeGreeting
          petName={companion.petName}
          greeting={timeInfo.greeting}
          mood={timeInfo.mood}
          relationshipStage={personality.stage}
          totalDays={personality.profile.totalDays}
        />

        {/* ── Companion card: pet + timer + report ── */}
        <div className="home-companion-card">
          <div className="home-pet-wrap">
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
              idleActivity={displayStatus === STATES.IDLE ? idleAnim.animDef.svgClass : ''}
            />
            {displayStatus === STATES.TOKEN_EXHAUSTED && (
              <button className="btn-feed" onClick={handleFeed}>
                🍤 投喂{fedCount > 0 ? ` ×${fedCount}` : ''}
              </button>
            )}
          </div>

          {/* Pomodoro timer */}
          <PomodoroTimer
            phase={pomodoro.phase}
            timeLeft={pomodoro.timeLeft}
            totalSeconds={pomodoro.totalSeconds}
            paused={pomodoro.paused}
            completedPomodoros={pomodoro.completedPomodoros}
            onStart={pomodoro.start}
            onPause={pomodoro.pause}
            onResume={pomodoro.resume}
            onSkip={pomodoro.skip}
          />

          <div className="home-companion-footer">
            <PetReport
              status={displayStatus}
              currentTool={displayTool}
              source={source}
              idleActivity={displayStatus === STATES.IDLE ? idleAnim.animDef.svgClass : ''}
            />
            {affinity > 0 && (
              <AffinityBar affinity={affinity} isHappy={isHappy} />
            )}
          </div>
        </div>

        {/* ── Activity selector (idle animations) ── */}
        <ActivitySelector
          selected={idleAnim.selected}
          currentAnim={idleAnim.currentAnim}
          totalPomodoros={pomodoro.totalPomodoros}
          onSelect={idleAnim.setActivity}
        />

        {/* ── Todo list ── */}
        <TodoPanel
          todos={todoList.todos}
          onAdd={todoList.addTodo}
          onToggle={handleTodoToggle}
          onRemove={todoList.removeTodo}
          onClearCompleted={todoList.clearCompleted}
          pendingCount={todoList.pendingCount}
          doneCount={todoList.doneCount}
        />

        {/* ── Stats ── */}
        <StatsPanel
          status={displayStatus}
          stats={displayStats}
          totalTasks={localData.totalTasks}
          source={source}
          pomodoroData={{
            completedPomodoros: pomodoro.completedPomodoros,
            totalPomodoros: pomodoro.totalPomodoros,
            todayFocusMinutes: pomodoro.todayFocusMinutes,
            totalFocusMinutes: pomodoro.totalFocusMinutes,
            todayTodosCompleted: todoList.todayCompleted,
          }}
        />

        {/* ── Share actions ── */}
        <div className="home-actions">
          <button className="btn-meme-share" onClick={handleMemeShare} title="用状态梗图分享">
            😂 梗图
          </button>
          <ShareButton
            stats={displayStats}
            status={displayStatus}
            skinId={activeSkinId}
            petFrameUrl={currentPetFrameUrl}
            onGenerated={handleShareGenerated}
          />
          <GifButton
            stats={displayStats}
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

        {/* ── Agent (optional, unobtrusive) ── */}
        <button
          className={`btn-agent-toggle ${gwConnected ? 'btn-agent-toggle--connected' : ''}`}
          onClick={() => setShowGatewayModal(true)}
        >
          {gwConnected ? (
            <><span className="agent-dot agent-dot--on" /> Agent 已连接</>
          ) : (
            '🔗 连接 Agent（可选）'
          )}
        </button>
      </main>
    </div>
  );
}

// ─── Affinity bar ─────────────────────────────────────────────────────────────
function AffinityBar({ affinity, isHappy }) {
  return (
    <div className="affinity-bar-wrap">
      <span className="affinity-label">
        {isHappy ? '😊' : '🐾'} 好感度
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
        <p className="ach-empty">完成番茄钟或任务后解锁成就</p>
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
