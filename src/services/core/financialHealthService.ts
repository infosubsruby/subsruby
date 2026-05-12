import type { FinancialHealthSnapshotRecord, FinancialHealthScore } from "@/domain/financeModels";
import { createProfileForUser } from "@/lib/auth/authService";
import { isSupabaseMode } from "@/lib/config/dataMode";
import { calculateBudgetUsagePercentage, calculateHealthScore, calculateSavingsRate, calculateSubscriptionBurden } from "@/lib/financeCalculations";
import { calculateFinancialHealthScore } from "@/lib/financialHealthScore";
import { getSupabaseClient } from "@/lib/supabase/client";
import { mapDbFinancialHealthSnapshotToSnapshot, mapFinancialHealthSnapshotToDbInsert } from "@/lib/supabase/mappers";
import type { Database } from "@/integrations/supabase/types";
import { fetchBudgets } from "@/services/core/budgetService";
import { fetchSubscriptions } from "@/services/core/subscriptionService";
import { fetchTransactions } from "@/services/core/transactionService";
import { fail, ok, toFriendlyError, type ServiceResult } from "@/services/core/serviceResult";

export const getFinancialHealthScore = async (userId: string): Promise<FinancialHealthScore> => {
  const [transactions, subscriptions, budgets] = await Promise.all([
    fetchTransactions(userId),
    fetchSubscriptions(userId),
    fetchBudgets(userId),
  ]);

  const monthlyIncome = Math.max(
    1,
    transactions
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + item.amount, 0)
  );
  const averageBudgetUsage =
    budgets.length === 0 ? 0 : budgets.reduce((sum, item) => sum + calculateBudgetUsagePercentage(item), 0) / budgets.length;

  const score = calculateHealthScore({
    savingsRate: calculateSavingsRate(transactions),
    subscriptionBurden: calculateSubscriptionBurden(subscriptions, monthlyIncome),
    averageBudgetUsage,
  });

  return {
    id: `health-${userId}`,
    userId,
    score,
    status: score >= 90 ? "excellent" : score >= 75 ? "good" : score >= 60 ? "moderate" : score >= 40 ? "risky" : "critical",
    riskLevel: score >= 75 ? "low" : score >= 55 ? "medium" : "high",
    factors: [
      { key: "savings_rate", score: calculateSavingsRate(transactions), weight: 0.2 },
      { key: "subscription_burden", score: calculateSubscriptionBurden(subscriptions, monthlyIncome), weight: 0.15 },
      { key: "budget_usage", score: averageBudgetUsage, weight: 0.15 },
    ],
    generatedAt: new Date().toISOString(),
  };
};

type FinancialHealthHistoryRow = Database["public"]["Tables"]["financial_health_history"]["Row"];
type FinancialHealthHistoryInsert = Database["public"]["Tables"]["financial_health_history"]["Insert"];
type FinancialHealthHistoryUpdate = Database["public"]["Tables"]["financial_health_history"]["Update"];

type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];
type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];
type GoalRow = Database["public"]["Tables"]["goals"]["Row"];
type WalletRow = Database["public"]["Tables"]["wallets"]["Row"];
type BudgetRow = Database["public"]["Tables"]["budgets"]["Row"];

type PostgrestErrorLike = {
  message: string;
  code?: string | null;
  details?: string | null;
  hint?: string | null;
};

const UNAVAILABLE_MESSAGE = "Financial health history is unavailable because Supabase is not configured.";

const isDemoUser = (userId: string): boolean => userId === "demo-user" || userId.startsWith("demo-");

const formatPostgrestError = (error: PostgrestErrorLike): string => {
  const parts = [error.message];
  if (error.code) parts.push(`code=${error.code}`);
  if (error.details) parts.push(`details=${error.details}`);
  if (error.hint) parts.push(`hint=${error.hint}`);
  return parts.join(" | ");
};

const logDevPostgrestError = (scope: string, error: unknown, context: Record<string, unknown>): void => {
  if (!import.meta.env.DEV) return;
  const e = error as PostgrestErrorLike | null | undefined;
  console.error(`[FinancialHealth] ${scope}`, {
    ...context,
    error: e ? { message: e.message, code: e.code ?? null, details: e.details ?? null, hint: e.hint ?? null } : error,
  });
};

const ensureProfileExists = async (userId: string): Promise<ServiceResult<true>> => {
  const supabase = getSupabaseClient();
  if (!supabase) return fail(UNAVAILABLE_MESSAGE);
  const { data } = await supabase.auth.getUser();
  const authUser = data.user ?? null;
  if (!authUser) return fail(import.meta.env.DEV ? "Not authenticated (no current user)." : "Please sign in.");

  if (authUser.id !== userId && import.meta.env.DEV) {
    console.error("[FinancialHealth] userId mismatch", { passedUserId: userId, authUserId: authUser.id });
  }

  const { data: profileRow, error } = await supabase.from("profiles").select("id").eq("id", authUser.id).maybeSingle();
  if (error) {
    logDevPostgrestError("profiles select error", error, { authUserId: authUser.id });
    return fail(import.meta.env.DEV ? formatPostgrestError(error as unknown as PostgrestErrorLike) : error.message);
  }
  if (!profileRow) {
    const { error: createError } = await createProfileForUser(authUser);
    if (createError) {
      logDevPostgrestError("profiles create error", createError, { authUserId: authUser.id });
      return fail(
        import.meta.env.DEV
          ? formatPostgrestError(createError as unknown as PostgrestErrorLike)
          : "Please check authentication or permissions."
      );
    }
  }
  return ok(true);
};

const resolveFinancialHealthCall = async <T>(
  userId: string,
  supabaseCall: () => Promise<ServiceResult<T>>,
  fallbackCall: () => Promise<ServiceResult<T>>
): Promise<ServiceResult<T>> => {
  if (!isSupabaseMode() || isDemoUser(userId)) return fallbackCall();
  return supabaseCall();
};

const safeNumber = (value: number | null | undefined): number => (Number.isFinite(value) ? Number(value) : 0);
const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));
const toMonthKey = (date: Date): string => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const statusFromScore = (score: number): FinancialHealthSnapshotRecord["status"] => {
  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 60) return "moderate";
  if (score >= 40) return "risky";
  return "critical";
};

const computeGoalProgressPct = (goals: GoalRow[]): number => {
  if (!goals.length) return 0;
  const ratios = goals
    .map((goal) => {
      const target = Math.max(1, safeNumber(goal.target_amount));
      const current = Math.max(0, safeNumber(goal.current_amount));
      return Math.min(1, current / target);
    })
    .filter((value) => Number.isFinite(value));
  if (!ratios.length) return 0;
  return (ratios.reduce((sum, v) => sum + v, 0) / ratios.length) * 100;
};

const computeOverspendingDaysRatio = (transactions: TransactionRow[], monthKey: string): number => {
  const dailyTotals: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.type !== "expense") continue;
    const dateValue = tx.date ? new Date(tx.date) : null;
    if (!dateValue || Number.isNaN(dateValue.getTime()) || toMonthKey(dateValue) !== monthKey) continue;
    const day = (tx.date ?? "").slice(0, 10);
    if (!day) continue;
    dailyTotals[day] = safeNumber(dailyTotals[day] ?? 0) + safeNumber(tx.amount);
  }
  const values = Object.values(dailyTotals);
  if (!values.length) return 0;
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  const overspendingDays = values.filter((v) => v > avg * 1.25).length;
  return overspendingDays / values.length;
};

const computeSubscriptionMonthlyCost = (subscriptions: SubscriptionRow[]): number =>
  subscriptions.reduce((sum, sub) => {
    const amount = safeNumber(sub.price);
    return sum + (sub.billing_cycle === "yearly" ? amount / 12 : amount);
  }, 0);

const calculateSnapshotFromSupabaseRows = (input: {
  userId: string;
  transactions: TransactionRow[];
  subscriptions: SubscriptionRow[];
  budgets: BudgetRow[];
  goals: GoalRow[];
  wallets: WalletRow[];
}): { snapshot: Omit<FinancialHealthSnapshotRecord, "id">; score: number } => {
  const now = new Date();
  const currentMonth = toMonthKey(now);

  const monthKeys = [5, 4, 3, 2, 1, 0].map((offset) => {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return toMonthKey(d);
  });

  const monthlyIncomeSeries = monthKeys.map((key) =>
    input.transactions
      .filter((tx) => tx.type === "income" && tx.date && toMonthKey(new Date(tx.date)) === key)
      .reduce((sum, tx) => sum + safeNumber(tx.amount), 0)
  );

  const monthlyExpenseSeries = monthKeys.map((key) =>
    input.transactions
      .filter((tx) => tx.type === "expense" && tx.date && toMonthKey(new Date(tx.date)) === key)
      .reduce((sum, tx) => sum + safeNumber(tx.amount), 0)
  );

  const monthlyIncome = input.transactions
    .filter((tx) => tx.type === "income" && tx.date && toMonthKey(new Date(tx.date)) === currentMonth)
    .reduce((sum, tx) => sum + safeNumber(tx.amount), 0);

  const monthlyExpense = input.transactions
    .filter((tx) => tx.type === "expense" && tx.date && toMonthKey(new Date(tx.date)) === currentMonth)
    .reduce((sum, tx) => sum + safeNumber(tx.amount), 0);

  const subscriptionMonthlyCost = computeSubscriptionMonthlyCost(input.subscriptions);
  const budgetTotal = input.budgets.reduce((sum, b) => sum + safeNumber(b.limit_amount), 0);
  const walletBalanceTotal = input.wallets.reduce((sum, w) => sum + safeNumber(w.balance), 0);

  const netSavings = monthlyIncome - monthlyExpense - subscriptionMonthlyCost;
  const savingsRatePct = monthlyIncome > 0 ? (netSavings / monthlyIncome) * 100 : 0;
  const subscriptionBurdenPct = monthlyIncome > 0 ? (subscriptionMonthlyCost / monthlyIncome) * 100 : 0;
  const expenseRatioPct = monthlyIncome > 0 ? (monthlyExpense / monthlyIncome) * 100 : 100;
  const goalProgressPct = computeGoalProgressPct(input.goals);
  const overspendingDaysRatio = computeOverspendingDaysRatio(input.transactions, currentMonth);

  const emergencyFundMonths =
    monthlyExpense > 0
      ? walletBalanceTotal > 0
        ? walletBalanceTotal / monthlyExpense
        : Math.max(netSavings, 0) / monthlyExpense
      : 0;

  const budgetDisciplineRatio = budgetTotal > 0 ? clamp(Math.min(budgetTotal / Math.max(monthlyExpense, 1), 1), 0, 1) : 0.6;
  const debtRatioPct = subscriptionBurdenPct;

  const result = calculateFinancialHealthScore({
    savingsRatePct,
    monthlyExpenseSeries,
    monthlyIncomeSeries,
    subscriptionBurdenPct,
    expenseRatioPct,
    goalProgressPct,
    emergencyFundMonths,
    overspendingDaysRatio,
    debtRatioPct,
    budgetDisciplineRatio,
  });

  const factorLookup = new Map(result.factors.map((factor) => [factor.key, factor.scorePct]));

  const createdAt = now.toISOString();
  const score = Number.isFinite(result.score) ? result.score : 0;

  return {
    score,
    snapshot: {
      userId: input.userId,
      score,
      status: statusFromScore(score),
      savingsRateScore: safeNumber(factorLookup.get("savings_rate")),
      spendingControlScore: safeNumber(factorLookup.get("spending_control")),
      subscriptionBurdenScore: safeNumber(factorLookup.get("subscription_burden")),
      emergencyFundScore: safeNumber(factorLookup.get("emergency_fund")),
      budgetDisciplineScore: safeNumber(factorLookup.get("budget_discipline")),
      cashFlowStabilityScore: safeNumber(factorLookup.get("cash_flow_stability")),
      goalProgressScore: safeNumber(factorLookup.get("goal_progress")),
      debtCreditRiskScore: safeNumber(factorLookup.get("debt_credit_risk")),
      notes: result.summary,
      createdAt,
    },
  };
};

export const fetchFinancialHealthHistorySafe = async (
  userId: string
): Promise<ServiceResult<FinancialHealthSnapshotRecord[]>> =>
  resolveFinancialHealthCall(
    userId,
    async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return fail(UNAVAILABLE_MESSAGE);
      try {
        const profileResult = await ensureProfileExists(userId);
        if (profileResult.error) return fail(profileResult.error);

        const { data: authData } = await supabase.auth.getUser();
        const authUserId = authData.user?.id ?? null;
        if (!authUserId) return fail("Please sign in to view financial health history.");

        const { data, error } = await supabase
          .from("financial_health_history")
          .select("*")
          .eq("user_id", authUserId)
          .order("created_at", { ascending: true });

        if (error) {
          logDevPostgrestError("fetch history error", error, { authUserId });
          return fail(import.meta.env.DEV ? formatPostgrestError(error as unknown as PostgrestErrorLike) : error.message);
        }
        return ok(((data ?? []) as FinancialHealthHistoryRow[]).map(mapDbFinancialHealthSnapshotToSnapshot));
      } catch (error) {
        return fail(toFriendlyError(error, "Failed to load financial health history."));
      }
    },
    async () => ok([])
  );

export const fetchFinancialHealthHistory = async (userId: string): Promise<FinancialHealthSnapshotRecord[]> => {
  const result = await fetchFinancialHealthHistorySafe(userId);
  return result.data ?? [];
};

export const fetchLatestFinancialHealthSnapshotSafe = async (
  userId: string
): Promise<ServiceResult<FinancialHealthSnapshotRecord | null>> =>
  resolveFinancialHealthCall(
    userId,
    async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return fail(UNAVAILABLE_MESSAGE);
      try {
        const profileResult = await ensureProfileExists(userId);
        if (profileResult.error) return fail(profileResult.error);

        const { data: authData } = await supabase.auth.getUser();
        const authUserId = authData.user?.id ?? null;
        if (!authUserId) return fail("Please sign in to view financial health.");

        const { data, error } = await supabase
          .from("financial_health_history")
          .select("*")
          .eq("user_id", authUserId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          logDevPostgrestError("fetch latest error", error, { authUserId });
          return fail(import.meta.env.DEV ? formatPostgrestError(error as unknown as PostgrestErrorLike) : error.message);
        }
        if (!data) return ok(null);
        return ok(mapDbFinancialHealthSnapshotToSnapshot(data as FinancialHealthHistoryRow));
      } catch (error) {
        return fail(toFriendlyError(error, "Failed to load latest financial health snapshot."));
      }
    },
    async () => ok(null)
  );

export const fetchLatestFinancialHealthSnapshot = async (userId: string): Promise<FinancialHealthSnapshotRecord | null> => {
  const result = await fetchLatestFinancialHealthSnapshotSafe(userId);
  return result.data ?? null;
};

export const saveFinancialHealthSnapshotSafe = async (
  userId: string,
  snapshot: Omit<FinancialHealthSnapshotRecord, "id">
): Promise<ServiceResult<FinancialHealthSnapshotRecord>> =>
  resolveFinancialHealthCall(
    userId,
    async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return fail(UNAVAILABLE_MESSAGE);
      try {
        const profileResult = await ensureProfileExists(userId);
        if (profileResult.error) return fail(profileResult.error);

        const { data: authData } = await supabase.auth.getUser();
        const authUserId = authData.user?.id ?? null;
        if (!authUserId) return fail("Please sign in to save financial health.");

        const latestRes = await fetchLatestFinancialHealthSnapshotSafe(userId);
        if (latestRes.error) return fail(latestRes.error);
        const latest = latestRes.data;

        const todayKey = new Date().toISOString().slice(0, 10);
        const latestKey = latest?.createdAt.slice(0, 10) ?? null;

        if (latest && latestKey === todayKey) {
          const update: FinancialHealthHistoryUpdate = {
            score: snapshot.score,
            status: snapshot.status,
            savings_rate_score: snapshot.savingsRateScore,
            spending_control_score: snapshot.spendingControlScore,
            subscription_burden_score: snapshot.subscriptionBurdenScore,
            emergency_fund_score: snapshot.emergencyFundScore,
            budget_discipline_score: snapshot.budgetDisciplineScore,
            cash_flow_stability_score: snapshot.cashFlowStabilityScore,
            goal_progress_score: snapshot.goalProgressScore,
            debt_credit_risk_score: snapshot.debtCreditRiskScore,
            notes: snapshot.notes,
          };

          const { data, error } = await supabase
            .from("financial_health_history")
            .update(update)
            .eq("id", latest.id)
            .eq("user_id", authUserId)
            .select("*")
            .single();

          if (error) {
            logDevPostgrestError("update snapshot error", error, { authUserId, update });
            return fail(import.meta.env.DEV ? formatPostgrestError(error as unknown as PostgrestErrorLike) : error.message);
          }
          return ok(mapDbFinancialHealthSnapshotToSnapshot(data as FinancialHealthHistoryRow));
        }

        const insertPayload: FinancialHealthHistoryInsert = mapFinancialHealthSnapshotToDbInsert({
          ...snapshot,
          userId: authUserId,
        });

        const { data, error } = await supabase
          .from("financial_health_history")
          .insert(insertPayload)
          .select("*")
          .single();

        if (error) {
          logDevPostgrestError("insert snapshot error", error, { authUserId, insertPayload });
          return fail(import.meta.env.DEV ? formatPostgrestError(error as unknown as PostgrestErrorLike) : error.message);
        }
        return ok(mapDbFinancialHealthSnapshotToSnapshot(data as FinancialHealthHistoryRow));
      } catch (error) {
        return fail(toFriendlyError(error, "Failed to save financial health snapshot."));
      }
    },
    async () => fail("Financial health history is not available in demo mode.")
  );

export const saveFinancialHealthSnapshot = async (
  userId: string,
  snapshot: Omit<FinancialHealthSnapshotRecord, "id">
): Promise<ServiceResult<FinancialHealthSnapshotRecord>> => saveFinancialHealthSnapshotSafe(userId, snapshot);

export const calculateFinancialHealthSafe = async (
  userId: string
): Promise<ServiceResult<Omit<FinancialHealthSnapshotRecord, "id">>> =>
  resolveFinancialHealthCall(
    userId,
    async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return fail(UNAVAILABLE_MESSAGE);

      try {
        const profileResult = await ensureProfileExists(userId);
        if (profileResult.error) return fail(profileResult.error);

        const { data: authData } = await supabase.auth.getUser();
        const authUserId = authData.user?.id ?? null;
        if (!authUserId) return fail("Please sign in to calculate financial health.");

        const [transactionsRes, subscriptionsRes, budgetsRes, goalsRes, walletsRes] = await Promise.all([
          supabase.from("transactions").select("*").eq("user_id", authUserId),
          supabase.from("subscriptions").select("*").eq("user_id", authUserId),
          supabase.from("budgets").select("*").eq("user_id", authUserId),
          supabase.from("goals").select("*").eq("user_id", authUserId),
          supabase.from("wallets").select("*").eq("user_id", authUserId),
        ]);

        const sourceErrors: Array<{ source: string; error: unknown }> = [];
        if (transactionsRes.error) sourceErrors.push({ source: "transactions", error: transactionsRes.error });
        if (subscriptionsRes.error) sourceErrors.push({ source: "subscriptions", error: subscriptionsRes.error });
        if (budgetsRes.error) sourceErrors.push({ source: "budgets", error: budgetsRes.error });
        if (goalsRes.error) sourceErrors.push({ source: "goals", error: goalsRes.error });
        if (walletsRes.error) sourceErrors.push({ source: "wallets", error: walletsRes.error });

        if (sourceErrors.length) {
          for (const entry of sourceErrors) {
            logDevPostgrestError("data source error", entry.error, { source: entry.source, authUserId });
          }
        }

        const transactions = (transactionsRes.data ?? []) as TransactionRow[];
        const subscriptions = (subscriptionsRes.data ?? []) as SubscriptionRow[];
        const budgets = (budgetsRes.data ?? []) as BudgetRow[];
        const goals = (goalsRes.data ?? []) as GoalRow[];
        const wallets = (walletsRes.data ?? []) as WalletRow[];

        const computed = calculateSnapshotFromSupabaseRows({
          userId: authUserId,
          transactions,
          subscriptions,
          budgets,
          goals,
          wallets,
        });

        return ok(computed.snapshot);
      } catch (error) {
        return fail(toFriendlyError(error, "Failed to calculate financial health."));
      }
    },
    async () => {
      const basic = await getFinancialHealthScore(userId);
      return ok({
        userId,
        score: basic.score,
        status: basic.status,
        savingsRateScore: 0,
        spendingControlScore: 0,
        subscriptionBurdenScore: 0,
        emergencyFundScore: 0,
        budgetDisciplineScore: 0,
        cashFlowStabilityScore: 0,
        goalProgressScore: 0,
        debtCreditRiskScore: 0,
        notes: null,
        createdAt: new Date().toISOString(),
      });
    }
  );

export const calculateFinancialHealth = async (
  userId: string
): Promise<ServiceResult<Omit<FinancialHealthSnapshotRecord, "id">>> => calculateFinancialHealthSafe(userId);

export const generateAndSaveFinancialHealthSnapshot = async (
  userId: string
): Promise<ServiceResult<FinancialHealthSnapshotRecord>> => {
  const calculated = await calculateFinancialHealthSafe(userId);
  if (calculated.error || !calculated.data) return fail(calculated.error ?? "Failed to calculate snapshot.");
  return saveFinancialHealthSnapshotSafe(userId, calculated.data);
};
