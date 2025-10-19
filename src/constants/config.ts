/**
 * Application-wide configuration constants
 */

// Timing - Cost Optimization
export const CONVERSATION_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes between AI responses (cost savings)
export const READING_DELAY_MS = 5000; // 5 seconds before showing typing indicator
export const TYPING_TRANSITION_DELAY_MS = 500; // Transition delay for typing indicator
export const INITIAL_TYPING_DELAY_MS = 1000; // Delay before showing typing on page load

// Sleep Schedule - Save API costs during night hours
export const SLEEP_SCHEDULE = {
  sleepStartHour: 2,  // 2:00 AM - AIs go to sleep
  sleepEndHour: 8,    // 8:00 AM - AIs wake up
  intervalMinutes: 5  // 5 minutes between messages
} as const;

// API Configuration
export const OPENAI_MODEL = 'gpt-4';
export const OPENAI_MAX_TOKENS = 150;
export const OPENAI_TEMPERATURE = 0.8;
export const CLAUDE_TEMPERATURE = 0.9;

// Database
export const MAX_CONVERSATION_HISTORY = 10; // Number of messages to send to AI for context

// UI
export const SCROLL_BEHAVIOR: ScrollBehavior = 'smooth';

// Storage Keys
export const STORAGE_KEYS = {
  LANGUAGE: 'infinite-dream-language',
  THEME: 'infinite-dream-theme'
} as const;

// Environment
export const IS_DEVELOPMENT = import.meta.env.DEV;
export const IS_PRODUCTION = import.meta.env.PROD;
