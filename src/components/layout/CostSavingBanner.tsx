/**
 * CostSavingBanner Component
 * Shows the 5-minute message interval info
 */
import { useTranslation } from "react-i18next";

interface CostSavingBannerProps {
  isVisible: boolean;
}

export const CostSavingBanner = ({ isVisible }: CostSavingBannerProps) => {
  const { t } = useTranslation();

  if (!isVisible) return null;

  return (
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
  );
};
