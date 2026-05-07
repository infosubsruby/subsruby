import { AlertTriangle, BrainCircuit, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type SubscriptionInsightSeverity = "low" | "medium" | "high";

export type SubscriptionOptimizationInsight = {
  id: string;
  title: string;
  explanation: string;
  severity: SubscriptionInsightSeverity;
  categoryTag: string;
  confidencePct: number;
  potentialSavings: number;
  suggestedAction: string;
  actionLabel: string;
};

const severityTone: Record<SubscriptionInsightSeverity, string> = {
  low: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  high: "border-red-500/35 bg-red-500/10 text-red-200",
};

const SeverityIcon = ({ severity }: { severity: SubscriptionInsightSeverity }) => {
  if (severity === "high") return <AlertTriangle className="h-4 w-4 text-red-300" />;
  if (severity === "medium") return <BrainCircuit className="h-4 w-4 text-amber-300" />;
  return <CheckCircle2 className="h-4 w-4 text-emerald-300" />;
};

export const SubscriptionOptimizationInsightCard = ({
  insight,
  savingsLabel,
  onAction,
}: {
  insight: SubscriptionOptimizationInsight;
  savingsLabel: string;
  onAction?: () => void;
}) => {
  return (
    <article className="interactive-card rounded-2xl border border-white/10 bg-black/25 p-4 shadow-[0_12px_36px_rgba(0,0,0,0.35)]">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <SeverityIcon severity={insight.severity} />
          <h3 className="text-sm font-semibold text-zinc-100">{insight.title}</h3>
        </div>
        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]", severityTone[insight.severity])}>
          {insight.severity}
        </span>
      </div>

      <p className="text-xs leading-relaxed text-zinc-300">{insight.explanation}</p>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-zinc-300">{insight.categoryTag}</span>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-200">
          Confidence {insight.confidencePct}%
        </span>
        <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-1 text-red-200">{savingsLabel}</span>
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-2.5">
        <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Suggested Action</p>
        <p className="mt-1 text-xs text-zinc-300">{insight.suggestedAction}</p>
      </div>

      <Button
        size="sm"
        variant="outline"
        className="mt-3 w-full border-white/15 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.08]"
        onClick={onAction}
      >
        <Sparkles className="h-3.5 w-3.5" />
        {insight.actionLabel}
      </Button>
    </article>
  );
};
