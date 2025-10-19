export interface Conversation {
  id: number;
  conversation_date: string;
  subject: string;
  created_at: string;
}

export interface ConversationWithMessages {
  conversation: Conversation | null;
  messages: import('./message.types').Message[];
}
