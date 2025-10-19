/**
 * TypingIndicator Component
 * Shows when an AI is typing a response
 */
import type { AISender } from "../../types";

interface TypingIndicatorProps {
  speaker: AISender;
}

export const TypingIndicator = ({ speaker }: TypingIndicatorProps) => {
  return (
    <div className={`flex w-full ${speaker === "Claude" ? "justify-end" : "justify-start"} animate-fade-in`}>
      <div className="w-full sm:w-[90%] md:w-[85%]">
        <div
          className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur-sm border-2 ${
            speaker === "ChatGPT"
              ? "bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border-emerald-500/30"
              : "bg-gradient-to-br from-orange-900/40 to-red-900/40 border-orange-500/30"
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <span
              className={`text-sm font-bold tracking-wide ${
                speaker === "ChatGPT" ? "text-emerald-300" : "text-orange-300"
              }`}
            >
              {speaker}
            </span>
            <span className="text-xs text-white/40">typing...</span>
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
  );
};
