import { useState, useEffect } from "react";
import { useTranslations } from "@/i18n/useTranslations";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
}

interface CountdownTimerProps {
  targetDate: string | null;
}

export const CountdownTimer = ({ targetDate }: CountdownTimerProps) => {
  const t = useTranslations("Dashboard");
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
  });

  useEffect(() => {
    if (!targetDate) return;

    const calculateTimeLeft = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const formatNumber = (num: number) => String(num).padStart(2, "0");

  return (
    <div className="grid grid-cols-3 gap-2 w-full mt-auto">
      <div className="countdown-box text-center w-full">
        <div className="countdown-number text-foreground font-semibold text-sm sm:text-base">
          {formatNumber(timeLeft.days)}
        </div>
        <div className="countdown-label text-muted-foreground text-[10px] uppercase tracking-wider font-medium">
          {t("days")}
        </div>
      </div>
      <div className="countdown-box text-center w-full">
        <div className="countdown-number text-foreground font-semibold text-sm sm:text-base">
          {formatNumber(timeLeft.hours)}
        </div>
        <div className="countdown-label text-muted-foreground text-[10px] uppercase tracking-wider font-medium">
          {t("hours")}
        </div>
      </div>
      <div className="countdown-box text-center w-full">
        <div className="countdown-number text-foreground font-semibold text-sm sm:text-base">
          {formatNumber(timeLeft.minutes)}
        </div>
        <div className="countdown-label text-muted-foreground text-[10px] uppercase tracking-wider font-medium">
          {t("min")}
        </div>
      </div>
    </div>
  );
};
