import { AlertTriangle, ArrowDownRight, ArrowUpRight, BrainCircuit, Sparkles, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type TrendItem = {
  label: string;
  value: string;
  positive?: boolean;
};

type InsightItem = {
  title: string;
  detail: string;
  kind: "opportunity" | "alert" | "risk";
};

type OverviewHeroProps = {
  userName: string;
  healthScore: number;
  summary: string;
  trends: TrendItem[];
  insights: InsightItem[];
};

const insightToneClasses: Record<InsightItem["kind"], string> = {
  opportunity: "border-emerald-500/30 bg-emerald-500/10",
  alert: "border-amber-500/30 bg-amber-500/10",
  risk: "border-red-500/30 bg-red-500/10",
};

const insightIcon = (kind: InsightItem["kind"]) => {
  if (kind === "opportunity") return <Sparkles className="h-4 w-4 text-emerald-300" />;
  if (kind === "alert") return <AlertTriangle className="h-4 w-4 text-amber-300" />;
  return <TriangleAlert className="h-4 w-4 text-red-300" />;
};

export const OverviewHero = ({ userName, healthScore, summary, trends, insights }: OverviewHeroProps) => {
  const healthTone =
    healthScore >= 80 ? "text-emerald-300" : healthScore >= 60 ? "text-amber-300" : "text-red-300";

  return (
    <section className="grid gap-6 xl:grid-cols-12">
      <div className="xl:col-span-7">
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-7 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="pointer-events-none absolute -left-12 -top-10 h-40 w-40 rounded-full bg-red-600/15 blur-3xl" />
          <div className="pointer-events-none absolute right-8 top-8 h-20 w-20 rounded-full bg-rose-500/20 blur-2xl" />

          <p className="text-sm tracking-wide text-zinc-400">Good Evening, {userName}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-100 sm:text-4xl">
            Here&apos;s your financial overview today.
          </h1>

          <div className="mt-6 flex flex-wrap items-end gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Financial Health Score</p>
              <p className={cn("mt-1 text-5xl font-bold leading-none", healthTone)}>{healthScore}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <BrainCircuit className="h-4 w-4 text-red-300" />
                <span>AI Financial Engine Active</span>
              </div>
            </div>
          </div>

          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-zinc-300">{summary}</p>

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
        </div>
      </div>

      <div className="xl:col-span-5">
        <div className="relative h-full overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#171922]/90 to-[#0c0e15]/95 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="pointer-events-none absolute -right-10 -top-8 h-28 w-28 rounded-full bg-red-500/25 blur-2xl" />
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-100">Animated AI Insights</h2>
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-400 shadow-[0_0_15px_rgba(248,113,113,0.9)]" />
          </div>

          <div className="space-y-3">
            {insights.map((item) => (
              <article
                key={item.title}
                className={cn(
                  "rounded-2xl border px-4 py-3 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(239,68,68,0.15)]",
                  insightToneClasses[item.kind]
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">{insightIcon(item.kind)}</div>
                  <div>
                    <h3 className="text-sm font-medium text-zinc-100">{item.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-zinc-300">{item.detail}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
