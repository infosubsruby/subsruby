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
  title: string;
  message: string;
  details: string;
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

  return [
    {
      id: insightId("spending_warning"),
      type: "spending_warning",
      severity: spendingUp ? "high" : "medium",
      title: `Food spending increased ${pct(context.expenseTrendPct || 24)} this week.`,
      message:
        "Your weekly expense velocity is above baseline and may impact month-end free cash flow.",
      details:
        "AI pattern detection found acceleration in variable categories. Create a temporary weekly cap and monitor whether the next 7-day trend returns to normal.",
      label: "Spending Warning",
      timestamp: timeAgoLabel(12),
    },
    {
      id: insightId("subscription_optimization"),
      type: "subscription_optimization",
      severity: "medium",
      title: `You can save ${asMoney(potentialYearlySavings, context.currency)}/year by optimizing subscriptions.`,
      message:
        "Recurring-cost clustering suggests at least one overlapping plan with low utilization.",
      details:
        "Switching one overlapping service and removing one low-value plan could reduce recurring burn while preserving core utility.",
      label: "Optimization",
      timestamp: timeAgoLabel(28),
    },
    {
      id: insightId("behavior_analysis"),
      type: "behavior_analysis",
      severity: "medium",
      title: "Weekend spending behavior detected.",
      message:
        "Spend spikes repeatedly occur on weekends and are now materially above weekday averages.",
      details:
        "Behavioral model flags a repeat pattern over recent cycles. A weekend-specific spending guardrail can stabilize your monthly variance.",
      label: "Behavior Analysis",
      timestamp: timeAgoLabel(47),
    },
    {
      id: insightId("goal_progress"),
      type: "goal_progress",
      severity: goalHealthy ? "low" : "medium",
      title: "Your emergency fund goal is progressing well.",
      message:
        "Current trajectory indicates continued progress if contribution rhythm remains unchanged.",
      details:
        "Maintain current allocation rules for the next two cycles to lock in momentum and reduce downside risk from irregular expenses.",
      label: "Goal Update",
      timestamp: timeAgoLabel(66),
    },
    {
      id: insightId("risk_detection"),
      type: "risk_detection",
      severity: safeSpendLow ? "high" : "medium",
      title: "Daily spending is above your normal average.",
      message:
        "Projected run-rate indicates increased probability of negative month-end buffer.",
      details:
        "Risk detector combines daily burn, recurring obligations, and remaining calendar days. Tighten discretionary spend until burn rate normalizes.",
      label: "Risk Detection",
      timestamp: timeAgoLabel(89),
    },
    {
      id: insightId("budget_recommendation"),
      type: "budget_recommendation",
      severity: "low",
      title: `Budget recommendation: protect ${context.topCategory || "top category"} with a dynamic limit.`,
      message:
        "Adaptive limits can prevent high-volatility categories from affecting strategic savings goals.",
      details:
        "Use an adaptive cap linked to weekly variance so limits rise and fall with true usage while still enforcing discipline.",
      label: "Budget Recommendation",
      timestamp: timeAgoLabel(130),
    },
    {
      id: insightId("saving_opportunity"),
      type: "saving_opportunity",
      severity: context.savingsRatePct >= 15 ? "low" : "medium",
      title: "You are saving more than last month.",
      message:
        "Savings momentum has improved and is trending in a healthy direction this cycle.",
      details:
        "AI suggests preserving momentum by auto-routing a small additional percentage from incoming cash flow into reserves.",
      label: "Saving Opportunity",
      timestamp: timeAgoLabel(176),
    },
    {
      id: insightId("smart_tip"),
      type: "smart_tip",
      severity: "low",
      title: "Smart tip: automate bill-day cash buffers.",
      message:
        `With ${context.upcomingBillsCount} upcoming bills, a bill-day buffer can reduce balance shocks.`,
      details:
        "Create a dedicated sub-wallet and automatically move funds 24 hours before recurring charges settle.",
      label: "Smart Tip",
      timestamp: timeAgoLabel(240),
    },
  ];
};
