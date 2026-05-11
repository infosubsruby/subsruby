import type {
  MonthlyReportGoalProgress,
  MonthlyReportRecord,
  MonthlyReportRecommendedAction,
  MonthlyReportSubscriptionImpact,
  MonthlyReportTopCategory,
} from "@/domain/financeModels";
import { createProfileForUser } from "@/lib/auth/authService";
import { calculateFinancialHealthScore } from "@/lib/financialHealthScore";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  mapDbMonthlyReportToMonthlyReport,
  mapMonthlyReportToDbInsert,
  mapMonthlyReportToDbUpdate,
} from "@/lib/supabase/mappers";
import { fail, ok, toFriendlyError, type ServiceResult } from "@/services/core/serviceResult";

type MonthlyReportRow = Database["public"]["Tables"]["monthly_reports"]["Row"];
type MonthlyReportInsert = Database["public"]["Tables"]["monthly_reports"]["Insert"];
type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];
type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];
type GoalRow = Database["public"]["Tables"]["goals"]["Row"];
type WalletRow = Database["public"]["Tables"]["wallets"]["Row"];
type BudgetRow = Database["public"]["Tables"]["budgets"]["Row"];
type AIInsightRow = Database["public"]["Tables"]["ai_insights"]["Row"];

const UNAVAILABLE_MESSAGE = "Monthly reports are unavailable because Supabase is not configured.";

type PostgrestErrorLike = {
  message: string;
  code?: string | null;
  details?: string | null;
  hint?: string | null;
};

const formatPostgrestError = (error: PostgrestErrorLike): string => {
  const parts: string[] = [error.message];
  if (error.code) parts.push(`code=${error.code}`);
  if (error.details) parts.push(`details=${error.details}`);
  if (error.hint) parts.push(`hint=${error.hint}`);
  return parts.join(" | ");
};

const logDevPostgrestError = (
  scope: string,
  error: unknown,
  context: Record<string, unknown>
): void => {
  if (!import.meta.env.DEV) return;
  const e = error as PostgrestErrorLike | null | undefined;
  console.error(`[MonthlyReports] ${scope}`, {
    ...context,
    error: e
      ? { message: e.message, code: e.code ?? null, details: e.details ?? null, hint: e.hint ?? null }
      : error,
  });
};

const safeNumber = (value: number | null | undefined): number => (Number.isFinite(value) ? Number(value) : 0);

const isExpense = (tx: TransactionRow): boolean => String(tx.type).toLowerCase() === "expense";
const isIncome = (tx: TransactionRow): boolean => String(tx.type).toLowerCase() === "income";

const toMonthKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const parseMonthKey = (month: string): { year: number; monthIndex: number } | null => {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) return null;
  return { year, monthIndex };
};

const monthRange = (month: string): { start: Date; end: Date } | null => {
  const parsed = parseMonthKey(month);
  if (!parsed) return null;
  const start = new Date(parsed.year, parsed.monthIndex, 1, 0, 0, 0, 0);
  const end = new Date(parsed.year, parsed.monthIndex + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

const estimateMonthlySubscriptionCost = (sub: SubscriptionRow): number => {
  const price = safeNumber(sub.price);
  const cycle = String(sub.billing_cycle ?? "monthly").toLowerCase();
  if (cycle === "yearly") return price / 12;
  if (cycle === "weekly") return price * 4.33;
  return price;
};

const computeTopCategories = (transactions: TransactionRow[]): MonthlyReportTopCategory[] => {
  const totals = new Map<string, number>();
  let expenseTotal = 0;
  for (const tx of transactions) {
    if (!isExpense(tx)) continue;
    const category = (tx.category ?? "Uncategorized").trim() || "Uncategorized";
    const amount = safeNumber(tx.amount);
    expenseTotal += amount;
    totals.set(category, (totals.get(category) ?? 0) + amount);
  }
  const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  return sorted.map(([category, amount]) => ({
    category,
    amount,
    percentageOfExpenses: expenseTotal > 0 ? (amount / expenseTotal) * 100 : 0,
  }));
};

const buildSubscriptionImpact = (subscriptions: SubscriptionRow[]): MonthlyReportSubscriptionImpact => {
  const monthlyCost = subscriptions.reduce((sum, sub) => sum + estimateMonthlySubscriptionCost(sub), 0);
  return {
    count: subscriptions.length,
    monthlyCost,
    yearlyCost: monthlyCost * 12,
  };
};

const buildGoalProgress = (goals: GoalRow[]): MonthlyReportGoalProgress => {
  if (!goals.length) return { goalsCount: 0, averageProgressPct: 0 };
  const progressValues = goals
    .map((goal) => {
      const target = Math.max(1, safeNumber(goal.target_amount));
      const current = Math.max(0, safeNumber(goal.current_amount));
      return Math.min(1, current / target);
    })
    .filter((value) => Number.isFinite(value));
  const avg = progressValues.length ? progressValues.reduce((s, v) => s + v, 0) / progressValues.length : 0;
  return { goalsCount: goals.length, averageProgressPct: avg * 100 };
};

const buildRecommendedActions = (input: {
  subscriptionImpact: MonthlyReportSubscriptionImpact;
  topCategories: MonthlyReportTopCategory[];
  netSavings: number;
  savingsRatePct: number;
  wallets: WalletRow[];
  goals: GoalRow[];
}): MonthlyReportRecommendedAction[] => {
  const actions: MonthlyReportRecommendedAction[] = [];
  if (input.subscriptionImpact.count > 0) {
    actions.push({
      title: "Optimize recurring payments",
      action: "Review subscriptions for duplicates and switch yearly billing on high-value services.",
      expectedImpact: `Potential yearly savings: ${Math.round(input.subscriptionImpact.yearlyCost * 0.1)}`,
    });
  }
  const top = input.topCategories[0];
  if (top && top.percentageOfExpenses !== undefined && top.percentageOfExpenses >= 30) {
    actions.push({
      title: `Reduce ${top.category} pressure`,
      action: `Set a weekly spending cap for ${top.category} and review the highest-spend days.`,
      expectedImpact: `Target reduction: ${Math.round(top.amount * 0.08)}`,
    });
  }
  if (input.netSavings < 0 || input.savingsRatePct < 0) {
    actions.push({
      title: "Restore positive cash flow",
      action: "Cut one discretionary category for 7 days and audit recurring costs.",
      expectedImpact: "Stabilize monthly net savings",
    });
  }
  if (input.wallets.length > 0) {
    const lowest = input.wallets
      .map((w) => ({ id: w.id, name: w.name, balance: safeNumber(w.balance) }))
      .sort((a, b) => a.balance - b.balance)[0];
    if (lowest && lowest.balance < 50) {
      actions.push({
        title: "Prevent low-balance issues",
        action: `Top up "${lowest.name}" or move upcoming bills to a higher-balance wallet.`,
        expectedImpact: "Avoid failed payments / late fees",
      });
    }
  }
  if (input.goals.length > 0) {
    actions.push({
      title: "Increase goal momentum",
      action: "Set or increase monthly targets on goals to accelerate progress.",
      expectedImpact: "Faster goal completion",
    });
  }
  return actions.slice(0, 5);
};

const buildAiSummary = (input: {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  subscriptionImpact: MonthlyReportSubscriptionImpact;
  netSavings: number;
  savingsRatePct: number;
  topCategories: MonthlyReportTopCategory[];
  goalProgress: MonthlyReportGoalProgress;
  insights: AIInsightRow[];
}): string => {
  const top = input.topCategories[0]?.category ?? "your top category";
  const recurring = input.subscriptionImpact.count > 0 ? `${input.subscriptionImpact.count} recurring payments` : "no recurring payments";
  const insightHint = input.insights.length > 0 ? `You have ${input.insights.length} active AI insight(s).` : "No active AI insights yet.";
  const direction = input.netSavings >= 0 ? "positive" : "negative";
  return `For ${input.month}, income is ${Math.round(input.totalIncome)} and expenses are ${Math.round(
    input.totalExpenses
  )}. Recurring costs include ${recurring} (~${Math.round(input.subscriptionImpact.monthlyCost)}/mo). Net savings are ${Math.round(
    input.netSavings
  )} (${input.savingsRatePct.toFixed(1)}%), with ${direction} cash flow. Biggest spending pressure appears in ${top}. Goal tracking is active for ${input.goalProgress.goalsCount} goal(s). ${insightHint}`;
};

const ensureProfileExists = async (userId: string): Promise<ServiceResult<true>> => {
  const supabase = getSupabaseClient();
  if (!supabase) return fail(UNAVAILABLE_MESSAGE);
  const { data, error } = await supabase.auth.getUser();
  const authUser = data.user ?? null;
  if (!authUser) return fail(import.meta.env.DEV ? "Not authenticated (no current user)." : "Please sign in.");
  if (authUser.id !== userId && import.meta.env.DEV) {
    console.error("[MonthlyReports] userId mismatch", { passedUserId: userId, authUserId: authUser.id });
  }

  const { data: profileRow, error: profileError } = await supabase.from("profiles").select("id").eq("id", authUser.id).maybeSingle();
  if (profileError) {
    return fail(import.meta.env.DEV ? formatPostgrestError(profileError as unknown as PostgrestErrorLike) : profileError.message);
  }
  if (!profileRow) {
    const { error: createError } = await createProfileForUser(authUser);
    if (createError) {
      return fail(
        import.meta.env.DEV
          ? formatPostgrestError(createError as unknown as PostgrestErrorLike)
          : "Please check authentication or permissions."
      );
    }
  }
  return ok(true);
};

export const fetchMonthlyReportsSupabase = async (userId: string): Promise<ServiceResult<MonthlyReportRecord[]>> => {
  const supabase = getSupabaseClient();
  if (!supabase) return fail(UNAVAILABLE_MESSAGE);

  try {
    const profileResult = await ensureProfileExists(userId);
    if (profileResult.error) return fail(profileResult.error);

    const { data: authData } = await supabase.auth.getUser();
    const authUserId = authData.user?.id ?? null;
    if (!authUserId) return fail("Please sign in to view monthly reports.");

    const { data, error } = await supabase
      .from("monthly_reports")
      .select("*")
      .eq("user_id", authUserId)
      .order("month", { ascending: false });

    if (error) return fail(import.meta.env.DEV ? formatPostgrestError(error as unknown as PostgrestErrorLike) : error.message);
    return ok((data ?? []).map((row) => mapDbMonthlyReportToMonthlyReport(row as MonthlyReportRow)));
  } catch (error) {
    if (import.meta.env.DEV) console.error("[MonthlyReports] fetch failed", { userId, error });
    return fail(toFriendlyError(error, "Failed to load monthly reports."));
  }
};

export const fetchMonthlyReportByMonthSupabase = async (
  userId: string,
  month: string
): Promise<ServiceResult<MonthlyReportRecord | null>> => {
  const supabase = getSupabaseClient();
  if (!supabase) return fail(UNAVAILABLE_MESSAGE);
  if (!parseMonthKey(month)) return fail(import.meta.env.DEV ? `Invalid month format: ${month}` : "Invalid month.");

  try {
    const profileResult = await ensureProfileExists(userId);
    if (profileResult.error) return fail(profileResult.error);

    const { data: authData } = await supabase.auth.getUser();
    const authUserId = authData.user?.id ?? null;
    if (!authUserId) return fail("Please sign in to view monthly reports.");

    const { data, error } = await supabase
      .from("monthly_reports")
      .select("*")
      .eq("user_id", authUserId)
      .eq("month", month)
      .maybeSingle();

    if (error) return fail(import.meta.env.DEV ? formatPostgrestError(error as unknown as PostgrestErrorLike) : error.message);
    if (!data) return ok(null);
    return ok(mapDbMonthlyReportToMonthlyReport(data as MonthlyReportRow));
  } catch (error) {
    if (import.meta.env.DEV) console.error("[MonthlyReports] fetch by month failed", { userId, month, error });
    return fail(toFriendlyError(error, "Failed to load monthly report."));
  }
};

export const upsertMonthlyReportSupabase = async (
  userId: string,
  report: MonthlyReportRecord
): Promise<ServiceResult<MonthlyReportRecord>> => {
  const supabase = getSupabaseClient();
  if (!supabase) return fail(UNAVAILABLE_MESSAGE);

  try {
    const profileResult = await ensureProfileExists(userId);
    if (profileResult.error) return fail(profileResult.error);

    const { data: authData } = await supabase.auth.getUser();
    const authUserId = authData.user?.id ?? null;
    if (!authUserId) return fail("Please sign in to save monthly reports.");

    const payload: MonthlyReportInsert = mapMonthlyReportToDbInsert({ ...report, userId: authUserId });

    const { data, error } = await supabase
      .from("monthly_reports")
      .upsert(payload, { onConflict: "user_id,month" })
      .select("*")
      .single();

    if (error) {
      const message = (error as unknown as PostgrestErrorLike | null)?.message ?? "";
      const code = (error as unknown as PostgrestErrorLike | null)?.code ?? "";
      const missingConstraint =
        code === "42P10" || message.includes("no unique or exclusion constraint") || message.includes("ON CONFLICT");
      if (missingConstraint) {
        if (import.meta.env.DEV) {
          console.warn("[MonthlyReports] upsert fallback (missing unique constraint on user_id+month)", {
            passedUserId: userId,
            authUserId,
            month: payload.month,
          });
        }

        const { data: existing, error: findError } = await supabase
          .from("monthly_reports")
          .select("id")
          .eq("user_id", authUserId)
          .eq("month", payload.month)
          .maybeSingle();

        if (findError) {
          logDevPostgrestError("upsert fallback find error", findError, {
            passedUserId: userId,
            authUserId,
            month: payload.month,
          });
          return fail(import.meta.env.DEV ? formatPostgrestError(findError as unknown as PostgrestErrorLike) : findError.message);
        }

        if (existing?.id) {
          const updatePayload = mapMonthlyReportToDbUpdate({
            totalIncome: report.totalIncome,
            totalExpenses: report.totalExpenses,
            netSavings: report.netSavings,
            savingsRate: report.savingsRate,
            healthScore: report.healthScore,
            previousHealthScore: report.previousHealthScore,
            topCategories: report.topCategories,
            subscriptionImpact: report.subscriptionImpact,
            goalProgress: report.goalProgress,
            aiSummary: report.aiSummary,
            recommendedActions: report.recommendedActions,
          });

          const { data: updated, error: updateError } = await supabase
            .from("monthly_reports")
            .update(updatePayload)
            .eq("id", existing.id)
            .eq("user_id", authUserId)
            .select("*")
            .single();

          if (updateError) {
            logDevPostgrestError("upsert fallback update error", updateError, {
              passedUserId: userId,
              authUserId,
              month: payload.month,
              updatePayload,
            });
            return fail(
              import.meta.env.DEV ? formatPostgrestError(updateError as unknown as PostgrestErrorLike) : updateError.message
            );
          }
          return ok(mapDbMonthlyReportToMonthlyReport(updated as MonthlyReportRow));
        }

        const { data: inserted, error: insertError } = await supabase
          .from("monthly_reports")
          .insert(payload)
          .select("*")
          .single();

        if (insertError) {
          logDevPostgrestError("upsert fallback insert error", insertError, {
            passedUserId: userId,
            authUserId,
            month: payload.month,
            payload,
          });
          return fail(
            import.meta.env.DEV ? formatPostgrestError(insertError as unknown as PostgrestErrorLike) : insertError.message
          );
        }
        return ok(mapDbMonthlyReportToMonthlyReport(inserted as MonthlyReportRow));
      }

      logDevPostgrestError("upsert error", error, {
        passedUserId: userId,
        authUserId,
        month: payload.month,
        payload,
      });
      return fail(import.meta.env.DEV ? formatPostgrestError(error as unknown as PostgrestErrorLike) : error.message);
    }
    return ok(mapDbMonthlyReportToMonthlyReport(data as MonthlyReportRow));
  } catch (error) {
    if (import.meta.env.DEV) console.error("[MonthlyReports] upsert failed", { userId, report, error });
    return fail(toFriendlyError(error, "Failed to save monthly report."));
  }
};

export const deleteMonthlyReportSupabase = async (userId: string, reportId: string): Promise<ServiceResult<boolean>> => {
  const supabase = getSupabaseClient();
  if (!supabase) return fail(UNAVAILABLE_MESSAGE);

  try {
    const profileResult = await ensureProfileExists(userId);
    if (profileResult.error) return fail(profileResult.error);

    const { data: authData } = await supabase.auth.getUser();
    const authUserId = authData.user?.id ?? null;
    if (!authUserId) return fail("Please sign in to delete monthly reports.");

    const { error } = await supabase.from("monthly_reports").delete().eq("id", reportId).eq("user_id", authUserId);
    if (error) return fail(import.meta.env.DEV ? formatPostgrestError(error as unknown as PostgrestErrorLike) : error.message);
    return ok(true);
  } catch (error) {
    if (import.meta.env.DEV) console.error("[MonthlyReports] delete failed", { userId, reportId, error });
    return fail(toFriendlyError(error, "Failed to delete monthly report."));
  }
};

export const generateMonthlyReportSupabase = async (
  userId: string,
  month: string
): Promise<ServiceResult<MonthlyReportRecord>> => {
  const supabase = getSupabaseClient();
  if (!supabase) return fail(UNAVAILABLE_MESSAGE);

  const range = monthRange(month);
  if (!range) return fail(import.meta.env.DEV ? `Invalid month format: ${month}` : "Invalid month.");

  try {
    const profileResult = await ensureProfileExists(userId);
    if (profileResult.error) return fail(profileResult.error);

    const { data: authData } = await supabase.auth.getUser();
    const authUserId = authData.user?.id ?? null;
    if (!authUserId) return fail("Please sign in to generate monthly reports.");

    const [
      transactionsRes,
      subscriptionsRes,
      goalsRes,
      walletsRes,
      budgetsRes,
      insightsRes,
    ] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", authUserId),
      supabase.from("subscriptions").select("*").eq("user_id", authUserId),
      supabase.from("goals").select("*").eq("user_id", authUserId),
      supabase.from("wallets").select("*").eq("user_id", authUserId),
      supabase.from("budgets").select("*").eq("user_id", authUserId),
      supabase.from("ai_insights").select("*").eq("user_id", authUserId).eq("is_resolved", false),
    ]);

    const sourceErrors: Array<{ source: string; error: unknown }> = [];
    if (transactionsRes.error) sourceErrors.push({ source: "transactions", error: transactionsRes.error });
    if (subscriptionsRes.error) sourceErrors.push({ source: "subscriptions", error: subscriptionsRes.error });
    if (goalsRes.error) sourceErrors.push({ source: "goals", error: goalsRes.error });
    if (walletsRes.error) sourceErrors.push({ source: "wallets", error: walletsRes.error });
    if (budgetsRes.error) sourceErrors.push({ source: "budgets", error: budgetsRes.error });
    if (insightsRes.error) sourceErrors.push({ source: "ai_insights", error: insightsRes.error });

    if (sourceErrors.length) {
      for (const entry of sourceErrors) {
        logDevPostgrestError("data source error", entry.error, { source: entry.source, authUserId, month });
      }
    }

    const transactions = (transactionsRes.data ?? []) as TransactionRow[];
    const subscriptions = (subscriptionsRes.data ?? []) as SubscriptionRow[];
    const goals = (goalsRes.data ?? []) as GoalRow[];
    const wallets = (walletsRes.data ?? []) as WalletRow[];
    const budgets = (budgetsRes.data ?? []) as BudgetRow[];
    const insights = (insightsRes.data ?? []) as AIInsightRow[];

    const monthTransactions = transactions.filter((tx) => {
      const d = new Date(tx.date);
      return !Number.isNaN(d.getTime()) && d >= range.start && d <= range.end;
    });

    const totalIncome = monthTransactions.filter(isIncome).reduce((sum, tx) => sum + safeNumber(tx.amount), 0);
    const totalExpenses = monthTransactions.filter(isExpense).reduce((sum, tx) => sum + safeNumber(tx.amount), 0);
    const subscriptionImpact = buildSubscriptionImpact(subscriptions);
    const netSavings = totalIncome - totalExpenses - subscriptionImpact.monthlyCost;
    const savingsRatePct = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
    const topCategories = computeTopCategories(monthTransactions);
    const goalProgress = buildGoalProgress(goals);

    const parsed = parseMonthKey(month);
    const seriesMonths = Array.from({ length: 6 }, (_, index) => {
      const d = new Date(parsed?.year ?? range.start.getFullYear(), (parsed?.monthIndex ?? range.start.getMonth()) - (5 - index), 1);
      return toMonthKey(d);
    });

    const monthlyIncomeSeries = seriesMonths.map((key) =>
      transactions
        .filter((tx) => isIncome(tx) && toMonthKey(new Date(tx.date)) === key)
        .reduce((sum, tx) => sum + safeNumber(tx.amount), 0)
    );

    const monthlyExpenseSeries = seriesMonths.map((key) =>
      transactions
        .filter((tx) => isExpense(tx) && toMonthKey(new Date(tx.date)) === key)
        .reduce((sum, tx) => sum + safeNumber(tx.amount), 0)
    );

    const budgetTotal = budgets.reduce((sum, b) => sum + safeNumber(b.limit_amount), 0);
    const daysInMonth = Math.max(1, new Date(range.start.getFullYear(), range.start.getMonth() + 1, 0).getDate());
    const dailyBudget = budgetTotal > 0 ? budgetTotal / daysInMonth : 0;
    const dailyExpenseTotals = new Map<string, number>();
    for (const tx of monthTransactions) {
      if (!isExpense(tx)) continue;
      const d = new Date(tx.date);
      const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      dailyExpenseTotals.set(dayKey, (dailyExpenseTotals.get(dayKey) ?? 0) + safeNumber(tx.amount));
    }
    const overspendingDays = dailyBudget > 0 ? [...dailyExpenseTotals.values()].filter((v) => v > dailyBudget).length : 0;
    const overspendingDaysRatio = dailyBudget > 0 ? overspendingDays / daysInMonth : 0;
    const expenseRatioPct = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 100;
    const subscriptionBurdenPct = totalIncome > 0 ? (subscriptionImpact.monthlyCost / totalIncome) * 100 : 0;
    const emergencyFundMonths = totalExpenses > 0 ? Math.max(netSavings, 0) / totalExpenses : 0;
    const budgetDisciplineRatio = budgetTotal > 0 ? Math.min(budgetTotal / Math.max(totalExpenses, 1), 1) : 0.6;
    const goalProgressPct = goalProgress.averageProgressPct;

    const health = calculateFinancialHealthScore({
      savingsRatePct,
      monthlyExpenseSeries,
      monthlyIncomeSeries,
      subscriptionBurdenPct,
      expenseRatioPct,
      goalProgressPct,
      emergencyFundMonths,
      overspendingDaysRatio,
      debtRatioPct: subscriptionBurdenPct,
      budgetDisciplineRatio,
    });

    const previousMonthDate = new Date(range.start.getFullYear(), range.start.getMonth() - 1, 1);
    const previousMonthKey = toMonthKey(previousMonthDate);
    const previousReportRes = await fetchMonthlyReportByMonthSupabase(userId, previousMonthKey);
    const previousHealthScore = previousReportRes.data?.healthScore ?? null;

    const aiSummary = buildAiSummary({
      month,
      totalIncome,
      totalExpenses,
      subscriptionImpact,
      netSavings,
      savingsRatePct,
      topCategories,
      goalProgress,
      insights,
    });

    const recommendedActions = buildRecommendedActions({
      subscriptionImpact,
      topCategories,
      netSavings,
      savingsRatePct,
      wallets,
      goals,
    });

    const report: MonthlyReportRecord = {
      id: crypto.randomUUID(),
      userId: authUserId,
      month,
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate: savingsRatePct,
      healthScore: health.score,
      previousHealthScore,
      topCategories,
      subscriptionImpact,
      goalProgress,
      aiSummary,
      recommendedActions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return upsertMonthlyReportSupabase(userId, report);
  } catch (error) {
    if (import.meta.env.DEV) console.error("[MonthlyReports] generate failed", { userId, month, error });
    return fail(toFriendlyError(error, "Failed to generate monthly report."));
  }
};
