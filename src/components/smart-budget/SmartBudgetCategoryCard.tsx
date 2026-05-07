import { ArrowDown, ArrowUp, TriangleAlert } from "lucide-react";
import { formatCurrency } from "@/i18n/currency";
import type { SmartBudgetCategoryPlan } from "@/lib/smartBudgetPlanner";

const riskTone: Record<SmartBudgetCategoryPlan["riskLabel"], string> = {
  Low: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  Medium: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  High: "border-red-500/35 bg-red-500/12 text-red-100",
};

export const SmartBudgetCategoryCard = ({
  item,
  currency,
}: {
  item: SmartBudgetCategoryPlan;
  currency: string;
}) => {
  const progressWidth = Math.max(6, Math.min(100, item.usagePct));

  return (
    <article className="interactive-card rounded-2xl border border-white/10 bg-black/25 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-100">{item.category}</p>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] ${riskTone[item.riskLabel]}`}>
          {item.riskLabel}
        </span>
      </div>
      <p className="text-sm text-zinc-300">
        {formatCurrency(item.spent, currency)} / {formatCurrency(item.planned, currency)} used
      </p>
      <div className="mt-2 h-1.5 rounded-full bg-zinc-800/90">
        <div className="h-1.5 rounded-full bg-gradient-to-r from-red-500/90 to-rose-300/90" style={{ width: `${progressWidth}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-zinc-400">Remaining: {formatCurrency(item.remaining, currency)}</span>
        <span className={`inline-flex items-center gap-1 ${item.trendVsLastMonthPct <= 0 ? "text-emerald-300" : "text-red-300"}`}>
          {item.trendVsLastMonthPct <= 0 ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />}
          {Math.abs(item.trendVsLastMonthPct).toFixed(1)}%
        </span>
      </div>
      <p className="mt-2 text-xs text-zinc-300">{item.aiComment}</p>
      {item.projectedOverrun > 0 ? (
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-red-200">
          <TriangleAlert className="h-3.5 w-3.5" />
          At this pace, overrun risk: {formatCurrency(item.projectedOverrun, currency)}
        </p>
      ) : null}
      <button
        type="button"
        className="mt-2 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-300 transition hover:border-red-500/35 hover:bg-red-500/10 hover:text-red-100"
      >
        {item.adjustAction}
      </button>
    </article>
  );
};
