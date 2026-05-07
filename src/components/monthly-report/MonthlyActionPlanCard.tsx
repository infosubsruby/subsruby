import { Clock3, Gauge, WandSparkles } from "lucide-react";
import type { MonthlyReportAction } from "@/lib/monthlyFinancialReport";

const difficultyTone: Record<MonthlyReportAction["difficulty"], string> = {
  Easy: "text-emerald-300",
  Medium: "text-amber-200",
  Hard: "text-red-300",
};

export const MonthlyActionPlanCard = ({ action }: { action: MonthlyReportAction }) => {
  return (
    <article className="interactive-card rounded-2xl border border-white/10 bg-black/25 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-zinc-400">
          {action.relatedCategory}
        </span>
        <span className={`text-xs font-medium ${difficultyTone[action.difficulty]}`}>{action.difficulty}</span>
      </div>
      <p className="text-sm font-medium text-zinc-100">{action.title}</p>
      <p className="mt-1 text-xs text-zinc-400">{action.expectedImpact}</p>
      <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
        <span className="inline-flex items-center gap-1">
          <Clock3 className="h-3.5 w-3.5 text-zinc-400" />
          {action.timeline}
        </span>
        <span className="inline-flex items-center gap-1">
          <Gauge className="h-3.5 w-3.5 text-zinc-400" />
          Difficulty: {action.difficulty}
        </span>
      </div>
      <button
        type="button"
        className="mt-2 inline-flex items-center gap-1 rounded-full border border-red-500/35 bg-red-500/15 px-2.5 py-1 text-[11px] text-red-100 transition hover:bg-red-500/25"
      >
        <WandSparkles className="h-3.5 w-3.5" />
        Apply plan
      </button>
    </article>
  );
};
