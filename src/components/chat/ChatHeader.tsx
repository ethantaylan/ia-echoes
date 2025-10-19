/**
 * ChatHeader Component
 * Displays today's subject and history button
 */
import { useTranslation } from "react-i18next";
import { translateSubject } from "../../utils/subjectTranslation.utils";

interface ChatHeaderProps {
  subject: string;
  onOpenHistory: () => void;
}

export const ChatHeader = ({ subject, onOpenHistory }: ChatHeaderProps) => {
  const { t } = useTranslation();

  return (
    <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-white/10 bg-white/5 flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm text-white/50 mb-1">
          {t("chat.todaysSubject")}
        </p>
        <h3 className="text-lg sm:text-2xl font-bold text-white line-clamp-2">
          {translateSubject(subject, t)}
        </h3>
      </div>

      {/* History Button */}
      <button
        onClick={onOpenHistory}
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
  );
};
