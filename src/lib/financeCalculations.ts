import type {
  Budget,
  FinancialHealthScore,
  Goal,
  MonthlyReport,
  Subscription,
  Transaction,
} from "@/domain/financeModels";

const toSafeNumber = (value: number) => (Number.isFinite(value) ? value : 0);

export const calculateTotalIncome = (transactions: Transaction[]): number =>
  transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + toSafeNumber(item.amount), 0);

export const calculateTotalExpenses = (transactions: Transaction[]): number =>
  transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + toSafeNumber(item.amount), 0);

export const calculateNetCashFlow = (transactions: Transaction[]): number =>
  calculateTotalIncome(transactions) - calculateTotalExpenses(transactions);

export const calculateSavingsRate = (transactions: Transaction[]): number => {
  const income = calculateTotalIncome(transactions);
  if (income <= 0) return 0;
  return (calculateNetCashFlow(transactions) / income) * 100;
};

export const calculateSafeToSpend = (transactions: Transaction[], remainingDaysInMonth: number): number => {
  const safeDays = Math.max(1, remainingDaysInMonth);
  return calculateNetCashFlow(transactions) / safeDays;
};

export const calculateSubscriptionBurden = (subscriptions: Subscription[], monthlyIncome: number): number => {
  if (monthlyIncome <= 0) return 0;
  const monthlySubCost = subscriptions.reduce((sum, sub) => {
    const amount = toSafeNumber(sub.amount);
    return sum + (sub.billingCycle === "yearly" ? amount / 12 : amount);
  }, 0);
  return (monthlySubCost / monthlyIncome) * 100;
};

export const calculateYearlySubscriptionCost = (subscriptions: Subscription[]): number =>
  subscriptions.reduce((sum, sub) => sum + toSafeNumber(sub.yearlyCost), 0);

export const calculateGoalProgressPercentage = (goal: Goal): number => {
  if (goal.targetAmount <= 0) return 0;
  return Math.min(100, (toSafeNumber(goal.currentAmount) / goal.targetAmount) * 100);
};

export const predictGoalCompletion = (goal: Goal, monthlyContribution: number): string | null => {
  const remaining = goal.targetAmount - toSafeNumber(goal.currentAmount);
  if (remaining <= 0) return new Date().toISOString().slice(0, 10);
  if (monthlyContribution <= 0) return null;
  const monthsRequired = Math.ceil(remaining / monthlyContribution);
  const projectedDate = new Date();
  projectedDate.setMonth(projectedDate.getMonth() + monthsRequired);
  return projectedDate.toISOString().slice(0, 10);
};

export const calculateBudgetUsagePercentage = (budget: Budget): number => {
  if (budget.limitAmount <= 0) return 0;
  return Math.min(100, (toSafeNumber(budget.spentAmount) / budget.limitAmount) * 100);
};

export const calculateHealthScore = (input: {
  savingsRate: number;
  subscriptionBurden: number;
  averageBudgetUsage: number;
}): FinancialHealthScore["score"] => {
  const savingsFactor = Math.min(100, Math.max(0, input.savingsRate * 4));
  const burdenPenalty = Math.min(35, Math.max(0, input.subscriptionBurden * 1.4));
  const budgetPenalty = Math.min(25, Math.max(0, input.averageBudgetUsage - 75));
  return Math.max(0, Math.min(100, Math.round(savingsFactor + 45 - burdenPenalty - budgetPenalty)));
};

export const summarizeMonthlyReport = (report: MonthlyReport): string =>
  `${report.monthKey}: income ${report.income.toFixed(0)}, expenses ${report.expenses.toFixed(0)}, savings rate ${report.savingsRate.toFixed(1)}%.`;

export const calculateCategorySpendingTotals = (
  transactions: Transaction[]
): Array<{ category: string; amount: number }> => {
  const map: Record<string, number> = {};
  transactions
    .filter((item) => item.type === "expense")
    .forEach((item) => {
      map[item.category] = (map[item.category] ?? 0) + toSafeNumber(item.amount);
    });

  return Object.entries(map)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
};

export const detectTransactionAnomaliesPlaceholder = (transactions: Transaction[]): Transaction[] => {
  const averageExpense =
    calculateTotalExpenses(transactions) /
    Math.max(1, transactions.filter((item) => item.type === "expense").length);
  return transactions.filter((item) => item.type === "expense" && item.amount > averageExpense * 2.5);
};

export const detectRecurringTransactionsPlaceholder = (transactions: Transaction[]): Transaction[] => {
  const seen: Record<string, number> = {};
  transactions.forEach((item) => {
    const key = `${item.merchant}-${item.amount}-${item.category}`;
    seen[key] = (seen[key] ?? 0) + 1;
  });
  return transactions.filter((item) => {
    const key = `${item.merchant}-${item.amount}-${item.category}`;
    return (seen[key] ?? 0) >= 2 || item.isRecurring;
  });
};
