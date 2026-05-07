import { useMemo } from "react";
import { ArrowRight, BrainCircuit, Goal, HeartPulse, PiggyBank, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFinance } from "@/hooks/useFinance";
import { useSettings } from "@/hooks/useSettings";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { formatCurrency } from "@/i18n/currency";
import { buildAnalyticsIntelligence } from "@/lib/analyticsIntelligence";
import { buildPredictiveFinanceEngine } from "@/lib/predictiveFinanceEngine";
import { calculateFinancialHealthScore } from "@/lib/financialHealthScore";
import { buildMockAIInsights } from "@/lib/aiInsights";
import { buildMonthlyFinancialReport } from "@/lib/monthlyFinancialReport";
import { buildSmartBudgetPlanner } from "@/lib/smartBudgetPlanner";
import { buildRubyAIContext } from "@/lib/rubyAI";
import { PremiumEmptyState } from "@/components/shared/PremiumEmptyState";
import { Button } from "@/components/ui/button";
import { DEMO_CATEGORIES, DEMO_MONTHLY_EXPENSES, DEMO_MONTHLY_INCOME } from "@/data/demoFinanceData";

const monthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;
const safe = (value: number) => (Number.isFinite(value) ? value : 0);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const PlanningHub = () => {
  const navigate = useNavigate();
  const { transactions, budgets, isLoading } = useFinance();
  const { subscriptions, isLoading: subscriptionsLoading } = useSubscriptions();
  const { defaultCurrency } = useSettings();

  const planning = useMemo(() => {
    const now = new Date();
    const currentKey = monthKey(now);
    const monthKeys = [5, 4, 3, 2, 1, 0].map((offset) => {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      return monthKey(d);
    });

    const monthlyIncomeSeries = monthKeys.map((key) =>
      transactions
        .filter((tx) => tx.type === "income" && monthKey(new Date(tx.date)) === key)
        .reduce((sum, tx) => sum + safe(Number(tx.amount)), 0)
    );
    const monthlyExpenseSeries = monthKeys.map((key) =>
      transactions
        .filter((tx) => tx.type === "expense" && monthKey(new Date(tx.date)) === key)
        .reduce((sum, tx) => sum + safe(Number(tx.amount)), 0)
    );
    const monthlyIncome = transactions
      .filter((tx) => tx.type === "income" && monthKey(new Date(tx.date)) === currentKey)
      .reduce((sum, tx) => sum + safe(Number(tx.amount)), 0);
    const monthlyExpense = transactions
      .filter((tx) => tx.type === "expense" && monthKey(new Date(tx.date)) === currentKey)
      .reduce((sum, tx) => sum + safe(Number(tx.amount)), 0);
    const monthlySubscription = subscriptions.reduce((sum, sub) => {
      const amount = safe(Number(sub.price));
      return sum + (sub.billing_cycle === "yearly" ? amount / 12 : amount);
    }, 0);
    const budgetLimit = budgets.reduce((sum, budget) => sum + safe(Number(budget.limit_amount)), 0);
    const savingsRatePct = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpense - monthlySubscription) / monthlyIncome) * 100 : 0;
    const goalProgressPct = budgetLimit > 0 ? clamp((monthlyExpense / budgetLimit) * 100, 0, 100) : 0;
    const debtRatioPct = monthlyIncome > 0 ? (monthlySubscription / monthlyIncome) * 100 : 24;
    const expenseRatioPct = monthlyIncome > 0 ? (monthlyExpense / monthlyIncome) * 100 : 100;
    const emergencyFundMonths = monthlyExpense > 0 ? Math.max(monthlyIncome - monthlyExpense, 0) / monthlyExpense : 0;
    const budgetDisciplineRatio = budgetLimit > 0 ? clamp(Math.min(budgetLimit / Math.max(monthlyExpense, 1), 1), 0, 1) : 0.62;

    const health = calculateFinancialHealthScore({
      savingsRatePct,
      monthlyExpenseSeries,
      monthlyIncomeSeries,
      subscriptionBurdenPct: debtRatioPct,
      expenseRatioPct,
      goalProgressPct,
      emergencyFundMonths,
      overspendingDaysRatio: 0.24,
      debtRatioPct,
      budgetDisciplineRatio,
    });

    const predictive = buildPredictiveFinanceEngine({ transactions, budgets, subscriptions });
    const analytics = buildAnalyticsIntelligence({ transactions, budgets, subscriptions, currency: defaultCurrency });
    const budgetPlanner = buildSmartBudgetPlanner({
      transactions,
      budgets,
      subscriptions,
      analytics,
      health,
      predictive,
    });
    const aiInsights = buildMockAIInsights({
      expenseTrendPct: analytics.spendingTrends.monthly.at(-2)?.value
        ? ((analytics.spendingTrends.monthly.at(-1)?.value ?? 0) - (analytics.spendingTrends.monthly.at(-2)?.value ?? 0)) /
            Math.max(1, analytics.spendingTrends.monthly.at(-2)?.value ?? 0) *
            100
        : 0,
      savingsRatePct,
      monthlySubscriptionCost: monthlySubscription,
      currency: defaultCurrency,
      goalProgressPct,
      dailySafeSpend: predictive.safeToSpend.daily,
      topCategory: analytics.categoryIntelligence.distribution[0]?.category ?? "Food & Dining",
      upcomingBillsCount: subscriptions.filter((sub) => Boolean(sub.next_payment_date)).length,
    });
    const report = buildMonthlyFinancialReport({
      transactions,
      budgets,
      subscriptions,
      health,
      predictive,
      analytics,
      aiInsights,
      currency: defaultCurrency,
      referenceDate: now,
    });
    const ruby = buildRubyAIContext({
      transactions,
      budgets,
      subscriptions,
      currency: defaultCurrency,
      financialHealthScore: health.score,
    });

    return {
      health,
      report,
      budgetPlanner,
      ruby,
      topGoals: budgets.slice(0, 3),
      riskyBudgetCategories: budgetPlanner.categoryBudgets.filter((item) => item.riskLabel === "High").slice(0, 2),
      nextAction: budgetPlanner.adjustmentSuggestions[0]?.title ?? health.quickImprovementAction,
    };
  }, [transactions, budgets, subscriptions, defaultCurrency]);

  if (isLoading || subscriptionsLoading) {
    return (
      <div className="motion-card-enter rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-sm text-zinc-400">
        Loading planning hub intelligence...
      </div>
    );
  }

  const isEmpty = transactions.length === 0 && budgets.length === 0 && subscriptions.length === 0;
  if (isEmpty) {
    return (
      <div className="premium-page">
        <PremiumEmptyState
          icon={<Goal className="h-5 w-5" />}
          headline="Planning Hub is ready"
          description="Activate your goals, budgets, and monthly planning data to unlock Ruby AI strategic planning guidance."
          primaryAction={{ label: "Add Financial Data", to: "/finance" }}
          secondaryAction={{ label: "Open Overview", to: "/overview" }}
          badges={[
            `Income ${formatCurrency(DEMO_MONTHLY_INCOME, defaultCurrency)}`,
            `Expenses ${formatCurrency(DEMO_MONTHLY_EXPENSES, defaultCurrency)}`,
            ...DEMO_CATEGORIES.slice(0, 3),
          ]}
        />
      </div>
    );
  }

  return (
    <div className="premium-page">
      <section className="premium-section relative overflow-hidden rounded-[30px] p-6 sm:p-7">
        <div className="pointer-events-none absolute -left-14 top-[-44px] h-48 w-48 rounded-full bg-red-600/15 blur-3xl" />
        <div className="pointer-events-none absolute right-[-46px] top-5 h-44 w-44 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="premium-eyebrow mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              Planning Hub
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">Strategic Planning Workspace</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Ruby AI reviewed your financial plan. Your goals are progressing, but category-level budget pressure needs weekly attention.
            </p>
          </div>
          <span className="premium-chip">Planning System</span>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <article className="premium-section xl:col-span-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="premium-heading">Goals Preview</h2>
            <Button variant="outline" size="sm" onClick={() => navigate("/goals")}>
              Open Goals
            </Button>
          </div>
          <div className="space-y-2">
            {planning.topGoals.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-400">No active goals yet.</p>
            ) : (
              planning.topGoals.map((goal) => (
                <article key={goal.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-sm font-medium text-zinc-100">{goal.category}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Progress: budget target {formatCurrency(Number(goal.limit_amount), defaultCurrency)} • Predicted completion: in progress
                  </p>
                </article>
              ))
            )}
          </div>
        </article>

        <article className="premium-section xl:col-span-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="premium-heading">Budget Planner Preview</h2>
            <Button variant="outline" size="sm" onClick={() => navigate("/smart-budget-planner")}>
              Open Budget Planner
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="premium-card-quiet">
              <p className="premium-subheading">Budget Health</p>
              <p className="mt-1 text-sm text-zinc-100">{planning.budgetPlanner.summaryHero.budgetHealthStatus}</p>
            </div>
            <div className="premium-card-quiet">
              <p className="premium-subheading">Safe-to-Spend Today</p>
              <p className="mt-1 text-sm text-zinc-100">{formatCurrency(planning.budgetPlanner.safeToSpendSystem.safeToday, defaultCurrency)}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            Risky categories: {planning.riskyBudgetCategories.map((item) => item.category).join(", ") || "No high-risk category detected."}
          </p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <article className="premium-section xl:col-span-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="premium-heading">Monthly Report Preview</h2>
            <Button variant="outline" size="sm" onClick={() => navigate("/monthly-report")}>
              Open Reports
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="premium-card-quiet">
              <p className="premium-subheading">Latest Month</p>
              <p className="mt-1 text-sm text-zinc-100">{planning.report.monthLabel}</p>
            </div>
            <div className="premium-card-quiet">
              <p className="premium-subheading">Savings Rate</p>
              <p className="mt-1 text-sm text-zinc-100">{planning.report.hero.savingsRatePct.toFixed(1)}%</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-red-200">Biggest warning: {planning.report.hero.biggestWarning}</p>
        </article>

        <article className="premium-section xl:col-span-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="premium-heading">Financial Health Preview</h2>
            <Button variant="outline" size="sm" onClick={() => navigate("/financial-health")}>
              Open Health
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="premium-card-quiet">
              <p className="premium-subheading">Current Score</p>
              <p className="mt-1 text-sm text-zinc-100">{planning.health.score}/100</p>
            </div>
            <div className="premium-card-quiet">
              <p className="premium-subheading">Quick Action</p>
              <p className="mt-1 text-xs text-zinc-300">{planning.health.quickImprovementAction}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            Top positive: {planning.health.topPositiveFactor} • Top negative: {planning.health.topNegativeFactor}
          </p>
        </article>
      </section>

      <section className="premium-section rounded-[26px]">
        <div className="mb-3 flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-red-300" />
          <h2 className="premium-heading">Ruby AI Planning Suggestions</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-sm font-medium text-zinc-100">Recommended next action</p>
            <p className="mt-1 text-xs text-zinc-300">{planning.nextAction}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-sm font-medium text-zinc-100">Ruby AI planning note</p>
            <p className="mt-1 text-xs text-zinc-300">{planning.ruby.weeklySummary}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-sm font-medium text-zinc-100">Focus category</p>
            <p className="mt-1 text-xs text-zinc-300">{planning.ruby.topSpendingCategory}</p>
          </article>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => navigate("/ruby-ai")} className="gap-2">
            Ask Ruby AI
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => navigate("/planning/budget-planner")} className="gap-2">
            <PiggyBank className="h-4 w-4" />
            Adjust Budget Plan
          </Button>
          <Button variant="outline" onClick={() => navigate("/planning/financial-health")} className="gap-2">
            <HeartPulse className="h-4 w-4" />
            Improve Health Score
          </Button>
        </div>
      </section>
    </div>
  );
};

export default PlanningHub;
