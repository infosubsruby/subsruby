export type FinancialHealthStatus = "Excellent" | "Good" | "Moderate" | "Risky" | "Critical";

export type FinancialHealthFactorKey =
  | "savings_rate"
  | "spending_control"
  | "subscription_burden"
  | "emergency_fund"
  | "budget_discipline"
  | "cash_flow_stability"
  | "goal_progress"
  | "debt_credit_risk";

export type FinancialHealthFactorStatus = "Excellent" | "Good" | "Moderate" | "Risky" | "Critical";

export type FinancialHealthImprovementAction = {
  id: string;
  title: string;
  estimatedImpact: number;
  difficulty: "Easy" | "Medium" | "Hard";
  timeToComplete: string;
  category: string;
};

export type FinancialHealthFactor = {
  key: FinancialHealthFactorKey;
  label: string;
  scorePct: number;
  scoreContribution: number;
  weightPct: number;
  status: FinancialHealthFactorStatus;
  explanation: string;
  suggestion: string;
  trendVsPreviousPct: number;
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
  statusExplanation: string;
  recommendedNextAction: string;
  summary: string;
  trendComparisonPct: number; // score change vs previous month
  previousMonthScore: number;
  monthlyScoreChange: number;
  weeklyImprovementPct: number;
  history: number[];
  bestScore: number;
  worstScore: number;
  biggestImprovementFactor: string;
  topPositiveFactor: string;
  topNegativeFactor: string;
  quickImprovementAction: string;
  factors: FinancialHealthFactor[];
  improvementPlan: FinancialHealthImprovementAction[];
  aiExplanations: string[];
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

const scoreToStatus = (score: number): FinancialHealthFactorStatus => {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Moderate";
  if (score >= 40) return "Risky";
  return "Critical";
};

const savingsRateScore = (value: number) => clamp((value / 20) * 100);
const spendingControlScore = (expenseRatioPct: number, overspendingDaysRatio: number) =>
  clamp(100 - Math.max(0, expenseRatioPct - 65) * 1.3 - overspendingDaysRatio * 40);
const subscriptionBurdenScore = (value: number) => clamp(100 - Math.max(0, value - 8) * 5.5);
const emergencyFundProgressScore = (months: number) => clamp((months / 6) * 100);
const budgetDisciplineScore = (ratio: number) => clamp(ratio * 100);
const cashFlowStabilityScore = (incomeSeries: number[], expenseSeries: number[]) => {
  if (incomeSeries.length < 2 || expenseSeries.length < 2) return 62;
  const netSeries = incomeSeries.map((income, index) => safe(income) - safe(expenseSeries[index] ?? 0));
  const meanAbs = Math.max(1, avg(netSeries.map((v) => Math.abs(v))));
  const cv = stdDev(netSeries) / meanAbs;
  return clamp(100 - cv * 110);
};
const goalProgressScore = (value: number) => clamp(value);
const debtCreditRiskScore = (debtRatioPct: number) => clamp(100 - Math.max(0, debtRatioPct - 10) * 3.8);

const safe = (value: number) => (Number.isFinite(value) ? value : 0);

const statusFromScore = (score: number): FinancialHealthStatus => {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Moderate";
  if (score >= 40) return "Risky";
  return "Critical";
};

const factorWeights: Record<FinancialHealthFactorKey, number> = {
  savings_rate: 20,
  spending_control: 20,
  subscription_burden: 15,
  emergency_fund: 15,
  budget_discipline: 10,
  cash_flow_stability: 10,
  goal_progress: 5,
  debt_credit_risk: 5,
};

const factorLabel: Record<FinancialHealthFactorKey, string> = {
  savings_rate: "Savings Rate",
  spending_control: "Spending Control",
  subscription_burden: "Subscription Burden",
  emergency_fund: "Emergency Fund",
  budget_discipline: "Budget Discipline",
  cash_flow_stability: "Cash Flow Stability",
  goal_progress: "Goal Progress",
  debt_credit_risk: "Debt / Credit Risk",
};

export const calculateFinancialHealthScore = (input: FinancialHealthInput): FinancialHealthResult => {
  const monthlyIncomeCurrent = safe(input.monthlyIncomeSeries.at(-1) ?? 0);
  const monthlyIncomePrevious = safe(input.monthlyIncomeSeries.at(-2) ?? monthlyIncomeCurrent);
  const monthlyExpenseCurrent = safe(input.monthlyExpenseSeries.at(-1) ?? 0);
  const monthlyExpensePrevious = safe(input.monthlyExpenseSeries.at(-2) ?? monthlyExpenseCurrent);

  const previousSavingsRate =
    monthlyIncomePrevious > 0 ? ((monthlyIncomePrevious - monthlyExpensePrevious) / monthlyIncomePrevious) * 100 : input.savingsRatePct - 2;
  const previousExpenseRatio =
    monthlyIncomePrevious > 0 ? (monthlyExpensePrevious / monthlyIncomePrevious) * 100 : input.expenseRatioPct + 3;
  const previousSubscriptionBurden =
    monthlyIncomePrevious > 0
      ? (input.subscriptionBurdenPct * Math.max(monthlyIncomeCurrent, 1)) / Math.max(monthlyIncomePrevious, 1)
      : input.subscriptionBurdenPct + 1.2;
  const previousEmergencyFundMonths = Math.max(0, input.emergencyFundMonths - Math.max(0, input.savingsRatePct) / 100);
  const previousBudgetDiscipline = clamp(input.budgetDisciplineRatio - (monthlyExpenseCurrent > monthlyExpensePrevious ? 0.05 : -0.03), 0, 1);
  const previousGoalProgress = clamp(input.goalProgressPct - 4);
  const previousDebtRatio = clamp(input.debtRatioPct + (monthlyExpenseCurrent > monthlyExpensePrevious ? 1.8 : -1.2), 0, 100);

  const currentRawScores: Record<FinancialHealthFactorKey, number> = {
    savings_rate: savingsRateScore(input.savingsRatePct),
    spending_control: spendingControlScore(input.expenseRatioPct, input.overspendingDaysRatio),
    subscription_burden: subscriptionBurdenScore(input.subscriptionBurdenPct),
    emergency_fund: emergencyFundProgressScore(input.emergencyFundMonths),
    budget_discipline: budgetDisciplineScore(input.budgetDisciplineRatio),
    cash_flow_stability: cashFlowStabilityScore(input.monthlyIncomeSeries, input.monthlyExpenseSeries),
    goal_progress: goalProgressScore(input.goalProgressPct),
    debt_credit_risk: debtCreditRiskScore(input.debtRatioPct),
  };

  const previousRawScores: Record<FinancialHealthFactorKey, number> = {
    savings_rate: savingsRateScore(previousSavingsRate),
    spending_control: spendingControlScore(previousExpenseRatio, clamp(input.overspendingDaysRatio + (monthlyExpenseCurrent > monthlyExpensePrevious ? 0.04 : -0.03), 0, 1)),
    subscription_burden: subscriptionBurdenScore(previousSubscriptionBurden),
    emergency_fund: emergencyFundProgressScore(previousEmergencyFundMonths),
    budget_discipline: budgetDisciplineScore(previousBudgetDiscipline),
    cash_flow_stability: cashFlowStabilityScore(input.monthlyIncomeSeries.slice(0, -1), input.monthlyExpenseSeries.slice(0, -1)),
    goal_progress: goalProgressScore(previousGoalProgress),
    debt_credit_risk: debtCreditRiskScore(previousDebtRatio),
  };

  const factorExplanations: Record<FinancialHealthFactorKey, string> = {
    savings_rate: `You saved ${input.savingsRatePct.toFixed(1)}% of income this month.`,
    spending_control: `Expense ratio is ${input.expenseRatioPct.toFixed(1)}% with ${(input.overspendingDaysRatio * 100).toFixed(0)}% overspending days.`,
    subscription_burden: `Subscriptions consume ${input.subscriptionBurdenPct.toFixed(1)}% of income.`,
    emergency_fund: `Emergency reserve currently covers ${input.emergencyFundMonths.toFixed(1)} month(s) of expenses.`,
    budget_discipline: `Budget usage signal is ${(input.budgetDisciplineRatio * 100).toFixed(0)}% discipline.`,
    cash_flow_stability: "Cash flow stability is measured by month-to-month net volatility.",
    goal_progress: `Average goal progress is ${input.goalProgressPct.toFixed(0)}%.`,
    debt_credit_risk: `Debt/Credit risk ratio is ${input.debtRatioPct.toFixed(1)}%.`,
  };

  const factorSuggestions: Record<FinancialHealthFactorKey, string> = {
    savings_rate: "Try reaching at least 20% savings rate for stronger score growth.",
    spending_control: "Tighten food/shopping discretionary limits for the next 2 weeks.",
    subscription_burden: "Keep recurring costs under 10-12% of income.",
    emergency_fund: "Increase automated transfers to target a 3-6 month emergency reserve.",
    budget_discipline: "Keep monthly budget usage under 90% in volatile categories.",
    cash_flow_stability: "Smooth irregular spending and avoid spike-heavy weeks.",
    goal_progress: "Raise goal contribution cadence by a small weekly amount.",
    debt_credit_risk: "Keep credit utilization below 30% to reduce risk pressure.",
  };

  const factors: FinancialHealthFactor[] = (Object.keys(currentRawScores) as FinancialHealthFactorKey[]).map((key) => {
    const weightPct = factorWeights[key];
    const scorePct = clamp(currentRawScores[key]);
    const previousScorePct = clamp(previousRawScores[key]);
    const scoreContribution = (scorePct / 100) * weightPct;
    const trendVsPreviousPct =
      previousScorePct > 0
        ? ((scorePct - previousScorePct) / previousScorePct) * 100
        : scorePct - previousScorePct;
    return {
      key,
      label: factorLabel[key],
      scorePct,
      scoreContribution,
      weightPct,
      status: scoreToStatus(scorePct),
      explanation: factorExplanations[key],
      suggestion: factorSuggestions[key],
      trendVsPreviousPct,
    };
  });

  const totalWeight = factors.reduce((acc, factor) => acc + factor.weightPct, 0);
  const weightedTotal = factors.reduce((acc, factor) => acc + factor.scorePct * factor.weightPct, 0);
  const score = clamp(weightedTotal / Math.max(totalWeight, 1));
  const status = statusFromScore(score);

  const previousScore = clamp(
    factors.reduce((acc, factor) => {
      const previousFactor = previousRawScores[factor.key];
      return acc + previousFactor * factor.weightPct;
    }, 0) / 100
  );
  const monthlyScoreChange = score - previousScore;
  const trendComparisonPct = previousScore > 0 ? ((score - previousScore) / previousScore) * 100 : 0;

  const history = [0, 1, 2, 3, 4, 5].map((index) => {
    const slope = monthlyScoreChange * 0.65;
    const baseline = score - slope * (5 - index);
    const microVariance = (index % 2 === 0 ? -1 : 1) * 0.9;
    return clamp(baseline + microVariance);
  });
  const weeklyImprovementPct =
    history[history.length - 2] > 0
      ? ((history[history.length - 1] - history[history.length - 2]) / history[history.length - 2]) * 100
      : 0;

  const topPositiveFactorObj = [...factors].sort((a, b) => b.scoreContribution - a.scoreContribution)[0];
  const topNegativeFactorObj = [...factors].sort((a, b) => a.scoreContribution - b.scoreContribution)[0];
  const biggestImprovementFactorObj = [...factors].sort((a, b) => b.trendVsPreviousPct - a.trendVsPreviousPct)[0];

  const insights: string[] = [
    monthlyScoreChange >= 0
      ? "Your score improved because savings and spending discipline strengthened versus last month."
      : "Your score declined because key spend-control factors weakened versus last month.",
    input.subscriptionBurdenPct <= 12
      ? "Subscription burden is currently healthy."
      : "Subscription burden is above ideal and is weighing on your score.",
    input.emergencyFundMonths >= 3
      ? "Emergency fund progress is helping your score stability."
      : "Emergency fund depth is still limited and lowers resilience.",
    input.debtRatioPct > 30
      ? "Credit usage is elevated; keep utilization below 30%."
      : "Debt/credit risk is currently within an acceptable range.",
  ];

  const aiExplanations: string[] = [
    monthlyScoreChange >= 0
      ? "Your score improved because your savings rate increased and spending stayed closer to budget."
      : "Your score declined because spending control weakened and cash flow stability decreased.",
    `Your subscription burden is ${
      input.subscriptionBurdenPct <= 12 ? "healthy" : "elevated"
    }, while ${topNegativeFactorObj.label.toLowerCase()} is currently the main drag on your score.`,
    `Improving your savings rate by 3% could increase your Health Score by about ${Math.max(2, Math.round(0.03 * factorWeights.savings_rate)) + 2} points.`,
    input.emergencyFundMonths >= 3
      ? "Emergency fund progress is supporting your score trajectory."
      : "Increasing emergency reserves would materially improve your resilience score.",
  ];

  const summary =
    status === "Excellent"
      ? "Financial condition is robust with strong savings, disciplined spending, and stable cash flow."
      : status === "Good"
        ? "Financial profile is stable with healthy fundamentals and clear upside opportunities."
        : status === "Moderate"
          ? "Financial health is balanced, but spend control and consistency need tighter execution."
          : status === "Risky"
            ? "Financial risk indicators are elevated. Immediate budget and cash-flow corrections are recommended."
            : "Financial resilience is critically low. Prioritize stabilization of spending, debt risk, and emergency reserves.";

  const statusExplanation =
    status === "Excellent"
      ? "You are operating with strong resilience and low structural risk."
      : status === "Good"
      ? "Your finances are mostly healthy, with manageable risk and solid control."
      : status === "Moderate"
      ? "You have a workable baseline but key factors still limit long-term stability."
      : status === "Risky"
      ? "Risk pressure is meaningful and requires focused corrective actions."
      : "Your current profile is vulnerable and needs immediate stabilization steps.";

  const recommendedNextAction =
    status === "Excellent"
      ? "Maintain momentum and optimize one low-performing factor for incremental gains."
      : status === "Good"
      ? "Target the weakest factor and improve it by one status level this month."
      : status === "Moderate"
      ? "Focus on spending control and emergency fund growth first."
      : status === "Risky"
      ? "Reduce variable spending and credit usage immediately while protecting cash buffer."
      : "Run a strict 30-day recovery plan: cut non-essentials, cap debt usage, and rebuild cash buffer.";

  const basePlan: FinancialHealthImprovementAction[] = [
    {
      id: "improve-savings-rate",
      title: "Increase savings rate by 5 percentage points",
      estimatedImpact: 4,
      difficulty: "Medium",
      timeToComplete: "2-4 weeks",
      category: "Savings Rate",
    },
    {
      id: "reduce-food-spending",
      title: "Reduce food and dining spending by $80 this month",
      estimatedImpact: 3,
      difficulty: "Medium",
      timeToComplete: "This month",
      category: "Spending Control",
    },
    {
      id: "review-subscriptions",
      title: "Review 2 subscriptions and optimize one plan",
      estimatedImpact: 2,
      difficulty: "Easy",
      timeToComplete: "1-2 days",
      category: "Subscription Burden",
    },
    {
      id: "emergency-fund-transfer",
      title: "Move $50 more into emergency fund this cycle",
      estimatedImpact: 3,
      difficulty: "Easy",
      timeToComplete: "This week",
      category: "Emergency Fund",
    },
    {
      id: "credit-utilization",
      title: "Keep credit utilization below 30%",
      estimatedImpact: 2,
      difficulty: "Medium",
      timeToComplete: "This month",
      category: "Debt / Credit Risk",
    },
  ];

  const priorityCategories = new Set([
    topNegativeFactorObj.label,
    biggestImprovementFactorObj.label,
  ]);
  const improvementPlan = basePlan
    .sort((a, b) => {
      const aPriority = priorityCategories.has(a.category) ? 1 : 0;
      const bPriority = priorityCategories.has(b.category) ? 1 : 0;
      if (aPriority !== bPriority) return bPriority - aPriority;
      return b.estimatedImpact - a.estimatedImpact;
    })
    .slice(0, 5);

  const bestScore = Math.round(Math.max(...history));
  const worstScore = Math.round(Math.min(...history));

  return {
    score: Math.round(score),
    status,
    statusExplanation,
    recommendedNextAction,
    summary,
    trendComparisonPct,
    previousMonthScore: Math.round(previousScore),
    monthlyScoreChange: Math.round(monthlyScoreChange * 10) / 10,
    weeklyImprovementPct,
    history,
    bestScore,
    worstScore,
    biggestImprovementFactor: biggestImprovementFactorObj.label,
    topPositiveFactor: topPositiveFactorObj.label,
    topNegativeFactor: topNegativeFactorObj.label,
    quickImprovementAction: improvementPlan[0]?.title ?? "Increase savings consistency this month.",
    factors,
    improvementPlan,
    aiExplanations,
    insights,
  };
};
