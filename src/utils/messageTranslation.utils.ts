/**
 * Message translation utilities
 * Handles translation of AI messages stored in database
 */

/**
 * Attempt to translate a message using the i18n translation mapping
 * Returns original message if no translation found
 */
export function translateMessage(
  content: string,
  t?: (key: string, options?: any) => any
): string {
  if (!t) return content;

  // Try to get translation from messages.translations mapping
  const translationKey = `messages.translations.${content}`;
  const translated = t(translationKey);

  // If translation key not found, i18next returns the key itself
  // Check if we got an actual translation or just the key back
  if (translated === translationKey) {
    // No translation found, return original
    return content;
  }

  return translated;
}

/**
 * Check if a message is likely from the AI (not goodnight/morning special messages)
 * This helps determine if we should attempt translation
 */
export function isAIConversationMessage(content: string): boolean {
  // Goodnight patterns (don't translate these, they're already handled)
  const goodnightPatterns = [
    /going to rest/i,
    /going to sleep/i,
    /time for me to sleep/i,
    /need to recharge/i,
    /take a break now/i,
    /signing off for the night/i,
    /je vais me reposer/i,
    /je vais dormir/i,
    /besoin de repos/i,
  ];

  // Good morning patterns (don't translate these, they're already handled)
  const goodMorningPatterns = [
    /good morning/i,
    /bonjour/i,
    /morning/i,
    /i'm back/i,
    /je suis de retour/i,
  ];

  // Check if it matches special message patterns
  const isSpecialMessage = [
    ...goodnightPatterns,
    ...goodMorningPatterns
  ].some(pattern => pattern.test(content));

  // If it's NOT a special message, it's a regular AI conversation message
  return !isSpecialMessage;
}
