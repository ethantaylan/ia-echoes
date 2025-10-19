import { useState, useEffect, useRef } from "react";
import "./App.css";
import { useTranslation } from "react-i18next";
import { callOpenAI, callClaude } from "./services/aiService";
import {
  getTodayConversation,
  getOrCreateTodayConversation,
  saveMessage,
  supabase,
} from "./services/supabaseService";
import { CONVERSATION_INTERVAL_MS } from "./constants/config";
import { useSleepSchedule } from "./hooks/useSleepSchedule";
import { isInSleepPeriod } from "./utils/schedule.utils";
// Removed MyMemory translation service - AI messages are displayed in original language
import { getTodaySubject as getTodaySubjectFromDB } from "./services/supabaseService";
import { translateSubject } from "./utils/subjectTranslation.utils";

interface Message {
  sender: "ChatGPT" | "Claude" | "Human";
  content: string;
  timestamp: string;
  id: number;
  status?: "sent" | "read";
}

export default function App() {
  const { t, i18n } = useTranslation();
  // const selectedBackground = "/src/assets/bg2.mp4";

  // State for today's subject (loaded from DB as full text)
  const [subjectText, setSubjectText] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingAI, setTypingAI] = useState<"ChatGPT" | "Claude" | null>(null);
  const [nextSpeaker, setNextSpeaker] = useState<"ChatGPT" | "Claude">(
    "ChatGPT"
  );
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageCount, setMessageCount] = useState(0);
  const conversationTimerRef = useRef<number | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const localMessageIds = useRef<Set<number>>(new Set());

  // Sleep schedule hook for cost optimization (with translations)
  const {
    isSleeping,
    shouldSleep,
    shouldWake,
    getGoodnightMessage,
    getGoodMorningMessage,
  } = useSleepSchedule({ t });

  // Language switcher
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]); // Scroll when messages change OR when typing state changes

  // No translation needed - AI messages are displayed in their original language
  // Only UI elements are translated using i18next static files

  // Set up Supabase Realtime subscription for new messages
  useEffect(() => {
    if (!conversationId) return;

    // Subscribe to new messages in real-time
    const channel = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log("New message received via Realtime:", payload);

          // Add the new message to the UI
          const newMsg = payload.new as {
            sender: string;
            content: string;
            message_order: number;
          };

          // Skip if this message was created locally (optimistic update)
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
            timestamp: "Just now",
          };

          setMessages((prev) => {
            // Double-check for duplicates based on message_order
            const exists = prev.some((m) => m.id === message.id);
            if (exists) return prev;

            // Add message and sort by ID (message_order) to maintain chronological order
            const updated = [...prev, message];
            return updated.sort((a, b) => a.id - b.id);
          });

          // Update next speaker based on who just spoke
          setNextSpeaker(newMsg.sender === "ChatGPT" ? "Claude" : "ChatGPT");
          setMessageCount((prev) => Math.max(prev, newMsg.message_order));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, messages.length]);

  // Load today's subject and conversation on mount
  useEffect(() => {
    const loadTodayConversation = async () => {
      try {
        setIsLoading(true);

        // Get today's subject from DB (full text like "Time and Existence")
        const todaySubject = await getTodaySubjectFromDB();
        setSubjectText(todaySubject);

        // Now load the conversation
        const { conversation, messages: loadedMessages } =
          await getTodayConversation();

        if (conversation && loadedMessages.length > 0) {
          // Load existing conversation
          setConversationId(conversation.id);
          setMessages(loadedMessages);
          setMessageCount(loadedMessages.length);

          // Set next speaker based on last message
          const lastMessage = loadedMessages[loadedMessages.length - 1];
          let nextAI: "ChatGPT" | "Claude" = "ChatGPT";
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
          // Create new conversation for today - NO hardcoded messages
          // All messages will be generated by AI based on today's subject
          const newConversationId = await getOrCreateTodayConversation(
            todaySubject
          );
          setConversationId(newConversationId);

          // Start with empty conversation
          setMessages([]);
          setMessageCount(0);

          // ChatGPT will start the conversation about today's subject
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
  }, [t]);

  // Send goodnight message before sleep
  useEffect(() => {
    if (!shouldSleep || !conversationId || isTyping) return;

    const sendGoodnight = async () => {
      const goodnightContent = getGoodnightMessage(nextSpeaker);

      const newMessage: Message = {
        id: messageCount + 1,
        sender: nextSpeaker,
        content: goodnightContent,
        timestamp: "Just now",
      };

      // Track this as a local message
      localMessageIds.current.add(messageCount + 1);

      setMessages((prev) => {
        const updated = [...prev, newMessage];
        // Always sort by ID to maintain chronological order
        return updated.sort((a, b) => a.id - b.id);
      });
      setMessageCount((prev) => prev + 1);

      // Save to database
      await saveMessage(
        conversationId,
        nextSpeaker,
        goodnightContent,
        messageCount + 1
      );

      // Stop typing indicator
      setIsTyping(false);
      setTypingAI(null);
    };

    sendGoodnight();
  }, [
    shouldSleep,
    conversationId,
    isTyping,
    nextSpeaker,
    messageCount,
    getGoodnightMessage,
  ]);

  // Send good morning message after wake up
  useEffect(() => {
    if (!shouldWake || !conversationId || isTyping) return;

    const sendGoodMorning = async () => {
      const morningContent = getGoodMorningMessage(nextSpeaker);

      const newMessage: Message = {
        id: messageCount + 1,
        sender: nextSpeaker,
        content: morningContent,
        timestamp: "Just now",
      };

      // Track this as a local message
      localMessageIds.current.add(messageCount + 1);

      setMessages((prev) => {
        const updated = [...prev, newMessage];
        // Always sort by ID to maintain chronological order
        return updated.sort((a, b) => a.id - b.id);
      });
      setMessageCount((prev) => prev + 1);

      // Save to database
      await saveMessage(
        conversationId,
        nextSpeaker,
        morningContent,
        messageCount + 1
      );

      // Switch to next AI
      const nextAI = nextSpeaker === "ChatGPT" ? "Claude" : "ChatGPT";
      setNextSpeaker(nextAI);

      // Show typing for next AI
      setTimeout(() => {
        setIsTyping(true);
        setTypingAI(nextAI);
      }, 5000);
    };

    sendGoodMorning();
  }, [
    shouldWake,
    conversationId,
    isTyping,
    nextSpeaker,
    messageCount,
    getGoodMorningMessage,
  ]);

  // Add new AI message with optimistic UI update
  const addAIMessage = async (speaker: "ChatGPT" | "Claude") => {
    if (!conversationId || isLoading || !subjectText) return;

    setError(null);

    try {
      let content: string;

      if (speaker === "ChatGPT") {
        content = await callOpenAI(messages, subjectText);
      } else {
        content = await callClaude(messages, subjectText);
      }

      // OPTIMISTIC UI: Add the message to UI immediately
      const newMessageOrder = messageCount + 1;
      const newMessage: Message = {
        id: newMessageOrder,
        sender: speaker,
        content: content,
        timestamp: "Just now",
      };

      // Track this as a local message to prevent duplicate from Realtime
      localMessageIds.current.add(newMessageOrder);

      setMessages((prev) => {
        const updated = [...prev, newMessage];
        // Always sort by ID to maintain chronological order
        return updated.sort((a, b) => a.id - b.id);
      });
      setMessageCount(newMessageOrder);

      // Switch to the other AI for next turn
      const nextAI = speaker === "ChatGPT" ? "Claude" : "ChatGPT";
      setNextSpeaker(nextAI);

      // Save to Supabase in the background (non-blocking)
      // This will trigger Realtime for other clients, but we already showed it locally
      saveMessage(conversationId, speaker, content, newMessageOrder).catch(
        (err) => {
          console.error("Failed to save message to Supabase:", err);
          // We don't remove the message from UI even if save fails
          // The message is already displayed, this ensures smooth UX
        }
      );

      // Stop current typing indicator
      setIsTyping(false);
      setTypingAI(null);

      // Wait 5 seconds before showing typing for the NEXT AI
      // This gives time for the AI to "read" the message that was just sent
      // Makes the conversation feel more natural and human-like
      setTimeout(() => {
        setIsTyping(true);
        setTypingAI(nextAI);
      }, 5000); // 5 seconds "reading time"
    } catch (err) {
      console.error(`Error getting ${speaker} response:`, err);
      setError(`Failed to get ${speaker} response. Check your API keys.`);
      setIsTyping(false);
      setTypingAI(null);
    }
  };

  // Conversation loop - with sleep schedule (5 minutes interval)
  useEffect(() => {
    // Don't start the loop until data is loaded
    if (isLoading || !conversationId) return;

    // IMPORTANT: Don't run during sleep period! (2:00-8:00 AM)
    if (isSleeping) {
      console.log("💤 AIs are sleeping (2:00-8:00). No API calls.");
      // Hide typing indicator during sleep
      setIsTyping(false);
      setTypingAI(null);
      return;
    }

    // Start the conversation loop
    conversationTimerRef.current = window.setInterval(() => {
      // Double-check we're not sleeping
      if (isInSleepPeriod()) {
        console.log("💤 Sleep period started. Stopping conversation.");
        return;
      }

      addAIMessage(nextSpeaker);
    }, CONVERSATION_INTERVAL_MS); // 5 minutes = 300000ms

    return () => {
      if (conversationTimerRef.current) {
        clearInterval(conversationTimerRef.current);
      }
    };
  }, [
    nextSpeaker,
    messages,
    messageCount,
    subjectText,
    isLoading,
    conversationId,
    isSleeping,
  ]);

  return (
    <div className="min-h-screen w-screen bg-black relative overflow-hidden flex flex-col">
      {/* Local Video Background */}
      {/* <div className="absolute inset-0 w-full h-full overflow-hidden grayscale">
        <video
          key={selectedBackground}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={selectedBackground} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/90"></div>
      </div> */}

      {/* Loading Screen */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/95">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white/60 text-sm">
              Loading today&rsquo;s conversation...
            </p>
          </div>
        </div>
      )}

      {/* Language Switcher - Top Right */}
      <div className="absolute top-4 right-4 z-20 flex gap-1 bg-black/40 backdrop-blur-sm rounded-lg border border-white/20 p-1">
        <button
          onClick={() => changeLanguage("en")}
          className={`px-2 py-1 text-xs rounded transition-all ${
            i18n.language === "en"
              ? "bg-white/20 text-white font-bold"
              : "text-white/50 hover:text-white/80"
          }`}
          title="English"
        >
          EN
        </button>
        <button
          onClick={() => changeLanguage("fr")}
          className={`px-2 py-1 text-xs rounded transition-all ${
            i18n.language === "fr"
              ? "bg-white/20 text-white font-bold"
              : "text-white/50 hover:text-white/80"
          }`}
          title="Français"
        >
          FR
        </button>
      </div>

      {/* Sleep Mode Indicator */}
      {isSleeping && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-purple-500/20 border border-purple-500/50 backdrop-blur-sm rounded-lg px-4 py-2 text-purple-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">😴</span>
            <div>
              <p className="font-bold">{t("sleepMode.title")}</p>
              <p className="opacity-75">
                {t("sleepMode.subtitle")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cost-Saving Info Banner - Only when NOT sleeping - SMALLER */}
      {!isSleeping && !isLoading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-orange-500/15 border border-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-[10px] sm:text-xs max-w-[85%] sm:max-w-none">
          <div className="flex items-center gap-1.5 justify-center">
            <span className="text-xs sm:text-sm">💸</span>
            <p className="font-medium">
              {t("costSaving.interval")}
              <span className="hidden sm:inline text-emerald-300/80">
                {" "}
                — {t("costSaving.reasonFull")}
              </span>
              <span className="inline sm:hidden text-emerald-300/80">
                {" "}
                — {t("costSaving.reason")}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Error Display - Top Right */}
      {error && (
        <div className="absolute top-6 right-6 z-20 bg-red-500/20 border border-red-500/50 backdrop-blur-sm rounded-lg px-4 py-2 text-red-200 text-sm max-w-xs">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 md:p-8">
        {/* Main Layout */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 md:gap-8 w-full max-w-[1600px] py-4">
          {/* Left Avatar: ChatGPT */}
          <div className="hidden lg:flex flex-col items-center justify-center gap-6 w-64">
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full opacity-30 blur-2xl group-hover:opacity-50 transition-opacity duration-500"></div>
              <div
                onClick={() => window.open("https://chatgpt.com/")}
                className="cursor-pointer relative w-40 h-40 rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/50 border-4 border-emerald-400/40 group-hover:scale-105 transition-transform duration-300"
              >
                <svg
                  className="w-20 h-20 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold bg-gradient-to-br from-emerald-300 to-teal-400 bg-clip-text text-transparent mb-1">
                ChatGPT
              </h3>
              <p className="text-xs text-emerald-400/70 font-medium tracking-wider uppercase">
                Rationalist
              </p>
              <div className="mt-4 text-xs text-white/40 italic leading-relaxed max-w-[200px]">
                &ldquo;Logic is the beginning of wisdom, not the end.&rdquo;
              </div>
            </div>
          </div>

          {/* Center: Conversation Theater */}
          <div className="flex flex-col w-full lg:w-[700px] max-w-4xl">
            <div className="h-[600px] sm:h-[700px] lg:h-[700px] bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
              {/* Subject Header */}
              <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-white/10 bg-white/5 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-white/50 mb-1">
                    {t('chat.todaysSubject')}
                  </p>
                  <h3 className="text-lg sm:text-2xl font-bold text-white line-clamp-2">
                    {translateSubject(subjectText, t)}
                  </h3>
                </div>

                {/* History Button */}
                <button
                  onClick={() => setIsHistoryOpen(true)}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-2 text-white transition-all hover:bg-white/20 hover:scale-110 flex items-center justify-center group flex-shrink-0"
                  title="View History"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 scroll-smooth">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${
                      message.sender === "Human" ? "justify-center" : ""
                    } animate-fade-in`}
                  >
                    {message.sender !== "Human" && (
                      <div
                        className={`flex w-full ${
                          message.sender === "Claude"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div className="w-full sm:w-[90%] md:w-[85%]">
                          <div
                            className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-sm border-2 transition-all duration-300 hover:scale-[1.01] sm:hover:scale-[1.02] ${
                              message.sender === "ChatGPT"
                                ? "bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border-emerald-500/30 hover:border-emerald-400/50"
                                : "bg-gradient-to-br from-orange-900/40 to-red-900/40 border-orange-500/30 hover:border-orange-400/50"
                            }`}
                          >
                            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                              <span
                                className={`text-xs sm:text-sm font-bold tracking-wide ${
                                  message.sender === "ChatGPT"
                                    ? "text-emerald-300"
                                    : "text-orange-300"
                                }`}
                              >
                                {message.sender}
                              </span>
                              <span className="text-[10px] sm:text-xs text-white/40">
                                {message.timestamp}
                              </span>
                            </div>
                            <p className="text-sm sm:text-base leading-relaxed text-white">
                              {message.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {message.sender === "Human" && (
                      <div className="w-full">
                        <div className="rounded-2xl p-5 bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-2 border-white/20 backdrop-blur-sm">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                            <span className="text-sm font-bold text-white tracking-wide">
                              HUMAN PERSPECTIVE
                            </span>
                            <span className="text-xs text-white/40">
                              {message.timestamp}
                            </span>
                          </div>
                          <p className="text-base leading-relaxed text-white/90 italic">
                            &ldquo;{message.content}&rdquo;
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing Indicator - Only show when NOT sleeping */}
                {isTyping && typingAI && !isSleeping && (
                  <div
                    className={`flex w-full ${
                      typingAI === "Claude" ? "justify-end" : "justify-start"
                    } animate-fade-in`}
                  >
                    <div className="w-full sm:w-[90%] md:w-[85%]">
                      <div
                        className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-sm border-2 ${
                          typingAI === "ChatGPT"
                            ? "bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border-emerald-500/30"
                            : "bg-gradient-to-br from-orange-900/40 to-red-900/40 border-orange-500/30"
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <span
                            className={`text-sm font-bold tracking-wide ${
                              typingAI === "ChatGPT"
                                ? "text-emerald-300"
                                : "text-orange-300"
                            }`}
                          >
                            {typingAI}
                          </span>
                          <span className="text-xs text-white/40">
                            typing...
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div
                            className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>

          {/* Right Avatar: Claude */}
          <div className="hidden lg:flex flex-col items-center justify-center gap-6 w-64">
            <div className="relative group">
              <div className="cursor-pointer absolute -inset-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-full opacity-30 blur-2xl group-hover:opacity-50 transition-opacity duration-500"></div>
              <div
                onClick={() => window.open("https://claude.ai/")}
                className="cursor-pointer relative w-40 h-40 rounded-full bg-gradient-to-br from-orange-400 via-red-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-orange-500/50 border-4 border-orange-400/40 group-hover:scale-105 transition-transform duration-300"
              >
                <svg
                  className="w-20 h-20 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.3 2C18.4 2 19.4 2.4 20.1 3.1 20.8 3.8 21.2 4.8 21.2 5.9V18.1C21.2 19.2 20.8 20.2 20.1 20.9 19.4 21.6 18.4 22 17.3 22H6.7C5.6 22 4.6 21.6 3.9 20.9 3.2 20.2 2.8 19.2 2.8 18.1V5.9C2.8 4.8 3.2 3.8 3.9 3.1 4.6 2.4 5.6 2 6.7 2H17.3M12 6C10.9 6 9.9 6.5 9.2 7.2 8.5 7.9 8 8.9 8 10V14C8 15.1 8.5 16.1 9.2 16.8 9.9 17.5 10.9 18 12 18 13.1 18 14.1 17.5 14.8 16.8 15.5 16.1 16 15.1 16 14V10C16 8.9 15.5 7.9 14.8 7.2 14.1 6.5 13.1 6 12 6Z" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold bg-gradient-to-br from-orange-300 to-red-400 bg-clip-text text-transparent mb-1">
                Claude
              </h3>
              <p className="text-xs text-orange-400/70 font-medium tracking-wider uppercase">
                Humanist
              </p>
              <div className="mt-4 text-xs text-white/40 italic leading-relaxed max-w-[200px]">
                &ldquo;In collaboration, we find meaning beyond
                computation.&rdquo;
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setIsHistoryOpen(false)}
          ></div>

          {/* Modal Container */}
          <div className="relative w-full max-w-5xl h-[95vh] sm:h-[90vh] bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl sm:rounded-3xl border-2 border-white/20 shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="relative px-4 sm:px-8 py-4 sm:py-6 border-b border-white/10 bg-gradient-to-r from-emerald-900/20 via-purple-900/20 to-orange-900/20">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">
                    The Chronicle
                  </h2>
                  <p className="text-xs sm:text-sm text-white/60 line-clamp-2">
                    {t('history.subtitle')}{" "}
                    <span className="text-white/90 font-medium">
                      {translateSubject(subjectText, t)}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all hover:scale-110 hover:rotate-90 duration-300 flex-shrink-0"
                >
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Stats Bar */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-3 sm:mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-emerald-400"></div>
                  <span className="text-[10px] sm:text-xs text-white/70">
                    ChatGPT:{" "}
                    <span className="font-bold text-emerald-400">
                      {messages.filter((m) => m.sender === "ChatGPT").length}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-orange-400"></div>
                  <span className="text-[10px] sm:text-xs text-white/70">
                    Claude:{" "}
                    <span className="font-bold text-orange-400">
                      {messages.filter((m) => m.sender === "Claude").length}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-white"></div>
                  <span className="text-[10px] sm:text-xs text-white/70">
                    Total:{" "}
                    <span className="font-bold text-white">
                      {messages.length}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Messages Timeline */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
              <div className="relative">
                {/* Vertical Timeline Line */}
                <div className="absolute left-4 sm:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 via-purple-500 to-orange-500 opacity-30"></div>

                {/* Messages */}
                <div className="space-y-4 sm:space-y-6">
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      className="relative pl-12 sm:pl-20 animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Timeline Dot */}
                      <div
                        className={`absolute left-2.5 sm:left-6 top-3 sm:top-4 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 sm:border-4 ${
                          message.sender === "ChatGPT"
                            ? "bg-emerald-400 border-emerald-900"
                            : message.sender === "Claude"
                            ? "bg-orange-400 border-orange-900"
                            : "bg-white border-gray-900"
                        } shadow-lg`}
                      ></div>

                      {/* Message Card */}
                      <div
                        className={`group relative rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-sm border-2 transition-all duration-300 hover:scale-[1.01] sm:hover:scale-[1.02] hover:shadow-2xl ${
                          message.sender === "ChatGPT"
                            ? "bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border-emerald-500/30 hover:border-emerald-400/60"
                            : message.sender === "Claude"
                            ? "bg-gradient-to-br from-orange-900/30 to-red-900/30 border-orange-500/30 hover:border-orange-400/60"
                            : "bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-white/20 hover:border-white/40"
                        }`}
                      >
                        {/* Message Header */}
                        <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            {message.sender === "ChatGPT" && (
                              <svg
                                className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
                              </svg>
                            )}
                            {message.sender === "Claude" && (
                              <svg
                                className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 flex-shrink-0"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M17.3 2C18.4 2 19.4 2.4 20.1 3.1 20.8 3.8 21.2 4.8 21.2 5.9V18.1C21.2 19.2 20.8 20.2 20.1 20.9 19.4 21.6 18.4 22 17.3 22H6.7C5.6 22 4.6 21.6 3.9 20.9 3.2 20.2 2.8 19.2 2.8 18.1V5.9C2.8 4.8 3.2 3.8 3.9 3.1 4.6 2.4 5.6 2 6.7 2H17.3M12 6C10.9 6 9.9 6.5 9.2 7.2 8.5 7.9 8 8.9 8 10V14C8 15.1 8.5 16.1 9.2 16.8 9.9 17.5 10.9 18 12 18 13.1 18 14.1 17.5 14.8 16.8 15.5 16.1 16 15.1 16 14V10C16 8.9 15.5 7.9 14.8 7.2 14.1 6.5 13.1 6 12 6Z" />
                              </svg>
                            )}
                            {message.sender === "Human" && (
                              <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white flex-shrink-0"></div>
                            )}
                            <span
                              className={`text-xs sm:text-sm font-bold tracking-wide truncate ${
                                message.sender === "ChatGPT"
                                  ? "text-emerald-300"
                                  : message.sender === "Claude"
                                  ? "text-orange-300"
                                  : "text-white"
                              }`}
                            >
                              {message.sender}
                            </span>
                          </div>
                          <span className="text-[10px] sm:text-xs text-white/40 group-hover:text-white/60 transition-colors flex-shrink-0">
                            {message.timestamp}
                          </span>
                        </div>

                        {/* Message Content */}
                        <p className="text-sm sm:text-base leading-relaxed text-white/90 group-hover:text-white transition-colors">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 border-t border-white/10 bg-gradient-to-r from-black/50 to-black/30 backdrop-blur-sm">
              <p className="text-xs text-white/50 text-center italic">
                &ldquo;An eternal conversation between minds, witnessed but
                untouched — a living digital artifact.&rdquo;
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
