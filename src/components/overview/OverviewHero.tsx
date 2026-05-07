import { ArrowDownRight, ArrowUpRight, BrainCircuit, Gauge, Sparkles, Target } from "lucide-react";
import { cn } from "@/lib/utils";

type TrendItem = {
  label: string;
  value: string;
  positive?: boolean;
};

type InsightItem = {
  title: string;
  detail: string;
  kind: "opportunity" | "signal";
};

type OverviewHeroProps = {
  greeting: string;
  healthScore: number;
  summary: string;
  monthlyProgressPct: number;
  monthlyProgressLabel: string;
  safeToSpendValue: string;
  keyRecommendation: string;
  trends: TrendItem[];
  insights: InsightItem[];
};

const insightToneClasses: Record<InsightItem["kind"], string> = {
  opportunity: "border-emerald-500/30 bg-emerald-500/10",
  signal: "border-white/15 bg-black/25",
};

const insightIcon = (kind: InsightItem["kind"]) => {
  if (kind === "opportunity") return <Sparkles className="h-4 w-4 text-emerald-300" />;
  return <BrainCircuit className="h-4 w-4 text-red-300" />;
};

export const OverviewHero = ({
  greeting,
  healthScore,
  summary,
  monthlyProgressPct,
  monthlyProgressLabel,
  safeToSpendValue,
  keyRecommendation,
  trends,
  insights,
}: OverviewHeroProps) => {
  const healthTone =
    healthScore >= 80 ? "text-emerald-300" : healthScore >= 60 ? "text-amber-300" : "text-red-300";

  return (
    <section className="grid gap-6 xl:grid-cols-12">
      <div className="xl:col-span-7">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-7 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="pointer-events-none absolute -left-12 -top-10 h-40 w-40 rounded-full bg-red-600/15 blur-3xl" />
          <div className="pointer-events-none absolute right-8 top-8 h-20 w-20 rounded-full bg-rose-500/20 blur-2xl" />

          <p className="text-sm tracking-wide text-zinc-400">{greeting}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">
            AI Financial Command Center
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-300">{summary}</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {trends.map((trend) => (
              <div key={trend.label} className="rounded-xl border border-white/10 bg-black/25 px-3 py-3">
                <p className="text-[11px] uppercase tracking-wider text-zinc-500">{trend.label}</p>
                <div className="mt-1 flex items-center gap-1">
                  {trend.positive ? (
                    <ArrowUpRight className="h-4 w-4 text-emerald-300" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-300" />
                  )}
                  <p className={cn("text-sm font-medium", trend.positive ? "text-emerald-300" : "text-red-300")}>
                    {trend.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {insights.map((item) => (
              <div key={item.title} className="rounded-xl border border-white/10 bg-black/25 px-3 py-3">
                <div className={cn("rounded-lg border px-3 py-2", insightToneClasses[item.kind])}>
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5">{insightIcon(item.kind)}</div>
                    <div>
                      <h3 className="text-[11px] uppercase tracking-[0.14em] text-zinc-300">{item.title}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-300">{item.detail}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="xl:col-span-5">
        <div className="relative h-full overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#171922]/90 to-[#0c0e15]/95 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="pointer-events-none absolute -right-10 -top-8 h-28 w-28 rounded-full bg-red-500/25 blur-2xl" />

          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Financial Health Score</p>
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-400 shadow-[0_0_15px_rgba(248,113,113,0.9)]" />
          </div>
          <p className={cn("text-5xl font-bold leading-none", healthTone)}>{healthScore}</p>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/25 p-3">
            <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-zinc-400">
              <span>Monthly Progress</span>
              <span>{monthlyProgressLabel}</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-800/80">
              <div
                className="h-1.5 rounded-full bg-emerald-400 transition-all duration-700"
                style={{ width: `${Math.max(5, Math.min(100, monthlyProgressPct))}%` }}
              />
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <article className="rounded-xl border border-white/10 bg-black/25 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
                <Gauge className="h-3.5 w-3.5 text-red-300" />
                Safe To Spend
              </div>
              <p className="text-lg font-semibold text-zinc-100">{safeToSpendValue}</p>
            </article>
            <article className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-emerald-200">
                <Target className="h-3.5 w-3.5" />
                Key Recommendation
              </div>
              <p className="text-xs leading-relaxed text-zinc-100">{keyRecommendation}</p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
};
