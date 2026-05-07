export const DEMO_DEFAULT_CURRENCY = "USD" as const;
export const DEMO_USER_NAME = "Alex Carter";

export const DEMO_MONTHLY_INCOME = 6200;
export const DEMO_MONTHLY_EXPENSES = 4380;
export const DEMO_MONTHLY_SUBSCRIPTIONS = 86;
export const DEMO_GOAL_PROGRESS_PCT = 47;
export const DEMO_FINANCIAL_HEALTH_SCORE = 78;

export const DEMO_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Subscriptions",
  "Housing",
  "Income",
  "Savings",
  "Entertainment",
  "Health",
  "Education",
] as const;

export const DEMO_WALLETS = [
  "Cash Wallet",
  "Main Bank Account",
  "Savings Account",
  "Credit Card",
  "Crypto Wallet",
] as const;

export const DEMO_GOALS = [
  "Emergency Fund",
  "New Laptop",
  "Travel Fund",
  "Tuition",
  "Investment Starter",
] as const;

export type DemoTransaction = {
  merchant: string;
  category: (typeof DEMO_CATEGORIES)[number];
  amount: number;
  type: "income" | "expense";
  date: string;
};

export const DEMO_TRANSACTIONS: DemoTransaction[] = [
  { merchant: "Salary", category: "Income", amount: 6200, type: "income", date: "2026-04-01" },
  { merchant: "Rent", category: "Housing", amount: 1800, type: "expense", date: "2026-04-02" },
  { merchant: "Grocery Store", category: "Food & Dining", amount: 124, type: "expense", date: "2026-04-04" },
  { merchant: "Starbucks Coffee", category: "Food & Dining", amount: 9, type: "expense", date: "2026-04-05" },
  { merchant: "Uber Ride", category: "Transportation", amount: 27, type: "expense", date: "2026-04-07" },
  { merchant: "Spotify", category: "Subscriptions", amount: 11, type: "expense", date: "2026-04-10" },
  { merchant: "Netflix", category: "Subscriptions", amount: 16, type: "expense", date: "2026-04-11" },
  { merchant: "Amazon", category: "Shopping", amount: 82, type: "expense", date: "2026-04-14" },
  { merchant: "Apple Music", category: "Entertainment", amount: 11, type: "expense", date: "2026-04-15" },
];
