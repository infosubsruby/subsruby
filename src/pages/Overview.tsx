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

  const healthScore = useMemo(() => {
    const baseline = 55;
    const savingsFactor = clamp(savingsRate, -20, 35);
    const billFactor = upcomingBillsCount > 3 ? -8 : 6;
    const spendFactor = expenseTrend < 0 ? 8 : expenseTrend > 15 ? -10 : -2;
    const loadFactor = subscriptionLoad < 12 ? 6 : subscriptionLoad > 25 ? -8 : 0;
    return clamp(Math.round(baseline + savingsFactor + billFactor + spendFactor + loadFactor), 0, 100);
  }, [savingsRate, upcomingBillsCount, expenseTrend, subscriptionLoad]);

  const displayName = profile?.first_name || user?.email?.split("@")[0] || "User";

  const aiSummary = useMemo(() => {
    const direction = expenseTrend <= 0 ? "is stabilizing" : "is accelerating";
    const riskNote =
      subscriptionLoad > 25
        ? "Subscription weight is high and should be optimized."
        : "Subscription load is currently in a manageable range.";
    return `Your monthly cash flow ${direction}. Current savings rate is ${pct(savingsRate)}, with ${upcomingBillsCount} bills due soon. ${riskNote}`;
  }, [expenseTrend, savingsRate, upcomingBillsCount, subscriptionLoad]);

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
    <div className="space-y-7">
      <OverviewHero
        userName={displayName}
        healthScore={healthScore}
        summary={aiSummary}
        trends={heroTrends}
        insights={heroInsights}
      />

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
