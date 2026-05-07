import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  Goal,
  Lightbulb,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PremiumEmptyState } from "@/components/shared/PremiumEmptyState";
import { DEMO_CATEGORIES } from "@/data/demoFinanceData";
import { useFinance } from "@/hooks/useFinance";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useSettings } from "@/hooks/useSettings";
import { formatCurrency } from "@/i18n/currency";
import { formatDate } from "@/i18n/date";
import { buildMockAIInsights } from "@/lib/aiInsights";
import { buildPredictiveFinanceEngine } from "@/lib/predictiveFinanceEngine";
import { calculateFinancialHealthScore } from "@/lib/financialHealthScore";
import {
  IntelligenceInsightCard,
  type IntelligenceInsightCardItem,
} from "@/components/insights/IntelligenceInsightCard";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { ProValueCallout } from "@/components/monetization/ProValueCallout";
import { FeatureGate } from "@/components/monetization/FeatureGate";
import { UpgradeModal } from "@/components/monetization/UpgradeModal";

const monthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;
const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));
const pct = (value: number) => `${Math.abs(Number.isFinite(value) ? value : 0).toFixed(1)}%`;

const AIInsights = () => {
  const { canAccessFeature } = usePlanAccess();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { transactions, budgets } = useFinance();
  const { subscriptions } = useSubscriptions();
  const { defaultCurrency } = useSettings();
  const currency = defaultCurrency || "USD";

  const now = new Date();
  const currentKey = monthKey(now);
  const previousKey = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const monthly = useMemo(() => {
    const currentTransactions = transactions.filter((tx) => monthKey(new Date(tx.date)) === currentKey);
    const previousTransactions = transactions.filter((tx) => monthKey(new Date(tx.date)) === previousKey);
    const incomeCurrent = currentTransactions
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);
    const expenseCurrent = currentTransactions
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);
    const expensePrevious = previousTransactions
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);
    const incomePrevious = previousTransactions
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);
    const categoryTotals = currentTransactions
      .filter((tx) => tx.type === "expense")
      .reduce<Record<string, number>>((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + Math.abs(Number(tx.amount) || 0);
        return acc;
      }, {});
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "No category data yet";
    return { currentTransactions, incomeCurrent, expenseCurrent, expensePrevious, incomePrevious, topCategory };
  }, [transactions, currentKey, previousKey]);

  const monthlySubscriptionCost = subscriptions.reduce((sum, sub) => {
    const amount = Math.abs(Number(sub.price) || 0);
    return sum + (sub.billing_cycle === "yearly" ? amount / 12 : amount);
  }, 0);
  const expenseTrendPct =
    monthly.expensePrevious > 0
      ? ((monthly.expenseCurrent - monthly.expensePrevious) / monthly.expensePrevious) * 100
      : 0;
  const netCurrent = monthly.incomeCurrent - monthly.expenseCurrent - monthlySubscriptionCost;
  const savingsRate = monthly.incomeCurrent > 0 ? (netCurrent / monthly.incomeCurrent) * 100 : 0;
  const daysRemaining = Math.max(1, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1);
  const dailySafeSpend = netCurrent > 0 ? netCurrent / daysRemaining : -Math.abs(netCurrent) / daysRemaining;
  const upcomingBillsCount = subscriptions.filter((sub) => {
    if (!sub.next_payment_date) return false;
    const date = new Date(sub.next_payment_date);
    const in14 = new Date(now);
    in14.setDate(in14.getDate() + 14);
    return date >= now && date <= in14;
  }).length;
  const goalProgress = budgets.length > 0 ? clamp((monthly.expenseCurrent / Math.max(1, budgets.reduce((s, b) => s + Number(b.limit_amount || 0), 0))) * 100) : 0;

  const aiInsights = useMemo(
    () =>
      buildMockAIInsights({
        expenseTrendPct,
        savingsRatePct: savingsRate,
        monthlySubscriptionCost,
        currency,
        goalProgressPct: goalProgress,
        dailySafeSpend,
        topCategory: monthly.topCategory,
        upcomingBillsCount,
      }),
    [
      expenseTrendPct,
      savingsRate,
      monthlySubscriptionCost,
      currency,
      goalProgress,
      dailySafeSpend,
      monthly.topCategory,
      upcomingBillsCount,
    ]
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

  const health = useMemo(() => {
    const monthlyIncomeSeries = [5, 4, 3, 2, 1, 0].map((offset) => {
      const m = monthKey(new Date(now.getFullYear(), now.getMonth() - offset, 1));
      return transactions
        .filter((tx) => tx.type === "income" && monthKey(new Date(tx.date)) === m)
        .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);
    });
    const monthlyExpenseSeries = [5, 4, 3, 2, 1, 0].map((offset) => {
      const m = monthKey(new Date(now.getFullYear(), now.getMonth() - offset, 1));
      return transactions
        .filter((tx) => tx.type === "expense" && monthKey(new Date(tx.date)) === m)
        .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);
    });
    const expensePerDay: Record<string, number> = {};
    for (const tx of monthly.currentTransactions.filter((item) => item.type === "expense")) {
      const day = tx.date.slice(0, 10);
      expensePerDay[day] = (expensePerDay[day] || 0) + Math.abs(Number(tx.amount) || 0);
    }
    const dailyValues = Object.values(expensePerDay);
    const avgDaily = dailyValues.length ? dailyValues.reduce((s, v) => s + v, 0) / dailyValues.length : 0;
    const overspendingDaysRatio = dailyValues.length ? dailyValues.filter((value) => value > avgDaily * 1.25).length / dailyValues.length : 0;
    const expenseRatioPct = monthly.incomeCurrent > 0 ? (monthly.expenseCurrent / monthly.incomeCurrent) * 100 : 100;
    return calculateFinancialHealthScore({
      savingsRatePct: savingsRate,
      monthlyExpenseSeries,
      monthlyIncomeSeries,
      subscriptionBurdenPct: monthly.incomeCurrent > 0 ? (monthlySubscriptionCost / monthly.incomeCurrent) * 100 : 0,
      expenseRatioPct,
      goalProgressPct: goalProgress,
      emergencyFundMonths: monthly.expenseCurrent > 0 ? Math.max(netCurrent, 0) / monthly.expenseCurrent : 0,
      overspendingDaysRatio,
      debtRatioPct: monthly.incomeCurrent > 0 ? ((monthlySubscriptionCost + Math.max(0, -netCurrent)) / monthly.incomeCurrent) * 100 : 28,
      budgetDisciplineRatio: budgets.length > 0 ? clamp(1 - goalProgress / 100, 0, 1) : 0.65,
    });
  }, [
    transactions,
    monthly.currentTransactions,
    monthly.incomeCurrent,
    monthly.expenseCurrent,
    monthlySubscriptionCost,
    savingsRate,
    goalProgress,
    netCurrent,
    budgets,
    now,
  ]);

  const priorityInsights = useMemo<IntelligenceInsightCardItem[]>(
    () =>
      aiInsights.slice(0, 4).map((item, index) => ({
        id: item.id,
        title: item.title,
        explanation: item.message,
        severity: item.severity,
        confidencePct: item.confidencePct,
        category: item.label,
        impactLabel: index % 2 === 0 ? formatCurrency(Math.abs(dailySafeSpend) * (index + 1), currency) : pct(expenseTrendPct),
        suggestedAction: item.suggestedAction,
        relatedDataPoint: item.categoryTag,
        actionLabel: "Take Action",
      })),
    [aiInsights, dailySafeSpend, currency, expenseTrendPct]
  );

  const healthScoreInsights = useMemo<IntelligenceInsightCardItem[]>(
    () => [
      {
        id: "health-savings-lift",
        title: "Increasing savings rate by 3% could raise your score",
        explanation: "Ruby AI estimates a measurable score lift when savings rate moves toward the 20% target band.",
        severity: "medium",
        confidencePct: 86,
        category: "Financial Health Improvement",
        impactLabel: "Estimated +4 points",
        suggestedAction: "Increase monthly savings transfer by a small fixed amount this cycle.",
        relatedDataPoint: `Current savings rate ${savingsRate.toFixed(1)}%`,
        actionLabel: "Improve Savings Rate",
      },
      {
        id: "health-subscription-burden",
        title: "Subscription burden status",
        explanation:
          monthly.incomeCurrent > 0 && (monthlySubscriptionCost / monthly.incomeCurrent) * 100 <= 12
            ? "Subscription burden is currently healthy and supports score stability."
            : "Subscription burden is elevated and reducing your health score resilience.",
        severity:
          monthly.incomeCurrent > 0 && (monthlySubscriptionCost / monthly.incomeCurrent) * 100 <= 12 ? "low" : "medium",
        confidencePct: 90,
        category: "Subscription Burden",
        impactLabel: `${(monthly.incomeCurrent > 0 ? (monthlySubscriptionCost / monthly.incomeCurrent) * 100 : 0).toFixed(1)}% of income`,
        suggestedAction: "Review overlapping services and optimize one recurring plan.",
        relatedDataPoint: formatCurrency(monthlySubscriptionCost, currency),
        actionLabel: "Optimize Subscriptions",
      },
      {
        id: "health-spending-control",
        title: "Spending control changed in food and shopping",
        explanation: "Recent food and shopping outflows are weighing on spending control quality.",
        severity: expenseTrendPct > 10 ? "high" : "medium",
        confidencePct: 84,
        category: "Spending Control",
        impactLabel: pct(expenseTrendPct),
        suggestedAction: "Apply a weekly cap to variable categories for the next 2 weeks.",
        relatedDataPoint: monthly.topCategory,
        actionLabel: "Adjust Budget",
      },
      {
        id: "health-emergency-fund",
        title: "Emergency fund progress is supporting your score",
        explanation:
          health.topPositiveFactor === "Emergency Fund"
            ? "Emergency reserve growth is one of your strongest contributors this month."
            : "Emergency reserve progress remains a positive structural factor.",
        severity: "low",
        confidencePct: 82,
        category: "Emergency Fund",
        impactLabel: `${health.factors.find((factor) => factor.key === "emergency_fund")?.scoreContribution.toFixed(1) ?? "0"}/15`,
        suggestedAction: "Keep automated emergency transfers active this month.",
        relatedDataPoint: health.factors.find((factor) => factor.key === "emergency_fund")?.explanation,
        actionLabel: "Boost Emergency Fund",
      },
    ],
    [savingsRate, monthly.incomeCurrent, monthlySubscriptionCost, expenseTrendPct, monthly.topCategory, health, currency]
  );

  const mergedPriorityInsights = [...healthScoreInsights, ...priorityInsights].slice(0, 6);

  const spendingWarnings = mergedPriorityInsights.filter(
    (insight) => insight.category === "Spending Warning" || insight.category === "Risk Detection"
  );
  const savingOpportunities = useMemo(
    () => [
      {
        id: "save-1",
        title: "Switch yearly billing to reduce recurring costs",
        estimatedSavings: formatCurrency(Math.max(12, monthlySubscriptionCost * 0.1), currency),
        difficulty: "Easy",
        timeToImpact: "This billing cycle",
        confidencePct: 88,
      },
      {
        id: "save-2",
        title: "Reduce weekend food spending",
        estimatedSavings: formatCurrency(Math.max(28, monthly.expenseCurrent * 0.04), currency),
        difficulty: "Medium",
        timeToImpact: "2-4 weeks",
        confidencePct: 82,
      },
      {
        id: "save-3",
        title: "Cancel one unused service",
        estimatedSavings: formatCurrency(Math.max(8, monthlySubscriptionCost * 0.16), currency),
        difficulty: "Easy",
        timeToImpact: "Immediate",
        confidencePct: 91,
      },
      {
        id: "save-4",
        title: "Move extra balance to savings goal",
        estimatedSavings: formatCurrency(Math.max(25, Math.max(netCurrent, 0) * 0.25), currency),
        difficulty: "Easy",
        timeToImpact: "This week",
        confidencePct: 79,
      },
    ],
    [monthlySubscriptionCost, monthly.expenseCurrent, netCurrent, currency]
  );

  const predictiveRiskAlerts = useMemo(
    () => [
      {
        id: "risk-1",
        title: "Food budget may exceed limit soon",
        riskLevel: prediction.budgetRisk.scorePct > 78 ? "high" : "medium",
        projectedImpact: `Projected overrun ${formatCurrency(
          Math.max(0, prediction.monthlyProjection.projectedExpense - monthly.expenseCurrent),
          currency
        )}`,
        prevention: "Set a strict weekly cap for food and dining until month-end.",
        timeline: "Next 8 days",
      },
      {
        id: "risk-2",
        title: "End-of-month balance may be lower than expected",
        riskLevel: prediction.monthlyProjection.negativeRiskPct > 45 ? "high" : "medium",
        projectedImpact: `Projected EOM balance ${formatCurrency(prediction.monthlyProjection.projectedEndBalance, currency)}`,
        prevention: "Reduce discretionary outflows for the next 5 days.",
        timeline: "By month end",
      },
      {
        id: "risk-3",
        title: "Subscriptions are approaching unhealthy income ratio",
        riskLevel: prediction.subscriptionImpact.burdenTrendPct > 20 ? "high" : "medium",
        projectedImpact: `Current ratio ${prediction.subscriptionImpact.burdenTrendPct.toFixed(1)}%`,
        prevention: "Review overlapping plans and switch high-frequency plans to annual billing.",
        timeline: "Within 2 weeks",
      },
      {
        id: "risk-4",
        title: "Goal completion may be delayed",
        riskLevel: prediction.goalForecast.delayed ? "high" : "low",
        projectedImpact: prediction.goalForecast.completionLabel,
        prevention: "Increase monthly contribution or reduce one high-variance category.",
        timeline: `${prediction.goalForecast.projectedCompletionDays} days`,
      },
    ],
    [prediction, currency, monthly.expenseCurrent]
  );

  const behaviorPatterns = useMemo(() => {
    const weekendExpenses = monthly.currentTransactions
      .filter((tx) => tx.type === "expense")
      .filter((tx) => {
        const day = new Date(`${tx.date}T00:00:00`).getDay();
        return day === 0 || day === 6;
      }).length;
    const frequentSmall = monthly.currentTransactions.filter((tx) => tx.type === "expense" && Math.abs(Number(tx.amount) || 0) < 20).length;
    const entertainmentRecurring = subscriptions.filter((sub) => {
      const name = sub.name.toLowerCase();
      return name.includes("netflix") || name.includes("spotify") || name.includes("youtube") || name.includes("disney");
    }).length;
    const transportationExpenses = monthly.currentTransactions.filter((tx) => tx.type === "expense" && tx.category === "Transportation").length;
    return [
      { label: "Weekend spending spikes", detail: `${weekendExpenses} weekend transactions this month.`, tone: weekendExpenses > 6 ? "watch" : "stable" },
      { label: "Late-night purchases", detail: "Receipt timestamping is ready for deeper pattern analysis in future sync.", tone: "info" },
      { label: "Frequent small transactions", detail: `${frequentSmall} transactions under $20 detected this month.`, tone: frequentSmall > 10 ? "watch" : "stable" },
      { label: "Recurring entertainment expenses", detail: `${entertainmentRecurring} entertainment subscriptions are currently active.`, tone: entertainmentRecurring > 2 ? "watch" : "stable" },
      { label: "Transportation increases", detail: `${transportationExpenses} transport expenses detected in current cycle.`, tone: transportationExpenses > 6 ? "watch" : "stable" },
      {
        label: "Category growth patterns",
        detail: `Top category impact is ${monthly.topCategory} with trend ${pct(expenseTrendPct)}.`,
        tone: expenseTrendPct > 12 ? "watch" : "stable",
      },
    ];
  }, [monthly.currentTransactions, subscriptions, monthly.topCategory, expenseTrendPct]);

  const recommendedActions = [
    { id: "act-1", label: "Quick Budget Adjustment", to: "/finance", detail: "Update the highest-variance category cap now." },
    { id: "act-2", label: "Review Subscriptions", to: "/dashboard#subscriptions", detail: "Optimize overlapping recurring services." },
    { id: "act-3", label: "Create Goal", to: "/goals", detail: "Convert projected surplus into targeted progress." },
    { id: "act-4", label: "Reduce Category Spend", to: "/transactions", detail: "Focus on the highest growth category this week." },
    { id: "act-5", label: "Add Transaction", to: "/finance", detail: "Improve model accuracy with complete data capture." },
    { id: "act-6", label: "Ask Ruby AI", to: "/ruby-ai", detail: "Open an advisory conversation with current insights context." },
  ];

  const insightHistory = useMemo(
    () =>
      aiInsights.slice(0, 7).map((insight, idx) => ({
        id: insight.id,
        title: insight.title,
        status: idx === 0 ? "repeated warning" : idx % 4 === 0 ? "resolved" : idx % 3 === 0 ? "ignored" : "improved",
        date: new Date(now.getTime() - idx * 1000 * 60 * 60 * 26),
      })),
    [aiInsights, now]
  );

  const highPriorityCount = priorityInsights.filter((item) => item.severity === "high").length;
  const potentialMonthlySavings = savingOpportunities.reduce((sum, item) => {
    const num = Number(item.estimatedSavings.replace(/[^\d.-]/g, "")) || 0;
    return sum + num;
  }, 0);
  const riskLevel = prediction.monthlyProjection.negativeRiskPct > 55 ? "High" : prediction.monthlyProjection.negativeRiskPct > 28 ? "Moderate" : "Low";
  const hasData = transactions.length > 0 || subscriptions.length > 0 || budgets.length > 0;

  if (!hasData) {
    return (
      <div className="premium-page">
        <PremiumEmptyState
          icon={<BrainCircuit className="h-5 w-5" />}
          headline="Ruby AI is waiting for financial data"
          description="Once you add transactions, subscriptions, or goals, insights will appear here automatically."
          primaryAction={{ label: "Add Financial Data", to: "/finance" }}
          secondaryAction={{ label: "Go to Subscriptions", to: "/dashboard#subscriptions" }}
          badges={DEMO_CATEGORIES.slice(0, 5)}
        />
      </div>
    );
  }

  return (
    <div className="premium-page">
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
      <section className="premium-section rounded-[28px] p-6 sm:p-7">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">AI Intelligence Summary Hero</p>
            <h1 className="mt-1 text-2xl font-semibold text-zinc-100">Central Financial Intelligence Panel</h1>
            <p className="mt-2 max-w-3xl text-sm text-zinc-300">
              Ruby AI found {aiInsights.length} insights this week. Your biggest opportunity is recurring-cost optimization, while your main risk is rising {monthly.topCategory.toLowerCase()} spending.
            </p>
          </div>
          <div className="rounded-full border border-red-500/35 bg-red-500/10 px-3 py-1 text-xs text-red-200">
            Last analysis {formatDate(now, { dateStyle: "medium", timeStyle: "short" })}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Total Insights Detected</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{aiInsights.length}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">High Priority Insights</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{highPriorityCount}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Potential Monthly Savings</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{formatCurrency(potentialMonthlySavings, currency)}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Risk Level</p>
            <p className={`mt-1 text-lg font-semibold ${riskLevel === "High" ? "text-red-300" : riskLevel === "Moderate" ? "text-amber-200" : "text-emerald-300"}`}>{riskLevel}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Financial Health Impact</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{health.score}/100</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Main Signal</p>
            <p className="mt-1 text-sm font-semibold text-zinc-100">{health.insights[0] || "Monitoring active."}</p>
          </article>
        </div>
      </section>
      <ProValueCallout message="Get deeper recommendations with Pro." />

      <FeatureGate
        enabled={canAccessFeature("advanced_ai_insights")}
        title="Unlock Ruby AI Pro"
        description="Advanced AI insights include deeper analysis depth, confidence scoring context, and richer recommendations."
        onUpgradeClick={() => setUpgradeOpen(true)}
      >
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-red-300" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Priority Insights</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {mergedPriorityInsights.map((insight) => (
              <IntelligenceInsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </section>
      </FeatureGate>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Spending Warnings</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {spendingWarnings.map((insight) => (
            <IntelligenceInsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Saving Opportunities</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {savingOpportunities.map((item) => (
            <article key={item.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
              <p className="text-sm font-medium text-zinc-100">{item.title}</p>
              <p className="mt-1 text-lg font-semibold text-emerald-300">{item.estimatedSavings}</p>
              <p className="mt-1 text-xs text-zinc-400">Difficulty: {item.difficulty}</p>
              <p className="text-xs text-zinc-400">Time to impact: {item.timeToImpact}</p>
              <p className="text-xs text-sky-200">Confidence {item.confidencePct}%</p>
            </article>
          ))}
        </div>
      </section>

      <section className="premium-section rounded-[24px]">
        <div className="mb-3 flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Subscription Optimization</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Monthly Subscription Cost</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{formatCurrency(monthlySubscriptionCost, currency)}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Projected Quarter Cost</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{formatCurrency(prediction.subscriptionImpact.nextQuarterCost, currency)}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Income Ratio</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{prediction.subscriptionImpact.burdenTrendPct.toFixed(1)}%</p>
          </article>
        </div>
      </section>

      <section className="premium-section rounded-[24px]">
        <div className="mb-3 flex items-center gap-2">
          <Goal className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Goal Progress Insights</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-sm text-zinc-100">Goal completion forecast: {prediction.goalForecast.completionLabel}</p>
            <p className="text-xs text-zinc-400">Estimated completion in {prediction.goalForecast.projectedCompletionDays} days.</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-sm text-zinc-100">
              Acceleration signal: {prediction.goalForecast.accelerationPct >= 0 ? "+" : "-"}
              {Math.abs(prediction.goalForecast.accelerationPct).toFixed(1)}%
            </p>
            <p className="text-xs text-zinc-400">Adjust monthly contributions to protect goal timeline.</p>
          </article>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Predictive Risk Alerts</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {predictiveRiskAlerts.map((alert) => (
            <article key={alert.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-100">{alert.title}</p>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] ${
                    alert.riskLevel === "high"
                      ? "border-red-500/40 bg-red-500/10 text-red-200"
                      : "border-amber-500/40 bg-amber-500/10 text-amber-200"
                  }`}
                >
                  {alert.riskLevel}
                </span>
              </div>
              <p className="text-xs text-zinc-300">Projected impact: {alert.projectedImpact}</p>
              <p className="mt-1 text-xs text-zinc-400">Prevention: {alert.prevention}</p>
              <p className="mt-1 text-xs text-zinc-500">Timeline: {alert.timeline}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="premium-section rounded-[24px]">
        <div className="mb-3 flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Behavior Patterns</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {behaviorPatterns.map((pattern) => (
            <article key={pattern.label} className="rounded-xl border border-white/10 bg-black/25 p-3">
              <p className="text-sm font-medium text-zinc-100">{pattern.label}</p>
              <p className="mt-1 text-xs text-zinc-400">{pattern.detail}</p>
              <p
                className={`mt-1 text-xs ${
                  pattern.tone === "watch" ? "text-amber-200" : pattern.tone === "stable" ? "text-emerald-300" : "text-sky-200"
                }`}
              >
                {pattern.tone === "watch" ? "Monitor closely" : pattern.tone === "stable" ? "Stable pattern" : "Info signal"}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="premium-section rounded-[24px]">
        <div className="mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Recommended Actions</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {recommendedActions.map((action) => (
            <article key={action.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
              <p className="text-sm font-medium text-zinc-100">{action.label}</p>
              <p className="mt-1 text-xs text-zinc-400">{action.detail}</p>
              <Button asChild size="sm" variant="outline" className="mt-3 border-white/15 bg-white/[0.03] text-zinc-200">
                <Link to={action.to}>Open</Link>
              </Button>
            </article>
          ))}
        </div>
      </section>

      <section className="premium-section rounded-[24px]">
        <div className="mb-3 flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Insight History</h2>
        </div>
        <div className="space-y-2">
          {insightHistory.map((item) => (
            <article key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-zinc-100">{item.title}</p>
                <p className="text-xs text-zinc-400">{formatDate(item.date, { dateStyle: "medium", timeStyle: "short" })}</p>
              </div>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] ${
                  item.status === "resolved"
                    ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-200"
                    : item.status === "ignored"
                    ? "border-zinc-500/40 bg-zinc-500/10 text-zinc-300"
                    : item.status === "repeated warning"
                    ? "border-red-500/35 bg-red-500/10 text-red-200"
                    : "border-sky-500/35 bg-sky-500/10 text-sky-200"
                }`}
              >
                {item.status}
              </span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AIInsights;
