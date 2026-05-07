import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const LandingSection = ({
  eyebrow,
  title,
  subtitle,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) => {
  return (
    <section className={cn("py-14 sm:py-20", className)}>
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-8 sm:mb-10">
          {eyebrow ? (
            <p className="mb-3 inline-flex items-center rounded-full border border-white/15 bg-black/25 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-red-200">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">{title}</h2>
          {subtitle ? <p className="mt-2 max-w-3xl text-sm text-zinc-400 sm:text-base">{subtitle}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
};

export const LandingCard = ({
  title,
  description,
  icon,
  className,
  children,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
}) => {
  return (
    <article className={cn("interactive-card rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_14px_35px_rgba(0,0,0,0.3)]", className)}>
      <div className="mb-3 flex items-center gap-2">
        {icon ? <div className="text-red-300">{icon}</div> : null}
        <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
      </div>
      {description ? <p className="text-sm text-zinc-400">{description}</p> : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </article>
  );
};

export const LandingFeatureBlock = ({
  title,
  description,
  insight,
}: {
  title: string;
  description: string;
  insight: string;
}) => {
  return (
    <LandingCard title={title} description={description}>
      <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-100">AI insight: {insight}</div>
    </LandingCard>
  );
};
