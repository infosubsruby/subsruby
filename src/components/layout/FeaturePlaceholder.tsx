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
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_0_30px_rgba(239,68,68,0.08)] backdrop-blur-xl">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/15 text-red-300">
            {icon ?? <Sparkles className="h-5 w-5" />}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">{title}</h1>
        </div>
        <p className="text-sm text-zinc-400">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <section
            key={section}
            className="rounded-2xl border border-white/10 bg-black/20 p-5 transition duration-200 hover:border-red-500/35 hover:bg-red-500/10"
          >
            <p className="text-sm font-medium text-zinc-100">{section}</p>
            <p className="mt-2 text-xs text-zinc-500">This module is ready for integration with existing platform logic.</p>
          </section>
        ))}
      </div>
    </div>
  );
};
