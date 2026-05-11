import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFinance } from "@/hooks/useFinance";
import { useSettings } from "@/hooks/useSettings";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { formatCurrency } from "@/i18n/currency";
import { formatDate } from "@/i18n/date";
import { OverviewHero } from "@/components/overview/OverviewHero";
import { OverviewBentoGrid } from "@/components/overview/OverviewBentoGrid";
import { OverviewAIInsightsEngine } from "@/components/overview/OverviewAIInsightsEngine";
import { buildMockAIInsights, type AIInsight as DisplayAIInsight, type AIInsightType } from "@/lib/aiInsights";
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
import { LayoutDashboard } from "lucide-react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BrainCircuit,
  CalendarClock,
  Goal,
  ListChecks,
  ReceiptText,
  ShieldCheck,
  Wallet2,
} from "lucide-react";
import { PremiumEmptyState } from "@/components/shared/PremiumEmptyState";
import { DEMO_GOALS, DEMO_TRANSACTIONS } from "@/data/demoFinanceData";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { ProValueCallout } from "@/components/monetization/ProValueCallout";
import { FeatureGate } from "@/components/monetization/FeatureGate";
import { UpgradeModal } from "@/components/monetization/UpgradeModal";
import type { AIInsight as SupabaseAIInsight } from "@/domain/financeModels";
import { isSupabaseMode } from "@/lib/config/dataMode";
import { fetchAIInsightsSafe } from "@/services/core/aiInsightService";

const safeNumber = (value: number) => (Number.isFinite(value) ? value : 0);
const pct = (value: number) => `${safeNumber(value).toFixed(1)}%`;

const monthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeDisplayInsightType = (value: string): AIInsightType => {
  if (
    value === "spending_warning" ||
    value === "saving_opportunity" ||
    value === "subscription_optimization" ||
    value === "budget_recommendation" ||
    value === "budget_risk" ||
    value === "risk_detection" ||
    value === "goal_progress" ||
    value === "behavior_analysis" ||
    value === "wallet_alert" ||
    value === "financial_health_tip" ||
    value === "smart_tip"
  ) {
    return value;
  }
  return "smart_tip";
};

const mapSupabaseSeverityToDisplay = (severity: SupabaseAIInsight["severity"]): DisplayAIInsight["severity"] => {
  if (severity === "critical") return "high";
  if (severity === "warning") return "medium";
  return "low";
};

const confidenceToPct = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  if (value > 1 && value <= 100) return Math.round(value);
  return Math.round(Math.min(100, Math.max(0, value * 100)));
};

const insightCategoryTag = (insight: SupabaseAIInsight): string => {
  const type = insight.type.toLowerCase();
  if (insight.relatedEntityType === "subscription" || type.includes("subscription")) return "Subscriptions";
  if (insight.relatedEntityType === "goal" || type.includes("goal")) return "Goals";
  if (type.includes("spending") || type.includes("budget")) return "Spending Behavior";
  return "Cash Flow";
};

const insightLabel = (insight: SupabaseAIInsight): string => {
  const type = insight.type.toLowerCase();
  if (type.includes("spending") || type.includes("risk")) return "Spending Warning";
  if (type.includes("saving")) return "Saving Opportunity";
  if (type.includes("subscription")) return "Subscriptions";
  if (type.includes("goal")) return "Goal Progress";
  return "Ruby AI";
};

const mapSupabaseInsightToDisplayInsight = (insight: SupabaseAIInsight): DisplayAIInsight => ({
  id: insight.id,
  type: normalizeDisplayInsightType(insight.type),
  severity: mapSupabaseSeverityToDisplay(insight.severity),
  categoryTag: insightCategoryTag(insight),
  confidencePct: confidenceToPct(insight.confidence),
  title: insight.title,
  message: insight.description,
  details: insight.description,
  suggestedAction: insight.suggestedAction || "Review the recommendation details.",
  label: insightLabel(insight),
  timestamp: insight.createdAt,
});

const Overview = () => {
  const { canAccessFeature } = usePlanAccess();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { profile, user, isMockMode, isLoading: authLoading } = useAuth();
  const { defaultCurrency } = useSettings();
  const { transactions, budgets } = useFinance();
  const { subscriptions } = useSubscriptions();
  const [supabaseInsights, setSupabaseInsights] = useState<SupabaseAIInsight[]>([]);

  const now = new Date();
  const currentKey = monthKey(now);
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousKey = monthKey(previous);

  const usingSupabaseInsights = isSupabaseMode() && Boolean(user?.id) && !isMockMode;

  const loadSupabaseInsights = useCallback(async () => {
    if (!usingSupabaseInsights || !user?.id) {
      setSupabaseInsights([]);
      return;
    }

    const result = await fetchAIInsightsSafe(user.id);
    if (result.error) {
      if (import.meta.env.DEV) console.error("[Overview][AIInsights] Failed to fetch insights", { error: result.error });
      setSupabaseInsights([]);
      return;
    }
    setSupabaseInsights(result.data ?? []);
  }, [usingSupabaseInsights, user?.id]);

  useEffect(() => {
    if (authLoading) return;
    void loadSupabaseInsights();
  }, [authLoading, loadSupabaseInsights]);

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

    return {
      incomeCurrent: safeNumber(incomeCurrentAcc),
      expenseCurrent: safeNumber(expenseCurrentAcc),
      incomePrevious: safeNumber(incomePreviousAcc),
      expensePrevious: safeNumber(expensePreviousAcc),
      topCategoryLabel: top?.[0] ?? "No category data yet",
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

  const aiInsightCards = useMemo(
    () =>
      usingSupabaseInsights && supabaseInsights.length > 0
        ? supabaseInsights.map(mapSupabaseInsightToDisplayInsight)
        : buildMockAIInsights({
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
      usingSupabaseInsights,
      supabaseInsights,
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

  const monthlyProgressPct = clamp(((now.getDate() / Math.max(1, daysRemaining + now.getDate() - 1)) * 100), 0, 100);
  const greeting = `Good evening, ${displayName}`;
  const heroSummary =
    "Ruby AI analyzed your financial activity. Your savings rate improved this month, but subscription costs are slightly above the recommended range.";
  const keyRecommendation =
    subscriptionLoad > 20
      ? "Reduce recurring costs by 10% and redirect the recovered amount to your emergency fund."
      : "Keep current spending discipline and auto-transfer part of surplus cash to savings.";
  const heroInsights = [
    {
      title: "AI Recommendation",
      detail: keyRecommendation,
      kind: "opportunity" as const,
    },
    {
      title: "AI Signal",
      detail: `${upcomingBillsCount} recurring charges are expected within 14 days.`,
      kind: "signal" as const,
    },
  ];

  const coreMetrics = [
    {
      title: "Total Balance",
      value: formatCurrency(netBalance, defaultCurrency),
      trend: `${pct(Math.abs(savingsTrend))} vs last month`,
      trendPositive: savingsTrend >= 0,
      description: "Current month net position after income and expenses.",
      icon: <Wallet2 className="h-4 w-4 text-red-300" />,
    },
    {
      title: "Monthly Income",
      value: formatCurrency(incomeCurrent, defaultCurrency),
      trend: `${pct(Math.abs(incomePrevious > 0 ? ((incomeCurrent - incomePrevious) / incomePrevious) * 100 : 0))} trend`,
      trendPositive: incomeCurrent >= incomePrevious,
      description: "Income captured in the current monthly cycle.",
      icon: <ArrowUpRight className="h-4 w-4 text-red-300" />,
    },
    {
      title: "Monthly Expenses",
      value: formatCurrency(expenseCurrent, defaultCurrency),
      trend: `${pct(Math.abs(expenseTrend))} vs previous`,
      trendPositive: expenseTrend <= 0,
      description: "Total outflows and variable spending this month.",
      icon: <ArrowDownRight className="h-4 w-4 text-red-300" />,
    },
    {
      title: "Savings Rate",
      value: pct(savingsRate),
      trend: `${pct(Math.abs(savingsTrend))} momentum`,
      trendPositive: savingsTrend >= 0,
      description: "Net savings as a percentage of monthly income.",
      icon: <ShieldCheck className="h-4 w-4 text-red-300" />,
    },
    {
      title: "Safe To Spend Today",
      value: formatCurrency(dailySafeSpend, defaultCurrency),
      trend: `${daysRemaining} days remaining`,
      trendPositive: dailySafeSpend >= 0,
      description: "AI-calculated daily spending threshold for this month.",
      icon: <CalendarClock className="h-4 w-4 text-red-300" />,
    },
    {
      title: "Upcoming Bills",
      value: `${upcomingBillsCount} due`,
      trend: formatCurrency(upcomingBillsValue, defaultCurrency),
      trendPositive: upcomingBillsCount <= 2,
      description: "Recurring charges expected in the next 14 days.",
      icon: <ListChecks className="h-4 w-4 text-red-300" />,
    },
  ];

  const aiSummaryCard = {
    title: "Ruby AI Executive Summary",
    detail: aiSummary,
    recommendation: keyRecommendation,
  };

  const goalsPreview = useMemo(() => {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const elapsed = Math.max(1, now.getDate());
    const budgetItems = budgets.slice(0, 3).map((budget) => {
      const spent = transactions
        .filter((tx) => tx.type === "expense" && tx.category === budget.category && monthKey(new Date(tx.date)) === currentKey)
        .reduce((sum, tx) => sum + safeNumber(Number(tx.amount)), 0);
      const target = safeNumber(Number(budget.limit_amount));
      const progressPct = target > 0 ? clamp((spent / target) * 100, 0, 100) : 0;
      const paceProjection = elapsed > 0 ? (spent / elapsed) * daysInMonth : 0;
      const predictedCompletion = paceProjection <= target ? "On track" : "Needs correction";
      return {
        id: budget.id,
        label: budget.category,
        target,
        spent,
        progressPct,
        predictedCompletion,
        tip:
          predictedCompletion === "On track"
            ? "Maintain current spending rhythm and keep auto-savings enabled."
            : "Reduce this category by 8-12% this week to stay on target.",
      };
    });
    return budgetItems;
  }, [budgets, transactions, now, currentKey]);

  const upcomingPayments = useMemo(() => {
    const today = new Date(now.toDateString());
    return subscriptions
      .filter((sub) => Boolean(sub.next_payment_date))
      .map((sub) => {
        const dueDate = new Date(sub.next_payment_date as string);
        const daysUntil = Math.max(0, Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
        const monthlyAmount = sub.billing_cycle === "yearly" ? safeNumber(Number(sub.price)) / 12 : safeNumber(Number(sub.price));
        const urgency = daysUntil <= 2 ? "High" : daysUntil <= 7 ? "Medium" : "Low";
        return {
          id: sub.id,
          name: sub.name,
          amount: monthlyAmount,
          yearlyImpact: monthlyAmount * 12,
          dueDate: sub.next_payment_date as string,
          daysUntil,
          urgency,
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 4);
  }, [subscriptions, now]);

  const spendingAnalytics = useMemo(() => {
    const monthlyRows = monthlyExpenseSeries.map((expense, index) => ({
      label: `M-${monthlyExpenseSeries.length - index - 1}`,
      expense,
      income: monthlyIncomeSeries[index] ?? 0,
    }));
    const categoryRows = transactions
      .filter((tx) => tx.type === "expense" && monthKey(new Date(tx.date)) === currentKey)
      .reduce<Record<string, number>>((acc, tx) => {
        acc[tx.category] = safeNumber(acc[tx.category] || 0) + safeNumber(Number(tx.amount));
        return acc;
      }, {});
    const totalCategorySpend = Object.values(categoryRows).reduce((sum, value) => sum + value, 0);
    const topCategories = Object.entries(categoryRows)
      .map(([category, amount]) => ({
        category,
        amount,
        pct: totalCategorySpend > 0 ? (amount / totalCategorySpend) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    return { monthlyRows, topCategories };
  }, [monthlyExpenseSeries, monthlyIncomeSeries, transactions, currentKey]);

  const recentTransactions = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 6),
    [transactions]
  );

  const isOverviewEmpty = transactions.length === 0 && budgets.length === 0 && subscriptions.length === 0;

  if (isOverviewEmpty) {
    return (
      <div className="premium-page">
        <PremiumEmptyState
          icon={<LayoutDashboard className="h-5 w-5" />}
          headline="Your financial overview is ready to activate"
          description="Add your first data points and Ruby AI will build live balance forecasts, risk alerts, and strategic recommendations."
          primaryAction={{ label: "Add Transaction", to: "/finance" }}
          secondaryAction={{ label: "Add Subscription", to: "/dashboard#subscriptions" }}
          badges={[...DEMO_TRANSACTIONS.slice(0, 4).map((item) => item.merchant), ...DEMO_GOALS.slice(0, 2)]}
        />
      </div>
    );
  }

  return (
    <div className="premium-page">
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
      <OverviewHero
        greeting={greeting}
        healthScore={health.score}
        healthLevel={health.status}
        topPositiveFactor={health.topPositiveFactor}
        topNegativeFactor={health.topNegativeFactor}
        monthlyScoreChange={health.monthlyScoreChange}
        quickImprovementAction={health.quickImprovementAction}
        summary={heroSummary}
        monthlyProgressPct={monthlyProgressPct}
        monthlyProgressLabel={`${monthlyProgressPct.toFixed(0)}% elapsed`}
        safeToSpendValue={formatCurrency(dailySafeSpend, defaultCurrency)}
        keyRecommendation={keyRecommendation}
        trends={heroTrends}
        insights={heroInsights}
      />
      <ProValueCallout message="Unlock full predictive finance with Ruby AI Pro." />

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

      <section className="premium-section rounded-[26px]">
        <div className="mb-3 flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">AI Summary</h2>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <p className="text-sm leading-relaxed text-zinc-200">{aiSummaryCard.detail}</p>
          <p className="mt-2 text-xs text-zinc-400">
            Recommended action: <span className="text-zinc-200">{aiSummaryCard.recommendation}</span>
          </p>
        </div>
        <div className="mt-4">
          <RubyAIWidget
            title="Ruby AI Weekly CFO Note"
            summary={`For ${displayName}, spending concentration is currently in ${rubyContext.topSpendingCategory}. ${rubyContext.weeklySummary}`}
            actionLabel="Open Advisory Session"
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Wallet2 className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Core Financial Metrics</h2>
        </div>
        <OverviewBentoGrid metrics={coreMetrics} />
      </section>

      <OverviewAIInsightsEngine insights={aiInsightCards} />

      <FeatureGate
        enabled={canAccessFeature("predictive_finance")}
        title="Unlock Ruby AI Pro"
        description="Predictive forecasting, advanced safe-to-spend, and deeper risk analysis are available in Pro."
        onUpgradeClick={() => setUpgradeOpen(true)}
      >
        <section className="premium-section rounded-[28px]">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="premium-heading">Predictive Finance Widgets</h2>
              <p className="text-xs text-zinc-500">
                End-of-month balance forecast, spending trajectory, budget risk, and goal completion outlook.
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
      </FeatureGate>

      <section className="premium-section rounded-[26px]">
        <div className="mb-3 flex items-center gap-2">
          <Goal className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Goals Progress</h2>
        </div>
        {goalsPreview.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-zinc-400">
            Add budgets in Classic Finance to activate goals forecasting on this command center.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {goalsPreview.map((goal) => (
              <article key={goal.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
                <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">{goal.label}</p>
                <p className="mt-1 text-lg font-semibold text-zinc-100">
                  {formatCurrency(goal.spent, defaultCurrency)} / {formatCurrency(goal.target, defaultCurrency)}
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-zinc-800/90">
                  <div className="h-1.5 rounded-full bg-red-400" style={{ width: `${Math.max(5, goal.progressPct)}%` }} />
                </div>
                <p className="mt-2 text-xs text-zinc-400">Predicted completion: {goal.predictedCompletion}</p>
                <p className="mt-1 text-xs text-zinc-300">{goal.tip}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="premium-section rounded-[26px]">
        <div className="mb-3 flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Upcoming Payments</h2>
        </div>
        {upcomingPayments.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-zinc-400">
            No scheduled recurring payment in the next period.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {upcomingPayments.map((payment) => (
              <article key={payment.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-100">{payment.name}</p>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] ${
                      payment.urgency === "High"
                        ? "border-red-500/40 bg-red-500/10 text-red-200"
                        : payment.urgency === "Medium"
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                    }`}
                  >
                    {payment.urgency}
                  </span>
                </div>
                <p className="text-lg font-semibold text-zinc-100">{formatCurrency(payment.amount, defaultCurrency)}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  Due {formatDate(payment.dueDate, { dateStyle: "medium" })} ({payment.daysUntil} days)
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Yearly impact: {formatCurrency(payment.yearlyImpact, defaultCurrency)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="premium-section rounded-[26px]">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Spending Analytics</h2>
        </div>
        <div className="grid gap-4 xl:grid-cols-12">
          <article className="rounded-xl border border-white/10 bg-black/25 p-3 xl:col-span-7">
            <p className="mb-2 text-xs uppercase tracking-[0.14em] text-zinc-500">Income vs Expense Trend</p>
            {spendingAnalytics.monthlyRows.every((row) => row.expense === 0 && row.income === 0) ? (
              <p className="text-sm text-zinc-400">Add transactions to activate trend analytics charts.</p>
            ) : (
              <div className="space-y-2">
                {spendingAnalytics.monthlyRows.map((row) => {
                  const max = Math.max(1, ...spendingAnalytics.monthlyRows.map((item) => Math.max(item.expense, item.income)));
                  return (
                    <div key={row.label} className="rounded-lg border border-white/10 bg-black/20 p-2">
                      <div className="mb-1 flex items-center justify-between text-[11px] text-zinc-400">
                        <span>{row.label}</span>
                        <span>
                          {formatCurrency(row.income, defaultCurrency)} / {formatCurrency(row.expense, defaultCurrency)}
                        </span>
                      </div>
                      <div className="grid gap-1">
                        <div className="h-1.5 rounded-full bg-zinc-800/80">
                          <div className="h-1.5 rounded-full bg-emerald-400" style={{ width: `${(row.income / max) * 100}%` }} />
                        </div>
                        <div className="h-1.5 rounded-full bg-zinc-800/80">
                          <div className="h-1.5 rounded-full bg-red-400" style={{ width: `${(row.expense / max) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3 xl:col-span-5">
            <p className="mb-2 text-xs uppercase tracking-[0.14em] text-zinc-500">Top Spending Categories</p>
            {spendingAnalytics.topCategories.length === 0 ? (
              <p className="text-sm text-zinc-400">No category distribution yet in the current month.</p>
            ) : (
              <div className="space-y-2">
                {spendingAnalytics.topCategories.map((item) => (
                  <div key={item.category}>
                    <div className="mb-1 flex items-center justify-between text-xs text-zinc-300">
                      <span>{item.category}</span>
                      <span>{formatCurrency(item.amount, defaultCurrency)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-800/90">
                      <div className="h-1.5 rounded-full bg-red-400" style={{ width: `${Math.max(5, item.pct)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>

      <section className="premium-section rounded-[26px]">
        <div className="mb-3 flex items-center gap-2">
          <ReceiptText className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Recent Transactions</h2>
        </div>
        {recentTransactions.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-zinc-400">
            No recent transactions yet. Add your first transaction to populate this activity feed.
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((tx) => (
              <article
                key={tx.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-100">{tx.description || tx.category}</p>
                  <p className="text-xs text-zinc-400">
                    {tx.category} • {formatDate(tx.date, { dateStyle: "medium" })}
                  </p>
                </div>
                <p className={`text-sm font-semibold ${tx.type === "income" ? "text-emerald-300" : "text-zinc-100"}`}>
                  {tx.type === "income" ? "+" : "-"}
                  {formatCurrency(Math.abs(Number(tx.amount) || 0), tx.currency || defaultCurrency)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Overview;
