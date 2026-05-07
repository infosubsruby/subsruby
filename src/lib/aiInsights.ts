export type AIInsightSeverity = "low" | "medium" | "high";

export type AIInsightType =
  | "spending_warning"
  | "saving_opportunity"
  | "subscription_optimization"
  | "budget_recommendation"
  | "risk_detection"
  | "goal_progress"
  | "behavior_analysis"
  | "smart_tip";

export type AIInsight = {
  id: string;
  type: AIInsightType;
  severity: AIInsightSeverity;
  categoryTag: string;
  confidencePct: number;
  title: string;
  message: string;
  details: string;
  suggestedAction: string;
  label: string;
  timestamp: string;
};

export type AIInsightContext = {
  expenseTrendPct: number;
  savingsRatePct: number;
  monthlySubscriptionCost: number;
  currency: string;
  goalProgressPct: number;
  dailySafeSpend: number;
  topCategory: string;
  upcomingBillsCount: number;
};

const asMoney = (value: number, currency: string) => {
  const amount = Number.isFinite(value) ? value : 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toFixed(0)} ${currency}`;
  }
};

const pct = (value: number) => `${Math.abs(Number.isFinite(value) ? value : 0).toFixed(1)}%`;

const timeAgoLabel = (minutesAgo: number) => {
  if (minutesAgo < 60) return `${minutesAgo}m ago`;
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const insightId = (type: AIInsightType) =>
  `insight-${type}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

export const buildMockAIInsights = (context: AIInsightContext): AIInsight[] => {
  const potentialYearlySavings = context.monthlySubscriptionCost * 0.12 * 12;
  const spendingUp = context.expenseTrendPct > 0;
  const safeSpendLow = context.dailySafeSpend < 0;
  const goalHealthy = context.goalProgressPct >= 60 && context.goalProgressPct <= 95;
  const topCategory = context.topCategory && context.topCategory !== "No category data yet" ? context.topCategory : "spending";

  return [
    {
      id: insightId("spending_warning"),
      type: "spending_warning",
      severity: spendingUp ? "high" : "medium",
      categoryTag: "Spending Behavior",
      confidencePct: 91,
      title: `${topCategory} trend changed ${pct(context.expenseTrendPct || 0)} this month.`,
      message:
        "Your weekly expense velocity is above baseline and may impact month-end free cash flow.",
      details:
        "AI pattern detection found acceleration in variable categories. Create a temporary weekly cap and monitor whether the next 7-day trend returns to normal.",
      suggestedAction: "Set a weekly cap for high-volatility categories.",
      label: "Spending Warning",
      timestamp: timeAgoLabel(12),
    },
    {
      id: insightId("subscription_optimization"),
      type: "subscription_optimization",
      severity: "medium",
      categoryTag: "Subscriptions",
      confidencePct: 88,
      title: `You can save ${asMoney(potentialYearlySavings, context.currency)}/year by optimizing subscriptions.`,
      message:
        "Recurring-cost clustering suggests at least one overlapping plan with low utilization.",
      details:
        "Switching one overlapping service and removing one low-value plan could reduce recurring burn while preserving core utility.",
      suggestedAction: "Review and switch at least one monthly plan to yearly billing.",
      label: "Optimization",
      timestamp: timeAgoLabel(28),
    },
    {
      id: insightId("behavior_analysis"),
      type: "behavior_analysis",
      severity: "medium",
      categoryTag: "Pattern Detection",
      confidencePct: 86,
      title: "Weekend spending behavior detected.",
      message:
        "Spend spikes repeatedly occur on weekends and are now materially above weekday averages.",
      details:
        "Behavioral model flags a repeat pattern over recent cycles. A weekend-specific spending guardrail can stabilize your monthly variance.",
      suggestedAction: "Use a weekend-only spending limit to reduce variance.",
      label: "Behavior Analysis",
      timestamp: timeAgoLabel(47),
    },
    {
      id: insightId("goal_progress"),
      type: "goal_progress",
      severity: goalHealthy ? "low" : "medium",
      categoryTag: "Goals",
      confidencePct: 83,
      title: "Your emergency fund goal is progressing well.",
      message:
        "Current trajectory indicates continued progress if contribution rhythm remains unchanged.",
      details:
        "Maintain current allocation rules for the next two cycles to lock in momentum and reduce downside risk from irregular expenses.",
      suggestedAction: "Keep automated goal contributions active this month.",
      label: "Goal Update",
      timestamp: timeAgoLabel(66),
    },
    {
      id: insightId("risk_detection"),
      type: "risk_detection",
      severity: safeSpendLow ? "high" : "medium",
      categoryTag: "Risk Detection",
      confidencePct: 90,
      title: "Daily spending is above your normal average.",
      message:
        "Projected run-rate indicates increased probability of negative month-end buffer.",
      details:
        "Risk detector combines daily burn, recurring obligations, and remaining calendar days. Tighten discretionary spend until burn rate normalizes.",
      suggestedAction: "Reduce discretionary spending for the next 3-5 days.",
      label: "Risk Detection",
      timestamp: timeAgoLabel(89),
    },
    {
      id: insightId("budget_recommendation"),
      type: "budget_recommendation",
      severity: "low",
      categoryTag: "Budgeting",
      confidencePct: 78,
      title: `Budget recommendation: protect ${context.topCategory || "top category"} with a dynamic limit.`,
      message:
        "Adaptive limits can prevent high-volatility categories from affecting strategic savings goals.",
      details:
        "Use an adaptive cap linked to weekly variance so limits rise and fall with true usage while still enforcing discipline.",
      suggestedAction: "Enable adaptive limits for your top spend category.",
      label: "Budget Recommendation",
      timestamp: timeAgoLabel(130),
    },
    {
      id: insightId("saving_opportunity"),
      type: "saving_opportunity",
      severity: context.savingsRatePct >= 15 ? "low" : "medium",
      categoryTag: "Savings",
      confidencePct: 84,
      title: "You are saving more than last month.",
      message:
        "Savings momentum has improved and is trending in a healthy direction this cycle.",
      details:
        "AI suggests preserving momentum by auto-routing a small additional percentage from incoming cash flow into reserves.",
      suggestedAction: "Auto-transfer an extra 2-3% to savings this month.",
      label: "Saving Opportunity",
      timestamp: timeAgoLabel(176),
    },
    {
      id: insightId("smart_tip"),
      type: "smart_tip",
      severity: "low",
      categoryTag: "Cash Flow",
      confidencePct: 72,
      title: "Smart tip: automate bill-day cash buffers.",
      message:
        `With ${context.upcomingBillsCount} upcoming bills, a bill-day buffer can reduce balance shocks.`,
      details:
        "Create a dedicated sub-wallet and automatically move funds 24 hours before recurring charges settle.",
      suggestedAction: "Create a bill-buffer wallet and automate transfers.",
      label: "Smart Tip",
      timestamp: timeAgoLabel(240),
    },
  ];
};
