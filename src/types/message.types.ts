export type AISender = "ChatGPT" | "Claude";
export type MessageSender = AISender | "Human";

export interface Message {
  id: number;
  sender: MessageSender;
  content: string;
  timestamp: string;
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
