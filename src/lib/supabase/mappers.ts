import type { AIInsight, Goal, Subscription, Transaction, WalletAccount } from "@/domain/financeModels";
import type { DbInsert, DbRow, Json } from "@/lib/supabase/types";

const toSafeNumber = (value: number | null | undefined): number => (Number.isFinite(value) ? Number(value) : 0);

const mapJsonToStringArray = (value: Json | null | undefined): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
};

const ensureTransactionType = (value: string): Transaction["type"] => {
  if (value === "income" || value === "expense" || value === "transfer") return value;
  return "expense";
};

export const mapDbTransactionToTransaction = (row: DbRow<"transactions">): Transaction => ({
  id: row.id,
  userId: row.user_id,
  walletId: row.wallet_id,
  merchant: row.merchant ?? "",
  description: row.description,
  amount: toSafeNumber(row.amount),
  currency: row.currency,
  type: ensureTransactionType(row.type),
  category: row.category_name,
  date: row.date,
  tags: row.tags ?? [],
  isRecurring: row.is_recurring,
  aiFlags: mapJsonToStringArray(row.ai_flags),
  confidenceScore: toSafeNumber(row.confidence_score),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapTransactionToDbInsert = (transaction: Transaction): DbInsert<"transactions"> => ({
  user_id: transaction.userId,
  wallet_id: transaction.walletId,
  merchant: transaction.merchant || null,
  description: transaction.description,
  amount: transaction.amount,
  currency: transaction.currency,
  type: transaction.type,
  category_name: transaction.category,
  date: transaction.date,
  tags: transaction.tags,
  is_recurring: transaction.isRecurring,
  ai_flags: transaction.aiFlags,
  confidence_score: transaction.confidenceScore,
  created_at: transaction.createdAt,
  updated_at: transaction.updatedAt,
});

export const mapDbSubscriptionToSubscription = (row: DbRow<"subscriptions">): Subscription => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  amount: toSafeNumber(row.amount),
  currency: row.currency,
  billingCycle: row.billing_cycle,
  nextBillingDate: row.next_billing_date,
  category: row.category_name,
  status: row.status,
  yearlyCost: toSafeNumber(row.yearly_cost),
  optimizationStatus:
    row.optimization_status === "optimized" ||
    row.optimization_status === "monitor" ||
    row.optimization_status === "high-cost" ||
    row.optimization_status === "review"
      ? row.optimization_status
      : "monitor",
  aiRecommendation: row.ai_recommendation ?? "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapDbGoalToGoal = (row: DbRow<"goals">): Goal => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  targetAmount: toSafeNumber(row.target_amount),
  currentAmount: toSafeNumber(row.current_amount),
  currency: row.currency,
  deadline: row.deadline,
  status:
    row.status === "on_track"
      ? "on-track"
      : row.status === "ahead"
      ? "ahead"
      : row.status === "behind"
      ? "behind"
      : row.status === "completed"
      ? "completed"
      : "behind",
  monthlyTarget: toSafeNumber(row.monthly_target),
  predictedCompletionDate: row.predicted_completion_date,
  priority: row.priority === "high" || row.priority === "medium" || row.priority === "low" ? row.priority : "medium",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapDbWalletToWallet = (row: DbRow<"wallets">): WalletAccount => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  type:
    row.type === "bank"
      ? "checking"
      : row.type === "credit_card"
      ? "credit"
      : row.type === "savings" || row.type === "cash" || row.type === "crypto" || row.type === "investment"
      ? row.type
      : "checking",
  balance: toSafeNumber(row.balance),
  currency: row.currency,
  provider: row.provider ?? "Manual",
  isManual: row.is_manual,
  lastSyncedAt: row.last_synced_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapDbAIInsightToAIInsight = (row: DbRow<"ai_insights">): AIInsight => ({
  id: row.id,
  userId: row.user_id,
  type: row.type,
  title: row.title,
  description: row.description,
  severity: row.severity,
  confidence: toSafeNumber(row.confidence),
  financialImpact: row.financial_impact ?? 0,
  suggestedAction: row.suggested_action ?? "",
  relatedEntityType:
    row.related_entity_type === "transaction" ||
    row.related_entity_type === "subscription" ||
    row.related_entity_type === "goal" ||
    row.related_entity_type === "budget" ||
    row.related_entity_type === "wallet" ||
    row.related_entity_type === "report"
      ? row.related_entity_type
      : "report",
  relatedEntityId: row.related_entity_id,
  createdAt: row.created_at,
  resolvedAt: row.resolved_at,
});
