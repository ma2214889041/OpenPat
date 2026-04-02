import { useState, useEffect, useRef } from 'react';
import { STATES } from '../utils/states';
import './PetReport.css';

const AGENT_REPORTS = {
  [STATES.OFFLINE]: [
    '已下线，安静地休眠中 zzZ',
    '今天的工作结束了，明天见',
    '蜷缩在角落里睡着了',
  ],
  [STATES.IDLE]: [
    '空闲中，随时待命',
    '悠闲地等待你的下一个指令',
    '吃着小零食，等待中...',
  ],
  [STATES.THINKING]: [
    '正在认真思考...给它点时间',
    '脑子高速旋转，思考中',
    '正在召唤神力，不要打扰它',
  ],
  [STATES.TOOL_CALL]: [
    '全力以赴，干劲十足！',
    '加速了！都冒烟了',
    '进入战斗状态，谁也挡不住',
  ],
  [STATES.DONE]: [
    '搞定了！得意地抖了抖',
    '任务完成，正在庆祝',
    '赢了！比心比心比心',
  ],
  [STATES.ERROR]: [
    '遇到了问题，正在恢复',
    '遇到了麻烦，努力爬起来中',
    '出错了，但不会放弃的',
  ],
  [STATES.TOKEN_EXHAUSTED]: [
    'Token 吃光了，需要补给',
    '粮仓空了，需要补充能量',
    '已经断粮，无力回天',
  ],
};

const COMPANION_REPORTS = {
  [STATES.OFFLINE]: [
    '太晚了...早点休息吧',
    '该睡觉了，明天继续',
    '晚安，做个好梦',
  ],
  [STATES.IDLE]: [
    '准备好了，随时可以开始专注',
    '要不要开个番茄钟？',
    '在等你发号施令呢',
    '喝杯水，然后开始吧',
  ],
  [STATES.THINKING]: [
    '和你一起专注中...嘘！',
    '全力投入工作！',
    '认真工作中，别分心哦',
    '加油！你可以的！',
  ],
  [STATES.TOOL_CALL]: [
    '又完成一个任务！太棒了！',
    '划掉！好有成就感！',
    '干得漂亮！继续！',
  ],
  [STATES.DONE]: [
    '番茄钟完成！休息一下吧',
    '辛苦了！站起来活动活动',
    '好棒！喝口水休息会儿',
  ],
  [STATES.ERROR]: [
    '感觉你有点累了...',
    '要不要休息一下？',
    '别太拼了，身体重要',
  ],
  [STATES.TOKEN_EXHAUSTED]: [
    '饿了...需要补充能量',
    '没力气了，投喂一下吧',
    '需要能量！',
  ],
};

const IDLE_ACTIVITY_REPORTS = {
  'idle-chill':   ['安静地发呆中...', '望着窗外放空', '脑子一片空白，好舒服'],
  'idle-coffee':  ['悠闲地品着咖啡', '☕ 这杯拿铁真不错', '边喝咖啡边想事情'],
  'idle-phone':   ['在刷手机...别告诉老板', '看到了一个好笑的视频', '回了条消息'],
  'idle-stretch': ['伸了个大懒腰～', '活动一下筋骨', '转了转脖子，嘎嘣响'],
  'idle-snack':   ['偷偷吃零食中...嘘', '这个薯片好好吃', '吃完这口就干活...'],
  'idle-dance':   ['忍不住扭起来了！', '跟着节奏摇摆～', '今天心情好好！'],
  'idle-guitar':  ['弹一首小曲儿', '♪ 铛铛铛～', '在练一首新歌'],
  'idle-cook':    ['给自己做顿好吃的', '今天做什么菜呢...', '搅拌搅拌～'],
  'idle-paint':   ['在画一幅小画', '灵感来了！快记下来', '这个颜色真好看'],
  'idle-yoga':    ['深呼吸...放松...', '感受内心的平静', '今天第三个瑜伽动作了'],
  'idle-game':    ['偷偷打游戏中...', '就玩一局！最后一局！', '快赢了快赢了！'],
  'idle-crown':   ['俯瞰整片海域', '王的日常就是如此悠闲', '从容淡定，尽在掌握'],
};

export default function PetReport({ status, currentTool, source = 'companion', idleActivity = '' }) {
  const [text, setText] = useState('');
  const prevStatus = useRef(null);
  const indexRef = useRef(0);

  useEffect(() => {
    // If idle with a specific activity, use activity-specific reports
    if (status === STATES.IDLE && idleActivity && IDLE_ACTIVITY_REPORTS[idleActivity]) {
      const actVariants = IDLE_ACTIVITY_REPORTS[idleActivity];
      if (idleActivity !== prevStatus.current) {
        indexRef.current = (indexRef.current + 1) % actVariants.length;
        prevStatus.current = idleActivity;
      }
      setText(actVariants[indexRef.current % actVariants.length]);
      return;
    }

    const pool = source === 'agent' ? AGENT_REPORTS : COMPANION_REPORTS;
    const variants = pool[status] || pool[STATES.IDLE];

    if (status !== prevStatus.current) {
      const newIndex = (indexRef.current + 1) % variants.length;
      indexRef.current = newIndex;
      prevStatus.current = status;
    }

    let report = variants[indexRef.current % variants.length];

    if (source === 'agent' && status === STATES.TOOL_CALL && currentTool?.name) {
      report = `全力以赴！正在调用 ${currentTool.name}`;
    }

    setText(report);
  }, [status, currentTool, source, idleActivity]);

  return (
    <p className="pet-report">{text}</p>
  );
}
