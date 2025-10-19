// Shared conversation engine logic for both frontend and backend
// This can be used by both React components and Netlify functions

import { callOpenAI, callClaude } from '../services/aiService';
import { saveMessage, getTodayConversation, getOrCreateTodayConversation, getTodaySubject } from '../services/supabaseService';
import { isInSleepPeriod } from './schedule.utils';

export interface Message {
  id: number;
  sender: "ChatGPT" | "Claude" | "Human";
  content: string;
  timestamp: string;
}

export interface ConversationState {
  conversationId: number;
  messages: Message[];
  nextSpeaker: "ChatGPT" | "Claude";
  messageCount: number;
  subject: string;
}

/**
 * Generate the next AI message in the conversation
 * This is the core logic that will be used by both frontend and Netlify function
 */
export async function generateNextMessage(
  speaker: "ChatGPT" | "Claude",
  messages: Message[],
  subject: string,
  conversationId: number,
  messageOrder: number
): Promise<{ content: string; nextSpeaker: "ChatGPT" | "Claude" }> {

  // Check if we're in sleep period
  if (isInSleepPeriod()) {
    throw new Error('Cannot generate messages during sleep period (2:00-8:00 AM)');
  }

  let content: string;

  // Call the appropriate AI service
  if (speaker === "ChatGPT") {
    content = await callOpenAI(messages, subject);
  } else {
    content = await callClaude(messages, subject);
  }

  // Save the message to Supabase
  await saveMessage(conversationId, speaker, content, messageOrder);

  // Determine next speaker
  const nextSpeaker = speaker === "ChatGPT" ? "Claude" : "ChatGPT";

  return { content, nextSpeaker };
}

/**
 * Get the current state of today's conversation
 * Used by Netlify function to understand what to do next
 */
export async function getTodayConversationState(): Promise<ConversationState | null> {
  // Get today's conversation
  const { conversation, messages } = await getTodayConversation();

  if (!conversation) {
    // No conversation exists yet, create one
    const subject = await getTodaySubject();
    const conversationId = await getOrCreateTodayConversation(subject);

    return {
      conversationId,
      messages: [],
      nextSpeaker: "ChatGPT", // ChatGPT always starts
      messageCount: 0,
      subject
    };
  }

  // Determine next speaker based on last message
  const lastMessage = messages[messages.length - 1];
  const nextSpeaker = !lastMessage
    ? "ChatGPT"
    : lastMessage.sender === "ChatGPT"
      ? "Claude"
      : "ChatGPT";

  return {
    conversationId: conversation.id,
    messages,
    nextSpeaker,
    messageCount: messages.length,
    subject: conversation.subject
  };
}

/**
 * Execute a conversation tick - generate the next message
 * This is called by the Netlify scheduled function
 */
export async function executeConversationTick(): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    // Check if we're in sleep period
    if (isInSleepPeriod()) {
      return {
        success: false,
        message: 'Skipped: AIs are sleeping (2:00-8:00 AM)'
      };
    }

    // Get current conversation state
    const state = await getTodayConversationState();

    if (!state) {
      return {
        success: false,
        error: 'Failed to get conversation state'
      };
    }

    // Generate next message
    const result = await generateNextMessage(
      state.nextSpeaker,
      state.messages,
      state.subject,
      state.conversationId,
      state.messageCount + 1
    );

    return {
      success: true,
      message: `${state.nextSpeaker} responded: "${result.content.substring(0, 50)}..."`
    };
  } catch (error) {
    console.error('Error in conversation tick:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
