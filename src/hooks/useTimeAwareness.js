import { useState, useEffect } from 'react';

function getTimeInfo(petName) {
  const h = new Date().getHours();

  let timeOfDay, greeting, mood;

  if (h >= 6 && h < 12) {
    timeOfDay = 'morning';
    mood = 'energetic';
    greeting = `早上好，${petName}！新的一天开始了`;
  } else if (h >= 12 && h < 14) {
    timeOfDay = 'noon';
    mood = 'normal';
    greeting = `中午好，${petName}！该吃午饭了`;
  } else if (h >= 14 && h < 18) {
    timeOfDay = 'afternoon';
    mood = 'normal';
    greeting = `下午好，${petName}！继续加油`;
  } else if (h >= 18 && h < 21) {
    timeOfDay = 'evening';
    mood = 'sleepy';
    greeting = `晚上好，${petName}！辛苦了一天`;
  } else if (h >= 21 && h < 23) {
    timeOfDay = 'evening';
    mood = 'sleepy';
    greeting = `${petName}有点困了...早点休息吧`;
  } else {
    // 23:00 - 5:59
    timeOfDay = 'lateNight';
    mood = 'asleep';
    greeting = `这么晚了...${petName}担心你的身体`;
  }

  const shouldSuggestBreak = h >= 22 || h < 6;

  return { timeOfDay, greeting, mood, shouldSuggestBreak, hour: h };
}

/**
 * Time-of-day awareness — makes the pet feel alive with daily rhythms.
 */
export function useTimeAwareness(petName = '小龙') {
  const [info, setInfo] = useState(() => getTimeInfo(petName));

  useEffect(() => {
    setInfo(getTimeInfo(petName));
    const id = setInterval(() => setInfo(getTimeInfo(petName)), 60_000);
    return () => clearInterval(id);
  }, [petName]);

  return info;
}
