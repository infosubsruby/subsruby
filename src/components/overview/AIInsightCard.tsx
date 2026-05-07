import { useState } from "react";
import {
  AlertTriangle,
  BadgeAlert,
  BrainCircuit,
  ChevronDown,
  ChevronUp,
  CircleCheckBig,
  Compass,
  CreditCard,
  Goal,
  Lightbulb,
  PiggyBank,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIInsight, AIInsightSeverity, AIInsightType } from "@/lib/aiInsights";

const severityTone: Record<AIInsightSeverity, string> = {
  low: "border-emerald-500/35 bg-emerald-500/[0.08]",
  medium: "border-amber-500/35 bg-amber-500/[0.08]",
  high: "border-red-500/40 bg-red-500/[0.10]",
};

const severityText: Record<AIInsightSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const typeIcon = (type: AIInsightType) => {
  switch (type) {
    case "spending_warning":
      return <TrendingUp className="h-4 w-4 text-amber-300" />;
    case "saving_opportunity":
      return <PiggyBank className="h-4 w-4 text-emerald-300" />;
    case "subscription_optimization":
      return <CreditCard className="h-4 w-4 text-red-300" />;
    case "budget_recommendation":
      return <Compass className="h-4 w-4 text-sky-300" />;
    case "risk_detection":
      return <ShieldAlert className="h-4 w-4 text-red-300" />;
    case "goal_progress":
      return <Goal className="h-4 w-4 text-emerald-300" />;
    case "behavior_analysis":
      return <BrainCircuit className="h-4 w-4 text-violet-300" />;
    default:
      return <Lightbulb className="h-4 w-4 text-zinc-300" />;
  }
};

const severityIndicator = (severity: AIInsightSeverity) => {
  if (severity === "low") return <CircleCheckBig className="h-4 w-4 text-emerald-300" />;
  if (severity === "medium") return <AlertTriangle className="h-4 w-4 text-amber-300" />;
  return <BadgeAlert className="h-4 w-4 text-red-300" />;
};

export const AIInsightCard = ({ insight }: { insight: AIInsight }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className={cn(
        "group rounded-[22px] border p-5 shadow-[0_14px_35px_rgba(0,0,0,0.35)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_35px_rgba(239,68,68,0.18)]",
        severityTone[insight.severity]
      )}
    >
      <header className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 rounded-lg border border-white/10 bg-black/30 p-2">
            {typeIcon(insight.type)}
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-medium leading-tight text-zinc-100">{insight.title}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
              <span className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5">
                {insight.label}
              </span>
              <span>{insight.timestamp}</span>
            </div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] text-zinc-300">
          {severityIndicator(insight.severity)}
          {severityText[insight.severity]}
        </span>
      </header>

      <p className="text-sm leading-relaxed text-zinc-300">{insight.message}</p>

      <div
        className={cn(
          "grid transition-all duration-300",
          expanded ? "mt-3 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <p className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs leading-relaxed text-zinc-400">
            {insight.details}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-red-300 transition hover:text-red-200"
      >
        {expanded ? "Hide analysis" : "Expand analysis"}
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>
    </article>
  );
};
