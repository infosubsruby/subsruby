import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFinance } from "@/hooks/useFinance";
import { useSettings } from "@/hooks/useSettings";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { formatCurrency } from "@/i18n/currency";
import { OverviewHero } from "@/components/overview/OverviewHero";
import { OverviewBentoGrid } from "@/components/overview/OverviewBentoGrid";
import { OverviewAIInsightsEngine } from "@/components/overview/OverviewAIInsightsEngine";
import { buildMockAIInsights } from "@/lib/aiInsights";
import { calculateFinancialHealthScore } from "@/lib/financialHealthScore";
import { FinancialHealthSection } from "@/components/overview/FinancialHealthSection";
import { buildRubyAIContext } from "@/lib/rubyAI";
import { RubyAIWidget } from "@/components/ruby-ai/RubyAIWidget";
import { buildPredictiveFinanceEngine } from "@/lib/predictiveFinanceEngine";
import { PredictiveForecastChart } from "@/components/predictive/PredictiveForecastChart";
import {
  PredictiveInsightsFeed,
  PredictiveRiskCard,
  PredictiveSummaryCards,
  SafeToSpendWidget,
} from "@/components/predictive/PredictiveWidgets";

const safeNumber = (value: number) => (Number.isFinite(value) ? value : 0);
const pct = (value: number) => `${safeNumber(value).toFixed(1)}%`;

const monthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const Overview = () => {
  const { profile, user } = useAuth();
  const { defaultCurrency } = useSettings();
  const { transactions, budgets } = useFinance();
  const { subscriptions } = useSubscriptions();

  const now = new Date();
  const currentKey = monthKey(now);
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousKey = monthKey(previous);

  const { monthlyIncomeSeries, monthlyExpenseSeries } = useMemo(() => {
    const monthStarts = [5, 4, 3, 2, 1, 0].map((offset) => {
      const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      return monthKey(d);
    });
    const incomeByMonth: Record<string, number> = {};
    const expenseByMonth: Record<string, number> = {};

    for (const tx of transactions) {
      const txDate = new Date(tx.date);
      if (Number.isNaN(txDate.getTime())) continue;
      const key = monthKey(txDate);
      if (!monthStarts.includes(key)) continue;
      const amount = safeNumber(Number(tx.amount));
      if (tx.type === "income") {
        incomeByMonth[key] = safeNumber(incomeByMonth[key] || 0) + amount;
      } else {
        expenseByMonth[key] = safeNumber(expenseByMonth[key] || 0) + amount;
      }
    }

    return {
      monthlyIncomeSeries: monthStarts.map((key) => safeNumber(incomeByMonth[key] || 0)),
      monthlyExpenseSeries: monthStarts.map((key) => safeNumber(expenseByMonth[key] || 0)),
    };
  }, [transactions, now]);

  const {
    incomeCurrent,
    expenseCurrent,
    incomePrevious,
    expensePrevious,
    topCategoryShare,
    topCategoryLabel,
    monthlySubscriptionCost,
    upcomingBillsCount,
    upcomingBillsValue,
    goalProgress,
  } = useMemo(() => {
    let incomeCurrentAcc = 0;
    let expenseCurrentAcc = 0;
    let incomePreviousAcc = 0;
    let expensePreviousAcc = 0;
    const categoryTotals: Record<string, number> = {};

    for (const tx of transactions) {
      const amount = safeNumber(Number(tx.amount));
      const txDate = new Date(tx.date);
      if (Number.isNaN(txDate.getTime())) continue;
      const key = monthKey(txDate);

      if (tx.type === "income") {
        if (key === currentKey) incomeCurrentAcc += amount;
        if (key === previousKey) incomePreviousAcc += amount;
      } else {
        if (key === currentKey) {
          expenseCurrentAcc += amount;
          categoryTotals[tx.category] = safeNumber(categoryTotals[tx.category] || 0) + amount;
        }
        if (key === previousKey) expensePreviousAcc += amount;
      }
    }

    const totalBudget = budgets.reduce((sum, budget) => sum + safeNumber(Number(budget.limit_amount)), 0);
    const goalProgressPct = totalBudget > 0 ? clamp((expenseCurrentAcc / totalBudget) * 100, 0, 100) : 0;

    const totalSubscriptionMonthly = subscriptions.reduce((sum, sub) => {
      const amount = safeNumber(Number(sub.price));
      return sum + (sub.billing_cycle === "yearly" ? amount / 12 : amount);
    }, 0);

    const in14Days = new Date(now);
    in14Days.setDate(in14Days.getDate() + 14);

    let upcomingCount = 0;
    let upcomingValue = 0;
    for (const sub of subscriptions) {
      if (!sub.next_payment_date) continue;
      const nextDate = new Date(sub.next_payment_date);
      if (Number.isNaN(nextDate.getTime())) continue;
      if (nextDate >= now && nextDate <= in14Days) {
        upcomingCount += 1;
        upcomingValue += sub.billing_cycle === "yearly" ? safeNumber(Number(sub.price)) / 12 : safeNumber(Number(sub.price));
      }
    }

    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const top = sortedCategories[0];
    const topShare = expenseCurrentAcc > 0 && top ? (top[1] / expenseCurrentAcc) * 100 : 0;

    return {
      incomeCurrent: safeNumber(incomeCurrentAcc),
      expenseCurrent: safeNumber(expenseCurrentAcc),
      incomePrevious: safeNumber(incomePreviousAcc),
      expensePrevious: safeNumber(expensePreviousAcc),
      topCategoryShare: safeNumber(topShare),
      topCategoryLabel: top?.[0] ?? "N/A",
      monthlySubscriptionCost: safeNumber(totalSubscriptionMonthly),
      upcomingBillsCount: upcomingCount,
      upcomingBillsValue: safeNumber(upcomingValue),
      goalProgress: safeNumber(goalProgressPct),
    };
  }, [transactions, budgets, subscriptions, currentKey, previousKey, now]);

  const netBalance = safeNumber(incomeCurrent - expenseCurrent);
  const savingsRate = incomeCurrent > 0 ? safeNumber((netBalance / incomeCurrent) * 100) : 0;
  const daysRemaining = Math.max(1, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1);
  const dailySafeSpend = netBalance > 0 ? netBalance / daysRemaining : 0;

  const expenseTrend = expensePrevious > 0 ? ((expenseCurrent - expensePrevious) / expensePrevious) * 100 : 0;
  const savingsTrend = incomePrevious - expensePrevious !== 0
    ? ((netBalance - (incomePrevious - expensePrevious)) / Math.max(Math.abs(incomePrevious - expensePrevious), 1)) * 100
    : 0;
  const subscriptionLoad = incomeCurrent > 0 ? (monthlySubscriptionCost / incomeCurrent) * 100 : 0;

  const trackedBudgetLimit = budgets.reduce((sum, budget) => sum + safeNumber(Number(budget.limit_amount)), 0);
  const trackedBudgetSpent = transactions
    .filter((tx) => tx.type === "expense" && monthKey(new Date(tx.date)) === currentKey)
    .filter((tx) => budgets.some((budget) => budget.category === tx.category))
    .reduce((sum, tx) => sum + safeNumber(Number(tx.amount)), 0);
  const budgetDisciplineRatio =
    trackedBudgetLimit > 0 ? clamp(Math.min(trackedBudgetLimit / Math.max(trackedBudgetSpent, 1), 1), 0, 1) : 0.65;

  const expensePerDay: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.type !== "expense") continue;
    const txDate = new Date(tx.date);
    if (monthKey(txDate) !== currentKey) continue;
    const dayKey = tx.date.slice(0, 10);
    expensePerDay[dayKey] = safeNumber(expensePerDay[dayKey] || 0) + safeNumber(Number(tx.amount));
  }
  const dailySpendValues = Object.values(expensePerDay);
  const avgDailySpend = dailySpendValues.length
    ? dailySpendValues.reduce((acc, value) => acc + value, 0) / dailySpendValues.length
    : 0;
  const overspendingDays = dailySpendValues.filter((value) => value > avgDailySpend * 1.25).length;
  const overspendingDaysRatio = dailySpendValues.length > 0 ? overspendingDays / dailySpendValues.length : 0;

  const emergencyFundMonths = expenseCurrent > 0 ? Math.max(netBalance, 0) / expenseCurrent : 0;
  const debtRatioPct = incomeCurrent > 0 ? ((monthlySubscriptionCost + upcomingBillsValue) / incomeCurrent) * 100 : 28;
  const expenseRatio = incomeCurrent > 0 ? (expenseCurrent / incomeCurrent) * 100 : 100;

  const health = useMemo(
    () =>
      calculateFinancialHealthScore({
        savingsRatePct: savingsRate,
        monthlyExpenseSeries,
        monthlyIncomeSeries,
        subscriptionBurdenPct: subscriptionLoad,
        expenseRatioPct: expenseRatio,
        goalProgressPct: goalProgress,
        emergencyFundMonths,
        overspendingDaysRatio,
        debtRatioPct,
        budgetDisciplineRatio,
      }),
    [
      savingsRate,
      monthlyExpenseSeries,
      monthlyIncomeSeries,
      subscriptionLoad,
      expenseRatio,
      goalProgress,
      emergencyFundMonths,
      overspendingDaysRatio,
      debtRatioPct,
      budgetDisciplineRatio,
    ]
  );

  const displayName = profile?.first_name || user?.email?.split("@")[0] || "User";

  const rubyContext = useMemo(
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

  const prediction = useMemo(
    () =>
      buildPredictiveFinanceEngine({
        transactions,
        budgets,
        subscriptions,
      }),
    [transactions, budgets, subscriptions]
  );

  const aiSummary = useMemo(() => {
    const direction = expenseTrend <= 0 ? "is stabilizing" : "is accelerating";
    const riskNote =
      subscriptionLoad > 25
        ? "Subscription weight is high and should be optimized."
        : "Subscription load is currently in a manageable range.";
    return `${health.summary} Monthly cash flow ${direction}. Current savings rate is ${pct(savingsRate)}, with ${upcomingBillsCount} bills due soon. ${riskNote}`;
  }, [health.summary, expenseTrend, savingsRate, upcomingBillsCount, subscriptionLoad]);

  const heroTrends = [
    { label: "Spending Trend", value: pct(Math.abs(expenseTrend)), positive: expenseTrend <= 0 },
    { label: "Savings Momentum", value: pct(Math.abs(savingsTrend)), positive: savingsTrend >= 0 },
    { label: "Subscription Load", value: pct(subscriptionLoad), positive: subscriptionLoad < 20 },
  ];

  const heroInsights = [
    {
      title: "Smart Recommendation",
      detail: "Redirect 8% of non-essential spending into your savings bucket this week to improve resilience.",
      kind: "opportunity" as const,
    },
    {
      title: "Financial Alert",
      detail: `${upcomingBillsCount} recurring charges are expected within 14 days.`,
      kind: "alert" as const,
    },
    {
      title: "Savings Opportunity",
      detail: `Potential monthly recovery: ${formatCurrency(monthlySubscriptionCost * 0.12, defaultCurrency)} from optimization actions.`,
      kind: "opportunity" as const,
    },
    {
      title: "Risk Warning",
      detail:
        subscriptionLoad > 25
          ? "Recurring commitments are consuming a high portion of income."
          : "No major risk spike detected in fixed commitments.",
      kind: "risk" as const,
    },
  ];

  const aiInsightCards = useMemo(
    () =>
      buildMockAIInsights({
        expenseTrendPct: expenseTrend,
        savingsRatePct: savingsRate,
        monthlySubscriptionCost,
        currency: defaultCurrency,
        goalProgressPct: goalProgress,
        dailySafeSpend,
        topCategory: topCategoryLabel,
        upcomingBillsCount,
      }),
    [
      expenseTrend,
      savingsRate,
      monthlySubscriptionCost,
      defaultCurrency,
      goalProgress,
      dailySafeSpend,
      topCategoryLabel,
      upcomingBillsCount,
    ]
  );

  return (
    <div className="premium-page">
      <OverviewHero
        userName={displayName}
        healthScore={health.score}
        summary={aiSummary}
        trends={heroTrends}
        insights={heroInsights}
      />

      <FinancialHealthSection
        result={health}
        rubyWidgetSummary={`Health score is ${health.score}/100. Ruby AI recommends prioritizing ${
          health.factors[0]?.label ?? "spending consistency"
        } to accelerate resilience.`}
        predictiveWidgetSummary={`Projected month-end balance is ${formatCurrency(
          prediction.monthlyProjection.projectedEndBalance,
          defaultCurrency
        )} with ${prediction.monthlyProjection.negativeRiskPct.toFixed(1)}% downside risk.`}
      />

      <RubyAIWidget
        title="Ruby AI Weekly CFO Note"
        summary={`For ${displayName}, spending concentration is currently in ${rubyContext.topSpendingCategory}. ${rubyContext.weeklySummary}`}
        actionLabel="Open Advisory Session"
      />

      <section className="premium-section rounded-[28px]">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
          <h2 className="premium-heading">Predictive Finance Engine</h2>
            <p className="text-xs text-zinc-500">
              Forecasting future balance, safe-to-spend, and proactive risk trajectory.
            </p>
          </div>
          <div className="premium-chip border-red-500/35 bg-red-500/10 text-red-200">
            End-of-month projection:{" "}
            <span className="font-semibold">
              {formatCurrency(prediction.monthlyProjection.projectedEndBalance, defaultCurrency)}
            </span>
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-12">
          <div className="premium-chart-panel xl:col-span-8">
            <p className="mb-2 text-xs text-zinc-500">Future Balance & Spending Forecast</p>
            <PredictiveForecastChart data={prediction.futureBalanceForecast} />
          </div>
          <div className="space-y-4 xl:col-span-4">
            <SafeToSpendWidget prediction={prediction} currency={defaultCurrency} />
            <PredictiveRiskCard prediction={prediction} currency={defaultCurrency} />
          </div>
        </div>
        <div className="mt-4">
          <PredictiveSummaryCards prediction={prediction} currency={defaultCurrency} />
        </div>
        <div className="mt-4">
          <PredictiveInsightsFeed prediction={prediction} />
        </div>
      </section>

      <OverviewBentoGrid
        balanceCard={{
          title: "Balance Card",
          value: formatCurrency(netBalance, defaultCurrency),
          hint: "Current month net balance",
        }}
        monthlySpending={{
          title: "Monthly Spending",
          value: formatCurrency(expenseCurrent, defaultCurrency),
          hint: `${pct(expenseTrend)} vs previous month`,
        }}
        savingsRate={{
          title: "Savings Rate",
          value: pct(savingsRate),
          hint: "Net savings / income",
        }}
        dailySafeSpend={{
          title: "Daily Safe Spend",
          value: formatCurrency(dailySafeSpend, defaultCurrency),
          hint: `${daysRemaining} days remaining this month`,
        }}
        upcomingBills={{
          title: "Upcoming Bills",
          value: `${upcomingBillsCount} bills`,
          hint: `${formatCurrency(upcomingBillsValue, defaultCurrency)} due in next 14 days`,
        }}
        goalProgress={{
          title: "Goal Progress",
          value: pct(goalProgress),
          hint: "Budget utilization vs set monthly limits",
        }}
        spendingDistribution={{
          title: "Spending Distribution",
          value: `${topCategoryLabel} (${pct(topCategoryShare)})`,
          hint: "Top category share this month",
        }}
        cashFlowAnalytics={{
          title: "Cash Flow Analytics",
          value: `${formatCurrency(incomeCurrent, defaultCurrency)} in / ${formatCurrency(expenseCurrent, defaultCurrency)} out`,
          hint: "Realtime operating cash flow pulse",
        }}
      />

      <OverviewAIInsightsEngine insights={aiInsightCards} />
    </div>
  );
};

export default Overview;
