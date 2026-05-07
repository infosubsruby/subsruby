import type { ReactNode } from "react";

export type RubyAssistantMode = {
  id: string;
  title: string;
  description: string;
  useCase: string;
  icon: ReactNode;
};

export const RubyAIAssistantModes = ({ modes }: { modes: RubyAssistantMode[] }) => {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {modes.map((mode) => (
        <article key={mode.id} className="interactive-card rounded-xl border border-white/10 bg-black/25 p-3">
          <div className="mb-2 inline-flex rounded-full border border-white/10 bg-black/20 p-1.5 text-red-200">{mode.icon}</div>
          <p className="text-sm font-medium text-zinc-100">{mode.title}</p>
          <p className="mt-1 text-xs text-zinc-400">{mode.description}</p>
          <p className="mt-2 rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-[11px] text-zinc-300">
            Best use: {mode.useCase}
          </p>
        </article>
      ))}
    </div>
  );
};
