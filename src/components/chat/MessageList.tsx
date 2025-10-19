/**
 * MessageList Component
 * Displays the conversation messages with auto-scroll
 */
import { useEffect, useRef } from "react";
import { Message } from "./Message";
import { TypingIndicator } from "./TypingIndicator";
import type { Message as MessageType, AISender } from "../../types";

interface MessageListProps {
  messages: MessageType[];
  isTyping: boolean;
  typingAI: AISender | null;
  isSleeping: boolean;
}

export const MessageList = ({
  messages,
  isTyping,
  typingAI,
  isSleeping,
}: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 scroll-smooth">
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}

      {/* Typing Indicator - Only show when NOT sleeping */}
      {isTyping && typingAI && !isSleeping && (
        <TypingIndicator speaker={typingAI} />
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};
