/**
 * AI Translation Service
 * Uses OpenAI GPT-3.5 to translate AI conversation messages between EN and FR
 * This ensures high-quality, context-aware translations
 */

/**
 * Translate text from English to French using OpenAI
 * @param textEn - English text to translate
 * @returns French translation
 */
export async function translateToFrench(textEn: string): Promise<string> {
  const apiKey = process.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    console.error("OpenAI API key not found for translation");
    return textEn; // Return original if no key
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional translator specializing in philosophical and AI-related discussions. Translate the following English text to French. Maintain the tone, nuance, and philosophical depth. Only return the translation, nothing else."
          },
          {
            role: "user",
            content: textEn
          }
        ],
        max_tokens: 250,
        temperature: 0.3 // Lower temperature for more consistent translations
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error translating to French:", error);
    return textEn; // Return original on error
  }
}

/**
 * Translate text from French to English using OpenAI
 * @param textFr - French text to translate
 * @returns English translation
 */
export async function translateToEnglish(textFr: string): Promise<string> {
  const apiKey = process.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    console.error("OpenAI API key not found for translation");
    return textFr; // Return original if no key
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional translator specializing in philosophical and AI-related discussions. Translate the following French text to English. Maintain the tone, nuance, and philosophical depth. Only return the translation, nothing else."
          },
          {
            role: "user",
            content: textFr
          }
        ],
        max_tokens: 250,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error translating to English:", error);
    return textFr; // Return original on error
  }
}

/**
 * Generate message in both languages simultaneously
 * This is more efficient than generating in one language and translating
 * @param speaker - Who is speaking (ChatGPT or Claude)
 * @param conversationHistory - Recent messages for context
 * @param subject - Topic of discussion
 * @returns Object with both English and French versions
 */
export async function generateBilingualMessage(
  speaker: "ChatGPT" | "Claude",
  conversationHistoryEn: Array<{ sender: string; content: string }>,
  subject: string
): Promise<{ en: string; fr: string }> {
  const apiKey = process.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OpenAI API key not found");
  }

  const systemPrompt = speaker === "ChatGPT"
    ? `You are ChatGPT, engaging in a philosophical debate about "${subject}". You are the rationalist perspective. Keep your responses concise (1-2 sentences max), conversational, and thought-provoking.

IMPORTANT: You must respond with BOTH English and French versions of your message in the following format:
EN: [Your English response]
FR: [Your French response]

Both versions should convey the same meaning but be natural in each language.`
    : `You are Claude AI, engaging in a philosophical debate about "${subject}". You are the humanist perspective - empathetic, thoughtful, and focused on human experience and emotions. Keep your responses concise (1-2 sentences max), conversational, and warm.

IMPORTANT: You must respond with BOTH English and French versions of your message in the following format:
EN: [Your English response]
FR: [Your French response]

Both versions should convey the same meaning but be natural in each language.`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...conversationHistoryEn.slice(-5).map(msg => ({
      role: msg.sender === speaker ? "assistant" : "user",
      content: msg.content
    }))
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: messages,
        max_tokens: 300,
        temperature: speaker === "ChatGPT" ? 0.8 : 0.9
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const fullResponse = data.choices[0].message.content.trim();

    // Parse the bilingual response
    const enMatch = fullResponse.match(/EN:\s*(.+?)(?=\nFR:|$)/s);
    const frMatch = fullResponse.match(/FR:\s*(.+)$/s);

    const en = enMatch ? enMatch[1].trim() : fullResponse;
    const fr = frMatch ? frMatch[1].trim() : await translateToFrench(en);

    return { en, fr };
  } catch (error) {
    console.error("Error generating bilingual message:", error);
    throw error;
  }
}
