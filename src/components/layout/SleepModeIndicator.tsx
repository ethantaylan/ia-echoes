/**
 * SleepModeIndicator Component
 * Shows when AIs are in sleep mode (2AM-8AM)
 */
import { useTranslation } from "react-i18next";

interface SleepModeIndicatorProps {
  isSleeping: boolean;
}

export const SleepModeIndicator = ({ isSleeping }: SleepModeIndicatorProps) => {
  const { t } = useTranslation();

  if (!isSleeping) return null;

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-purple-500/20 border border-purple-500/50 backdrop-blur-sm rounded-lg px-4 py-2 text-purple-200 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-base">😴</span>
        <div>
          <p className="font-bold">{t("sleepMode.title")}</p>
          <p className="opacity-75">{t("sleepMode.subtitle")}</p>
        </div>
      </div>
    </div>
  );
};
