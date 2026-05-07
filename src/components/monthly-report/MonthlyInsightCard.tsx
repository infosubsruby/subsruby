import { ArrowRight, CircleAlert, ShieldCheck } from "lucide-react";
import type { MonthlyReportInsight } from "@/lib/monthlyFinancialReport";

const severityTone: Record<MonthlyReportInsight["severity"], string> = {
  low: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  high: "border-red-500/35 bg-red-500/10 text-red-100",
};

export const MonthlyInsightCard = ({ insight }: { insight: MonthlyReportInsight }) => {
  return (
    <article className="interactive-card rounded-2xl border border-white/10 bg-black/25 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-zinc-400">
          {insight.category}
        </span>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] ${severityTone[insight.severity]}`}>
          {insight.severity}
        </span>
      </div>
      <p className="text-sm font-medium text-zinc-100">{insight.title}</p>
      <p className="mt-1 text-xs text-zinc-400">{insight.financialImpact}</p>
      <div className="mt-2 rounded-lg border border-white/10 bg-black/20 p-2">
        <p className="text-[11px] text-zinc-300">{insight.suggestedNextStep}</p>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
        <span className="inline-flex items-center gap-1">
          {insight.severity === "high" ? <CircleAlert className="h-3.5 w-3.5 text-red-300" /> : <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />}
          Suggested next step
        </span>
        <span className="inline-flex items-center gap-1 text-red-200">
          Open
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </article>
  );
};
