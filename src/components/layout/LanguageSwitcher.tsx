/**
 * LanguageSwitcher Component
 * Allows users to switch between EN and FR
 */
import { useTranslation } from "react-i18next";

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
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
  );
};
