import { useState, useEffect, useCallback } from 'react';
import {
  isInSleepPeriod,
  getMillisecondsUntilWake,
  shouldSendGoodnightMessage,
  generateGoodnightMessage,
  generateGoodMorningMessage
} from '../utils/schedule.utils';
import { SLEEP_SCHEDULE } from '../constants/config';
import type { AISender } from '../types';

interface UseSleepScheduleReturn {
  isSleeping: boolean;
  shouldSleep: boolean;
  shouldWake: boolean;
  getGoodnightMessage: (speaker: AISender) => string;
  getGoodMorningMessage: (speaker: AISender) => string;
}

interface UseSleepScheduleProps {
  t?: (key: string, options?: any) => any;
}

/**
 * Custom hook to manage AI sleep schedule
 * Handles sleep periods (2:00 AM - 8:00 AM) to save API costs
 */
export function useSleepSchedule(props?: UseSleepScheduleProps): UseSleepScheduleReturn {
  const { t } = props || {};
  const [isSleeping, setIsSleeping] = useState(isInSleepPeriod(SLEEP_SCHEDULE));
  const [shouldSleep, setShouldSleep] = useState(false);
  const [shouldWake, setShouldWake] = useState(false);

  useEffect(() => {
    // Check sleep status every minute
    const checkSchedule = () => {
      const sleeping = isInSleepPeriod(SLEEP_SCHEDULE);
      const needsGoodnight = shouldSendGoodnightMessage(SLEEP_SCHEDULE);

      setIsSleeping(sleeping);
      setShouldSleep(needsGoodnight);

      // Check if we just woke up
      if (!sleeping && isSleeping) {
        setShouldWake(true);
        setTimeout(() => setShouldWake(false), 60000); // Reset after 1 minute
      }
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isSleeping]);

  // Schedule wake-up if currently sleeping
  useEffect(() => {
    if (!isSleeping) return;

    const msUntilWake = getMillisecondsUntilWake(SLEEP_SCHEDULE);
    if (msUntilWake === 0) return;

    const wakeTimer = setTimeout(() => {
      setIsSleeping(false);
      setShouldWake(true);
    }, msUntilWake);

    return () => clearTimeout(wakeTimer);
  }, [isSleeping]);

  const getGoodnightMessage = useCallback((speaker: AISender) => {
    return generateGoodnightMessage(speaker, t);
  }, [t]);

  const getGoodMorningMessage = useCallback((speaker: AISender) => {
    return generateGoodMorningMessage(speaker, t);
  }, [t]);

  return {
    isSleeping,
    shouldSleep,
    shouldWake,
    getGoodnightMessage,
    getGoodMorningMessage
  };
}
