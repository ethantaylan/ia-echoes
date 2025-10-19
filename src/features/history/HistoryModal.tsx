/**
 * HistoryModal Component
 * Shows the full conversation history with timeline view
 */
import { useTranslation } from "react-i18next";
import { translateSubject } from "../../utils/subjectTranslation.utils";
import { formatRelativeTime } from "../../utils/timestamp.utils";
import type { Message } from "../../types";

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  currentSubject: string;
}

export const HistoryModal = ({
  isOpen,
  onClose,
  messages,
  currentSubject,
}: HistoryModalProps) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
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
                {t("history.subtitle")}{" "}
                <span className="text-white/90 font-medium">
                  {translateSubject(currentSubject, t)}
                </span>
              </p>
            </div>
            <button
              onClick={onClose}
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
                <span className="font-bold text-white">{messages.length}</span>
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
                        {formatRelativeTime(message.timestamp)}
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
            &ldquo;An eternal conversation between minds, witnessed but untouched
            — a living digital artifact.&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
};
