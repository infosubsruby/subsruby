import { ShieldAlert } from "lucide-react";
import type { SmartBudgetRiskAlert } from "@/lib/smartBudgetPlanner";

const riskTone: Record<SmartBudgetRiskAlert["riskLevel"], string> = {
  Low: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  Medium: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  High: "border-red-500/35 bg-red-500/10 text-red-100",
};

export const SmartBudgetRiskCard = ({ item }: { item: SmartBudgetRiskAlert }) => {
  return (
    <article className="interactive-card rounded-2xl border border-white/10 bg-black/25 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-100">{item.title}</p>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] ${riskTone[item.riskLevel]}`}>
          {item.riskLevel}
        </span>
      </div>
      <p className="text-xs text-zinc-300">Projected impact: {item.projectedImpact}</p>
      <p className="mt-1 text-xs text-zinc-400">{item.preventionSuggestion}</p>
      <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-zinc-500">
        <ShieldAlert className="h-3.5 w-3.5" />
        {item.timeline}
      </p>
    </article>
  );
};
