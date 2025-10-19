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
 * Get today's conversation with all messages
 */
export async function getTodayConversation(): Promise<{ conversation: Conversation | null; messages: Message[] }> {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Get conversation
  const { data: conversationData, error: conversationError } = await supabase
    .from('conversations')
    .select('*')
    .eq('conversation_date', today)
    .single();

  if (conversationError) {
    if (conversationError.code === 'PGRST116') {
      // No conversation found for today
      return { conversation: null, messages: [] };
    }
    console.error('Error fetching conversation:', conversationError);
    throw conversationError;
  }

  // Get messages
  const { data: messagesData, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationData.id)
    .order('message_order', { ascending: true });

  if (messagesError) {
    console.error('Error fetching messages:', messagesError);
    throw messagesError;
  }

  // Transform messages to match the app format
  const messages: Message[] = (messagesData || []).map((msg: DBMessage, index: number) => ({
    id: index + 1, // Use sequential IDs for the app
    sender: msg.sender as "ChatGPT" | "Claude" | "Human",
    content: msg.content,
    timestamp: formatTimestamp(msg.timestamp),
  }));

  return {
    conversation: conversationData,
    messages
  };
}

/**
 * Save a new message to today's conversation
 */
export async function saveMessage(
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
    console.error('Error saving message:', error);
    throw error;
  }
}

/**
 * Get all historical conversations (for history view)
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
 * Get messages for a specific conversation
 */
export async function getConversationMessages(conversationId: number): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('message_order', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }

  return (data || []).map((msg: DBMessage, index: number) => ({
    id: index + 1,
    sender: msg.sender as "ChatGPT" | "Claude" | "Human",
    content: msg.content,
    timestamp: formatTimestamp(msg.timestamp),
  }));
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  return date.toLocaleDateString();
}

// ============================================
// DAILY SUBJECTS - Store subject for each day
// ============================================

// List of all philosophical subjects (full text)
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

/**
 * Get today's subject from database, or create one if it doesn't exist
 * Returns the full subject text (e.g., "Time and Existence")
 */
export async function getTodaySubject(): Promise<string> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  // Try to get existing subject for today
  const { data, error } = await supabase
    .from('daily_subjects')
    .select('*')
    .eq('date', today)
    .single();

  if (error && error.code !== 'PGRST116') {
    // Error other than "not found"
    console.error('Error fetching daily subject:', error);
    throw error;
  }

  if (data) {
    // Subject exists for today
    return data.subject as string;
  }

  // No subject for today, create a new one
  return await createTodaySubject();
}

/**
 * Create a new subject for today using deterministic selection
 */
async function createTodaySubject(): Promise<string> {
  const today = new Date().toISOString().split('T')[0];

  // Use day of year for deterministic subject selection
  const date = new Date();
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const index = dayOfYear % SUBJECTS.length;
  const subject = SUBJECTS[index];

  // Save to database
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

/**
 * Get subject for a specific date
 */
export async function getSubjectForDate(date: Date): Promise<string | null> {
  const dateString = date.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_subjects')
    .select('*')
    .eq('date', dateString)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No subject found for this date
      return null;
    }
    console.error('Error fetching subject for date:', error);
    throw error;
  }

  return data.subject as string;
}

/**
 * Get all daily subjects (for historical view)
 */
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
