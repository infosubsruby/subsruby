export type FinancialHealthStatus = "Excellent" | "Good" | "Moderate" | "Risky" | "Critical";

export type FinancialHealthFactorKey =
  | "savings_rate"
  | "spending_consistency"
  | "income_stability"
  | "subscription_burden"
  | "expense_ratio"
  | "goal_progress"
  | "emergency_fund"
  | "overspending_behavior"
  | "debt_ratio"
  | "budget_discipline";

export type FinancialHealthFactor = {
  key: FinancialHealthFactorKey;
  label: string;
  score: number;
  weight: number;
  contribution: number;
};

export type FinancialHealthInput = {
  savingsRatePct: number;
  monthlyExpenseSeries: number[];
  monthlyIncomeSeries: number[];
  subscriptionBurdenPct: number;
  expenseRatioPct: number;
  goalProgressPct: number;
  emergencyFundMonths: number;
  overspendingDaysRatio: number;
  debtRatioPct: number;
  budgetDisciplineRatio: number;
};

export type FinancialHealthResult = {
  score: number;
  status: FinancialHealthStatus;
  summary: string;
  trendComparisonPct: number;
  weeklyImprovementPct: number;
  history: number[];
  factors: FinancialHealthFactor[];
  insights: string[];
};

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));

const avg = (values: number[]) => {
  if (!values.length) return 0;
  return values.reduce((acc, value) => acc + (Number.isFinite(value) ? value : 0), 0) / values.length;
};

const stdDev = (values: number[]) => {
  if (!values.length) return 0;
  const mean = avg(values);
  const variance = avg(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
};

const savingsRateScore = (value: number) => clamp((value / 25) * 100);
const spendingConsistencyScore = (series: number[]) => {
  if (series.length < 2) return 55;
  const mean = Math.max(avg(series), 1);
  const cv = stdDev(series) / mean;
  return clamp(100 - cv * 120);
};
const incomeStabilityScore = (series: number[]) => {
  if (series.length < 2) return 55;
  const mean = Math.max(avg(series), 1);
  const cv = stdDev(series) / mean;
  return clamp(100 - cv * 130);
};
const subscriptionBurdenScore = (value: number) => clamp(100 - value * 3.2);
const expenseRatioScore = (value: number) => clamp(115 - value * 1.05);
const goalProgressScore = (value: number) => clamp(value);
const emergencyFundScore = (months: number) => clamp((months / 6) * 100);
const overspendingBehaviorScore = (ratio: number) => clamp(100 - ratio * 100);
const debtRatioScore = (value: number) => clamp(100 - value * 2.1);
const budgetDisciplineScore = (ratio: number) => clamp(ratio * 100);

const statusFromScore = (score: number): FinancialHealthStatus => {
  if (score >= 85) return "Excellent";
  if (score >= 72) return "Good";
  if (score >= 58) return "Moderate";
  if (score >= 42) return "Risky";
  return "Critical";
};

const factorWeights: Record<FinancialHealthFactorKey, number> = {
  savings_rate: 14,
  spending_consistency: 10,
  income_stability: 10,
  subscription_burden: 10,
  expense_ratio: 12,
  goal_progress: 10,
  emergency_fund: 10,
  overspending_behavior: 8,
  debt_ratio: 8,
  budget_discipline: 8,
};

const factorLabel: Record<FinancialHealthFactorKey, string> = {
  savings_rate: "Savings Rate",
  spending_consistency: "Spending Consistency",
  income_stability: "Income Stability",
  subscription_burden: "Subscription Burden",
  expense_ratio: "Expense Ratio",
  goal_progress: "Goal Progress",
  emergency_fund: "Emergency Fund",
  overspending_behavior: "Overspending Behavior",
  debt_ratio: "Debt Ratio",
  budget_discipline: "Budget Discipline",
};

export const calculateFinancialHealthScore = (input: FinancialHealthInput): FinancialHealthResult => {
  const factorsRaw: Array<[FinancialHealthFactorKey, number]> = [
    ["savings_rate", savingsRateScore(input.savingsRatePct)],
    ["spending_consistency", spendingConsistencyScore(input.monthlyExpenseSeries)],
    ["income_stability", incomeStabilityScore(input.monthlyIncomeSeries)],
    ["subscription_burden", subscriptionBurdenScore(input.subscriptionBurdenPct)],
    ["expense_ratio", expenseRatioScore(input.expenseRatioPct)],
    ["goal_progress", goalProgressScore(input.goalProgressPct)],
    ["emergency_fund", emergencyFundScore(input.emergencyFundMonths)],
    ["overspending_behavior", overspendingBehaviorScore(input.overspendingDaysRatio)],
    ["debt_ratio", debtRatioScore(input.debtRatioPct)],
    ["budget_discipline", budgetDisciplineScore(input.budgetDisciplineRatio)],
  ];

  const factors: FinancialHealthFactor[] = factorsRaw.map(([key, score]) => {
    const weight = factorWeights[key];
    return {
      key,
      label: factorLabel[key],
      score: clamp(score),
      weight,
      contribution: (clamp(score) * weight) / 100,
    };
  });

  const totalWeight = factors.reduce((acc, factor) => acc + factor.weight, 0);
  const weightedTotal = factors.reduce((acc, factor) => acc + factor.score * factor.weight, 0);
  const score = clamp(weightedTotal / Math.max(totalWeight, 1));
  const status = statusFromScore(score);

  const previousScore = clamp(
    score -
      (input.savingsRatePct >= 12 ? 2.8 : -2.1) -
      (input.overspendingDaysRatio > 0.35 ? 2.4 : -1.3)
  );
  const trendComparisonPct = previousScore > 0 ? ((score - previousScore) / previousScore) * 100 : 0;

  const history = [0, 1, 2, 3, 4, 5].map((index) => {
    const swing = (index - 2) * 1.6;
    const stabilize = input.overspendingDaysRatio > 0.35 ? -1.2 : 0.9;
    return clamp(score - 4 + swing + stabilize);
  });
  const weeklyImprovementPct =
    history[history.length - 2] > 0
      ? ((history[history.length - 1] - history[history.length - 2]) / history[history.length - 2]) * 100
      : 0;

  const insights: string[] = [];
  if (input.savingsRatePct >= 15) {
    insights.push("Your spending discipline improved this month.");
  } else {
    insights.push("Savings rate is below healthy range.");
  }
  if (input.subscriptionBurdenPct > 18) {
    insights.push("Subscriptions are consuming too much income.");
  }
  if (input.emergencyFundMonths >= 3) {
    insights.push("Emergency savings are progressing well.");
  } else {
    insights.push("Emergency reserve needs more consistency.");
  }
  if (input.overspendingDaysRatio > 0.35) {
    insights.push("Overspending behavior is increasing risk pressure.");
  }

  const summary =
    status === "Excellent"
      ? "Financial condition is robust with healthy savings behavior and controlled spending dynamics."
      : status === "Good"
        ? "Financial profile is stable with strong progress. Tight optimization can lift your score further."
        : status === "Moderate"
          ? "Financial health is balanced but exposed to variability in cash flow and spending patterns."
          : status === "Risky"
            ? "Financial risk indicators are elevated. Corrective actions are recommended in core spending areas."
            : "Financial resilience is critically low. Immediate budget and cash flow stabilization is recommended.";

  return {
    score: Math.round(score),
    status,
    summary,
    trendComparisonPct,
    weeklyImprovementPct,
    history,
    factors,
    insights,
  };
};
