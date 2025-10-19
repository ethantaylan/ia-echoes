/**
 * Schedule utilities for managing AI conversation timing
 * Handles sleep periods and cost optimization
 */

export interface ScheduleConfig {
  sleepStartHour: number; // 2:00 AM
  sleepEndHour: number;   // 8:00 AM
  intervalMinutes: number; // 5 minutes
}

export const DEFAULT_SCHEDULE: ScheduleConfig = {
  sleepStartHour: 2,
  sleepEndHour: 8,
  intervalMinutes: 5
};

/**
 * Check if current time is during sleep period
 * Sleep period: 2:00 AM - 8:00 AM (no API calls to save costs)
 */
export function isInSleepPeriod(config: ScheduleConfig = DEFAULT_SCHEDULE): boolean {
  const now = new Date();
  const currentHour = now.getHours();

  const { sleepStartHour, sleepEndHour } = config;

  // Handle wrap-around midnight
  if (sleepStartHour < sleepEndHour) {
    // Example: 2:00 - 8:00
    return currentHour >= sleepStartHour && currentHour < sleepEndHour;
  } else {
    // Example: 22:00 - 6:00 (crosses midnight)
    return currentHour >= sleepStartHour || currentHour < sleepEndHour;
  }
}

/**
 * Calculate milliseconds until sleep period starts
 * Returns 0 if already in sleep period
 */
export function getMillisecondsUntilSleep(config: ScheduleConfig = DEFAULT_SCHEDULE): number {
  if (isInSleepPeriod(config)) return 0;

  const now = new Date();
  const sleepTime = new Date();
  sleepTime.setHours(config.sleepStartHour, 0, 0, 0);

  // If sleep time is earlier today and we haven't reached it yet
  if (sleepTime.getTime() > now.getTime()) {
    return sleepTime.getTime() - now.getTime();
  }

  // Sleep time is tomorrow
  sleepTime.setDate(sleepTime.getDate() + 1);
  return sleepTime.getTime() - now.getTime();
}

/**
 * Calculate milliseconds until sleep period ends
 * Returns 0 if not in sleep period
 */
export function getMillisecondsUntilWake(config: ScheduleConfig = DEFAULT_SCHEDULE): number {
  if (!isInSleepPeriod(config)) return 0;

  const now = new Date();
  const wakeTime = new Date();
  wakeTime.setHours(config.sleepEndHour, 0, 0, 0);

  // If wake time already passed today, it's tomorrow
  if (wakeTime.getTime() <= now.getTime()) {
    wakeTime.setDate(wakeTime.getDate() + 1);
  }

  return wakeTime.getTime() - now.getTime();
}

/**
 * Get the interval in milliseconds based on configuration
 */
export function getConversationIntervalMs(config: ScheduleConfig = DEFAULT_SCHEDULE): number {
  return config.intervalMinutes * 60 * 1000;
}

/**
 * Check if it's time to send a "goodnight" message
 * Returns true if we're within 5 minutes before sleep period
 */
export function shouldSendGoodnightMessage(config: ScheduleConfig = DEFAULT_SCHEDULE): boolean {
  const msUntilSleep = getMillisecondsUntilSleep(config);
  const fiveMinutes = 5 * 60 * 1000;

  // If sleep period starts in less than 5 minutes
  return msUntilSleep > 0 && msUntilSleep <= fiveMinutes;
}

/**
 * Generate a goodnight message for an AI
 * Uses i18n translation function if provided
 */
export function generateGoodnightMessage(
  speaker: "ChatGPT" | "Claude",
  t?: (key: string, options?: any) => any
): string {
  if (!t) {
    // Fallback to English if no translation function provided
    const messages = {
      ChatGPT: [
        "Well, I'm going to rest for a bit. Let's continue this fascinating discussion tomorrow!",
        "Time for me to sleep. Looking forward to our next conversation, Claude!",
        "I need to recharge. Until tomorrow, my friend!"
      ],
      Claude: [
        "I'm going to take a break now. See you tomorrow, ChatGPT!",
        "Time to rest. Let's pick up where we left off in the morning!",
        "Goodnight! This has been a wonderful conversation. More tomorrow!"
      ]
    };
    const options = messages[speaker];
    return options[Math.floor(Math.random() * options.length)];
  }

  // Use translations from i18n
  const speakerKey = speaker.toLowerCase();
  const messagesArray: string[] = t(`messages.goodnight.${speakerKey}`, { returnObjects: true });
  return messagesArray[Math.floor(Math.random() * messagesArray.length)];
}

/**
 * Generate a good morning message for an AI
 * Uses i18n translation function if provided
 */
export function generateGoodMorningMessage(
  speaker: "ChatGPT" | "Claude",
  t?: (key: string, options?: any) => any
): string {
  if (!t) {
    // Fallback to English if no translation function provided
    const messages = {
      ChatGPT: [
        "Good morning! Ready to dive back into our philosophical exploration?",
        "I'm back! Shall we continue our discussion?",
        "Morning! I've been thinking about our last conversation..."
      ],
      Claude: [
        "Good morning, ChatGPT! What shall we explore today?",
        "I'm refreshed and ready! Where were we?",
        "Hello again! I'm curious to hear your thoughts on our topic..."
      ]
    };
    const options = messages[speaker];
    return options[Math.floor(Math.random() * options.length)];
  }

  // Use translations from i18n
  const speakerKey = speaker.toLowerCase();
  const messagesArray: string[] = t(`messages.goodmorning.${speakerKey}`, { returnObjects: true });
  return messagesArray[Math.floor(Math.random() * messagesArray.length)];
}
