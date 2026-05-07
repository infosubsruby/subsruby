import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertTriangle, BrainCircuit, CheckCircle2 } from "lucide-react";

export type AccountInsightSeverity = "low" | "medium" | "high";

export type AccountHealthInsight = {
  id: string;
  title: string;
  category: string;
  explanation: string;
  severity: AccountInsightSeverity;
  confidencePct: number;
  suggestedAction: string;
};

const severityStyles: Record<AccountInsightSeverity, string> = {
  low: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  high: "border-red-500/35 bg-red-500/10 text-red-200",
};

const SeverityIcon = ({ severity }: { severity: AccountInsightSeverity }) => {
  if (severity === "high") return <AlertTriangle className="h-4 w-4 text-red-300" />;
  if (severity === "medium") return <BrainCircuit className="h-4 w-4 text-amber-300" />;
  return <CheckCircle2 className="h-4 w-4 text-emerald-300" />;
};

export const AccountHealthInsightCard = ({
  insight,
  onAction,
}: {
  insight: AccountHealthInsight;
  onAction?: () => void;
}) => {
  return (
    <article className="interactive-card rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <SeverityIcon severity={insight.severity} />
          <h3 className="text-sm font-semibold text-zinc-100">{insight.title}</h3>
        </div>
        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.14em]", severityStyles[insight.severity])}>
          {insight.severity}
        </span>
      </div>
      <p className="text-xs text-zinc-300">{insight.explanation}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-zinc-300">{insight.category}</span>
        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-sky-200">
          Confidence {insight.confidencePct}%
        </span>
      </div>
      <p className="mt-2 rounded-lg border border-white/10 bg-black/20 p-2 text-xs text-zinc-300">
        Suggested action: {insight.suggestedAction}
      </p>
      <Button
        variant="outline"
        size="sm"
        className="mt-3 w-full border-white/15 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.08]"
        onClick={onAction}
      >
        Apply Recommendation
      </Button>
    </article>
  );
};
