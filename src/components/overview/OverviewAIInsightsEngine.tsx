import { BrainCircuit, Sparkles } from "lucide-react";
import { AIInsightCard } from "@/components/overview/AIInsightCard";
import type { AIInsight } from "@/lib/aiInsights";

export const OverviewAIInsightsEngine = ({ insights }: { insights: AIInsight[] }) => {
  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_14px_35px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-red-300" />
              <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">AI Insights Engine</h2>
            </div>
            <p className="text-sm text-zinc-400">
              Intelligent assistant feed analyzing your financial behavior in real time style.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-red-500/35 bg-red-500/10 px-3 py-1 text-xs text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <Sparkles className="h-3.5 w-3.5" />
            AI Signal Active
          </div>
        </div>
      </header>

      <div className="space-y-4">
        {insights.map((insight) => (
          <AIInsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </section>
  );
};
