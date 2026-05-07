import type { Budget, Transaction } from "@/hooks/useFinance";
import type { Subscription } from "@/hooks/subscriptions/types";

type TrendPoint = { label: string; value: number };

type ForecastPoint = {
  label: string;
  actual: number;
  forecast: number;
};

type CategoryPoint = {
  category: string;
  value: number;
  growthPct: number;
};

type HeatmapCell = {
  day: string;
  week: number;
  intensity: number;
  amount: number;
};

type AIInsight = {
  title: string;
  detail: string;
  severity: "info" | "warning" | "positive";
};

export type AnalyticsIntelligence = {
  spendingTrends: {
    weekly: TrendPoint[];
    monthly: TrendPoint[];
    yearly: TrendPoint[];
    interpretation: string;
  };
  incomeTrends: {
    monthly: TrendPoint[];
    yearly: TrendPoint[];
  };
  savingsGrowth: {
    monthly: TrendPoint[];
    momentumPct: number;
  };
  forecasting: {
    spendingPrediction: ForecastPoint[];
    savingsProjection: TrendPoint[];
    budgetRiskPct: number;
    goalCompletionPct: number;
  };
  categoryIntelligence: {
    distribution: CategoryPoint[];
    fastestGrowing: CategoryPoint | null;
    mostWasteful: CategoryPoint | null;
    behavioralPatterns: string[];
  };
  subscriptionAnalytics: {
    totalRecurringBurdenPct: number;
    yearlySubscriptionCost: number;
    optimizationPotential: number;
    cancellationSuggestions: string[];
  };
  financialBehavior: {
    weekendSpendingPct: number;
    nightSpendingPct: number;
    impulseSpendingPct: number;
    consistencyScore: number;
  };
  cashFlowIntelligence: TrendPoint[];
  categoryHeatmap: HeatmapCell[];
  patternDetection: string[];
  aiSummaries: AIInsight[];
};

export type AnalyticsInput = {
  transactions: Transaction[];
  budgets: Budget[];
  subscriptions: Subscription[];
  currency: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));
const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
const yearKey = (d: Date) => `${d.getFullYear()}`;
const weekdayLabel = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const rollingAverage = (values: number[], windowSize = 3) => {
  if (!values.length) return 0;
  const slice = values.slice(-windowSize);
  return slice.reduce((acc, curr) => acc + curr, 0) / Math.max(1, slice.length);
};

const formatMonthLabel = (date: Date) =>
  date.toLocaleString("en-US", { month: "short" });

const safeAmount = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export const buildAnalyticsIntelligence = ({
  transactions,
  budgets,
  subscriptions,
}: AnalyticsInput): AnalyticsIntelligence => {
  const now = new Date();
  const expenses = transactions.filter((tx) => tx.type === "expense");

  const monthDates = Array.from({ length: 6 }, (_, idx) => {
    const delta = 5 - idx;
    return new Date(now.getFullYear(), now.getMonth() - delta, 1);
  });
  const monthKeys = monthDates.map((date) => monthKey(date));

  const monthlyExpenseMap: Record<string, number> = {};
  const monthlyIncomeMap: Record<string, number> = {};
  const yearlyExpenseMap: Record<string, number> = {};
  const yearlyIncomeMap: Record<string, number> = {};

  for (const tx of transactions) {
    const txDate = new Date(tx.date);
    if (Number.isNaN(txDate.getTime())) continue;
    const amount = safeAmount(tx.amount);
    const mKey = monthKey(txDate);
    const yKey = yearKey(txDate);

    if (tx.type === "expense") {
      monthlyExpenseMap[mKey] = safeAmount(monthlyExpenseMap[mKey]) + amount;
      yearlyExpenseMap[yKey] = safeAmount(yearlyExpenseMap[yKey]) + amount;
    } else {
      monthlyIncomeMap[mKey] = safeAmount(monthlyIncomeMap[mKey]) + amount;
      yearlyIncomeMap[yKey] = safeAmount(yearlyIncomeMap[yKey]) + amount;
    }
  }

  const monthlyExpenseSeries = monthDates.map((date) => ({
    label: formatMonthLabel(date),
    value: safeAmount(monthlyExpenseMap[monthKey(date)]),
  }));
  const monthlyIncomeSeries = monthDates.map((date) => ({
    label: formatMonthLabel(date),
    value: safeAmount(monthlyIncomeMap[monthKey(date)]),
  }));
  const monthlySavingsSeries = monthKeys.map((key, idx) => ({
    label: monthlyExpenseSeries[idx].label,
    value: safeAmount(monthlyIncomeMap[key]) - safeAmount(monthlyExpenseMap[key]),
  }));

  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const weeklyExpenseMap: Record<string, number> = {};
  for (const tx of expenses) {
    const txDate = new Date(tx.date);
    if (Number.isNaN(txDate.getTime()) || txDate < weekStart) continue;
    const label = weekdayLabel[txDate.getDay()];
    weeklyExpenseMap[label] = safeAmount(weeklyExpenseMap[label]) + safeAmount(tx.amount);
  }
  const weeklySeries = weekdayLabel.map((day) => ({
    label: day,
    value: safeAmount(weeklyExpenseMap[day]),
  }));

  const years = Array.from(
    new Set([...Object.keys(yearlyExpenseMap), ...Object.keys(yearlyIncomeMap)])
  )
    .sort()
    .slice(-4);
  const yearlyExpenseSeries = years.map((year) => ({
    label: year,
    value: safeAmount(yearlyExpenseMap[year]),
  }));
  const yearlyIncomeSeries = years.map((year) => ({
    label: year,
    value: safeAmount(yearlyIncomeMap[year]),
  }));

  const currentExpense = monthlyExpenseSeries.at(-1)?.value ?? 0;
  const previousExpense = monthlyExpenseSeries.at(-2)?.value ?? 0;
  const expenseTrendPct =
    previousExpense > 0 ? ((currentExpense - previousExpense) / previousExpense) * 100 : 0;
  const spendingInterpretation =
    expenseTrendPct > 7
      ? "Spending is accelerating. AI flags this as a budget pressure signal."
      : expenseTrendPct < -4
        ? "Spending is cooling down. Current behavior supports healthier cash retention."
        : "Spending trend is stable. No critical volatility signal detected.";

  const savingsMomentum =
    (monthlySavingsSeries.at(-1)?.value ?? 0) - (monthlySavingsSeries.at(-2)?.value ?? 0);
  const savingsMomentumPct =
    monthlySavingsSeries.at(-2)?.value
      ? (savingsMomentum / Math.max(1, Math.abs(monthlySavingsSeries.at(-2)?.value ?? 0))) * 100
      : 0;

  const expenseForecastSlope = rollingAverage(
    monthlyExpenseSeries.map((item, index, arr) =>
      index === 0 ? 0 : item.value - arr[index - 1].value
    )
  );
  const baseExpenseForecast = rollingAverage(monthlyExpenseSeries.map((item) => item.value));
  const spendingPrediction = Array.from({ length: 4 }, (_, idx) => {
    const next = baseExpenseForecast + expenseForecastSlope * (idx + 1);
    return {
      label: `M+${idx + 1}`,
      actual: idx === 0 ? currentExpense : 0,
      forecast: Math.max(0, next),
    };
  });

  const baseSavings = monthlySavingsSeries.at(-1)?.value ?? 0;
  const savingsProjection = Array.from({ length: 4 }, (_, idx) => ({
    label: `M+${idx + 1}`,
    value: Math.max(0, baseSavings + savingsMomentum * (idx + 1) * 0.65),
  }));

  const budgetLimit = budgets.reduce((acc, budget) => acc + safeAmount(budget.limit_amount), 0);
  const budgetRiskPct =
    budgetLimit > 0 ? clamp((currentExpense / budgetLimit) * 100, 0, 100) : clamp(currentExpense / 45, 15, 95);
  const goalCompletionPct = clamp((savingsProjection.at(-1)?.value ?? 0) / Math.max(1, currentExpense) * 100, 0, 100);

  const categoryCurrent: Record<string, number> = {};
  const categoryPrevious: Record<string, number> = {};
  const currentMonthKey = monthKey(now);
  const previousMonthKey = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  for (const tx of expenses) {
    const txDate = new Date(tx.date);
    if (Number.isNaN(txDate.getTime())) continue;
    const key = monthKey(txDate);
    const amount = safeAmount(tx.amount);
    if (key === currentMonthKey) {
      categoryCurrent[tx.category] = safeAmount(categoryCurrent[tx.category]) + amount;
    }
    if (key === previousMonthKey) {
      categoryPrevious[tx.category] = safeAmount(categoryPrevious[tx.category]) + amount;
    }
  }

  const distribution = Object.entries(categoryCurrent)
    .map(([category, value]) => {
      const prev = safeAmount(categoryPrevious[category]);
      const growthPct = prev > 0 ? ((value - prev) / prev) * 100 : value > 0 ? 100 : 0;
      return { category, value, growthPct };
    })
    .sort((a, b) => b.value - a.value);

  const fastestGrowing = distribution.length
    ? [...distribution].sort((a, b) => b.growthPct - a.growthPct)[0]
    : null;
  const mostWasteful = distribution.length ? distribution[0] : null;

  const behaviorPatterns: string[] = [];
  if (fastestGrowing && fastestGrowing.growthPct > 12) {
    behaviorPatterns.push(`${fastestGrowing.category} spending is growing fastest (${fastestGrowing.growthPct.toFixed(1)}%).`);
  }
  if (mostWasteful && mostWasteful.value > currentExpense * 0.35) {
    behaviorPatterns.push(`${mostWasteful.category} is dominating monthly spend share.`);
  }
  if (!behaviorPatterns.length) {
    behaviorPatterns.push("Category behavior is balanced with no dominant volatility signal.");
  }

  const monthlyRecurringCost = subscriptions.reduce((sum, sub) => {
    const amount = safeAmount(sub.price);
    return sum + (sub.billing_cycle === "yearly" ? amount / 12 : amount);
  }, 0);
  const monthlyIncome = monthlyIncomeSeries.at(-1)?.value ?? 0;
  const totalRecurringBurdenPct =
    monthlyIncome > 0 ? clamp((monthlyRecurringCost / monthlyIncome) * 100, 0, 100) : 0;
  const yearlySubscriptionCost = monthlyRecurringCost * 12;
  const optimizationPotential = yearlySubscriptionCost * (totalRecurringBurdenPct > 22 ? 0.2 : 0.12);
  const cancellationSuggestions = subscriptions
    .slice()
    .sort((a, b) => safeAmount(b.price) - safeAmount(a.price))
    .slice(0, 3)
    .map((sub) => `${sub.name} (${sub.billing_cycle === "yearly" ? "yearly" : "monthly"})`);

  let weekendAmount = 0;
  let nightAmount = 0;
  let impulseAmount = 0;
  let dailySpend: Record<string, number> = {};
  for (const tx of expenses) {
    const amount = safeAmount(tx.amount);
    const txDate = new Date(tx.date);
    if (Number.isNaN(txDate.getTime())) continue;
    const day = txDate.getDay();
    const hour = txDate.getHours();
    const dayKey = tx.date.slice(0, 10);
    dailySpend[dayKey] = safeAmount(dailySpend[dayKey]) + amount;

    if (day === 0 || day === 6) weekendAmount += amount;
    if (hour >= 21 || hour <= 4) nightAmount += amount;
    if (amount > (currentExpense / 18 || 80)) impulseAmount += amount;
  }
  const totalExpense = expenses.reduce((sum, tx) => sum + safeAmount(tx.amount), 0);
  const weekendSpendingPct = totalExpense > 0 ? (weekendAmount / totalExpense) * 100 : 0;
  const nightSpendingPct = totalExpense > 0 ? (nightAmount / totalExpense) * 100 : 0;
  const impulseSpendingPct = totalExpense > 0 ? (impulseAmount / totalExpense) * 100 : 0;

  const dailyValues = Object.values(dailySpend);
  const dailyAvg = dailyValues.length ? dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length : 0;
  const variance =
    dailyValues.length > 0
      ? dailyValues.reduce((sum, value) => sum + Math.pow(value - dailyAvg, 2), 0) / dailyValues.length
      : 0;
  const consistencyScore = clamp(100 - Math.sqrt(variance) / Math.max(1, dailyAvg) * 35, 10, 100);

  const cashFlowIntelligence = monthDates.map((date, idx) => ({
    label: formatMonthLabel(date),
    value: (monthlyIncomeSeries[idx]?.value ?? 0) - (monthlyExpenseSeries[idx]?.value ?? 0),
  }));

  const categoryHeatmap: HeatmapCell[] = [];
  const start = new Date(now);
  start.setDate(now.getDate() - 34);
  for (let i = 0; i < 35; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const iso = date.toISOString().slice(0, 10);
    const amount = safeAmount(dailySpend[iso]);
    categoryHeatmap.push({
      day: weekdayLabel[date.getDay()],
      week: Math.floor(i / 7) + 1,
      amount,
      intensity: clamp(amount / Math.max(1, dailyAvg || 1), 0, 1),
    });
  }

  const patternDetection: string[] = [];
  if (weekendSpendingPct > 36) patternDetection.push("Weekend spending spikes detected.");
  if (impulseSpendingPct > 24) patternDetection.push("Impulse spending signal is elevated.");
  if (totalRecurringBurdenPct > 24) patternDetection.push("Recurring subscription burden is inefficient.");
  if (savingsMomentumPct > 6) patternDetection.push("Savings growth is outperforming recent months.");
  if (!patternDetection.length) patternDetection.push("No severe anomalies detected across spending behavior.");

  const aiSummaries: AIInsight[] = [
    {
      title: "Spending Trend Signal",
      detail:
        expenseTrendPct > 0
          ? `Spending has increased ${expenseTrendPct.toFixed(1)}% versus previous month.`
          : `Spending has stabilized ${Math.abs(expenseTrendPct).toFixed(1)}% lower than previous month.`,
      severity: expenseTrendPct > 6 ? "warning" : "info",
    },
    {
      title: "Subscription Efficiency",
      detail:
        totalRecurringBurdenPct > 22
          ? "Subscription costs are becoming financially inefficient."
          : "Subscription load remains within a healthy efficiency band.",
      severity: totalRecurringBurdenPct > 22 ? "warning" : "positive",
    },
    {
      title: "Savings Growth Pulse",
      detail:
        savingsMomentumPct >= 0
          ? "Savings growth is outperforming previous months."
          : "Savings momentum has weakened and needs proactive correction.",
      severity: savingsMomentumPct >= 0 ? "positive" : "warning",
    },
    {
      title: "Behavioral Pattern",
      detail:
        weekendSpendingPct > 36
          ? "Weekend spending spikes detected."
          : "Weekend behavior remains consistent with weekday baselines.",
      severity: weekendSpendingPct > 36 ? "warning" : "info",
    },
  ];

  return {
    spendingTrends: {
      weekly: weeklySeries,
      monthly: monthlyExpenseSeries,
      yearly: yearlyExpenseSeries,
      interpretation: spendingInterpretation,
    },
    incomeTrends: {
      monthly: monthlyIncomeSeries,
      yearly: yearlyIncomeSeries,
    },
    savingsGrowth: {
      monthly: monthlySavingsSeries,
      momentumPct: savingsMomentumPct,
    },
    forecasting: {
      spendingPrediction,
      savingsProjection,
      budgetRiskPct,
      goalCompletionPct,
    },
    categoryIntelligence: {
      distribution,
      fastestGrowing,
      mostWasteful,
      behavioralPatterns: behaviorPatterns,
    },
    subscriptionAnalytics: {
      totalRecurringBurdenPct,
      yearlySubscriptionCost,
      optimizationPotential,
      cancellationSuggestions,
    },
    financialBehavior: {
      weekendSpendingPct,
      nightSpendingPct,
      impulseSpendingPct,
      consistencyScore,
    },
    cashFlowIntelligence,
    categoryHeatmap,
    patternDetection,
    aiSummaries,
  };
};
