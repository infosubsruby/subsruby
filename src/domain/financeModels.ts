import type {
  BillingCycle,
  FeatureAccess,
  GoalStatus,
  HealthStatus,
  PlanType,
  RiskLevel,
  SeverityLevel,
  TransactionType,
} from "@/types/common";

export type CurrencyCode = string;

export interface User {
  id: string;
  email: string;
  role: "user" | "admin" | "moderator";
  createdAt: string;
  lastLoginAt: string | null;
}

export interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl: string | null;
  locale: string;
  defaultCurrency: CurrencyCode;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export type WalletType = "checking" | "savings" | "credit" | "cash" | "crypto" | "investment" | "custom";

export interface WalletAccount {
  id: string;
  userId: string;
  name: string;
  type: WalletType;
  balance: number;
  currency: CurrencyCode;
  provider: string;
  isManual: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  merchant: string;
  description: string;
  amount: number;
  currency: CurrencyCode;
  type: TransactionType;
  category: string;
  date: string;
  tags: string[];
  isRecurring: boolean;
  aiFlags: string[];
  confidenceScore: number;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionStatus = "active" | "paused" | "cancelled" | "trial";
export type OptimizationStatus = "optimized" | "monitor" | "high-cost" | "review";

export interface Subscription {
  id: string;
  userId: string;
  name: string;
  amount: number;
  currency: CurrencyCode;
  billingCycle: BillingCycle;
  nextBillingDate: string;
  category: string;
  status: SubscriptionStatus;
  yearlyCost: number;
  optimizationStatus: OptimizationStatus;
  aiRecommendation: string;
  createdAt: string;
  updatedAt: string;
}

export type GoalPriority = "low" | "medium" | "high";

export interface Goal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  currency: CurrencyCode;
  deadline: string | null;
  status: GoalStatus;
  monthlyTarget: number;
  predictedCompletionDate: string | null;
  aiRecommendation?: string | null;
  priority: GoalPriority;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetCategory {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  categoryName: string;
  limitAmount: number;
  spentAmount: number;
  currency: CurrencyCode;
  period: "monthly" | "weekly";
  createdAt: string;
  updatedAt: string;
}

export interface AIInsight {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  confidence: number;
  financialImpact: number;
  suggestedAction: string;
  relatedEntityType: "transaction" | "subscription" | "goal" | "budget" | "wallet" | "report";
  relatedEntityId: string | null;
  isResolved: boolean;
  createdAt: string;
  resolvedAt: string | null;
  updatedAt: string;
}

export interface FinancialHealthScore {
  id: string;
  userId: string;
  score: number;
  status: HealthStatus;
  riskLevel: RiskLevel;
  factors: Array<{ key: string; score: number; weight: number }>;
  generatedAt: string;
}

export interface MonthlyReport {
  id: string;
  userId: string;
  monthKey: string;
  income: number;
  expenses: number;
  netCashFlow: number;
  savingsRate: number;
  topCategories: Array<{ category: string; amount: number }>;
  summary: string;
  generatedAt: string;
}

export type RubyAIMessageRole = "user" | "assistant" | "system";

export interface RubyAIMessage {
  id: string;
  conversationId: string;
  role: RubyAIMessageRole;
  content: string;
  createdAt: string;
  metadata: Record<string, string | number | boolean | null>;
}

export interface RubyAIConversation {
  id: string;
  userId: string;
  title: string;
  contextTag: string;
  createdAt: string;
  updatedAt: string;
  messages: RubyAIMessage[];
}

export interface PricingPlan {
  id: PlanType;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  description: string;
  features: string[];
}

export interface SubscriptionPlan extends PricingPlan {
  recommended: boolean;
  ctaLabel: string;
}

export interface FeatureAccessEntry {
  featureKey: string;
  access: FeatureAccess;
  reason: string;
}

export interface AppSettings {
  userId: string;
  defaultCurrency: CurrencyCode;
  locale: string;
  theme: "dark" | "system";
  compactMode: boolean;
  notifications: {
    push: boolean;
    email: boolean;
    weeklyDigest: boolean;
  };
  updatedAt: string;
}

export interface OnboardingState {
  userId: string;
  completed: boolean;
  step: number;
  preferredCurrency: CurrencyCode;
  monthlyIncome: number;
  monthlySavingsTarget: number;
  selectedCategories: string[];
  rubyFocus: string[];
  completedAt: string | null;
}
