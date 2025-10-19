/**
 * Message Component
 * Displays a single message from ChatGPT, Claude, or Human
 */
import { formatRelativeTime } from "../../utils/timestamp.utils";
import type { Message as MessageType } from "../../types";

interface MessageProps {
  message: MessageType;
}

export const Message = ({ message }: MessageProps) => {
  if (message.sender === "Human") {
    return (
      <div className="flex justify-center animate-fade-in">
        <div className="w-full">
          <div className="rounded-2xl p-5 bg-gradient-to-br from-gray-900/50 to-gray-800/50 border-2 border-white/20 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-white"></div>
              <span className="text-sm font-bold text-white tracking-wide">
                HUMAN PERSPECTIVE
              </span>
              <span className="text-xs text-white/40">
                {formatRelativeTime(message.timestamp)}
              </span>
            </div>
            <p className="text-base leading-relaxed text-white/90 italic">
              &ldquo;{message.content}&rdquo;
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex w-full ${message.sender === "Claude" ? "justify-end" : "justify-start"} animate-fade-in`}>
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
                message.sender === "ChatGPT" ? "text-emerald-300" : "text-orange-300"
              }`}
            >
              {message.sender}
            </span>
            <span className="text-[10px] sm:text-xs text-white/40">
              {formatRelativeTime(message.timestamp)}
            </span>
          </div>
          <p className="text-sm sm:text-base leading-relaxed text-white">
            {message.content}
          </p>
        </div>
      </div>
    </div>
  );
};
