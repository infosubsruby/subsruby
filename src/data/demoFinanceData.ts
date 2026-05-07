import { financeMockDataBundle } from "@/data/mock/financeMockData";

export const DEMO_DEFAULT_CURRENCY = financeMockDataBundle.profile.defaultCurrency;
export const DEMO_USER_NAME = financeMockDataBundle.profile.displayName;

export const DEMO_MONTHLY_INCOME = financeMockDataBundle.reports[0]?.income ?? 6200;
export const DEMO_MONTHLY_EXPENSES = financeMockDataBundle.reports[0]?.expenses ?? 4380;
export const DEMO_MONTHLY_SUBSCRIPTIONS = financeMockDataBundle.subscriptions.reduce(
  (sum, item) => sum + (item.billingCycle === "yearly" ? item.amount / 12 : item.amount),
  0
);
export const DEMO_GOAL_PROGRESS_PCT = Math.round(
  ((financeMockDataBundle.goals[0]?.currentAmount ?? 0) / Math.max(1, financeMockDataBundle.goals[0]?.targetAmount ?? 1)) * 100
);
export const DEMO_FINANCIAL_HEALTH_SCORE = financeMockDataBundle.financialHealth.score;
export const DEMO_HEALTH_PROFILE = {
  monthlyIncome: 2800,
  monthlyExpenses: 2050,
  monthlySavings: 420,
  monthlySubscriptions: 46,
  emergencyFundProgressPct: 64,
  budgetUsagePct: 82,
  debtRatioPct: 18,
  goalProgressAvgPct: 57,
} as const;

export const DEMO_CATEGORIES = [
  ...new Set([
    ...financeMockDataBundle.budgets.map((item) => item.categoryName),
    ...financeMockDataBundle.transactions.map((item) => item.category),
    "Subscriptions",
    "Savings",
    "Health",
    "Education",
  ]),
] as const;

export const DEMO_WALLETS = financeMockDataBundle.wallets.map((item) => item.name) as readonly string[];

export const DEMO_GOALS = [
  ...new Set([
    ...financeMockDataBundle.goals.map((item) => item.title),
    "New Laptop",
    "Travel Fund",
    "Tuition",
    "Investment Starter",
  ]),
] as const;

export type DemoTransaction = {
  merchant: string;
  category: (typeof DEMO_CATEGORIES)[number];
  amount: number;
  type: "income" | "expense";
  date: string;
};

export const DEMO_TRANSACTIONS: DemoTransaction[] = [
  ...financeMockDataBundle.transactions.map((item): DemoTransaction => ({
    merchant: item.merchant,
    category: (item.category as (typeof DEMO_CATEGORIES)[number]) ?? "Other",
    amount: item.amount,
    type: item.type === "income" ? "income" : "expense",
    date: item.date,
  })),
];
