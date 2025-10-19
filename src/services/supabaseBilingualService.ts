import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Message {
  sender: "ChatGPT" | "Claude" | "Human";
  content: string;
  timestamp: string;
  id: number;
}

export interface Conversation {
  id: number;
  conversation_date: string;
  subject: string;
  created_at: string;
}

export interface DBMessage {
  id: number;
  conversation_id: number;
  sender: string;
  content: string;
  timestamp: string;
  message_order: number;
  created_at: string;
}

/**
 * Get the appropriate table name based on language
 */
function getMessagesTable(language: 'en' | 'fr'): string {
  return language === 'fr' ? 'messages_fr' : 'messages_en';
}

/**
 * Get or create today's conversation
 */
export async function getOrCreateTodayConversation(subject: string): Promise<number> {
  const { data, error } = await supabase.rpc('get_or_create_today_conversation', {
    p_subject: subject
  });

  if (error) {
    console.error('Error getting/creating conversation:', error);
    throw error;
  }

  return data as number;
}

/**
 * Get today's conversation with messages in specified language
 */
export async function getTodayConversation(language: 'en' | 'fr' = 'en'): Promise<{ conversation: Conversation | null; messages: Message[] }> {
  const today = new Date().toISOString().split('T')[0];
  const messagesTable = getMessagesTable(language);

  // Get conversation
  const { data: conversationData, error: conversationError } = await supabase
    .from('conversations')
    .select('*')
    .eq('conversation_date', today)
    .single();

  if (conversationError) {
    if (conversationError.code === 'PGRST116') {
      return { conversation: null, messages: [] };
    }
    console.error('Error fetching conversation:', conversationError);
    throw conversationError;
  }

  // Get messages in the requested language
  const { data: messagesData, error: messagesError } = await supabase
    .from(messagesTable)
    .select('*')
    .eq('conversation_id', conversationData.id)
    .order('message_order', { ascending: true });

  if (messagesError) {
    console.error(`Error fetching ${language} messages:`, messagesError);
    throw messagesError;
  }

  // Transform messages
  const messages: Message[] = (messagesData || []).map((msg: DBMessage, index: number) => ({
    id: index + 1,
    sender: msg.sender as "ChatGPT" | "Claude" | "Human",
    content: msg.content,
    timestamp: msg.timestamp,
  }));

  return {
    conversation: conversationData,
    messages
  };
}

/**
 * Save a bilingual message (saves to both EN and FR tables)
 */
export async function saveBilingualMessage(
  conversationId: number,
  sender: "ChatGPT" | "Claude" | "Human",
  contentEn: string,
  contentFr: string,
  messageOrder: number
): Promise<void> {
  // Save English version
  const { error: errorEn } = await supabase
    .from('messages_en')
    .insert({
      conversation_id: conversationId,
      sender,
      content: contentEn,
      message_order: messageOrder
    });

  if (errorEn) {
    console.error('Error saving English message:', errorEn);
    throw errorEn;
  }

  // Save French version
  const { error: errorFr } = await supabase
    .from('messages_fr')
    .insert({
      conversation_id: conversationId,
      sender,
      content: contentFr,
      message_order: messageOrder
    });

  if (errorFr) {
    console.error('Error saving French message:', errorFr);
    throw errorFr;
  }
}

/**
 * Get all historical conversations
 */
export async function getAllConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('conversation_date', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get messages for a specific conversation in specified language
 */
export async function getConversationMessages(
  conversationId: number,
  language: 'en' | 'fr' = 'en'
): Promise<Message[]> {
  const messagesTable = getMessagesTable(language);

  const { data, error } = await supabase
    .from(messagesTable)
    .select('*')
    .eq('conversation_id', conversationId)
    .order('message_order', { ascending: true });

  if (error) {
    console.error(`Error fetching ${language} messages:`, error);
    throw error;
  }

  return (data || []).map((msg: DBMessage, index: number) => ({
    id: index + 1,
    sender: msg.sender as "ChatGPT" | "Claude" | "Human",
    content: msg.content,
    timestamp: msg.timestamp,
  }));
}

// ============================================
// DAILY SUBJECTS
// ============================================

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

export interface DailySubject {
  id: number;
  date: string;
  subject: string;
  created_at: string;
}

export async function getTodaySubject(): Promise<string> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_subjects')
    .select('*')
    .eq('date', today)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching daily subject:', error);
    throw error;
  }

  if (data) {
    return data.subject as string;
  }

  return await createTodaySubject();
}

async function createTodaySubject(): Promise<string> {
  const today = new Date().toISOString().split('T')[0];
  const date = new Date();
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const index = dayOfYear % SUBJECTS.length;
  const subject = SUBJECTS[index];

  const { error } = await supabase
    .from('daily_subjects')
    .insert({
      date: today,
      subject: subject
    });

  if (error) {
    console.error('Error creating daily subject:', error);
    throw error;
  }

  return subject;
}

export async function getSubjectForDate(date: Date): Promise<string | null> {
  const dateString = date.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_subjects')
    .select('*')
    .eq('date', dateString)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching subject for date:', error);
    throw error;
  }

  return data.subject as string;
}

export async function getAllDailySubjects(): Promise<DailySubject[]> {
  const { data, error } = await supabase
    .from('daily_subjects')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching all daily subjects:', error);
    throw error;
  }

  return data || [];
}
