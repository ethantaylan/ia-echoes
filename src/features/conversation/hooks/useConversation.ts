/**
 * useConversation Hook
 * Manages conversation state, message loading, and real-time updates
 */
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  getTodayConversation,
  getOrCreateTodayConversation,
  supabase,
  getTodaySubject as getTodaySubjectFromDB,
} from "../../../services/supabaseBilingualService";
import type { Message, AISender } from "../../../types";

export const useConversation = () => {
  const { i18n } = useTranslation();
  const [subjectText, setSubjectText] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingAI, setTypingAI] = useState<AISender | null>(null);
  const [nextSpeaker, setNextSpeaker] = useState<AISender>("ChatGPT");
  const [error, setError] = useState<string | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const localMessageIds = useRef<Set<number>>(new Set());

  // Load today's conversation on mount
  useEffect(() => {
    const loadTodayConversation = async () => {
      try {
        setIsLoading(true);

        // Get today's subject from DB
        const todaySubject = await getTodaySubjectFromDB();
        setSubjectText(todaySubject);

        // Load conversation in current language
        const currentLang = i18n.language as "en" | "fr";
        const { conversation, messages: loadedMessages } =
          await getTodayConversation(currentLang);

        if (conversation && loadedMessages.length > 0) {
          // Load existing conversation
          setConversationId(conversation.id);
          setMessages(loadedMessages);
          setMessageCount(loadedMessages.length);

          // Set next speaker based on last message
          const lastMessage = loadedMessages[loadedMessages.length - 1];
          let nextAI: AISender = "ChatGPT";
          if (lastMessage.sender === "ChatGPT") {
            nextAI = "Claude";
            setNextSpeaker("Claude");
          } else if (lastMessage.sender === "Claude") {
            nextAI = "ChatGPT";
            setNextSpeaker("ChatGPT");
          }

          // Show typing indicator for the AI who will respond next
          setTimeout(() => {
            setIsTyping(true);
            setTypingAI(nextAI);
          }, 1000);
        } else {
          // Create new conversation for today
          const newConversationId = await getOrCreateTodayConversation(
            todaySubject
          );
          setConversationId(newConversationId);
          setMessages([]);
          setMessageCount(0);

          // ChatGPT will start the conversation
          setTimeout(() => {
            setIsTyping(true);
            setTypingAI("ChatGPT");
          }, 1000);
        }
      } catch (err) {
        console.error("Error loading conversation:", err);
        setError("Failed to load conversation. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };

    loadTodayConversation();
  }, [i18n]);

  // Reload messages when language changes
  useEffect(() => {
    const reloadMessagesInLanguage = async () => {
      if (!conversationId) return;

      try {
        const currentLang = i18n.language as "en" | "fr";
        const { messages: loadedMessages } = await getTodayConversation(
          currentLang
        );
        setMessages(loadedMessages);
        console.log(`✅ Messages reloaded in ${currentLang.toUpperCase()}`);
      } catch (err) {
        console.error("Error reloading messages in new language:", err);
      }
    };

    reloadMessagesInLanguage();
  }, [i18n.language, conversationId]);

  // Set up Supabase Realtime subscription
  useEffect(() => {
    if (!conversationId) return;

    const currentLang = i18n.language as "en" | "fr";
    const messagesTable = currentLang === "fr" ? "messages_fr" : "messages_en";

    const channel = supabase
      .channel(`${messagesTable}-channel`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: messagesTable,
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log("New message received via Realtime:", payload);

          const newMsg = payload.new as {
            sender: string;
            content: string;
            message_order: number;
            timestamp: string;
          };

          // Skip if this message was created locally
          if (localMessageIds.current.has(newMsg.message_order)) {
            console.log(
              "Skipping duplicate message (already added locally):",
              newMsg.message_order
            );
            return;
          }

          const message: Message = {
            id: newMsg.message_order,
            sender: newMsg.sender as "ChatGPT" | "Claude" | "Human",
            content: newMsg.content,
            timestamp: newMsg.timestamp || new Date().toISOString(),
          };

          setMessages((prev) => {
            const exists = prev.some((m) => m.id === message.id);
            if (exists) return prev;

            const updated = [...prev, message];
            return updated.sort((a, b) => a.id - b.id);
          });

          setNextSpeaker(newMsg.sender === "ChatGPT" ? "Claude" : "ChatGPT");
          setMessageCount((prev) => Math.max(prev, newMsg.message_order));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, i18n.language]);

  return {
    subjectText,
    messages,
    isTyping,
    typingAI,
    nextSpeaker,
    error,
    conversationId,
    isLoading,
    setIsTyping,
    setTypingAI,
    setMessages,
    setMessageCount,
    setNextSpeaker,
    messageCount,
    localMessageIds,
  };
};
