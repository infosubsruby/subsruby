import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type RubyPromptCard = {
  id: string;
  title: string;
  prompt: string;
  description: string;
  categoryTag: string;
  icon: ReactNode;
};

export const RubyAIPromptCards = ({
  prompts,
  onSelect,
  className,
}: {
  prompts: RubyPromptCard[];
  onSelect: (prompt: string) => void;
  className?: string;
}) => {
  return (
    <div className={cn("grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4", className)}>
      {prompts.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.prompt)}
          className="interactive-card rounded-xl border border-white/10 bg-black/25 p-3 text-left transition hover:border-red-500/30 hover:bg-red-500/10"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="rounded-full border border-white/10 bg-black/20 p-1.5 text-red-200">{item.icon}</span>
            <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] text-zinc-300">
              {item.categoryTag}
            </span>
          </div>
          <p className="text-sm font-medium text-zinc-100">{item.title}</p>
          <p className="mt-1 text-xs text-zinc-400">{item.description}</p>
        </button>
      ))}
    </div>
  );
};
