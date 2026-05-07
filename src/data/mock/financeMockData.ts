import type {
  AIInsight,
  AppSettings,
  Budget,
  BudgetCategory,
  FeatureAccessEntry,
  FinancialHealthScore,
  Goal,
  MonthlyReport,
  OnboardingState,
  PricingPlan,
  RubyAIConversation,
  Subscription,
  SubscriptionPlan,
  Transaction,
  User,
  UserProfile,
  WalletAccount,
} from "@/domain/financeModels";

const now = "2026-05-01T10:00:00.000Z";

export const mockUser: User = {
  id: "user-1",
  email: "alex.carter@example.com",
  role: "user",
  createdAt: "2025-11-01T09:00:00.000Z",
  lastLoginAt: now,
};

export const mockUserProfile: UserProfile = {
  id: "profile-1",
  userId: "user-1",
  firstName: "Alex",
  lastName: "Carter",
  displayName: "Alex Carter",
  avatarUrl: null,
  locale: "en-US",
  defaultCurrency: "USD",
  timezone: "UTC",
  createdAt: "2025-11-01T09:00:00.000Z",
  updatedAt: now,
};

export const mockWallets: WalletAccount[] = [
  {
    id: "wallet-1",
    userId: "user-1",
    name: "Main Bank Account",
    type: "checking",
    balance: 4200,
    currency: "USD",
    provider: "Manual",
    isManual: true,
    lastSyncedAt: null,
    createdAt: "2025-11-01T09:00:00.000Z",
    updatedAt: now,
  },
  {
    id: "wallet-2",
    userId: "user-1",
    name: "Savings Account",
    type: "savings",
    balance: 8600,
    currency: "USD",
    provider: "Manual",
    isManual: true,
    lastSyncedAt: null,
    createdAt: "2025-11-02T09:00:00.000Z",
    updatedAt: now,
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: "tx-1",
    userId: "user-1",
    walletId: "wallet-1",
    merchant: "Salary",
    description: "Monthly salary",
    amount: 6200,
    currency: "USD",
    type: "income",
    category: "Income",
    date: "2026-04-01",
    tags: ["salary"],
    isRecurring: true,
    aiFlags: ["stable-income"],
    confidenceScore: 0.98,
    createdAt: "2026-04-01T08:00:00.000Z",
    updatedAt: "2026-04-01T08:00:00.000Z",
  },
  {
    id: "tx-2",
    userId: "user-1",
    walletId: "wallet-1",
    merchant: "Rent",
    description: "Apartment rent",
    amount: 1800,
    currency: "USD",
    type: "expense",
    category: "Housing",
    date: "2026-04-02",
    tags: ["fixed-cost"],
    isRecurring: true,
    aiFlags: ["high-impact"],
    confidenceScore: 0.95,
    createdAt: "2026-04-02T08:00:00.000Z",
    updatedAt: "2026-04-02T08:00:00.000Z",
  },
  {
    id: "tx-3",
    userId: "user-1",
    walletId: "wallet-1",
    merchant: "Grocery Store",
    description: "Weekly groceries",
    amount: 124,
    currency: "USD",
    type: "expense",
    category: "Food & Dining",
    date: "2026-04-04",
    tags: ["groceries"],
    isRecurring: false,
    aiFlags: [],
    confidenceScore: 0.9,
    createdAt: "2026-04-04T08:00:00.000Z",
    updatedAt: "2026-04-04T08:00:00.000Z",
  },
];

export const mockSubscriptions: Subscription[] = [
  {
    id: "sub-1",
    userId: "user-1",
    name: "Netflix",
    amount: 16,
    currency: "USD",
    billingCycle: "monthly",
    nextBillingDate: "2026-05-11",
    category: "Entertainment",
    status: "active",
    yearlyCost: 192,
    optimizationStatus: "monitor",
    aiRecommendation: "Consider annual plans if available to reduce yearly cost.",
    createdAt: "2026-01-10T08:00:00.000Z",
    updatedAt: now,
  },
  {
    id: "sub-2",
    userId: "user-1",
    name: "Spotify",
    amount: 11,
    currency: "USD",
    billingCycle: "monthly",
    nextBillingDate: "2026-05-10",
    category: "Entertainment",
    status: "active",
    yearlyCost: 132,
    optimizationStatus: "optimized",
    aiRecommendation: "Current subscription mix is healthy.",
    createdAt: "2026-01-10T08:00:00.000Z",
    updatedAt: now,
  },
];

export const mockGoals: Goal[] = [
  {
    id: "goal-1",
    userId: "user-1",
    title: "Emergency Fund",
    targetAmount: 12000,
    currentAmount: 5700,
    currency: "USD",
    deadline: "2027-01-01",
    status: "on-track",
    monthlyTarget: 600,
    predictedCompletionDate: "2026-12-15",
    priority: "high",
    createdAt: "2026-01-01T08:00:00.000Z",
    updatedAt: now,
  },
];

export const mockBudgetCategories: BudgetCategory[] = [
  {
    id: "cat-1",
    userId: "user-1",
    name: "Food & Dining",
    icon: "utensils",
    color: "#ef4444",
    createdAt: "2026-01-01T08:00:00.000Z",
    updatedAt: now,
  },
  {
    id: "cat-2",
    userId: "user-1",
    name: "Housing",
    icon: "home",
    color: "#f59e0b",
    createdAt: "2026-01-01T08:00:00.000Z",
    updatedAt: now,
  },
];

export const mockBudgets: Budget[] = [
  {
    id: "budget-1",
    userId: "user-1",
    categoryId: "cat-1",
    categoryName: "Food & Dining",
    limitAmount: 600,
    spentAmount: 410,
    currency: "USD",
    period: "monthly",
    createdAt: "2026-01-01T08:00:00.000Z",
    updatedAt: now,
  },
];

export const mockAIInsights: AIInsight[] = [
  {
    id: "insight-1",
    userId: "user-1",
    type: "spending-trend",
    title: "Food spending is 12% above your average",
    description: "Food & Dining is rising faster than expected this month.",
    severity: "warning",
    confidence: 0.86,
    financialImpact: -72,
    suggestedAction: "Reduce takeout to two days per week.",
    relatedEntityType: "budget",
    relatedEntityId: "budget-1",
    createdAt: now,
    resolvedAt: null,
  },
];

export const mockFinancialHealthScore: FinancialHealthScore = {
  id: "health-1",
  userId: "user-1",
  score: 78,
  status: "good",
  riskLevel: "medium",
  factors: [
    { key: "savings_rate", score: 72, weight: 0.2 },
    { key: "spending_control", score: 74, weight: 0.2 },
    { key: "subscription_burden", score: 86, weight: 0.15 },
  ],
  generatedAt: now,
};

export const mockReports: MonthlyReport[] = [
  {
    id: "report-2026-04",
    userId: "user-1",
    monthKey: "2026-04",
    income: 6200,
    expenses: 4380,
    netCashFlow: 1820,
    savingsRate: 29.35,
    topCategories: [
      { category: "Housing", amount: 1800 },
      { category: "Food & Dining", amount: 610 },
    ],
    summary: "Strong savings month with stable recurring cost profile.",
    generatedAt: now,
  },
];

export const mockRubyAIConversations: RubyAIConversation[] = [
  {
    id: "conv-1",
    userId: "user-1",
    title: "April Spending Review",
    contextTag: "monthly-report",
    createdAt: "2026-04-30T20:00:00.000Z",
    updatedAt: now,
    messages: [
      {
        id: "msg-1",
        conversationId: "conv-1",
        role: "user",
        content: "How can I save more next month?",
        createdAt: "2026-04-30T20:01:00.000Z",
        metadata: {},
      },
      {
        id: "msg-2",
        conversationId: "conv-1",
        role: "assistant",
        content: "Reduce food delivery frequency and automate an extra $100 savings transfer.",
        createdAt: "2026-04-30T20:01:05.000Z",
        metadata: { confidence: 0.88 },
      },
    ],
  },
];

export const mockPricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    description: "Core tracking with basic insights.",
    features: ["Manual tracking", "Basic goals", "Limited insights"],
  },
  {
    id: "pro",
    name: "Ruby AI Pro",
    priceMonthly: 6.99,
    priceYearly: 59,
    description: "Predictive intelligence and advanced planning.",
    features: ["Advanced AI insights", "Predictive finance", "Monthly reports"],
  },
];

export const mockSubscriptionPlans: SubscriptionPlan[] = mockPricingPlans.map((plan) => ({
  ...plan,
  recommended: plan.id === "pro",
  ctaLabel: plan.id === "pro" ? "Upgrade to Pro" : "Current plan",
}));

export const mockFeatureAccess: FeatureAccessEntry[] = [
  { featureKey: "advanced_ai_insights", access: "locked", reason: "Available in Pro" },
  { featureKey: "monthly_reports", access: "limited", reason: "Preview on Free" },
  { featureKey: "basic_dashboard", access: "available", reason: "Included in Free" },
];

export const mockAppSettings: AppSettings = {
  userId: "user-1",
  defaultCurrency: "USD",
  locale: "en-US",
  theme: "dark",
  compactMode: false,
  notifications: {
    push: true,
    email: true,
    weeklyDigest: true,
  },
  updatedAt: now,
};

export const mockOnboardingState: OnboardingState = {
  userId: "user-1",
  completed: true,
  step: 8,
  preferredCurrency: "USD",
  monthlyIncome: 6200,
  monthlySavingsTarget: 1200,
  selectedCategories: ["Food & Dining", "Housing", "Subscriptions", "Savings"],
  rubyFocus: ["saving_money", "budgeting_better"],
  completedAt: "2026-02-01T08:00:00.000Z",
};

export const financeMockDataBundle = {
  user: mockUser,
  profile: mockUserProfile,
  wallets: mockWallets,
  transactions: mockTransactions,
  subscriptions: mockSubscriptions,
  goals: mockGoals,
  budgetCategories: mockBudgetCategories,
  budgets: mockBudgets,
  aiInsights: mockAIInsights,
  financialHealth: mockFinancialHealthScore,
  reports: mockReports,
  rubyAIConversations: mockRubyAIConversations,
  pricingPlans: mockPricingPlans,
  subscriptionPlans: mockSubscriptionPlans,
  featureAccess: mockFeatureAccess,
  appSettings: mockAppSettings,
  onboarding: mockOnboardingState,
};
