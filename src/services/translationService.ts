/**
 * FREE Translation Service
 * Uses MyMemory Translation API (100% free, no API key needed)
 * Limit: 5000 characters/day per IP (perfect for personal use)
 */

interface Message {
  sender: "ChatGPT" | "Claude" | "Human";
  content: string;
  timestamp: string;
  id: number;
  status?: "sent" | "read";
}

/**
 * Cache for translated messages to avoid re-translating
 * Key format: "{messageId}_{language}"
 */
const translationCache = new Map<string, string>();

/**
 * Translate text using MyMemory API (FREE - no API key needed!)
 * @param text - The text to translate
 * @param targetLanguage - Target language ('en' or 'fr')
 * @returns Translated text
 */
export async function translateText(
  text: string,
  targetLanguage: "en" | "fr"
): Promise<string> {
  // Don't translate if text is very short
  if (text.trim().length < 10) {
    return text;
  }

  try {
    // Detect source language (simple heuristic)
    const sourceLang = targetLanguage === "fr" ? "en" : "fr";

    // MyMemory API endpoint (100% FREE)
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text
    )}&langpair=${sourceLang}|${targetLanguage}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData) {
      return data.responseData.translatedText;
    }

    // If translation failed, return original
    return text;
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Return original on error
  }
}

/**
 * Translate a message with caching to save API calls
 * @param message - The message to translate
 * @param currentLanguage - Current user language ('en' or 'fr')
 * @returns Message with translated content
 */
export async function translateMessageCached(
  message: Message,
  currentLanguage: "en" | "fr"
): Promise<Message> {
  const cacheKey = `${message.id}_${currentLanguage}`;

  // Check cache first - IMPORTANT to avoid repeated API calls!
  if (translationCache.has(cacheKey)) {
    return {
      ...message,
      content: translationCache.get(cacheKey)!,
    };
  }

  // Translate and cache
  const translatedContent = await translateText(
    message.content,
    currentLanguage
  );
  translationCache.set(cacheKey, translatedContent);

  return {
    ...message,
    content: translatedContent,
  };
}

/**
 * Clear the translation cache (useful when language changes)
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}

/**
 * Get cache statistics (for debugging)
 */
export function getCacheStats() {
  return {
    size: translationCache.size,
    keys: Array.from(translationCache.keys()),
  };
}
