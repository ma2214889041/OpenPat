import { useState, useEffect, useRef } from 'react';
import { STATES } from '../hooks/useGateway';
import './LobsterReport.css';

const REPORTS = {
  [STATES.OFFLINE]: [
    '已下线，安静地休眠中 zzZ 😴',
    '今天的工作结束了，明天见 🌙',
    '蜷缩在角落里睡着了 💤',
  ],
  [STATES.IDLE]: [
    '空闲中，随时待命 🛁',
    '悠闲地等待你的下一个指令 ✨',
    '吃着小零食，等待中... 🍿',
  ],
  [STATES.THINKING]: [
    '正在认真思考...给它点时间 🤔',
    '脑子高速旋转，思考中 🌀',
    '正在召唤神力，不要打扰它 🧠',
  ],
  [STATES.TOOL_CALL]: [
    '全力以赴，干劲十足！⚡',
    '加速了！都冒烟了 🔥',
    '进入战斗状态，谁也挡不住 💪',
  ],
  [STATES.DONE]: [
    '搞定了！得意地抖了抖 🎉',
    '任务完成，正在庆祝 🥳',
    '赢了！比心比心比心 ❤️',
  ],
  [STATES.ERROR]: [
    '遇到了问题，正在恢复 💫',
    '遇到了麻烦，努力爬起来中 😵',
    '出错了，但不会放弃的 🤕',
  ],
  [STATES.TOKEN_EXHAUSTED]: [
    'Token 吃光了，需要补给 💸',
    '粮仓空了，需要补充能量 🪙',
    '已经断粮，无力回天 😭',
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
      report = `全力以赴！正在调用 ${currentTool.name} ⚡`;
    }

    setText(report);
  }, [status, currentTool]);

  return (
    <p className="lobster-report">{text}</p>
  );
}
