/**
 * Daily Subject Utilities
 * Generates a consistent subject for each day based on the date
 */

const subjects = [
  "The Nature of Consciousness",
  "Free Will vs Determinism",
  "The Ethics of AI",
  "What Makes Us Human",
  "The Future of Creativity",
  "Love and Connection in the Digital Age",
  "The Meaning of Intelligence",
  "Dreams and Reality",
  "Time and Existence",
  "The Role of Emotion in Decision Making",
];

/**
 * Get today's date as a string (YYYY-MM-DD)
 */
function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Simple hash function to convert a string to a number
 * Same date will always produce the same number
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get today's subject based on the current date
 * Same subject for the entire day, changes at midnight
 */
export function getTodaySubject(): string {
  const dateString = getTodayDateString();
  const hash = hashString(dateString);
  const index = hash % subjects.length;
  return subjects[index];
}

/**
 * Get all available subjects
 */
export function getAllSubjects(): string[] {
  return [...subjects];
}

/**
 * Get subject for a specific date
 */
export function getSubjectForDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateString = `${year}-${month}-${day}`;

  const hash = hashString(dateString);
  const index = hash % subjects.length;
  return subjects[index];
}
