import type { Budget, Transaction } from "@/hooks/useFinance";
import type { Subscription } from "@/hooks/subscriptions/types";
import { formatCurrency } from "@/i18n/currency";

export type RubyAISuggestion = {
  id: string;
  label: string;
  prompt: string;
};

export type RubyAIMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type RubyAIInsightCard = {
  title: string;
  value: string;
  detail: string;
  tone: "info" | "warning" | "positive";
};

export type RubyAIContext = {
  currency: string;
  monthlyIncome: number;
  monthlySpending: number;
  savingsRatePct: number;
  topSpendingCategory: string;
  topSpendingCategoryAmount: number;
  subscriptionMonthlyCost: number;
  subscriptionYearlyCost: number;
  subscriptionLoadPct: number;
  riskySpendingSignal: number;
  budgetCoveragePct: number;
  financialHealthScore: number;
  weeklySummary: string;
};

type BuildContextInput = {
  transactions: Transaction[];
  budgets: Budget[];
  subscriptions: Subscription[];
  currency: string;
  financialHealthScore: number;
};

const safe = (value: number) => (Number.isFinite(value) ? value : 0);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, safe(value)));
const monthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;
const dayKey = (date: Date) => date.toISOString().slice(0, 10);

export const buildRubyAIContext = ({
  transactions,
  budgets,
  subscriptions,
  currency,
  financialHealthScore,
}: BuildContextInput): RubyAIContext => {
  const now = new Date();
  const currentMonth = monthKey(now);

  let monthlyIncome = 0;
  let monthlySpending = 0;
  const categoryTotals: Record<string, number> = {};
  const dailySpending: Record<string, number> = {};

  for (const tx of transactions) {
    const txDate = new Date(tx.date);
    if (Number.isNaN(txDate.getTime()) || monthKey(txDate) !== currentMonth) continue;
    const amount = safe(Number(tx.amount));
    if (tx.type === "income") {
      monthlyIncome += amount;
    } else {
      monthlySpending += amount;
      categoryTotals[tx.category] = safe(categoryTotals[tx.category]) + amount;
      dailySpending[dayKey(txDate)] = safe(dailySpending[dayKey(txDate)]) + amount;
    }
  }

  const topCategoryEntry = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  const topSpendingCategory = topCategoryEntry?.[0] ?? "No category data yet";
  const topSpendingCategoryAmount = safe(topCategoryEntry?.[1] ?? 0);

  const subscriptionMonthlyCost = subscriptions.reduce((acc, sub) => {
    const amount = safe(Number(sub.price));
    return acc + (sub.billing_cycle === "yearly" ? amount / 12 : amount);
  }, 0);
  const subscriptionYearlyCost = subscriptionMonthlyCost * 12;
  const subscriptionLoadPct = monthlyIncome > 0 ? (subscriptionMonthlyCost / monthlyIncome) * 100 : 0;

  const savingsRatePct = monthlyIncome > 0 ? ((monthlyIncome - monthlySpending - subscriptionMonthlyCost) / monthlyIncome) * 100 : 0;

  const budgetTotal = budgets.reduce((acc, b) => acc + safe(Number(b.limit_amount)), 0);
  const budgetCoveragePct = budgetTotal > 0 ? (monthlySpending / budgetTotal) * 100 : 0;

  const dailyValues = Object.values(dailySpending);
  const dailyAvg = dailyValues.length ? dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length : 0;
  const spikeDays = dailyValues.filter((value) => value > dailyAvg * 1.35).length;
  const riskySpendingSignal = dailyValues.length ? clamp((spikeDays / dailyValues.length) * 100, 0, 100) : 0;

  const hasData = monthlyIncome > 0 || monthlySpending > 0 || subscriptionMonthlyCost > 0;
  const weeklySummary = hasData
    ? [
        savingsRatePct >= 15
          ? "Savings behavior remained resilient this week."
          : "Savings velocity softened this week and needs correction.",
        subscriptionLoadPct > 22
          ? "Subscription pressure is elevated and optimization is recommended."
          : "Recurring cost load is currently manageable.",
        riskySpendingSignal > 30
          ? "Volatile spending spikes were detected across recent days."
          : "Spending volatility remained within normal bounds.",
      ].join(" ")
    : "No financial activity is recorded yet. Add transactions or subscriptions to unlock Ruby AI insights.";

  return {
    currency,
    monthlyIncome: safe(monthlyIncome),
    monthlySpending: safe(monthlySpending),
    savingsRatePct: safe(savingsRatePct),
    topSpendingCategory,
    topSpendingCategoryAmount,
    subscriptionMonthlyCost: safe(subscriptionMonthlyCost),
    subscriptionYearlyCost: safe(subscriptionYearlyCost),
    subscriptionLoadPct: safe(subscriptionLoadPct),
    riskySpendingSignal: safe(riskySpendingSignal),
    budgetCoveragePct: clamp(budgetCoveragePct, 0, 180),
    financialHealthScore: clamp(financialHealthScore, 0, 100),
    weeklySummary,
  };
};

export const buildRubyAISuggestions = (context: RubyAIContext): RubyAISuggestion[] => [
  {
    id: "spend-why",
    label: "Why spend more?",
    prompt: "Why did I spend more this month?",
  },
  {
    id: "afford-check",
    label: "Can I afford this?",
    prompt: "Can I afford a $500 purchase?",
  },
  {
    id: "student-budget",
    label: "Student budget",
    prompt: "Create a student budget for me.",
  },
  {
    id: "subs-analysis",
    label: "Analyze subscriptions",
    prompt: "Analyze my subscriptions.",
  },
  {
    id: "health-upgrade",
    label: "Improve health score",
    prompt: "How can I improve my Financial Health Score?",
  },
  {
    id: "waste-category",
    label: "Reduce first category",
    prompt: "Which category should I reduce first?",
  },
  {
    id: "safe-spend",
    label: "Safe-to-spend today",
    prompt: "What can I safely spend today?",
  },
  {
    id: "emergency-goal",
    label: "Emergency fund plan",
    prompt: "Help me reach my emergency fund faster.",
  },
].slice(0, context.financialHealthScore > 70 ? 6 : 8);

const assistantHeader = "Ruby AI CFO:";

const buildAffordabilityAnswer = (context: RubyAIContext, message: string) => {
  const match = message.match(/\$?\s?(\d+(?:\.\d{1,2})?)/);
  const amount = match ? Number(match[1]) : 250;
  const discretionaryCapacity = Math.max(
    0,
    context.monthlyIncome - context.monthlySpending - context.subscriptionMonthlyCost
  );
  const canAfford = discretionaryCapacity > amount * 1.4;
  return `${assistantHeader} Based on your current month, discretionary headroom is ${formatCurrency(
    discretionaryCapacity,
    context.currency
  )}. ${
    canAfford
      ? `You can likely afford ${formatCurrency(amount, context.currency)} if you keep weekly variable spend stable.`
      : `I do not recommend ${formatCurrency(amount, context.currency)} right now. Delay or cut a non-essential category first.`
  }`;
};

export const buildRubyAIResponse = (prompt: string, context: RubyAIContext): string => {
  const text = prompt.toLowerCase();

  if (text.includes("why") && text.includes("spend")) {
    const baselineWeekly = (context.monthlySpending / 4) || 0;
    const categoryPct = baselineWeekly > 0 ? (context.topSpendingCategoryAmount / baselineWeekly) * 100 : 0;
    return `${assistantHeader} The strongest driver is ${context.topSpendingCategory} (${formatCurrency(
      context.topSpendingCategoryAmount,
      context.currency
    )}) this month. Based on your current spending pattern, this category is ${categoryPct.toFixed(
      0
    )}% of your weekly baseline. Budget coverage is ${context.budgetCoveragePct.toFixed(
      1
    )}%, and volatility signal is ${context.riskySpendingSignal.toFixed(
      1
    )}%. If you reduce this category by ${formatCurrency(
      Math.max(8, context.topSpendingCategoryAmount * 0.12),
      context.currency
    )} over the next 10 days, you can stabilize your monthly target.`;
  }

  if (text.includes("save more") || text.includes("save")) {
    return `${assistantHeader} Your current savings rate is ${context.savingsRatePct.toFixed(
      1
    )}%. To improve quickly: 1) reduce top category by 10%, 2) cut subscription outflow by at least ${formatCurrency(
      context.subscriptionMonthlyCost * 0.15,
      context.currency
    )}, 3) auto-transfer ${
      context.savingsRatePct < 10 ? "5%" : "3%"
    } of income every payday.`;
  }

  if (text.includes("subscription")) {
    return `${assistantHeader} Subscription load is ${context.subscriptionLoadPct.toFixed(
      1
    )}% of monthly income (${formatCurrency(context.subscriptionMonthlyCost, context.currency)}/mo, ${formatCurrency(
      context.subscriptionYearlyCost,
      context.currency
    )}/yr). Ruby AI recommends reviewing the two lowest-usage services first and enforcing a hard recurring-cost ceiling of 15% income.`;
  }

  if (text.includes("afford")) {
    return buildAffordabilityAnswer(context, prompt);
  }

  if (text.includes("student budget")) {
    return `${assistantHeader} Student budget blueprint: 55% essentials, 20% learning/career, 15% savings, 10% lifestyle. With your profile, cap non-essentials at ${formatCurrency(
      context.monthlyIncome * 0.1,
      context.currency
    )} and protect savings first before discretionary spend.`;
  }

  if (text.includes("health score")) {
    return `${assistantHeader} Your financial health score proxy is ${Math.round(
      context.financialHealthScore
    )}/100. Fastest lift path: decrease spending volatility, reduce subscription burden below 18% income, and raise savings rate above 15%. These changes can improve your score trajectory within 2-4 weeks.`;
  }

  if (text.includes("weekly")) {
    return `${assistantHeader} Weekly summary: ${context.weeklySummary} Priority actions this week: lock category caps, review recurring costs, and run a mid-week spend check before weekend activity.`;
  }

  if (text.includes("waste")) {
    return `${assistantHeader} Highest waste risk currently appears in ${context.topSpendingCategory}. It consumed ${formatCurrency(
      context.topSpendingCategoryAmount,
      context.currency
    )} this month. Start with a micro-budget and require a 24-hour cooldown on discretionary purchases in this category.`;
  }

  if (text.includes("safely spend") || text.includes("safe-to-spend")) {
    const daysLeft = Math.max(1, 30 - new Date().getDate());
    const safeToSpend = Math.max(
      0,
      (context.monthlyIncome - context.monthlySpending - context.subscriptionMonthlyCost) / daysLeft
    );
    return `${assistantHeader} Safe-to-spend estimate is ${formatCurrency(
      safeToSpend,
      context.currency
    )} per day for the rest of this cycle. If you keep discretionary spending near this range, month-end balance stability should remain healthy.`;
  }

  if (text.includes("emergency fund")) {
    const monthlySurplus = Math.max(
      0,
      context.monthlyIncome - context.monthlySpending - context.subscriptionMonthlyCost
    );
    const target = Math.max(context.monthlySpending * 3, context.monthlyIncome * 0.5);
    const months = monthlySurplus > 0 ? target / Math.max(monthlySurplus, 1) : 999;
    return `${assistantHeader} Emergency fund acceleration plan: current monthly surplus is ${formatCurrency(
      monthlySurplus,
      context.currency
    )}. At this pace, your emergency fund target could be reached in ${months.toFixed(
      1
    )} months. To speed this up, redirect 20% of subscription savings and 10% of variable-category reductions directly into reserves.`;
  }

  return `${assistantHeader} I analyzed your live financial context and recommend focusing on three levers now: spending discipline, recurring-cost efficiency, and savings automation. Ask me to generate a targeted plan for any one of these areas.`;
};

export const buildRubyAIInsightCards = (context: RubyAIContext): RubyAIInsightCard[] => [
  {
    title: "Savings Performance",
    value: `${context.savingsRatePct.toFixed(1)}%`,
    detail: context.savingsRatePct >= 15 ? "Savings behavior is strong." : "Savings ratio needs reinforcement.",
    tone: context.savingsRatePct >= 15 ? "positive" : "warning",
  },
  {
    title: "Recurring Burden",
    value: `${context.subscriptionLoadPct.toFixed(1)}%`,
    detail:
      context.subscriptionLoadPct > 22
        ? "Subscription cost is pressuring liquidity."
        : "Recurring load is in a manageable band.",
    tone: context.subscriptionLoadPct > 22 ? "warning" : "info",
  },
  {
    title: "Risky Spending Signal",
    value: `${context.riskySpendingSignal.toFixed(1)}%`,
    detail:
      context.riskySpendingSignal > 30
        ? "Frequent spending spikes detected."
        : "Volatility is currently stable.",
    tone: context.riskySpendingSignal > 30 ? "warning" : "positive",
  },
  {
    title: "Financial Health",
    value: `${Math.round(context.financialHealthScore)}/100`,
    detail: "Composite resilience indicator from cash flow and behavior.",
    tone: context.financialHealthScore >= 70 ? "positive" : "info",
  },
];

export const buildRubyAIMemoryLine = (context: RubyAIContext) => [
  `Primary overspend category: ${context.topSpendingCategory}`,
  `Monthly recurring cost baseline: ${formatCurrency(context.subscriptionMonthlyCost, context.currency)}`,
  `Financial health proxy: ${Math.round(context.financialHealthScore)}/100`,
  `Weekly pattern signal: ${context.riskySpendingSignal.toFixed(1)}% volatility`,
];
