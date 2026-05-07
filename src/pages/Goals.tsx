import { useMemo } from "react";
import { Goal, Sparkles, Target } from "lucide-react";
import { useFinance } from "@/hooks/useFinance";
import { useSettings } from "@/hooks/useSettings";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { buildRubyAIContext, buildRubyAISuggestions } from "@/lib/rubyAI";
import { RubyAIWidget } from "@/components/ruby-ai/RubyAIWidget";
import { RubyAISuggestedPrompts } from "@/components/ruby-ai/RubyAISuggestedPrompts";
import { calculateFinancialHealthScore } from "@/lib/financialHealthScore";
import { formatCurrency } from "@/i18n/currency";
import { buildPredictiveFinanceEngine } from "@/lib/predictiveFinanceEngine";
import {
  PredictiveInsightsFeed,
  PredictiveRiskCard,
  PredictiveSummaryCards,
  SafeToSpendWidget,
} from "@/components/predictive/PredictiveWidgets";

const monthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;
const safe = (value: number) => (Number.isFinite(value) ? value : 0);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const Goals = () => {
  const { transactions, budgets } = useFinance();
  const { subscriptions } = useSubscriptions();
  const { defaultCurrency } = useSettings();

  const now = new Date();
  const current = monthKey(now);

  const monthlyIncome = transactions
    .filter((tx) => tx.type === "income" && monthKey(new Date(tx.date)) === current)
    .reduce((sum, tx) => sum + safe(Number(tx.amount)), 0);
  const monthlyExpense = transactions
    .filter((tx) => tx.type === "expense" && monthKey(new Date(tx.date)) === current)
    .reduce((sum, tx) => sum + safe(Number(tx.amount)), 0);
  const monthlySubscription = subscriptions.reduce((sum, sub) => {
    const amount = safe(Number(sub.price));
    return sum + (sub.billing_cycle === "yearly" ? amount / 12 : amount);
  }, 0);

  const monthlyIncomeSeries = useMemo(() => {
    const keys = [5, 4, 3, 2, 1, 0].map((offset) => {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      return monthKey(d);
    });
    return keys.map((key) =>
      transactions
        .filter((tx) => tx.type === "income" && monthKey(new Date(tx.date)) === key)
        .reduce((sum, tx) => sum + safe(Number(tx.amount)), 0)
    );
  }, [transactions, now]);

  const monthlyExpenseSeries = useMemo(() => {
    const keys = [5, 4, 3, 2, 1, 0].map((offset) => {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      return monthKey(d);
    });
    return keys.map((key) =>
      transactions
        .filter((tx) => tx.type === "expense" && monthKey(new Date(tx.date)) === key)
        .reduce((sum, tx) => sum + safe(Number(tx.amount)), 0)
    );
  }, [transactions, now]);

  const budgetLimit = budgets.reduce((sum, budget) => sum + safe(Number(budget.limit_amount)), 0);
  const goalProgress = budgetLimit > 0 ? clamp((monthlyExpense / budgetLimit) * 100, 0, 100) : 0;
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpense - monthlySubscription) / monthlyIncome) * 100 : 0;

  const health = calculateFinancialHealthScore({
    savingsRatePct: savingsRate,
    monthlyExpenseSeries,
    monthlyIncomeSeries,
    subscriptionBurdenPct: monthlyIncome > 0 ? (monthlySubscription / monthlyIncome) * 100 : 0,
    expenseRatioPct: monthlyIncome > 0 ? (monthlyExpense / monthlyIncome) * 100 : 100,
    goalProgressPct: goalProgress,
    emergencyFundMonths: monthlyExpense > 0 ? Math.max(monthlyIncome - monthlyExpense, 0) / monthlyExpense : 0,
    overspendingDaysRatio: 0.25,
    debtRatioPct: monthlyIncome > 0 ? (monthlySubscription / monthlyIncome) * 100 : 25,
    budgetDisciplineRatio: budgetLimit > 0 ? clamp(Math.min(budgetLimit / Math.max(monthlyExpense, 1), 1), 0, 1) : 0.6,
  });

  const context = useMemo(
    () =>
      buildRubyAIContext({
        transactions,
        budgets,
        subscriptions,
        currency: defaultCurrency,
        financialHealthScore: health.score,
      }),
    [transactions, budgets, subscriptions, defaultCurrency, health.score]
  );

  const prompts = useMemo(() => buildRubyAISuggestions(context).slice(0, 5), [context]);
  const prediction = useMemo(
    () =>
      buildPredictiveFinanceEngine({
        transactions,
        budgets,
        subscriptions,
      }),
    [transactions, budgets, subscriptions]
  );

  return (
    <div className="premium-page">
      <section className="premium-section relative overflow-hidden rounded-[30px] p-6 sm:p-7">
        <div className="pointer-events-none absolute -left-14 top-[-40px] h-44 w-44 rounded-full bg-red-600/15 blur-3xl" />
        <div className="pointer-events-none absolute right-[-40px] top-10 h-36 w-36 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-red-200">
              <Goal className="h-3.5 w-3.5" />
              Goal Intelligence
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">Financial Goals Command Center</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Set better targets, measure progress, and let Ruby AI turn your current behavior into actionable goal plans.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-zinc-300">
            Current savings capacity: <span className="font-semibold text-zinc-100">{formatCurrency(Math.max(monthlyIncome - monthlyExpense, 0), defaultCurrency)}</span>
          </div>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-12">
        <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl xl:col-span-4">
          <div className="mb-2 flex items-center gap-2 text-zinc-300">
            <Target className="h-4 w-4 text-red-300" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em]">Goal Progress</h3>
          </div>
          <p className="text-3xl font-semibold text-zinc-100">{goalProgress.toFixed(1)}%</p>
          <p className="mt-1 text-xs text-zinc-500">Budget utilization vs monthly limits</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl xl:col-span-4">
          <div className="mb-2 flex items-center gap-2 text-zinc-300">
            <Sparkles className="h-4 w-4 text-red-300" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em]">Health-Aligned Goal Score</h3>
          </div>
          <p className="text-3xl font-semibold text-zinc-100">{health.score}/100</p>
          <p className="mt-1 text-xs text-zinc-500">{health.summary}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl xl:col-span-4">
          <div className="mb-2 flex items-center gap-2 text-zinc-300">
            <Goal className="h-4 w-4 text-red-300" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em]">Savings Target Signal</h3>
          </div>
          <p className="text-3xl font-semibold text-zinc-100">{savingsRate.toFixed(1)}%</p>
          <p className="mt-1 text-xs text-zinc-500">Recommended sustainable range: 15%+</p>
        </article>
      </div>

      <section className="premium-section rounded-[24px]">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Ruby AI Goal Planning Prompts</h2>
        <RubyAISuggestedPrompts prompts={prompts} onSelect={() => undefined} />
      </section>

      <RubyAIWidget
        title="Ruby AI Goal Advisor"
        summary={`Goal planning insight: ${context.weeklySummary} Ask Ruby AI to generate a goal ladder with short-, mid-, and long-term financial milestones.`}
        actionLabel="Plan Goals with Ruby AI"
      />

      <section className="premium-section rounded-[24px]">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">
          Predictive Goal Forecasting
        </h2>
        <div className="grid gap-4 xl:grid-cols-12">
          <div className="space-y-4 xl:col-span-4">
            <SafeToSpendWidget prediction={prediction} currency={defaultCurrency} />
            <PredictiveRiskCard prediction={prediction} currency={defaultCurrency} />
          </div>
          <div className="rounded-xl border border-white/10 bg-black/25 p-3 xl:col-span-8">
            <PredictiveSummaryCards prediction={prediction} currency={defaultCurrency} />
            <div className="mt-3">
              <PredictiveInsightsFeed prediction={prediction} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Goals;
