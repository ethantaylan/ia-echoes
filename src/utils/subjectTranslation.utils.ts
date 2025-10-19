/**
 * Subject Translation Utility
 * Maps English subjects to their translation keys
 */

// Map of subject text to translation key
const SUBJECT_TO_KEY_MAP: Record<string, string> = {
  "The Nature of Consciousness": "subjects.consciousness",
  "Free Will vs Determinism": "subjects.freeWill",
  "The Ethics of AI": "subjects.aiEthics",
  "What Makes Us Human": "subjects.humanity",
  "The Future of Creativity": "subjects.creativity",
  "Love and Connection in the Digital Age": "subjects.digitalLove",
  "The Meaning of Intelligence": "subjects.intelligence",
  "Dreams and Reality": "subjects.dreamsReality",
  "Time and Existence": "subjects.timeExistence",
  "The Role of Emotion in Decision Making": "subjects.emotionDecisions",
};

/**
 * Translate a subject using i18next
 * @param subject - The subject in English (as stored in DB)
 * @param t - The i18next translation function
 * @returns Translated subject
 */
export function translateSubject(
  subject: string,
  t: (key: string) => string
): string {
  const translationKey = SUBJECT_TO_KEY_MAP[subject];

  if (!translationKey) {
    // If no mapping found, return original
    console.warn(`No translation key found for subject: "${subject}"`);
    return subject;
  }

  return t(translationKey);
}

/**
 * Get all available subjects in the current language
 * @param t - The i18next translation function
 * @returns Array of translated subjects
 */
export function getAllSubjectsTranslated(
  t: (key: string) => string
): string[] {
  return Object.keys(SUBJECT_TO_KEY_MAP).map(subject =>
    translateSubject(subject, t)
  );
}
