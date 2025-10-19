/**
 * App Component (Refactored)
 * Composition-only, clean architecture with SOLID principles
 * ~90 lines total - all logic delegated to hooks and components
 */
import { lazy, Suspense, useState, memo } from "react";
import "./App.css";
import { useTimestampUpdater } from "./hooks/useTimestampUpdater";
import { useSleepSchedule } from "./hooks/useSleepSchedule";
import { useConversation } from "./features/conversation/hooks/useConversation";
import { useTranslation } from "react-i18next";

// Lazy-loaded components for code splitting
const VideoBackground = lazy(() =>
  import("./components/layout/VideoBackground").then((m) => ({
    default: m.VideoBackground,
  }))
);
const LoadingSpinner = lazy(() =>
  import("./components/ui/LoadingSpinner").then((m) => ({
    default: m.LoadingSpinner,
  }))
);
const ErrorDisplay = lazy(() =>
  import("./components/ui/ErrorDisplay").then((m) => ({
    default: m.ErrorDisplay,
  }))
);
const LanguageSwitcher = lazy(() =>
  import("./components/layout/LanguageSwitcher").then((m) => ({
    default: m.LanguageSwitcher,
  }))
);
const SleepModeIndicator = lazy(() =>
  import("./components/layout/SleepModeIndicator").then((m) => ({
    default: m.SleepModeIndicator,
  }))
);
const CostSavingBanner = lazy(() =>
  import("./components/layout/CostSavingBanner").then((m) => ({
    default: m.CostSavingBanner,
  }))
);
const ChatHeader = lazy(() =>
  import("./components/chat/ChatHeader").then((m) => ({ default: m.ChatHeader }))
);
const MessageList = lazy(() =>
  import("./components/chat/MessageList").then((m) => ({
    default: m.MessageList,
  }))
);
const AIAvatar = lazy(() =>
  import("./components/layout/AIAvatar").then((m) => ({ default: m.AIAvatar }))
);
const HistoryModal = lazy(() =>
  import("./features/history/HistoryModal").then((m) => ({
    default: m.HistoryModal,
  }))
);
const SEOHead = lazy(() =>
  import("./components/seo/SEOHead").then((m) => ({ default: m.SEOHead }))
);

// Memoized container component
const ConversationContainer = memo(
  ({ children }: { children: React.ReactNode }) => (
    <div className="h-[600px] sm:h-[700px] lg:h-[700px] bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
      {children}
    </div>
  )
);
ConversationContainer.displayName = "ConversationContainer";

export default function App() {
  const { t } = useTranslation();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Auto-update timestamps every minute
  useTimestampUpdater(60000);

  // Sleep schedule for cost optimization
  const { isSleeping } = useSleepSchedule({ t });

  // Conversation state and logic
  const {
    subjectText,
    messages,
    isTyping,
    typingAI,
    error,
    isLoading,
  } = useConversation();

  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <div className="min-h-screen w-screen bg-black relative overflow-hidden flex flex-col">
        {/* SEO */}
        <SEOHead />

        {/* Background */}
        <VideoBackground />

        {/* Loading */}
        {isLoading && <LoadingSpinner message="Loading today's conversation..." />}

        {/* UI Overlays */}
        <LanguageSwitcher />
        <SleepModeIndicator isSleeping={isSleeping} />
        <CostSavingBanner isVisible={!isSleeping && !isLoading} />
        {error && <ErrorDisplay message={error} />}

        {/* Main Content */}
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4 md:p-8">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-4 md:gap-8 w-full max-w-[1600px] py-4">
            {/* Left Avatar: ChatGPT */}
            <AIAvatar type="ChatGPT" />

            {/* Center: Conversation */}
            <div className="flex flex-col w-full lg:w-[700px] max-w-4xl">
              <ConversationContainer>
                <ChatHeader
                  subject={subjectText}
                  onOpenHistory={() => setIsHistoryOpen(true)}
                />
                <MessageList
                  messages={messages}
                  isTyping={isTyping}
                  typingAI={typingAI}
                  isSleeping={isSleeping}
                />
              </ConversationContainer>
            </div>

            {/* Right Avatar: Claude */}
            <AIAvatar type="Claude" />
          </div>
        </div>

        {/* History Modal */}
        <HistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          messages={messages}
          currentSubject={subjectText}
        />
      </div>
    </Suspense>
  );
}
