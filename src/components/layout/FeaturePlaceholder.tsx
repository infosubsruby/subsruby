import { ReactNode } from "react";
import { Sparkles } from "lucide-react";

type FeaturePlaceholderProps = {
  title: string;
  subtitle: string;
  sections: string[];
  icon?: ReactNode;
};

export const FeaturePlaceholder = ({ title, subtitle, sections, icon }: FeaturePlaceholderProps) => {
  return (
    <div className="premium-page">
      <div className="premium-section relative overflow-hidden">
        <div className="pointer-events-none absolute -left-12 top-[-48px] h-40 w-40 rounded-full bg-red-600/10 blur-3xl" />
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 text-red-300">
            {icon ?? <Sparkles className="h-5 w-5" />}
          </div>
          <h1 className="premium-heading text-2xl">{title}</h1>
        </div>
        <p className="max-w-2xl text-sm text-zinc-400">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <section
            key={section}
            className="premium-card premium-card-hover"
          >
            <p className="text-sm font-medium text-zinc-100">{section}</p>
            <p className="mt-2 text-xs text-zinc-500">This module is ready for integration with existing platform logic.</p>
          </section>
        ))}
      </div>
    </div>
  );
};
