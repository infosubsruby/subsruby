import { AlertTriangle, Gauge, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/i18n/currency";
import type { PredictiveFinanceResult } from "@/lib/predictiveFinanceEngine";

export const SafeToSpendWidget = ({
  prediction,
  currency,
}: {
  prediction: PredictiveFinanceResult;
  currency: string;
}) => {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="mb-2 flex items-center gap-2">
        <Gauge className="h-4 w-4 text-red-300" />
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Safe-To-Spend</h3>
      </div>
      <p className="text-2xl font-semibold text-zinc-100">
        {formatCurrency(prediction.safeToSpend.daily, currency)}
      </p>
      <p className="mt-1 text-xs text-zinc-500">Daily recommended safe spend</p>
      <p className="mt-2 text-xs text-zinc-300">
        Remaining safe budget: {formatCurrency(prediction.safeToSpend.remaining, currency)}
      </p>
    </article>
  );
};

export const PredictiveRiskCard = ({
  prediction,
  currency,
}: {
  prediction: PredictiveFinanceResult;
  currency: string;
}) => {
  const riskTone =
    prediction.monthlyProjection.negativeRiskPct > 45
      ? "text-red-200 border-red-500/35 bg-red-500/10"
      : prediction.monthlyProjection.negativeRiskPct > 22
        ? "text-amber-200 border-amber-500/35 bg-amber-500/10"
        : "text-emerald-200 border-emerald-500/35 bg-emerald-500/10";
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="mb-2 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-red-300" />
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Forecast Risk</h3>
      </div>
      <p className={`inline-flex rounded-full border px-2.5 py-1 text-sm font-semibold ${riskTone}`}>
        {prediction.monthlyProjection.negativeRiskPct.toFixed(1)}%
      </p>
      <p className="mt-2 text-xs text-zinc-300">
        Projected month-end balance:{" "}
        <span className="font-semibold">{formatCurrency(prediction.monthlyProjection.projectedEndBalance, currency)}</span>
      </p>
    </article>
  );
};

export const PredictiveSummaryCards = ({
  prediction,
  currency,
}: {
  prediction: PredictiveFinanceResult;
  currency: string;
}) => {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-xl border border-white/10 bg-black/25 p-3">
        <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
          <TrendingUp className="h-3.5 w-3.5 text-red-300" />
          Weekly Spending Prediction
        </div>
        <p className="text-lg font-semibold text-zinc-100">
          {formatCurrency(prediction.spendingProjection.weeklyPrediction, currency)}
        </p>
      </article>
      <article className="rounded-xl border border-white/10 bg-black/25 p-3">
        <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
          <ShieldCheck className="h-3.5 w-3.5 text-red-300" />
          Budget Risk
        </div>
        <p className="text-lg font-semibold text-zinc-100">{prediction.budgetRisk.scorePct.toFixed(1)}%</p>
      </article>
      <article className="rounded-xl border border-white/10 bg-black/25 p-3">
        <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
          <Sparkles className="h-3.5 w-3.5 text-red-300" />
          Goal Completion Forecast
        </div>
        <p className="text-lg font-semibold text-zinc-100">{prediction.goalForecast.completionLabel}</p>
      </article>
      <article className="rounded-xl border border-white/10 bg-black/25 p-3">
        <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
          <Gauge className="h-3.5 w-3.5 text-red-300" />
          Subscription Impact
        </div>
        <p className="text-lg font-semibold text-zinc-100">
          {formatCurrency(prediction.subscriptionImpact.nextQuarterCost, currency)}
        </p>
      </article>
    </div>
  );
};

export const PredictiveInsightsFeed = ({
  prediction,
}: {
  prediction: PredictiveFinanceResult;
}) => {
  const toneClass = {
    info: "border-white/10 bg-black/25 text-zinc-200",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-100",
    positive: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  } as const;

  return (
    <div className="space-y-2.5">
      {prediction.insights.map((item) => (
        <article key={item.title} className={`rounded-xl border px-3 py-2 ${toneClass[item.tone]}`}>
          <p className="text-[10px] uppercase tracking-[0.14em] opacity-85">{item.title}</p>
          <p className="mt-1 text-xs leading-relaxed">{item.detail}</p>
        </article>
      ))}
    </div>
  );
};

