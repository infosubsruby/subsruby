import type {
  AIInsight,
  FinancialHealthSnapshotRecord,
  Goal,
  MonthlyReportGoalProgress,
  MonthlyReportRecord,
  MonthlyReportRecommendedAction,
  MonthlyReportSubscriptionImpact,
  MonthlyReportTopCategory,
  RubyAIConversation,
  RubyAIMessage,
  RubyAIMessageMetadata,
  RubyAIMessageRole,
  Subscription,
  Transaction,
  WalletAccount,
} from "@/domain/financeModels";
import type { Database } from "@/integrations/supabase/types";
import type { Json } from "@/integrations/supabase/types";

type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];
type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];
type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];
type SubscriptionInsert = Database["public"]["Tables"]["subscriptions"]["Insert"];
type FinancialHealthHistoryRow = Database["public"]["Tables"]["financial_health_history"]["Row"];
type FinancialHealthHistoryInsert = Database["public"]["Tables"]["financial_health_history"]["Insert"];

const toSafeNumber = (value: number | null | undefined): number => (Number.isFinite(value) ? Number(value) : 0);

const mapJsonToStringArray = (value: Json | null | undefined): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
};

const ensureTransactionType = (value: string): Transaction["type"] => {
  if (value === "income" || value === "expense" || value === "transfer") return value;
  return "expense";
};

export const mapDbTransactionToTransaction = (row: TransactionRow): Transaction => ({
  id: row.id,
  userId: row.user_id,
  walletId: "",
  merchant: "",
  description: row.description,
  amount: toSafeNumber(row.amount),
  currency: "USD",
  type: ensureTransactionType(row.type),
  category: row.category,
  date: row.date,
  tags: [],
  isRecurring: false,
  aiFlags: [],
  confidenceScore: 0,
  createdAt: row.created_at,
  updatedAt: row.created_at,
});

export const mapTransactionToDbInsert = (transaction: Transaction): TransactionInsert => ({
  id: transaction.id,
  user_id: transaction.userId,
  description: transaction.description || null,
  amount: transaction.amount,
  type: transaction.type,
  category: transaction.category,
  date: transaction.date,
  created_at: transaction.createdAt,
});

const toBillingCycle = (value: string | null): "weekly" | "monthly" | "yearly" => {
  if (value === "weekly" || value === "monthly" || value === "yearly") return value;
  return "monthly";
};

export const mapDbSubscriptionToSubscription = (row: SubscriptionRow): Subscription => ({
  id: String(row.id),
  userId: row.user_id,
  name: row.name,
  amount: toSafeNumber(row.price),
  currency: row.currency ?? "USD",
  billingCycle: toBillingCycle(row.billing_cycle),
  nextBillingDate: row.next_payment_date ?? row.start_date,
  category: "Subscriptions",
  status: "active",
  yearlyCost: toSafeNumber(row.price) * 12,
  optimizationStatus: "monitor",
  aiRecommendation: "",
  createdAt: row.created_at,
  updatedAt: row.created_at,
});

const toSlug = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "subscription";

export const mapSubscriptionToDbInsert = (subscription: Subscription): SubscriptionInsert => ({
  user_id: subscription.userId,
  name: subscription.name,
  slug: toSlug(subscription.name),
  price: subscription.amount,
  currency: subscription.currency,
  billing_cycle: subscription.billingCycle,
  start_date: subscription.createdAt.slice(0, 10),
  next_payment_date: subscription.nextBillingDate,
  website_url: null,
  card_color: "#E50914",
  country_code: null,
  created_at: subscription.createdAt,
});

type GoalRowLike = {
  id: string;
  user_id: string;
  title: string;
  ai_recommendation: string | null;
  target_amount: number | null;
  current_amount: number | null;
  currency: string;
  deadline: string | null;
  status: string;
  monthly_target: number | null;
  predicted_completion_date: string | null;
  priority: string;
  created_at: string;
  updated_at: string;
};

type GoalInsertLike = {
  user_id: string;
  title: string;
  ai_recommendation: string | null;
  target_amount: number;
  current_amount: number;
  currency: string;
  deadline: string | null;
  status: DbGoalStatus;
  monthly_target: number;
  predicted_completion_date: string | null;
  priority: string;
  created_at: string;
  updated_at: string;
};

type WalletRowLike = {
  id: string;
  user_id: string;
  name: string;
  type: string;
  balance: number | null;
  currency: string;
  provider: string | null;
  is_manual: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

type WalletInsertLike = {
  user_id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  provider: string;
  is_manual: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

type DbGoalStatus = "on_track" | "ahead" | "behind" | "completed" | "paused";
type FrontendGoalStatus = Goal["status"];

export const mapGoalStatusToDbStatus = (status: FrontendGoalStatus): DbGoalStatus => {
  switch (status) {
    case "on-track":
      return "on_track";
    case "ahead":
      return "ahead";
    case "behind":
      return "behind";
    case "completed":
      return "completed";
    default:
      return "behind";
  }
};

export const mapDbGoalStatusToGoalStatus = (status: string | null | undefined): FrontendGoalStatus => {
  switch (status) {
    case "on_track":
      return "on-track";
    case "ahead":
      return "ahead";
    case "behind":
      return "behind";
    case "completed":
      return "completed";
    case "paused":
      return "behind";
    default:
      return "behind";
  }
};

export const mapDbGoalToGoal = (row: GoalRowLike): Goal => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  aiRecommendation: row.ai_recommendation,
  targetAmount: toSafeNumber(row.target_amount),
  currentAmount: toSafeNumber(row.current_amount),
  currency: row.currency,
  deadline: row.deadline,
  status: mapDbGoalStatusToGoalStatus(row.status),
  monthlyTarget: toSafeNumber(row.monthly_target),
  predictedCompletionDate: row.predicted_completion_date,
  priority: row.priority === "high" || row.priority === "medium" || row.priority === "low" ? row.priority : "medium",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapGoalToDbInsert = (goal: Goal): GoalInsertLike => ({
  user_id: goal.userId,
  title: goal.title,
  ai_recommendation: goal.aiRecommendation ?? null,
  target_amount: goal.targetAmount,
  current_amount: goal.currentAmount,
  currency: goal.currency,
  deadline: goal.deadline,
  status: mapGoalStatusToDbStatus(goal.status),
  monthly_target: goal.monthlyTarget,
  predicted_completion_date: goal.predictedCompletionDate,
  priority: goal.priority,
  created_at: goal.createdAt,
  updated_at: goal.updatedAt,
});

export const mapDbWalletToWallet = (row: WalletRowLike): WalletAccount => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  type:
    row.type === "bank"
      ? "checking"
      : row.type === "credit_card"
      ? "credit"
      : row.type === "savings" ||
        row.type === "cash" ||
        row.type === "crypto" ||
        row.type === "investment" ||
        row.type === "custom"
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

export const mapWalletToDbInsert = (wallet: WalletAccount): WalletInsertLike => ({
  user_id: wallet.userId,
  name: wallet.name,
  type:
    wallet.type === "checking"
      ? "bank"
      : wallet.type === "credit"
      ? "credit_card"
      : wallet.type,
  balance: wallet.balance,
  currency: wallet.currency,
  provider: wallet.provider,
  is_manual: wallet.isManual,
  last_synced_at: wallet.lastSyncedAt,
  created_at: wallet.createdAt,
  updated_at: wallet.updatedAt,
});

type AIInsightRow = Database["public"]["Tables"]["ai_insights"]["Row"];
type AIInsightInsert = Database["public"]["Tables"]["ai_insights"]["Insert"];
type AIInsightUpdate = Database["public"]["Tables"]["ai_insights"]["Update"];

const normalizeInsightSeverity = (value: string | null | undefined): AIInsight["severity"] => {
  if (value === "info" || value === "success" || value === "warning" || value === "critical") return value;
  return "info";
};

const normalizeRelatedEntityType = (value: string | null | undefined): AIInsight["relatedEntityType"] => {
  if (
    value === "transaction" ||
    value === "subscription" ||
    value === "goal" ||
    value === "budget" ||
    value === "wallet" ||
    value === "report"
  ) {
    return value;
  }
  return "report";
};

export const mapDbAIInsightToAIInsight = (row: AIInsightRow): AIInsight => ({
  id: row.id,
  userId: row.user_id,
  type: row.type,
  title: row.title,
  description: row.description,
  severity: normalizeInsightSeverity(row.severity),
  confidence: toSafeNumber(row.confidence),
  financialImpact: row.financial_impact ?? 0,
  suggestedAction: row.suggested_action ?? "",
  relatedEntityType: normalizeRelatedEntityType(row.related_entity_type),
  relatedEntityId: row.related_entity_id,
  isResolved: Boolean(row.is_resolved),
  createdAt: row.created_at,
  resolvedAt: row.resolved_at,
  updatedAt: row.updated_at,
});

export const mapAIInsightToDbInsert = (insight: AIInsight): AIInsightInsert => ({
  id: insight.id,
  user_id: insight.userId,
  type: insight.type,
  title: insight.title,
  description: insight.description,
  severity: normalizeInsightSeverity(insight.severity),
  confidence: insight.confidence,
  financial_impact: insight.financialImpact,
  suggested_action: insight.suggestedAction || null,
  related_entity_type: insight.relatedEntityType,
  related_entity_id: insight.relatedEntityId,
  is_resolved: insight.isResolved,
  resolved_at: insight.resolvedAt,
  created_at: insight.createdAt,
  updated_at: insight.updatedAt,
});

export const mapAIInsightToDbUpdate = (input: Partial<AIInsight>): AIInsightUpdate => {
  const update: AIInsightUpdate = {};
  if (input.userId) update.user_id = input.userId;
  if (typeof input.type === "string") update.type = input.type;
  if (typeof input.title === "string") update.title = input.title;
  if (typeof input.description === "string") update.description = input.description;
  if (input.severity !== undefined) update.severity = normalizeInsightSeverity(input.severity);
  if (typeof input.confidence === "number") update.confidence = input.confidence;
  if (input.financialImpact !== undefined) update.financial_impact = input.financialImpact;
  if (input.suggestedAction !== undefined) update.suggested_action = input.suggestedAction || null;
  if (input.relatedEntityType !== undefined) update.related_entity_type = input.relatedEntityType;
  if (input.relatedEntityId !== undefined) update.related_entity_id = input.relatedEntityId;
  if (typeof input.isResolved === "boolean") update.is_resolved = input.isResolved;
  if (input.resolvedAt !== undefined) update.resolved_at = input.resolvedAt;
  update.updated_at = new Date().toISOString();
  return update;
};

type MonthlyReportRow = Database["public"]["Tables"]["monthly_reports"]["Row"];
type MonthlyReportInsert = Database["public"]["Tables"]["monthly_reports"]["Insert"];
type MonthlyReportUpdate = Database["public"]["Tables"]["monthly_reports"]["Update"];

const isJsonObject = (value: Json | null | undefined): value is Record<string, Json> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const mapJsonToTopCategories = (value: Json | null | undefined): MonthlyReportTopCategory[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): MonthlyReportTopCategory | null => {
      if (!isJsonObject(item)) return null;
      const category = typeof item.category === "string" ? item.category : "";
      const amount = typeof item.amount === "number" ? item.amount : 0;
      const percentageOfExpenses = typeof item.percentageOfExpenses === "number" ? item.percentageOfExpenses : undefined;
      if (!category) return null;
      return { category, amount, percentageOfExpenses };
    })
    .filter((item): item is MonthlyReportTopCategory => Boolean(item));
};

const mapJsonToSubscriptionImpact = (value: Json | null | undefined): MonthlyReportSubscriptionImpact => {
  if (!isJsonObject(value)) return { count: 0, monthlyCost: 0, yearlyCost: 0 };
  return {
    count: typeof value.count === "number" ? value.count : 0,
    monthlyCost: typeof value.monthlyCost === "number" ? value.monthlyCost : 0,
    yearlyCost: typeof value.yearlyCost === "number" ? value.yearlyCost : 0,
  };
};

const mapJsonToGoalProgress = (value: Json | null | undefined): MonthlyReportGoalProgress => {
  if (!isJsonObject(value)) return { goalsCount: 0, averageProgressPct: 0 };
  return {
    goalsCount: typeof value.goalsCount === "number" ? value.goalsCount : 0,
    averageProgressPct: typeof value.averageProgressPct === "number" ? value.averageProgressPct : 0,
  };
};

const mapJsonToRecommendedActions = (value: Json | null | undefined): MonthlyReportRecommendedAction[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): MonthlyReportRecommendedAction | null => {
      if (!isJsonObject(item)) return null;
      const title = typeof item.title === "string" ? item.title : "";
      const action = typeof item.action === "string" ? item.action : "";
      const expectedImpact = typeof item.expectedImpact === "string" ? item.expectedImpact : undefined;
      if (!title || !action) return null;
      return { title, action, expectedImpact };
    })
    .filter((item): item is MonthlyReportRecommendedAction => Boolean(item));
};

export const mapDbMonthlyReportToMonthlyReport = (row: MonthlyReportRow): MonthlyReportRecord => ({
  id: row.id,
  userId: row.user_id,
  month: row.month,
  totalIncome: toSafeNumber(row.total_income),
  totalExpenses: toSafeNumber(row.total_expenses),
  netSavings: toSafeNumber(row.net_savings),
  savingsRate: toSafeNumber(row.savings_rate),
  healthScore: toSafeNumber(row.health_score),
  previousHealthScore: row.previous_health_score ?? null,
  topCategories: mapJsonToTopCategories(row.top_categories),
  subscriptionImpact: mapJsonToSubscriptionImpact(row.subscription_impact),
  goalProgress: mapJsonToGoalProgress(row.goal_progress),
  aiSummary: row.ai_summary,
  recommendedActions: mapJsonToRecommendedActions(row.recommended_actions),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const mapMonthlyReportToDbInsert = (report: MonthlyReportRecord): MonthlyReportInsert => ({
  user_id: report.userId,
  month: report.month,
  total_income: report.totalIncome,
  total_expenses: report.totalExpenses,
  net_savings: report.netSavings,
  savings_rate: report.savingsRate,
  health_score: report.healthScore,
  previous_health_score: report.previousHealthScore,
  top_categories: report.topCategories as unknown as Json,
  subscription_impact: report.subscriptionImpact as unknown as Json,
  goal_progress: report.goalProgress as unknown as Json,
  ai_summary: report.aiSummary,
  recommended_actions: report.recommendedActions as unknown as Json,
  created_at: report.createdAt,
  updated_at: report.updatedAt,
});

export const mapMonthlyReportToDbUpdate = (input: Partial<MonthlyReportRecord>): MonthlyReportUpdate => {
  const update: MonthlyReportUpdate = {};
  if (typeof input.userId === "string") update.user_id = input.userId;
  if (typeof input.month === "string") update.month = input.month;
  if (typeof input.totalIncome === "number") update.total_income = input.totalIncome;
  if (typeof input.totalExpenses === "number") update.total_expenses = input.totalExpenses;
  if (typeof input.netSavings === "number") update.net_savings = input.netSavings;
  if (typeof input.savingsRate === "number") update.savings_rate = input.savingsRate;
  if (typeof input.healthScore === "number") update.health_score = input.healthScore;
  if (input.previousHealthScore !== undefined) update.previous_health_score = input.previousHealthScore;
  if (input.topCategories) update.top_categories = input.topCategories as unknown as Json;
  if (input.subscriptionImpact) update.subscription_impact = input.subscriptionImpact as unknown as Json;
  if (input.goalProgress) update.goal_progress = input.goalProgress as unknown as Json;
  if (typeof input.aiSummary === "string") update.ai_summary = input.aiSummary;
  if (input.recommendedActions) update.recommended_actions = input.recommendedActions as unknown as Json;
  update.updated_at = new Date().toISOString();
  return update;
};

type RubyAIConversationRow = Database["public"]["Tables"]["ruby_ai_conversations"]["Row"];
type RubyAIConversationInsert = Database["public"]["Tables"]["ruby_ai_conversations"]["Insert"];

type RubyAIMessageRow = Database["public"]["Tables"]["ruby_ai_messages"]["Row"];
type RubyAIMessageInsert = Database["public"]["Tables"]["ruby_ai_messages"]["Insert"];

const ensureRubyAIRole = (value: string): RubyAIMessageRole => {
  if (value === "user" || value === "assistant" || value === "system") return value;
  return "assistant";
};

const mapJsonToRubyAIMessageMetadata = (value: Json | null | undefined): RubyAIMessageMetadata => {
  if (value === undefined) return null;
  if (value === null) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map((item) => mapJsonToRubyAIMessageMetadata(item));
  const out: Record<string, RubyAIMessageMetadata> = {};
  for (const [key, raw] of Object.entries(value as Record<string, Json>)) {
    if (raw === undefined) continue;
    out[key] = mapJsonToRubyAIMessageMetadata(raw);
  }
  return out;
};

const mapRubyAIMessageMetadataToJson = (value: RubyAIMessageMetadata | undefined): Json => {
  if (value === undefined || value === null) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map((item) => mapRubyAIMessageMetadataToJson(item));
  const out: Record<string, Json> = {};
  for (const [key, raw] of Object.entries(value)) {
    out[key] = mapRubyAIMessageMetadataToJson(raw);
  }
  return out;
};

export const mapDbRubyAIConversationToConversation = (row: RubyAIConversationRow): RubyAIConversation => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  contextTag: row.mode ?? "general",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  messages: [],
});

export const mapRubyAIConversationToDbInsert = (input: {
  userId: string;
  title: string;
  mode?: string | null;
  createdAt?: string;
  updatedAt?: string;
}): RubyAIConversationInsert => ({
  user_id: input.userId,
  title: input.title,
  mode: input.mode ?? null,
  created_at: input.createdAt,
  updated_at: input.updatedAt,
});

export const mapDbRubyAIMessageToMessage = (row: RubyAIMessageRow): RubyAIMessage => ({
  id: row.id,
  conversationId: row.conversation_id,
  role: ensureRubyAIRole(row.role),
  content: row.content,
  createdAt: row.created_at,
  metadata: mapJsonToRubyAIMessageMetadata(row.metadata),
});

export const mapRubyAIMessageToDbInsert = (input: {
  userId: string;
  conversationId: string;
  role: RubyAIMessageRole;
  content: string;
  metadata?: RubyAIMessage["metadata"];
  createdAt?: string;
}): RubyAIMessageInsert => ({
  user_id: input.userId,
  conversation_id: input.conversationId,
  role: input.role,
  content: input.content,
  metadata: mapRubyAIMessageMetadataToJson(input.metadata),
  created_at: input.createdAt,
});

export const mapDbFinancialHealthSnapshotToSnapshot = (row: FinancialHealthHistoryRow): FinancialHealthSnapshotRecord => ({
  id: row.id,
  userId: row.user_id,
  score: toSafeNumber(row.score),
  status:
    row.status === "excellent" || row.status === "good" || row.status === "moderate" || row.status === "risky" || row.status === "critical"
      ? row.status
      : "moderate",
  savingsRateScore: toSafeNumber(row.savings_rate_score),
  spendingControlScore: toSafeNumber(row.spending_control_score),
  subscriptionBurdenScore: toSafeNumber(row.subscription_burden_score),
  emergencyFundScore: toSafeNumber(row.emergency_fund_score),
  budgetDisciplineScore: toSafeNumber(row.budget_discipline_score),
  cashFlowStabilityScore: toSafeNumber(row.cash_flow_stability_score),
  goalProgressScore: toSafeNumber(row.goal_progress_score),
  debtCreditRiskScore: toSafeNumber(row.debt_credit_risk_score),
  notes: row.notes ?? null,
  createdAt: row.created_at,
});

export const mapFinancialHealthSnapshotToDbInsert = (
  input: Omit<FinancialHealthSnapshotRecord, "id"> & { id?: string }
): FinancialHealthHistoryInsert => ({
  id: input.id,
  user_id: input.userId,
  score: input.score,
  status: input.status,
  savings_rate_score: input.savingsRateScore,
  spending_control_score: input.spendingControlScore,
  subscription_burden_score: input.subscriptionBurdenScore,
  emergency_fund_score: input.emergencyFundScore,
  budget_discipline_score: input.budgetDisciplineScore,
  cash_flow_stability_score: input.cashFlowStabilityScore,
  goal_progress_score: input.goalProgressScore,
  debt_credit_risk_score: input.debtCreditRiskScore,
  notes: input.notes,
  created_at: input.createdAt,
});
