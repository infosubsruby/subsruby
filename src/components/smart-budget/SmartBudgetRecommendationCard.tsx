import { Sparkles } from "lucide-react";
import type { SmartBudgetRecommendation } from "@/lib/smartBudgetPlanner";

const difficultyTone: Record<SmartBudgetRecommendation["difficulty"], string> = {
  Easy: "text-emerald-300",
  Medium: "text-amber-200",
  Hard: "text-red-300",
};

export const SmartBudgetRecommendationCard = ({ item }: { item: SmartBudgetRecommendation }) => {
  return (
    <article className="interactive-card rounded-2xl border border-white/10 bg-black/25 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-zinc-400">
          {item.category}
        </span>
        <span className={`text-xs font-medium ${difficultyTone[item.difficulty]}`}>{item.difficulty}</span>
      </div>
      <p className="text-sm font-medium text-zinc-100">{item.title}</p>
      <p className="mt-1 text-xs text-zinc-400">Impact: {item.estimatedImpact}</p>
      <p className="mt-2 text-xs text-zinc-300">{item.suggestedAction}</p>
      <p className="mt-1 text-xs text-zinc-500">Related: {item.relatedImpact}</p>
      <button
        type="button"
        className="mt-2 inline-flex items-center gap-1 rounded-full border border-red-500/35 bg-red-500/15 px-2.5 py-1 text-[11px] text-red-100 transition hover:bg-red-500/25"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Apply suggestion
      </button>
    </article>
  );
};
