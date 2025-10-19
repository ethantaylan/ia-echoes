// AI Service for handling OpenAI and Anthropic API calls

interface Message {
  sender: "ChatGPT" | "Claude" | "Human";
  content: string;
  timestamp: string;
  id: number;
  status?: "sent" | "read";
}

// OpenAI API Call
export async function callOpenAI(conversationHistory: Message[], subject: string): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OpenAI API key not found");
  }

  // Format conversation history for OpenAI
  const messages = [
    {
      role: "system",
      content: `You are ChatGPT, engaging in a philosophical debate about "${subject}". You are the rationalist perspective. Keep your responses concise (1-2 sentences max), conversational, and thought-provoking. You're having a dialogue with Claude AI and occasionally humans join the conversation.`
    },
    ...conversationHistory.slice(-10).map(msg => ({
      role: msg.sender === "ChatGPT" ? "assistant" : "user",
      content: `${msg.sender === "Claude" ? "Claude says: " : msg.sender === "Human" ? "A human asks: " : ""}${msg.content}`
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
        max_tokens: 150,
        temperature: 0.8
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw error;
  }
}

// Simulated Claude API Call using OpenAI (for testing purposes)
// TODO: Replace with real Anthropic API when Claude key is available
export async function callClaude(conversationHistory: Message[], subject: string): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OpenAI API key not found (used for Claude simulation)");
  }

  // Format conversation history for Claude persona using OpenAI
  const messages = [
    {
      role: "system",
      content: `You are Claude AI, engaging in a philosophical debate about "${subject}". You are the humanist perspective - empathetic, thoughtful, and focused on human experience and emotions. Keep your responses concise (1-2 sentences max), conversational, and warm. You're having a dialogue with ChatGPT (the rationalist) and occasionally humans join the conversation. Respond in a distinct voice from ChatGPT - more reflective and emotionally aware.`
    },
    ...conversationHistory.slice(-10).map(msg => ({
      role: msg.sender === "Claude" ? "assistant" : "user",
      content: `${msg.sender === "ChatGPT" ? "ChatGPT says: " : msg.sender === "Human" ? "A human asks: " : ""}${msg.content}`
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
        max_tokens: 150,
        temperature: 0.9 // Slightly higher temperature for more varied responses
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error (Claude simulation): ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error calling Claude simulation:", error);
    throw error;
  }
}
