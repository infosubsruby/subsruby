import { useState, useEffect } from "react";

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
    <div className="flex items-center gap-1 sm:gap-2">
      <div className="countdown-box text-center min-w-[40px]">
        <div className="countdown-number text-foreground font-bold text-lg">
          {formatNumber(timeLeft.days)}
        </div>
        <div className="countdown-label text-muted-foreground text-[10px] uppercase tracking-wider font-medium">Days</div>
      </div>
      <span className="text-primary font-bold text-lg">:</span>
      <div className="countdown-box text-center min-w-[40px]">
        <div className="countdown-number text-foreground font-bold text-lg">
          {formatNumber(timeLeft.hours)}
        </div>
        <div className="countdown-label text-muted-foreground text-[10px] uppercase tracking-wider font-medium">Hours</div>
      </div>
      <span className="text-primary font-bold text-lg">:</span>
      <div className="countdown-box text-center min-w-[40px]">
        <div className="countdown-number text-foreground font-bold text-lg">
          {formatNumber(timeLeft.minutes)}
        </div>
        <div className="countdown-label text-muted-foreground text-[10px] uppercase tracking-wider font-medium">Min</div>
      </div>
      <span className="text-primary font-bold text-lg">:</span>
      <div className="countdown-box text-center min-w-[40px]">
        <div className="countdown-number text-foreground font-bold text-lg">
          {formatNumber(timeLeft.seconds)}
        </div>
        <div className="countdown-label text-muted-foreground text-[10px] uppercase tracking-wider font-medium">Sec</div>
      </div>
    </div>
  );
};
