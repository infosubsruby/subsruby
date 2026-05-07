import { useMemo } from "react";
import {
  Activity,
  AreaChart,
  BrainCircuit,
  CircleAlert,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { useFinance } from "@/hooks/useFinance";
import { useSettings } from "@/hooks/useSettings";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { formatCurrency } from "@/i18n/currency";
import { buildAnalyticsIntelligence } from "@/lib/analyticsIntelligence";
import { AnalyticsGlassCard } from "@/components/analytics/AnalyticsGlassCard";
import {
  BehaviorRadials,
  CategoryBars,
  ComparisonMiniBars,
  ForecastCurveChart,
  HeatmapGrid,
  SparkBars,
  TrendLineChart,
} from "@/components/analytics/AnalyticsCharts";
import { AIAnalysisCard } from "@/components/analytics/AIAnalysisCard";

const pct = (value: number) => `${value.toFixed(1)}%`;

const AnalyticsPage = () => {
  const { transactions, budgets, isLoading } = useFinance();
  const { subscriptions, isLoading: subscriptionsLoading } = useSubscriptions();
  const { defaultCurrency } = useSettings();

  const analytics = useMemo(
    () =>
      buildAnalyticsIntelligence({
        transactions,
        budgets,
        subscriptions,
        currency: defaultCurrency,
      }),
    [transactions, budgets, subscriptions, defaultCurrency]
  );

  const recurringLoadItems = [
    { label: "Recurring Burden", value: analytics.subscriptionAnalytics.totalRecurringBurdenPct },
    { label: "Weekend Spike", value: analytics.financialBehavior.weekendSpendingPct },
    { label: "Impulse Signal", value: analytics.financialBehavior.impulseSpendingPct },
    { label: "Budget Risk", value: analytics.forecasting.budgetRiskPct },
  ];

  if (isLoading || subscriptionsLoading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-sm text-zinc-400">
        Loading analytics intelligence layer...
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-7">
        <div className="pointer-events-none absolute -left-14 top-[-44px] h-48 w-48 rounded-full bg-red-600/15 blur-3xl" />
        <div className="pointer-events-none absolute right-[-46px] top-5 h-44 w-44 rounded-full bg-rose-500/20 blur-3xl" />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-red-200">
              <BrainCircuit className="h-3.5 w-3.5" />
              Analytics Intelligence Lab
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
              Predictive Finance Analytics
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Deep behavioral analysis, category-level intelligence, forecasting curves, and AI-generated summaries in a premium financial OS layer.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Pattern Detection</p>
            <p className="mt-1 text-sm font-medium text-zinc-200">{analytics.patternDetection[0]}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-12">
        <AnalyticsGlassCard
          title="Spending Trends"
          subtitle="Weekly, monthly, yearly and AI interpretation"
          rightSlot={<AreaChart className="h-4 w-4 text-red-300" />}
          className="xl:col-span-8"
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/25 p-3">
              <p className="mb-2 text-xs text-zinc-500">Monthly Spend Curve</p>
              <TrendLineChart data={analytics.spendingTrends.monthly} />
            </div>
            <div className="rounded-xl border border-white/10 bg-black/25 p-3">
              <p className="mb-2 text-xs text-zinc-500">Income Trend</p>
              <TrendLineChart data={analytics.incomeTrends.monthly} />
            </div>
            <div className="rounded-xl border border-white/10 bg-black/25 p-3">
              <p className="mb-2 text-xs text-zinc-500">Weekly Spend Pulse</p>
              <SparkBars data={analytics.spendingTrends.weekly} />
            </div>
            <div className="rounded-xl border border-white/10 bg-black/25 p-3">
              <p className="mb-1 text-xs text-zinc-500">AI Trend Interpretation</p>
              <p className="text-sm leading-relaxed text-zinc-300">{analytics.spendingTrends.interpretation}</p>
            </div>
          </div>
        </AnalyticsGlassCard>

        <AnalyticsGlassCard
          title="Financial Behavior"
          subtitle="Weekend, night, impulse and consistency intelligence"
          rightSlot={<Activity className="h-4 w-4 text-red-300" />}
          className="xl:col-span-4"
        >
          <BehaviorRadials
            items={[
              { label: "Weekend", value: analytics.financialBehavior.weekendSpendingPct },
              { label: "Night", value: analytics.financialBehavior.nightSpendingPct },
              { label: "Impulse", value: analytics.financialBehavior.impulseSpendingPct },
              { label: "Consistency", value: analytics.financialBehavior.consistencyScore },
            ]}
          />
        </AnalyticsGlassCard>

        <AnalyticsGlassCard
          title="Financial Forecasting"
          subtitle="Future spending, savings projection, budget risk and goal completion"
          rightSlot={<Sparkles className="h-4 w-4 text-red-300" />}
          className="xl:col-span-7"
        >
          <div className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="mb-2 text-xs text-zinc-500">Forecasting Curves</p>
            <ForecastCurveChart data={analytics.forecasting.spendingPrediction} />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-black/25 p-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Savings Projection</p>
              <p className="mt-1 text-base font-semibold text-zinc-100">
                {formatCurrency(analytics.forecasting.savingsProjection.at(-1)?.value ?? 0, defaultCurrency)}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 p-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Budget Risk</p>
              <p className="mt-1 text-base font-semibold text-amber-200">
                {pct(analytics.forecasting.budgetRiskPct)}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 p-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Goal Forecast</p>
              <p className="mt-1 text-base font-semibold text-emerald-200">
                {pct(analytics.forecasting.goalCompletionPct)}
              </p>
            </div>
          </div>
        </AnalyticsGlassCard>

        <AnalyticsGlassCard
          title="Category Intelligence"
          subtitle="Distribution, fast-growing categories and wasteful spending"
          rightSlot={<CircleAlert className="h-4 w-4 text-red-300" />}
          className="xl:col-span-5"
        >
          <CategoryBars data={analytics.categoryIntelligence.distribution} />
          <div className="mt-4 space-y-2 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-zinc-300">
            <p>
              Fastest growing:{" "}
              <span className="font-medium text-red-200">
                {analytics.categoryIntelligence.fastestGrowing?.category ?? "N/A"}
              </span>
            </p>
            <p>
              Most wasteful:{" "}
              <span className="font-medium text-amber-200">
                {analytics.categoryIntelligence.mostWasteful?.category ?? "N/A"}
              </span>
            </p>
            {analytics.categoryIntelligence.behavioralPatterns.map((pattern) => (
              <p key={pattern} className="text-zinc-400">
                • {pattern}
              </p>
            ))}
          </div>
        </AnalyticsGlassCard>

        <AnalyticsGlassCard
          title="Subscription Analytics"
          subtitle="Recurring burden, yearly cost and cancellation suggestions"
          rightSlot={<WalletCards className="h-4 w-4 text-red-300" />}
          className="xl:col-span-6"
        >
          <ComparisonMiniBars items={recurringLoadItems} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/25 p-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Yearly Cost</p>
              <p className="mt-1 text-lg font-semibold text-zinc-100">
                {formatCurrency(analytics.subscriptionAnalytics.yearlySubscriptionCost, defaultCurrency)}
              </p>
              <p className="text-xs text-zinc-500">Total recurring annual burden</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/25 p-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">Optimization Potential</p>
              <p className="mt-1 text-lg font-semibold text-emerald-200">
                {formatCurrency(analytics.subscriptionAnalytics.optimizationPotential, defaultCurrency)}
              </p>
              <p className="text-xs text-zinc-500">Estimated annual recovery</p>
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-zinc-500">AI Cancellation Suggestions</p>
            <div className="flex flex-wrap gap-2">
              {analytics.subscriptionAnalytics.cancellationSuggestions.map((item) => (
                <span
                  key={item}
                  className="inline-flex rounded-full border border-red-500/25 bg-red-500/10 px-2.5 py-1 text-xs text-red-200"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </AnalyticsGlassCard>

        <AnalyticsGlassCard
          title="Category Heatmap"
          subtitle="35-day spending activity density map"
          className="xl:col-span-3"
        >
          <HeatmapGrid cells={analytics.categoryHeatmap} />
        </AnalyticsGlassCard>

        <AnalyticsGlassCard
          title="Cash Flow Intelligence"
          subtitle="Net flow pattern and savings momentum"
          className="xl:col-span-3"
        >
          <SparkBars data={analytics.cashFlowIntelligence} />
          <p className="mt-3 text-xs text-zinc-400">
            Savings momentum:{" "}
            <span className={analytics.savingsGrowth.momentumPct >= 0 ? "text-emerald-300" : "text-red-300"}>
              {pct(analytics.savingsGrowth.momentumPct)}
            </span>
          </p>
        </AnalyticsGlassCard>
      </div>

      <section className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.42)] backdrop-blur-xl">
        <div className="mb-3 flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">AI Analysis Cards</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {analytics.aiSummaries.map((item) => (
            <AIAnalysisCard key={item.title} title={item.title} detail={item.detail} severity={item.severity} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default AnalyticsPage;
