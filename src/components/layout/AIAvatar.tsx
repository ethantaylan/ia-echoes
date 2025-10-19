/**
 * AIAvatar Component
 * Displays an AI avatar (ChatGPT or Claude) with branding
 */
import type { AISender } from "../../types";

interface AIAvatarProps {
  type: AISender;
}

const avatarConfig = {
  ChatGPT: {
    gradientRing: "from-emerald-500 to-teal-500",
    gradientBg: "from-emerald-400 via-teal-500 to-emerald-600",
    borderColor: "border-emerald-400/40",
    shadowColor: "shadow-emerald-500/50",
    textGradient: "from-emerald-300 to-teal-400",
    roleColor: "text-emerald-400/70",
    role: "Rationalist",
    quote: "Logic is the beginning of wisdom, not the end.",
    url: "https://chatgpt.com/",
    icon: (
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
    ),
  },
  Claude: {
    gradientRing: "from-orange-500 to-red-500",
    gradientBg: "from-orange-400 via-red-500 to-orange-600",
    borderColor: "border-orange-400/40",
    shadowColor: "shadow-orange-500/50",
    textGradient: "from-orange-300 to-red-400",
    roleColor: "text-orange-400/70",
    role: "Humanist",
    quote: "In collaboration, we find meaning beyond computation.",
    url: "https://claude.ai/",
    icon: (
      <path d="M17.3 2C18.4 2 19.4 2.4 20.1 3.1 20.8 3.8 21.2 4.8 21.2 5.9V18.1C21.2 19.2 20.8 20.2 20.1 20.9 19.4 21.6 18.4 22 17.3 22H6.7C5.6 22 4.6 21.6 3.9 20.9 3.2 20.2 2.8 19.2 2.8 18.1V5.9C2.8 4.8 3.2 3.8 3.9 3.1 4.6 2.4 5.6 2 6.7 2H17.3M12 6C10.9 6 9.9 6.5 9.2 7.2 8.5 7.9 8 8.9 8 10V14C8 15.1 8.5 16.1 9.2 16.8 9.9 17.5 10.9 18 12 18 13.1 18 14.1 17.5 14.8 16.8 15.5 16.1 16 15.1 16 14V10C16 8.9 15.5 7.9 14.8 7.2 14.1 6.5 13.1 6 12 6Z" />
    ),
  },
};

export const AIAvatar = ({ type }: AIAvatarProps) => {
  const config = avatarConfig[type];

  return (
    <div className="hidden lg:flex flex-col items-center justify-center gap-6 w-64">
      <div className="relative group">
        <div
          className={`absolute -inset-4 bg-gradient-to-br ${config.gradientRing} rounded-full opacity-30 blur-2xl group-hover:opacity-50 transition-opacity duration-500`}
        ></div>
        <div
          onClick={() => window.open(config.url)}
          className={`cursor-pointer relative w-40 h-40 rounded-full bg-gradient-to-br ${config.gradientBg} flex items-center justify-center shadow-2xl ${config.shadowColor} border-4 ${config.borderColor} group-hover:scale-105 transition-transform duration-300`}
        >
          <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 24 24">
            {config.icon}
          </svg>
        </div>
      </div>
      <div className="text-center">
        <h3
          className={`text-2xl font-bold bg-gradient-to-br ${config.textGradient} bg-clip-text text-transparent mb-1`}
        >
          {type}
        </h3>
        <p className={`text-xs ${config.roleColor} font-medium tracking-wider uppercase`}>
          {config.role}
        </p>
        <div className="mt-4 text-xs text-white/40 italic leading-relaxed max-w-[200px]">
          &ldquo;{config.quote}&rdquo;
        </div>
      </div>
    </div>
  );
};
