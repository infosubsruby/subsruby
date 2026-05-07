import { ArrowDownRight, ArrowUpRight, BrainCircuit, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FinancialHealthResult } from "@/lib/financialHealthScore";
import { RubyAIWidget } from "@/components/ruby-ai/RubyAIWidget";

const statusTone: Record<FinancialHealthResult["status"], string> = {
  Excellent: "text-emerald-300",
  Good: "text-green-300",
  Moderate: "text-amber-300",
  Risky: "text-orange-300",
  Critical: "text-red-300",
};

const barTone = (score: number) => {
  if (score >= 80) return "bg-emerald-400";
  if (score >= 65) return "bg-green-400";
  if (score >= 50) return "bg-amber-400";
  if (score >= 35) return "bg-orange-400";
  return "bg-red-400";
};

export const FinancialHealthSection = ({
  result,
  rubyWidgetSummary,
  predictiveWidgetSummary,
}: {
  result: FinancialHealthResult;
  rubyWidgetSummary?: string;
  predictiveWidgetSummary?: string;
}) => {
  const trendPositive = result.trendComparisonPct >= 0;
  const weeklyPositive = result.weeklyImprovementPct >= 0;
  const scoreArc = Math.max(0, Math.min(100, result.score));
  const angle = (scoreArc / 100) * 360;

  return (
    <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-7">
      <div className="pointer-events-none absolute -left-14 top-[-40px] h-44 w-44 rounded-full bg-red-600/15 blur-3xl" />
      <div className="pointer-events-none absolute right-[-40px] top-10 h-36 w-36 rounded-full bg-rose-500/20 blur-3xl" />

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <div className="mb-4 flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-red-300" />
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">Financial Health Score</h2>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div
              className="relative flex h-44 w-44 items-center justify-center rounded-full p-1"
              style={{
                background: `conic-gradient(rgba(248,113,113,0.95) 0deg, rgba(52,211,153,0.92) ${angle}deg, rgba(39,39,42,0.5) ${angle}deg 360deg)`,
              }}
            >
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#0b0d12]/95">
                <p className="text-5xl font-bold leading-none text-zinc-100">{result.score}</p>
                <p className={cn("mt-1 text-sm font-medium", statusTone[result.status])}>{result.status}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="max-w-sm text-sm leading-relaxed text-zinc-300">{result.summary}</p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-zinc-300">
                  {trendPositive ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-300" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 text-red-300" />
                  )}
                  Trend {Math.abs(result.trendComparisonPct).toFixed(1)}%
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-zinc-300">
                  {weeklyPositive ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-300" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 text-red-300" />
                  )}
                  Weekly {Math.abs(result.weeklyImprovementPct).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-zinc-400">Health Factor Matrix</h3>
          <div className="space-y-2.5 rounded-2xl border border-white/10 bg-black/25 p-4">
            {result.factors.map((factor) => (
              <div key={factor.key}>
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs text-zinc-300">{factor.label}</p>
                  <p className="text-xs text-zinc-500">{Math.round(factor.score)}</p>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-800/90">
                  <div
                    className={cn("h-1.5 rounded-full transition-all duration-500", barTone(factor.score))}
                    style={{ width: `${Math.max(4, Math.min(100, factor.score))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-3">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-zinc-400">AI Health Insights</h3>
          <div className="space-y-2.5">
            {result.insights.map((insight) => (
              <article
                key={insight}
                className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-xs leading-relaxed text-zinc-300 transition hover:border-red-500/35 hover:bg-red-500/10"
              >
                <div className="mb-1 flex items-center gap-1.5 text-red-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="text-[10px] uppercase tracking-[0.14em]">AI Signal</span>
                </div>
                {insight}
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-zinc-400">Health History</h3>
        <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-black/25 p-4">
          {result.history.map((point, index) => (
            <div key={`${point}-${index}`} className="flex-1">
              <div
                className={cn(
                  "mx-auto w-full rounded-md transition-all duration-500",
                  index === result.history.length - 1 ? "bg-red-400 shadow-[0_0_18px_rgba(248,113,113,0.55)]" : "bg-zinc-600/70"
                )}
                style={{ height: `${Math.max(14, point)}px` }}
              />
            </div>
          ))}
        </div>
      </div>

      {rubyWidgetSummary ? (
        <div className="mt-6">
          <RubyAIWidget
            compact
            title="Ruby AI Health Advisor"
            summary={rubyWidgetSummary}
            actionLabel="Review with Ruby AI"
          />
        </div>
      ) : null}

      {predictiveWidgetSummary ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            <Sparkles className="h-3.5 w-3.5 text-red-300" />
            Predictive Finance Signal
          </div>
          <p className="text-sm leading-relaxed text-zinc-200">{predictiveWidgetSummary}</p>
        </div>
      ) : null}
    </section>
  );
};
