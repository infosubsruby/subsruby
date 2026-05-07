import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateAction = {
  label: string;
  to?: string;
  onClick?: () => void;
};

type PremiumEmptyStateProps = {
  icon: ReactNode;
  headline: string;
  description: string;
  primaryAction: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  badges?: readonly string[];
  className?: string;
};

const ActionButton = ({
  action,
  variant = "default",
}: {
  action: EmptyStateAction;
  variant?: "default" | "secondary";
}) => {
  const sharedClassName =
    variant === "default"
      ? "ruby-gradient border-0 text-white shadow-ruby hover:shadow-ruby-strong"
      : "border-white/15 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]";

  if (action.to) {
    return (
      <Button asChild className={sharedClassName}>
        <Link to={action.to}>
          {action.label}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    );
  }

  return (
    <Button className={sharedClassName} onClick={action.onClick}>
      {action.label}
      <ArrowRight className="h-4 w-4" />
    </Button>
  );
};

export const PremiumEmptyState = ({
  icon,
  headline,
  description,
  primaryAction,
  secondaryAction,
  badges,
  className,
}: PremiumEmptyStateProps) => {
  return (
    <section className={cn("premium-section relative overflow-hidden rounded-[28px] p-6 sm:p-8", className)}>
      <div className="pointer-events-none absolute left-1/2 top-[-90px] h-52 w-52 -translate-x-1/2 rounded-full bg-red-600/12 blur-3xl" />
      <div className="pointer-events-none absolute right-[-30px] top-[-10px] h-40 w-40 rounded-full bg-rose-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10 text-red-200 shadow-[0_0_28px_rgba(220,38,38,0.18)]">
          {icon}
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-100 sm:text-2xl">{headline}</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{description}</p>

        {badges?.length ? (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] text-zinc-300"
              >
                {badge}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <ActionButton action={primaryAction} />
          {secondaryAction ? <ActionButton action={secondaryAction} variant="secondary" /> : null}
        </div>
      </div>
    </section>
  );
};
