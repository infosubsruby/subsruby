import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Download,
  FileDown,
  Mail,
  Send,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { useFinance } from "@/hooks/useFinance";
import { useSettings } from "@/hooks/useSettings";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { formatCurrency } from "@/i18n/currency";
import { buildAnalyticsIntelligence } from "@/lib/analyticsIntelligence";
import { buildPredictiveFinanceEngine } from "@/lib/predictiveFinanceEngine";
import { calculateFinancialHealthScore } from "@/lib/financialHealthScore";
import { buildMockAIInsights } from "@/lib/aiInsights";
import { buildMonthlyFinancialReport } from "@/lib/monthlyFinancialReport";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { MonthlyInsightCard } from "@/components/monthly-report/MonthlyInsightCard";
import { MonthlyActionPlanCard } from "@/components/monthly-report/MonthlyActionPlanCard";
import { Button } from "@/components/ui/button";
import { PremiumEmptyState } from "@/components/shared/PremiumEmptyState";
import { DEMO_CATEGORIES, DEMO_MONTHLY_EXPENSES, DEMO_MONTHLY_INCOME } from "@/data/demoFinanceData";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { ProValueCallout } from "@/components/monetization/ProValueCallout";
import { FeatureGate } from "@/components/monetization/FeatureGate";
import { UpgradeModal } from "@/components/monetization/UpgradeModal";

const safe = (value: number) => (Number.isFinite(value) ? value : 0);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, safe(value)));
const monthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;

const historyChartConfig = {
  income: { label: "Income", color: "#34d399" },
  expenses: { label: "Expenses", color: "#fb7185" },
  savings: { label: "Savings", color: "#f87171" },
} satisfies ChartConfig;

const getMonthSeriesKeys = (date: Date) =>
  Array.from({ length: 6 }, (_, index) => {
    const d = new Date(date.getFullYear(), date.getMonth() - (5 - index), 1);
    return monthKey(d);
  });

const MonthlyReport = () => {
  const { canAccessFeature } = usePlanAccess();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { transactions, budgets, isLoading } = useFinance();
  const { subscriptions, isLoading: subscriptionsLoading } = useSubscriptions();
  const { defaultCurrency } = useSettings();
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0);

  const selectedDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() - selectedMonthOffset, 1);
  }, [selectedMonthOffset]);

  const selectableMonths = useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) => {
        const date = new Date();
        date.setMonth(date.getMonth() - index);
        const offset = index;
        return {
          offset,
          label: date.toLocaleString("en-US", { month: "long", year: "numeric" }),
        };
      }),
    []
  );

  const report = useMemo(() => {
    const selectedMonthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999);
    const scopedTransactions = transactions.filter((tx) => {
      const date = new Date(tx.date);
      return !Number.isNaN(date.getTime()) && date <= selectedMonthEnd;
    });

    const monthKeys = getMonthSeriesKeys(selectedDate);
    const incomeSeries = monthKeys.map((key) =>
      scopedTransactions
        .filter((tx) => tx.type === "income" && monthKey(new Date(tx.date)) === key)
        .reduce((sum, tx) => sum + safe(Number(tx.amount)), 0)
    );
    const expenseSeries = monthKeys.map((key) =>
      scopedTransactions
        .filter((tx) => tx.type === "expense" && monthKey(new Date(tx.date)) === key)
        .reduce((sum, tx) => sum + safe(Number(tx.amount)), 0)
    );

    const selectedKey = monthKey(selectedDate);
    const selectedIncome = scopedTransactions
      .filter((tx) => tx.type === "income" && monthKey(new Date(tx.date)) === selectedKey)
      .reduce((sum, tx) => sum + safe(Number(tx.amount)), 0);
    const selectedExpense = scopedTransactions
      .filter((tx) => tx.type === "expense" && monthKey(new Date(tx.date)) === selectedKey)
      .reduce((sum, tx) => sum + safe(Number(tx.amount)), 0);
    const selectedSubCost = subscriptions.reduce((sum, sub) => {
      const amount = safe(Number(sub.price));
      return sum + (sub.billing_cycle === "yearly" ? amount / 12 : amount);
    }, 0);
    const budgetLimit = budgets.reduce((sum, budget) => sum + safe(Number(budget.limit_amount)), 0);
    const savingsRatePct = selectedIncome > 0 ? ((selectedIncome - selectedExpense - selectedSubCost) / selectedIncome) * 100 : 0;
    const goalProgressPct = budgetLimit > 0 ? clamp((selectedExpense / budgetLimit) * 100, 0, 100) : 0;
    const debtRatioPct = selectedIncome > 0 ? (selectedSubCost / selectedIncome) * 100 : 24;
    const expenseRatioPct = selectedIncome > 0 ? (selectedExpense / selectedIncome) * 100 : 100;
    const emergencyFundMonths = selectedExpense > 0 ? Math.max(selectedIncome - selectedExpense, 0) / selectedExpense : 0;
    const budgetDisciplineRatio = budgetLimit > 0 ? clamp(Math.min(budgetLimit / Math.max(selectedExpense, 1), 1), 0, 1) : 0.6;

    const health = calculateFinancialHealthScore({
      savingsRatePct,
      monthlyExpenseSeries: expenseSeries,
      monthlyIncomeSeries: incomeSeries,
      subscriptionBurdenPct: debtRatioPct,
      expenseRatioPct,
      goalProgressPct,
      emergencyFundMonths,
      overspendingDaysRatio: 0.24,
      debtRatioPct,
      budgetDisciplineRatio,
    });

    const predictive = buildPredictiveFinanceEngine({
      transactions: scopedTransactions,
      budgets,
      subscriptions,
    });
    const analytics = buildAnalyticsIntelligence({
      transactions: scopedTransactions,
      budgets,
      subscriptions,
      currency: defaultCurrency,
    });
    const aiInsights = buildMockAIInsights({
      expenseTrendPct: analytics.spendingTrends.monthly.at(-2)?.value
        ? ((analytics.spendingTrends.monthly.at(-1)?.value ?? 0) - (analytics.spendingTrends.monthly.at(-2)?.value ?? 0)) /
            Math.max(1, analytics.spendingTrends.monthly.at(-2)?.value ?? 0) *
            100
        : 0,
      savingsRatePct,
      monthlySubscriptionCost: selectedSubCost,
      currency: defaultCurrency,
      goalProgressPct,
      dailySafeSpend: predictive.safeToSpend.daily,
      topCategory: analytics.categoryIntelligence.distribution[0]?.category ?? "Food & Dining",
      upcomingBillsCount: subscriptions.filter((sub) => Boolean(sub.next_payment_date)).length,
    });

    return buildMonthlyFinancialReport({
      transactions: scopedTransactions,
      budgets,
      subscriptions,
      health,
      predictive,
      analytics,
      aiInsights,
      currency: defaultCurrency,
      referenceDate: selectedDate,
    });
  }, [transactions, budgets, subscriptions, selectedDate, defaultCurrency]);

  if (isLoading || subscriptionsLoading) {
    return (
      <div className="motion-card-enter rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-sm text-zinc-400">
        Loading monthly report intelligence...
      </div>
    );
  }

  const isReportEmpty = transactions.length === 0 && budgets.length === 0 && subscriptions.length === 0;
  if (isReportEmpty) {
    return (
      <div className="premium-page">
        <PremiumEmptyState
          icon={<Sparkles className="h-5 w-5" />}
          headline="Your monthly report layer is ready"
          description="Add income, expenses, subscriptions, and goals to unlock a premium AI monthly financial review."
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
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
      <section className="premium-section relative overflow-hidden rounded-[30px] p-6 sm:p-7">
        <div className="pointer-events-none absolute -left-14 top-[-44px] h-48 w-48 rounded-full bg-red-600/15 blur-3xl" />
        <div className="pointer-events-none absolute right-[-46px] top-5 h-44 w-44 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="premium-eyebrow mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              Monthly Financial Report
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
              Executive Monthly Financial Review
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Ruby AI summarizes your monthly financial performance, key changes, category pressure, subscription impact,
              and the next best actions.
            </p>
          </div>
          <label className="rounded-xl border border-white/10 bg-black/30 p-2 text-xs text-zinc-300">
            <span className="mb-1 block text-[10px] uppercase tracking-[0.14em] text-zinc-500">Selected Month</span>
            <select
              value={selectedMonthOffset}
              onChange={(event) => setSelectedMonthOffset(Number(event.target.value))}
              className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-zinc-100 outline-none"
            >
              {selectableMonths.map((item) => (
                <option key={item.offset} value={item.offset}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>
      <ProValueCallout message="Export monthly reports with Pro." />

      <section className="premium-section rounded-[26px]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="premium-heading">Report Summary Hero</h2>
          <span className="premium-chip">{report.monthLabel}</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article className="premium-card-quiet">
            <p className="premium-subheading">Total Income</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-100">{formatCurrency(report.hero.income, defaultCurrency)}</p>
          </article>
          <article className="premium-card-quiet">
            <p className="premium-subheading">Total Expenses</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-100">{formatCurrency(report.hero.expenses, defaultCurrency)}</p>
          </article>
          <article className="premium-card-quiet">
            <p className="premium-subheading">Net Savings</p>
            <p className={`mt-1 text-2xl font-semibold ${report.hero.netSavings >= 0 ? "text-emerald-300" : "text-red-300"}`}>
              {formatCurrency(report.hero.netSavings, defaultCurrency)}
            </p>
          </article>
          <article className="premium-card-quiet">
            <p className="premium-subheading">Savings Rate</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-100">{report.hero.savingsRatePct.toFixed(1)}%</p>
          </article>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <article className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="premium-subheading">Health Score Change</p>
            <p className={`mt-1 text-lg font-semibold ${report.hero.healthScoreChange >= 0 ? "text-emerald-300" : "text-red-300"}`}>
              {report.hero.healthScoreChange >= 0 ? "+" : ""}
              {report.hero.healthScoreChange.toFixed(1)}
            </p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="premium-subheading">Biggest Improvement</p>
            <p className="mt-1 text-sm font-medium text-zinc-100">{report.hero.biggestImprovement}</p>
          </article>
          <article className="rounded-xl border border-red-500/25 bg-red-500/10 p-3">
            <p className="premium-subheading text-red-200">Biggest Warning</p>
            <p className="mt-1 text-sm font-medium text-red-100">{report.hero.biggestWarning}</p>
          </article>
        </div>
        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">{report.hero.aiSummary}</div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <article className="premium-section xl:col-span-8">
          <h2 className="premium-heading mb-3">Income vs Expenses</h2>
          <ChartContainer config={historyChartConfig} className="h-[260px] w-full">
            <AreaChart data={report.incomeVsExpenses.history} margin={{ left: 8, right: 10, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="monthlyIncomeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0.04} />
                </linearGradient>
                <linearGradient id="monthlyExpenseFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb7185" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#fb7185" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} width={40} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="income" stroke="var(--color-income)" fill="url(#monthlyIncomeFill)" strokeWidth={2} />
              <Area type="monotone" dataKey="expenses" stroke="var(--color-expenses)" fill="url(#monthlyExpenseFill)" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        </article>
        <article className="premium-section xl:col-span-4">
          <h2 className="premium-heading mb-3">Snapshot</h2>
          <div className="space-y-2">
            <div className="premium-card-quiet">
              <p className="premium-subheading">Net Cash Flow</p>
              <p className={`mt-1 text-lg font-semibold ${report.incomeVsExpenses.netCashFlow >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                {formatCurrency(report.incomeVsExpenses.netCashFlow, defaultCurrency)}
              </p>
            </div>
            <div className="premium-card-quiet">
              <p className="premium-subheading">Income Trend</p>
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-zinc-100">
                {report.incomeVsExpenses.incomeTrendPct >= 0 ? <ArrowUp className="h-4 w-4 text-emerald-300" /> : <ArrowDown className="h-4 w-4 text-red-300" />}
                {Math.abs(report.incomeVsExpenses.incomeTrendPct).toFixed(1)}% vs previous month
              </p>
            </div>
            <div className="premium-card-quiet">
              <p className="premium-subheading">Expense Trend</p>
              <p className="mt-1 inline-flex items-center gap-1 text-sm text-zinc-100">
                {report.incomeVsExpenses.expenseTrendPct <= 0 ? <ArrowDown className="h-4 w-4 text-emerald-300" /> : <ArrowUp className="h-4 w-4 text-red-300" />}
                {Math.abs(report.incomeVsExpenses.expenseTrendPct).toFixed(1)}% vs previous month
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <article className="premium-section xl:col-span-5">
          <h2 className="premium-heading mb-3">Savings Summary</h2>
          <div className="grid gap-2">
            <div className="premium-card-quiet">
              <p className="premium-subheading">Total Saved This Month</p>
              <p className="mt-1 text-xl font-semibold text-zinc-100">{formatCurrency(report.savingsSummary.totalSaved, defaultCurrency)}</p>
            </div>
            <div className="premium-card-quiet">
              <p className="premium-subheading">Savings Compared To Last Month</p>
              <p className={`mt-1 text-sm font-medium ${report.savingsSummary.savedDelta >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                {report.savingsSummary.savedDelta >= 0 ? "+" : ""}
                {formatCurrency(report.savingsSummary.savedDelta, defaultCurrency)}
              </p>
            </div>
            <div className="premium-card-quiet">
              <p className="premium-subheading">Contribution To Goals</p>
              <p className="mt-1 text-sm font-medium text-zinc-100">
                {formatCurrency(report.savingsSummary.contributionToGoals, defaultCurrency)}
              </p>
            </div>
            <div className="premium-card-quiet">
              <p className="premium-subheading">Projected Next Month Savings</p>
              <p className="mt-1 text-sm font-medium text-zinc-100">
                {formatCurrency(report.savingsSummary.projectedSavingsNextMonth, defaultCurrency)}
              </p>
            </div>
          </div>
        </article>

        <article className="premium-section xl:col-span-7">
          <h2 className="premium-heading mb-3">Financial Health Change</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="premium-card-quiet">
              <p className="premium-subheading">Current Score</p>
              <p className="mt-1 text-xl font-semibold text-zinc-100">{report.financialHealthChange.currentScore}/100</p>
            </div>
            <div className="premium-card-quiet">
              <p className="premium-subheading">Previous Score</p>
              <p className="mt-1 text-xl font-semibold text-zinc-100">{report.financialHealthChange.previousScore}/100</p>
            </div>
            <div className="premium-card-quiet">
              <p className="premium-subheading">Score Change</p>
              <p className={`mt-1 text-xl font-semibold ${report.financialHealthChange.scoreChange >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                {report.financialHealthChange.scoreChange >= 0 ? "+" : ""}
                {report.financialHealthChange.scoreChange.toFixed(1)}
              </p>
            </div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3">
              <p className="premium-subheading text-emerald-100">Improved Factors</p>
              <p className="mt-1 text-sm text-emerald-50">{report.financialHealthChange.improvedFactors.join(", ") || "No major improvement signal."}</p>
            </div>
            <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3">
              <p className="premium-subheading text-red-100">Decreased Factors</p>
              <p className="mt-1 text-sm text-red-50">{report.financialHealthChange.decreasedFactors.join(", ") || "No major degradation signal."}</p>
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">
            {report.financialHealthChange.aiExplanation}
          </div>
        </article>
      </section>

      <section className="premium-section rounded-[26px]">
        <h2 className="premium-heading mb-3">Top Spending Categories</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {report.topCategories.map((category) => (
            <article key={category.category} className="interactive-card rounded-xl border border-white/10 bg-black/25 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-100">{category.category}</p>
                <span className="text-xs text-zinc-400">{category.percentageOfExpenses.toFixed(1)}%</span>
              </div>
              <p className="text-lg font-semibold text-zinc-100">{formatCurrency(category.total, defaultCurrency)}</p>
              <p className={`mt-1 text-xs ${category.changePct > 0 ? "text-red-300" : "text-emerald-300"}`}>
                {category.changePct > 0 ? "+" : ""}
                {category.changePct.toFixed(1)}% vs last month
              </p>
              <p className="mt-2 text-xs text-zinc-300">{category.aiComment}</p>
              <p className="mt-1 text-xs text-zinc-500">Action: {category.suggestedAction}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <article className="premium-section xl:col-span-6">
          <h2 className="premium-heading mb-3">Subscription Impact</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="premium-card-quiet">
              <p className="premium-subheading">Monthly Subscription Cost</p>
              <p className="mt-1 text-lg font-semibold text-zinc-100">
                {formatCurrency(report.subscriptionImpact.monthlyCost, defaultCurrency)}
              </p>
            </div>
            <div className="premium-card-quiet">
              <p className="premium-subheading">Yearly Projected Cost</p>
              <p className="mt-1 text-lg font-semibold text-zinc-100">
                {formatCurrency(report.subscriptionImpact.yearlyProjectedCost, defaultCurrency)}
              </p>
            </div>
            <div className="premium-card-quiet">
              <p className="premium-subheading">Subscription Burden</p>
              <p className="mt-1 text-sm font-medium text-zinc-100">{report.subscriptionImpact.burdenPct.toFixed(1)}% of income</p>
            </div>
            <div className="premium-card-quiet">
              <p className="premium-subheading">Possible Savings</p>
              <p className="mt-1 text-sm font-medium text-emerald-300">
                {formatCurrency(report.subscriptionImpact.possibleSavingsYearly, defaultCurrency)} / year
              </p>
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">
            Highest cost subscription: <span className="text-zinc-100">{report.subscriptionImpact.highestCostSubscription}</span>
          </div>
          <div className="mt-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-amber-100">
            Renewal risks in next days: {report.subscriptionImpact.renewalRiskCount}
          </div>
        </article>

        <article className="premium-section xl:col-span-6">
          <h2 className="premium-heading mb-3">Goal Progress Summary</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="premium-card-quiet">
              <p className="premium-subheading">Active Goals</p>
              <p className="mt-1 text-lg font-semibold text-zinc-100">{report.goalProgressSummary.activeGoals}</p>
            </div>
            <div className="premium-card-quiet">
              <p className="premium-subheading">Amount Added This Month</p>
              <p className="mt-1 text-lg font-semibold text-zinc-100">
                {formatCurrency(report.goalProgressSummary.amountAddedThisMonth, defaultCurrency)}
              </p>
            </div>
            <div className="premium-card-quiet">
              <p className="premium-subheading">Progress Change</p>
              <p className={`mt-1 text-sm font-medium ${report.goalProgressSummary.progressChangePct >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                {report.goalProgressSummary.progressChangePct >= 0 ? "+" : ""}
                {report.goalProgressSummary.progressChangePct.toFixed(1)}%
              </p>
            </div>
            <div className="premium-card-quiet">
              <p className="premium-subheading">Predicted Completion</p>
              <p className="mt-1 text-sm font-medium text-zinc-100">{report.goalProgressSummary.predictedCompletion}</p>
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-50">
              Goals ahead: {report.goalProgressSummary.goalsAhead}
            </div>
            <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-50">
              Goals delayed: {report.goalProgressSummary.goalsDelayed}
            </div>
          </div>
          <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">
            AI tip: {report.goalProgressSummary.aiSavingTip}
          </div>
        </article>
      </section>

      <section className="premium-section rounded-[26px]">
        <h2 className="premium-heading mb-3">AI Monthly Insights</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {report.monthlyInsights.map((insight) => (
            <MonthlyInsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </section>

      <section className="premium-section rounded-[26px]">
        <h2 className="premium-heading mb-3">Next Month Action Plan</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {report.nextMonthActionPlan.map((action) => (
            <MonthlyActionPlanCard key={action.id} action={action} />
          ))}
        </div>
      </section>

      <FeatureGate
        enabled={canAccessFeature("report_export")}
        title="Unlock Ruby AI Pro"
        description="Report export and advanced sharing workflows are available in Ruby AI Pro."
        onUpgradeClick={() => setUpgradeOpen(true)}
      >
        <section className="premium-section rounded-[26px]">
          <div className="mb-3 flex items-center gap-2">
            <FileDown className="h-4 w-4 text-red-300" />
            <h2 className="premium-heading">Export / Download</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="justify-start">
              <FileDown className="h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" className="justify-start">
              <Download className="h-4 w-4" />
              Download Report
            </Button>
            <Button variant="outline" className="justify-start">
              <Send className="h-4 w-4" />
              Share Summary
            </Button>
            <Button variant="outline" className="justify-start">
              <Mail className="h-4 w-4" />
              Email Report
            </Button>
          </div>
          <p className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-500">
            <TriangleAlert className="h-3.5 w-3.5" />
            Export actions are UI-only for now and prepared for future backend integrations.
          </p>
        </section>
      </FeatureGate>
    </div>
  );
};

export default MonthlyReport;
