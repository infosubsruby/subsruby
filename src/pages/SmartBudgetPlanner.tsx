import { useMemo } from "react";
import { BrainCircuit, PiggyBank, Sparkles } from "lucide-react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useFinance } from "@/hooks/useFinance";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useSettings } from "@/hooks/useSettings";
import { buildAnalyticsIntelligence } from "@/lib/analyticsIntelligence";
import { buildPredictiveFinanceEngine } from "@/lib/predictiveFinanceEngine";
import { calculateFinancialHealthScore } from "@/lib/financialHealthScore";
import { buildSmartBudgetPlanner } from "@/lib/smartBudgetPlanner";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { SmartBudgetCategoryCard } from "@/components/smart-budget/SmartBudgetCategoryCard";
import { SmartBudgetRecommendationCard } from "@/components/smart-budget/SmartBudgetRecommendationCard";
import { SmartBudgetRiskCard } from "@/components/smart-budget/SmartBudgetRiskCard";
import { SafeToSpendPanel } from "@/components/smart-budget/SafeToSpendPanel";
import { formatCurrency } from "@/i18n/currency";
import { PremiumEmptyState } from "@/components/shared/PremiumEmptyState";
import { DEMO_CATEGORIES, DEMO_MONTHLY_EXPENSES, DEMO_MONTHLY_INCOME } from "@/data/demoFinanceData";
import { RubyAISuggestedPrompts } from "@/components/ruby-ai/RubyAISuggestedPrompts";
import { RubyAIWidget } from "@/components/ruby-ai/RubyAIWidget";
import type { RubyAISuggestion } from "@/lib/rubyAI";

const monthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const safe = (value: number) => (Number.isFinite(value) ? value : 0);

const historyConfig = {
  plannedBudget: { label: "Planned", color: "#f87171" },
  actualSpend: { label: "Actual", color: "#fb7185" },
} satisfies ChartConfig;

const SmartBudgetPlanner = () => {
  const { transactions, budgets, isLoading } = useFinance();
  const { subscriptions, isLoading: isLoadingSubs } = useSubscriptions();
  const { defaultCurrency } = useSettings();

  const engine = useMemo(() => {
    const now = new Date();
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
    const currentKey = monthKey(now);
    const currentIncome = transactions
      .filter((tx) => tx.type === "income" && monthKey(new Date(tx.date)) === currentKey)
      .reduce((sum, tx) => sum + safe(Number(tx.amount)), 0);
    const currentExpense = transactions
      .filter((tx) => tx.type === "expense" && monthKey(new Date(tx.date)) === currentKey)
      .reduce((sum, tx) => sum + safe(Number(tx.amount)), 0);
    const monthlySubCost = subscriptions.reduce((sum, sub) => {
      const amount = safe(Number(sub.price));
      return sum + (sub.billing_cycle === "yearly" ? amount / 12 : amount);
    }, 0);
    const totalBudget = budgets.reduce((sum, budget) => sum + safe(Number(budget.limit_amount)), 0);
    const savingsRatePct = currentIncome > 0 ? ((currentIncome - currentExpense - monthlySubCost) / currentIncome) * 100 : 0;
    const goalProgressPct = totalBudget > 0 ? clamp((currentExpense / totalBudget) * 100, 0, 100) : 0;
    const debtRatioPct = currentIncome > 0 ? (monthlySubCost / currentIncome) * 100 : 24;
    const expenseRatioPct = currentIncome > 0 ? (currentExpense / currentIncome) * 100 : 100;
    const emergencyFundMonths = currentExpense > 0 ? Math.max(currentIncome - currentExpense, 0) / currentExpense : 0;
    const budgetDisciplineRatio = totalBudget > 0 ? clamp(Math.min(totalBudget / Math.max(currentExpense, 1), 1), 0, 1) : 0.62;

    const health = calculateFinancialHealthScore({
      savingsRatePct,
      monthlyExpenseSeries,
      monthlyIncomeSeries,
      subscriptionBurdenPct: debtRatioPct,
      expenseRatioPct,
      goalProgressPct,
      emergencyFundMonths,
      overspendingDaysRatio: 0.26,
      debtRatioPct,
      budgetDisciplineRatio,
    });
    const predictive = buildPredictiveFinanceEngine({ transactions, budgets, subscriptions });
    const analytics = buildAnalyticsIntelligence({
      transactions,
      budgets,
      subscriptions,
      currency: defaultCurrency,
    });
    return buildSmartBudgetPlanner({
      transactions,
      budgets,
      subscriptions,
      analytics,
      health,
      predictive,
    });
  }, [transactions, budgets, subscriptions, defaultCurrency]);

  const rubyPrompts: RubyAISuggestion[] = useMemo(
    () =>
      engine.rubyBudgetPrompts.map((prompt, index) => ({
        id: `budget-prompt-${index}`,
        label: prompt.replace(".", ""),
        prompt,
      })),
    [engine.rubyBudgetPrompts]
  );

  if (isLoading || isLoadingSubs) {
    return (
      <div className="motion-card-enter rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-sm text-zinc-400">
        Loading smart budget planner intelligence...
      </div>
    );
  }

  const isPlannerEmpty = transactions.length === 0 && budgets.length === 0 && subscriptions.length === 0;
  if (isPlannerEmpty) {
    return (
      <div className="premium-page">
        <PremiumEmptyState
          icon={<PiggyBank className="h-5 w-5" />}
          headline="Smart Budget Planner is ready"
          description="Add transactions and budget categories to unlock AI budget planning, risk alerts, and safe-to-spend guidance."
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
              Smart Budget Planner
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">AI-Powered Budget Command Center</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Intelligent monthly budgeting connected to your transactions, analytics, goals, financial health, and Ruby AI.
            </p>
          </div>
          <span className="premium-chip">{engine.monthLabel}</span>
        </div>
      </section>

      <section className="premium-section rounded-[26px]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="premium-heading">Budget Summary Hero</h2>
          <span
            className={`rounded-full border px-2.5 py-1 text-xs ${
              engine.summaryHero.budgetHealthStatus === "On Track"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : engine.summaryHero.budgetHealthStatus === "Cautious"
                ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                : "border-red-500/35 bg-red-500/10 text-red-200"
            }`}
          >
            {engine.summaryHero.budgetHealthStatus}
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article className="premium-card-quiet">
            <p className="premium-subheading">Monthly Income</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{formatCurrency(engine.summaryHero.monthlyIncome, defaultCurrency)}</p>
          </article>
          <article className="premium-card-quiet">
            <p className="premium-subheading">Total Planned Budget</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{formatCurrency(engine.summaryHero.totalPlannedBudget, defaultCurrency)}</p>
          </article>
          <article className="premium-card-quiet">
            <p className="premium-subheading">Spent So Far</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{formatCurrency(engine.summaryHero.spentSoFar, defaultCurrency)}</p>
          </article>
          <article className="premium-card-quiet">
            <p className="premium-subheading">Remaining Budget</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{formatCurrency(engine.summaryHero.remainingBudget, defaultCurrency)}</p>
          </article>
          <article className="premium-card-quiet">
            <p className="premium-subheading">Savings Target</p>
            <p className="mt-1 text-sm font-medium text-zinc-100">{formatCurrency(engine.summaryHero.savingsTarget, defaultCurrency)}</p>
          </article>
          <article className="premium-card-quiet">
            <p className="premium-subheading">Safe To Spend Today</p>
            <p className="mt-1 text-sm font-medium text-zinc-100">{formatCurrency(engine.summaryHero.safeToSpendToday, defaultCurrency)}</p>
          </article>
          <article className="premium-card-quiet">
            <p className="premium-subheading">Month Progress</p>
            <p className="mt-1 text-sm font-medium text-zinc-100">{engine.summaryHero.monthProgressPct.toFixed(1)}%</p>
          </article>
          <article className="premium-card-quiet">
            <p className="premium-subheading">Budget Health</p>
            <p className="mt-1 text-sm font-medium text-zinc-100">{engine.summaryHero.budgetHealthStatus}</p>
          </article>
        </div>
        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">{engine.summaryHero.aiSummary}</div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <article className="premium-section xl:col-span-7">
          <h2 className="premium-heading mb-3">Monthly Budget Overview</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <div className="premium-card-quiet">
              <p className="premium-subheading">Total Income</p>
              <p className="mt-1 text-sm text-zinc-100">{formatCurrency(engine.monthlyOverview.totalIncome, defaultCurrency)}</p>
            </div>
            <div className="premium-card-quiet">
              <p className="premium-subheading">Fixed Expenses</p>
              <p className="mt-1 text-sm text-zinc-100">{formatCurrency(engine.monthlyOverview.fixedExpenses, defaultCurrency)}</p>
            </div>
            <div className="premium-card-quiet">
              <p className="premium-subheading">Variable Expenses</p>
              <p className="mt-1 text-sm text-zinc-100">{formatCurrency(engine.monthlyOverview.variableExpenses, defaultCurrency)}</p>
            </div>
            <div className="premium-card-quiet">
              <p className="premium-subheading">Subscriptions</p>
              <p className="mt-1 text-sm text-zinc-100">{formatCurrency(engine.monthlyOverview.subscriptions, defaultCurrency)}</p>
            </div>
            <div className="premium-card-quiet">
              <p className="premium-subheading">Savings Target</p>
              <p className="mt-1 text-sm text-zinc-100">{formatCurrency(engine.monthlyOverview.savingsTarget, defaultCurrency)}</p>
            </div>
            <div className="premium-card-quiet">
              <p className="premium-subheading">Remaining Flexible</p>
              <p className="mt-1 text-sm text-zinc-100">{formatCurrency(engine.monthlyOverview.remainingFlexibleBudget, defaultCurrency)}</p>
            </div>
          </div>
        </article>
        <article className="premium-section xl:col-span-5">
          <h2 className="premium-heading mb-3">Projected EOM Balance</h2>
          <p className="text-3xl font-semibold text-zinc-100">{formatCurrency(engine.monthlyOverview.projectedEndOfMonthBalance, defaultCurrency)}</p>
          <p className="mt-2 text-xs text-zinc-400">
            Projection based on current budget pace, recurring costs, and predictive spending model.
          </p>
        </article>
      </section>

      <section className="premium-section rounded-[26px]">
        <h2 className="premium-heading mb-3">Category Budgets</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {engine.categoryBudgets.map((item) => (
            <SmartBudgetCategoryCard key={item.category} item={item} currency={defaultCurrency} />
          ))}
        </div>
      </section>

      <section className="premium-section rounded-[26px]">
        <h2 className="premium-heading mb-3">AI Budget Recommendations</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {engine.aiRecommendations.map((item) => (
            <SmartBudgetRecommendationCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <SafeToSpendPanel
        safeToday={engine.safeToSpendSystem.safeToday}
        safeWeek={engine.safeToSpendSystem.safeThisWeek}
        remainingFlexible={engine.safeToSpendSystem.remainingMonthlyFlexibleBudget}
        upcomingBillsImpact={engine.safeToSpendSystem.upcomingBillsImpact}
        overspendingRiskPct={engine.safeToSpendSystem.projectedOverspendingRiskPct}
        aiExplanation={engine.safeToSpendSystem.aiExplanation}
        currency={defaultCurrency}
      />

      <section className="premium-section rounded-[26px]">
        <h2 className="premium-heading mb-3">Budget Risk Alerts</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {engine.riskAlerts.map((item) => (
            <SmartBudgetRiskCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <article className="premium-section xl:col-span-6">
          <h2 className="premium-heading mb-3">Goal-Based Budget Planning</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="premium-card-quiet">
              <p className="premium-subheading">Active Goals Affected</p>
              <p className="mt-1 text-lg font-semibold text-zinc-100">{engine.goalBasedPlanning.activeGoalsAffected}</p>
            </div>
            <div className="premium-card-quiet">
              <p className="premium-subheading">Monthly Required Saving</p>
              <p className="mt-1 text-lg font-semibold text-zinc-100">{formatCurrency(engine.goalBasedPlanning.monthlyRequiredSaving, defaultCurrency)}</p>
            </div>
            <div className="premium-card-quiet">
              <p className="premium-subheading">Delayed Goals</p>
              <p className="mt-1 text-sm font-medium text-zinc-100">{engine.goalBasedPlanning.delayedGoalsDueToOverspending}</p>
            </div>
            <div className="premium-card-quiet">
              <p className="premium-subheading">Adjustment Strategy</p>
              <p className="mt-1 text-xs text-zinc-300">{engine.goalBasedPlanning.adjustmentToReachFaster}</p>
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">
            Savings acceleration: {engine.goalBasedPlanning.savingsAccelerationSuggestion}
          </div>
        </article>
        <article className="premium-section xl:col-span-6">
          <h2 className="premium-heading mb-3">Budget Adjustment Suggestions</h2>
          <div className="space-y-2">
            {engine.adjustmentSuggestions.map((item) => (
              <SmartBudgetRecommendationCard key={`adjust-${item.id}`} item={item} />
            ))}
          </div>
        </article>
      </section>

      <section className="premium-section rounded-[26px]">
        <h2 className="premium-heading mb-3">Budget History / Comparison</h2>
        <div className="grid gap-4 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <ChartContainer config={historyConfig} className="h-[260px] w-full">
              <LineChart data={engine.budgetHistoryComparison.history} margin={{ left: 8, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} width={40} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="plannedBudget" stroke="var(--color-plannedBudget)" strokeWidth={2.2} dot={false} />
                <Line type="monotone" dataKey="actualSpend" stroke="var(--color-actualSpend)" strokeWidth={2.2} dot={false} />
              </LineChart>
            </ChartContainer>
          </div>
          <div className="space-y-2 xl:col-span-4">
            <article className="premium-card-quiet">
              <p className="premium-subheading">Current Month</p>
              <p className="mt-1 text-xs text-zinc-300">{engine.budgetHistoryComparison.currentMonthPerformance}</p>
            </article>
            <article className="premium-card-quiet">
              <p className="premium-subheading">Previous Month Comparison</p>
              <p className="mt-1 text-xs text-zinc-300">{engine.budgetHistoryComparison.previousMonthComparison}</p>
            </article>
            <article className="premium-card-quiet">
              <p className="premium-subheading">Best Improvement</p>
              <p className="mt-1 text-xs text-zinc-300">{engine.budgetHistoryComparison.bestCategoryImprovement}</p>
            </article>
            <article className="premium-card-quiet">
              <p className="premium-subheading">Worst Overrun</p>
              <p className="mt-1 text-xs text-zinc-300">{engine.budgetHistoryComparison.worstCategoryOverrun}</p>
            </article>
            <article className="premium-card-quiet">
              <p className="premium-subheading">Savings Trend</p>
              <p className="mt-1 text-xs text-zinc-300">{engine.budgetHistoryComparison.savingsRateTrend}</p>
            </article>
            <article className="premium-card-quiet">
              <p className="premium-subheading">Budget Discipline</p>
              <p className="mt-1 text-xs text-zinc-300">{engine.budgetHistoryComparison.budgetDisciplineTrend}</p>
            </article>
          </div>
        </div>
      </section>

      <section className="premium-section rounded-[26px]">
        <div className="mb-3 flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-red-300" />
          <h2 className="premium-heading">Ask Ruby AI About Budget</h2>
        </div>
        <RubyAISuggestedPrompts prompts={rubyPrompts} onSelect={() => undefined} />
        <div className="mt-4">
          <RubyAIWidget
            title="Ruby AI Budget Assistant"
            summary="Ask Ruby AI to build a personalized budget, detect over-budget causes, and suggest high-impact category adjustments tied to your goals and financial health."
            actionLabel="Open Ruby AI Budget Session"
          />
        </div>
      </section>
    </div>
  );
};

export default SmartBudgetPlanner;
