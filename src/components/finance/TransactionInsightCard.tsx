import { AlertTriangle, BrainCircuit, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type TransactionInsightSeverity = "low" | "medium" | "high";

export type TransactionInsightItem = {
  id: string;
  insightType: string;
  title: string;
  explanation: string;
  category: string;
  severity: TransactionInsightSeverity;
  confidencePct: number;
  suggestedAction: string;
  relatedTransaction?: string;
};

const toneMap: Record<TransactionInsightSeverity, string> = {
  low: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  high: "border-red-500/35 bg-red-500/10 text-red-200",
};

const SeverityIcon = ({ severity }: { severity: TransactionInsightSeverity }) => {
  if (severity === "high") return <AlertTriangle className="h-4 w-4 text-red-300" />;
  if (severity === "medium") return <BrainCircuit className="h-4 w-4 text-amber-300" />;
  return <CheckCircle2 className="h-4 w-4 text-emerald-300" />;
};

export const TransactionInsightCard = ({
  insight,
  onOpenRelated,
}: {
  insight: TransactionInsightItem;
  onOpenRelated?: () => void;
}) => {
  return (
    <article className="interactive-card rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <SeverityIcon severity={insight.severity} />
          <h3 className="text-sm font-semibold text-zinc-100">{insight.title}</h3>
        </div>
        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]", toneMap[insight.severity])}>
          {insight.severity}
        </span>
      </div>
      <p className="text-xs text-zinc-300">{insight.explanation}</p>

      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-full border border-white/10 bg-black/25 px-2 py-1 text-zinc-300">
          {insight.insightType}
        </span>
        <span className="rounded-full border border-white/10 bg-black/25 px-2 py-1 text-zinc-300">
          {insight.category}
        </span>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-200">
          Confidence {insight.confidencePct}%
        </span>
      </div>

      <div className="mt-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
        <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Suggested Action</p>
        <p className="mt-1 text-xs text-zinc-300">{insight.suggestedAction}</p>
      </div>

      {insight.relatedTransaction ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-xs text-zinc-400">Related: {insight.relatedTransaction}</p>
          <Button
            size="sm"
            variant="outline"
            className="h-7 border-white/15 bg-white/[0.03] px-2.5 text-[11px] text-zinc-200"
            onClick={onOpenRelated}
          >
            <Sparkles className="h-3 w-3" />
            Review
          </Button>
        </div>
      ) : null}
    </article>
  );
};
