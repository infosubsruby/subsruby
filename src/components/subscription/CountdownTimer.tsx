import { useState, useEffect } from "react";
import { useTranslations } from "@/i18n/useTranslations";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
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
    seconds: 0,
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
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const formatNumber = (num: number) => String(num).padStart(2, "0");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="countdown-box text-center min-w-[32px]">
        <div className="countdown-number text-foreground font-semibold text-sm sm:text-base">
          {formatNumber(timeLeft.days)}
        </div>
        <div className="countdown-label text-muted-foreground text-[10px] uppercase tracking-wider font-medium">
          {t("days")}
        </div>
      </div>
      <span className="hidden sm:block text-primary font-semibold text-sm">:</span>
      <div className="countdown-box text-center min-w-[32px]">
        <div className="countdown-number text-foreground font-semibold text-sm sm:text-base">
          {formatNumber(timeLeft.hours)}
        </div>
        <div className="countdown-label text-muted-foreground text-[10px] uppercase tracking-wider font-medium">
          {t("hours")}
        </div>
      </div>
      <span className="hidden sm:block text-primary font-semibold text-sm">:</span>
      <div className="countdown-box text-center min-w-[32px]">
        <div className="countdown-number text-foreground font-semibold text-sm sm:text-base">
          {formatNumber(timeLeft.minutes)}
        </div>
        <div className="countdown-label text-muted-foreground text-[10px] uppercase tracking-wider font-medium">
          {t("min")}
        </div>
      </div>
      <span className="hidden sm:block text-primary font-semibold text-sm">:</span>
      <div className="countdown-box text-center min-w-[32px]">
        <div className="countdown-number text-foreground font-semibold text-sm sm:text-base">
          {formatNumber(timeLeft.seconds)}
        </div>
        <div className="countdown-label text-muted-foreground text-[10px] uppercase tracking-wider font-medium">
          {t("sec")}
        </div>
      </div>
    </div>
  );
};
