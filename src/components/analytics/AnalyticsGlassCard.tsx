import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AnalyticsGlassCardProps = {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
  className?: string;
};

export const AnalyticsGlassCard = ({
  title,
  subtitle,
  rightSlot,
  children,
  className,
}: AnalyticsGlassCardProps) => {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl",
        className
      )}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-red-500/10 blur-2xl" />
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-300">{title}</h3>
          {subtitle ? <p className="mt-1 text-xs text-zinc-500">{subtitle}</p> : null}
        </div>
        {rightSlot ? <div>{rightSlot}</div> : null}
      </div>
      {children}
    </section>
  );
};
