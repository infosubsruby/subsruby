import type { RubyAISuggestion } from "@/lib/rubyAI";
import { cn } from "@/lib/utils";

type RubyAISuggestedPromptsProps = {
  prompts: RubyAISuggestion[];
  onSelect: (prompt: string) => void;
  className?: string;
};

export const RubyAISuggestedPrompts = ({
  prompts,
  onSelect,
  className,
}: RubyAISuggestedPromptsProps) => {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {prompts.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.prompt)}
          className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-red-500/35 hover:bg-red-500/10 hover:text-red-100"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

