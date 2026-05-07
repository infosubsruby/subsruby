import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const SettingsSectionCard = ({
  title,
  description,
  icon,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) => {
  return (
    <section className={cn("rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5", className)}>
      <div className="mb-4 flex items-start gap-3">
        {icon ? <div className="mt-0.5 text-red-300">{icon}</div> : null}
        <div>
          <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-zinc-400">{description}</p> : null}
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
};
