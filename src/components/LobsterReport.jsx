import { useState, useEffect, useRef } from 'react';
import { STATES } from '../hooks/useGateway';
import './LobsterReport.css';

const REPORTS = {
  [STATES.OFFLINE]: [
    '龙虾盖着小被子打呼噜 zzZ 😴',
    '龙虾已经下班了，明天见 🌙',
    '龙虾钻进壳里睡着了 💤',
  ],
  [STATES.IDLE]: [
    '龙虾正在悠闲地泡澡，等你派任务 🛁',
    '龙虾无聊地摇着钳子，随时待命 🦞',
    '龙虾吃着小零食，等待指令中... 🍿',
  ],
  [STATES.THINKING]: [
    '龙虾皱着眉头在想问题...给它点时间 🤔',
    '龙虾的两根触角在高速旋转，思考中 🌀',
    '龙虾正在召唤神力，不要打扰它 🧠',
  ],
  [STATES.TOOL_CALL]: [
    '龙虾举着钳子在忙！全力以赴中 ⚡',
    '龙虾加速了！钳子都冒烟了 🔥',
    '龙虾进入战斗状态，谁也挡不住 💪',
  ],
  [STATES.DONE]: [
    '龙虾搞定了！得意地甩了甩触角 🎉',
    '龙虾任务完成，正在庆祝 🥳',
    '龙虾赢了！比心比心比心 ❤️',
  ],
  [STATES.ERROR]: [
    '龙虾翻车了，趴在地上冒泡泡 💫',
    '龙虾遇到了麻烦，正在努力爬起来 😵',
    '龙虾翻车现场，但它不会放弃的 🤕',
  ],
  [STATES.TOKEN_EXHAUSTED]: [
    '龙虾饿晕了...Token 吃光了 💸',
    '龙虾的粮仓空了，需要补给 🪙',
    '龙虾已经断粮，无力回天 😭',
  ],
};

export default function LobsterReport({ status, currentTool }) {
  const [text, setText] = useState('');
  const prevStatus = useRef(null);
  const indexRef = useRef(0);

  useEffect(() => {
    const variants = REPORTS[status] || REPORTS[STATES.OFFLINE];

    if (status !== prevStatus.current) {
      // Pick a different index than last time
      const newIndex = (indexRef.current + 1) % variants.length;
      indexRef.current = newIndex;
      prevStatus.current = status;
    }

    let report = variants[indexRef.current];

    // Inject tool name if available
    if (status === STATES.TOOL_CALL && currentTool?.name) {
      report = `龙虾举着钳子在忙！正在调用 ${currentTool.name} ⚡`;
    }

    setText(report);
  }, [status, currentTool]);

  return (
    <p className="lobster-report">{text}</p>
  );
}
