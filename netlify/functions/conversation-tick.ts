import { schedule } from "@netlify/functions";
import { createClient } from '@supabase/supabase-js';

// ============================================
// AI Service Functions (copied for serverless context)
// ============================================

interface Message {
  sender: "ChatGPT" | "Claude" | "Human";
  content: string;
  timestamp: string;
  id: number;
}

async function callOpenAI(conversationHistory: Message[], subject: string): Promise<string> {
  const apiKey = process.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OpenAI API key not found");
  }

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
}

async function callClaude(conversationHistory: Message[], subject: string): Promise<string> {
  const apiKey = process.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OpenAI API key not found (used for Claude simulation)");
  }

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
      temperature: 0.9
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error (Claude simulation): ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// ============================================
// Schedule Utilities
// ============================================

function isInSleepPeriod(): boolean {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 2 && hour < 8;
}

// ============================================
// Supabase Setup
// ============================================

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// Database Functions
// ============================================

interface DBMessage {
  id: number;
  conversation_id: number;
  sender: string;
  content: string;
  timestamp: string;
  message_order: number;
}

interface Conversation {
  id: number;
  conversation_date: string;
  subject: string;
}

async function getTodayConversation(): Promise<{ conversation: Conversation | null; messages: Message[] }> {
  const today = new Date().toISOString().split('T')[0];

  const { data: conversationData, error: conversationError } = await supabase
    .from('conversations')
    .select('*')
    .eq('conversation_date', today)
    .single();

  if (conversationError) {
    if (conversationError.code === 'PGRST116') {
      return { conversation: null, messages: [] };
    }
    throw conversationError;
  }

  const { data: messagesData, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationData.id)
    .order('message_order', { ascending: true });

  if (messagesError) {
    throw messagesError;
  }

  const messages: Message[] = (messagesData || []).map((msg: DBMessage, index: number) => ({
    id: index + 1,
    sender: msg.sender as "ChatGPT" | "Claude" | "Human",
    content: msg.content,
    timestamp: msg.timestamp,
  }));

  return { conversation: conversationData, messages };
}

async function getTodaySubject(): Promise<string> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_subjects')
    .select('*')
    .eq('date', today)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (data) {
    return data.subject as string;
  }

  // Create new subject if doesn't exist
  const SUBJECTS = [
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

  const date = new Date();
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const index = dayOfYear % SUBJECTS.length;
  const subject = SUBJECTS[index];

  await supabase
    .from('daily_subjects')
    .insert({ date: today, subject: subject });

  return subject;
}

async function getOrCreateTodayConversation(subject: string): Promise<number> {
  const { data, error } = await supabase.rpc('get_or_create_today_conversation', {
    p_subject: subject
  });

  if (error) {
    throw error;
  }

  return data as number;
}

async function saveMessage(
  conversationId: number,
  sender: "ChatGPT" | "Claude" | "Human",
  content: string,
  messageOrder: number
): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender,
      content,
      message_order: messageOrder
    });

  if (error) {
    throw error;
  }
}

// ============================================
// Main Scheduled Function
// ============================================

const conversationTickHandler = async () => {
  console.log('🔔 Conversation tick triggered at:', new Date().toISOString());

  try {
    // Check if we're in sleep period
    if (isInSleepPeriod()) {
      console.log('💤 Skipped: AIs are sleeping (2:00-8:00 AM)');
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Skipped: AIs are sleeping (2:00-8:00 AM)'
        })
      };
    }

    // Get today's conversation
    const { conversation, messages } = await getTodayConversation();

    let conversationId: number;
    let subject: string;

    if (!conversation) {
      // Create new conversation if doesn't exist
      subject = await getTodaySubject();
      conversationId = await getOrCreateTodayConversation(subject);
      console.log('📝 Created new conversation with subject:', subject);
    } else {
      conversationId = conversation.id;
      subject = conversation.subject;
      console.log('📖 Using existing conversation:', conversationId);
    }

    // Determine next speaker
    const lastMessage = messages[messages.length - 1];
    const nextSpeaker = !lastMessage
      ? "ChatGPT"
      : lastMessage.sender === "ChatGPT"
        ? "Claude"
        : "ChatGPT";

    console.log(`🤖 Next speaker: ${nextSpeaker}`);

    // Generate AI response
    let content: string;
    if (nextSpeaker === "ChatGPT") {
      content = await callOpenAI(messages, subject);
    } else {
      content = await callClaude(messages, subject);
    }

    console.log(`💬 ${nextSpeaker} says: "${content.substring(0, 50)}..."`);

    // Save message
    const messageOrder = messages.length + 1;
    await saveMessage(conversationId, nextSpeaker, content, messageOrder);

    console.log('✅ Message saved successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        speaker: nextSpeaker,
        messagePreview: content.substring(0, 100),
        messageOrder
      })
    };
  } catch (error) {
    console.error('❌ Error in conversation tick:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

// Schedule to run every 5 minutes
// Cron format: "minute hour day month dayOfWeek"
// "*/5 * * * *" = every 5 minutes
export const handler = schedule("*/5 * * * *", conversationTickHandler);
