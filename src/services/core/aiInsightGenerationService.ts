import { createProfileForUser } from "@/lib/auth/authService";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { fail, ok, toFriendlyError, type ServiceResult } from "@/services/core/serviceResult";

type AIInsightInsert = Database["public"]["Tables"]["ai_insights"]["Insert"];
type AIInsightRow = Database["public"]["Tables"]["ai_insights"]["Row"];
type BudgetRow = Database["public"]["Tables"]["budgets"]["Row"];
type GoalRow = Database["public"]["Tables"]["goals"]["Row"];
type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];
type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];
type WalletRow = Database["public"]["Tables"]["wallets"]["Row"];

type InsightGenerationSummary = {
  created: number;
  skipped: number;
};

const UNAVAILABLE_MESSAGE = "AI Insights are unavailable because Supabase is not configured.";

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

const safeNumber = (value: number | null | undefined): number => (Number.isFinite(value) ? Number(value) : 0);

const isExpenseTransaction = (tx: TransactionRow): boolean => String(tx.type).toLowerCase() === "expense";
const isIncomeTransaction = (tx: TransactionRow): boolean => String(tx.type).toLowerCase() === "income";

const monthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;

const estimateMonthlySubscriptionCost = (sub: SubscriptionRow): number => {
  const price = safeNumber(sub.price);
  const cycle = String(sub.billing_cycle ?? "monthly").toLowerCase();
  if (cycle === "yearly") return price / 12;
  if (cycle === "weekly") return price * 4.33;
  return price;
};

const normalizeSeverity = (value: string): "info" | "success" | "warning" | "critical" => {
  if (value === "info" || value === "success" || value === "warning" || value === "critical") return value;
  return "info";
};

const dedupeKey = (row: Pick<AIInsightRow, "type" | "title" | "related_entity_type" | "related_entity_id">): string =>
  [row.type, row.title, row.related_entity_type ?? "", row.related_entity_id ?? ""].join("|");

const createInsight = (base: Omit<AIInsightInsert, "user_id">): Omit<AIInsightInsert, "user_id"> => {
  const now = new Date().toISOString();
  return {
    ...base,
    severity: base.severity ? normalizeSeverity(String(base.severity)) : "info",
    confidence: base.confidence ?? 0.74,
    is_resolved: base.is_resolved ?? false,
    created_at: base.created_at ?? now,
    updated_at: base.updated_at ?? now,
  };
};

export const generateAIInsightsForUser = async (userId: string): Promise<ServiceResult<InsightGenerationSummary>> => {
  const supabase = getSupabaseClient();
  if (!supabase) return fail(UNAVAILABLE_MESSAGE);

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const authUser = authData.user ?? null;
    if (!authUser) {
      if (import.meta.env.DEV) {
        console.error("[AIInsights][generate] No authenticated user", {
          passedUserId: userId,
          authError: authError?.message ?? null,
        });
      }
      return fail(import.meta.env.DEV ? "Not authenticated (no current user)." : "Please sign in to generate insights.");
    }

    if (authUser.id !== userId && import.meta.env.DEV) {
      console.error("[AIInsights][generate] Passed userId does not match auth user id", {
        passedUserId: userId,
        authUserId: authUser.id,
      });
    }

    const { data: profileRow, error: profileSelectError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", authUser.id)
      .maybeSingle();

    if (profileSelectError) {
      return fail(import.meta.env.DEV ? formatPostgrestError(profileSelectError as unknown as PostgrestErrorLike) : profileSelectError.message);
    }

    if (!profileRow) {
      const { error: createProfileError } = await createProfileForUser(authUser);
      if (createProfileError) {
        return fail(
          import.meta.env.DEV
            ? formatPostgrestError(createProfileError as unknown as PostgrestErrorLike)
            : "Could not generate insights. Please check authentication or permissions."
        );
      }
    }

    const { data: existingInsights, error: existingError } = await supabase
      .from("ai_insights")
      .select("*")
      .eq("user_id", authUser.id)
      .eq("is_resolved", false);

    if (existingError) {
      return fail(import.meta.env.DEV ? formatPostgrestError(existingError as unknown as PostgrestErrorLike) : existingError.message);
    }

    const existingKeySet = new Set((existingInsights ?? []).map((row) => dedupeKey(row as AIInsightRow)));

    const [transactionsResult, subscriptionsResult, goalsResult, walletsResult, budgetsResult] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", authUser.id),
      supabase.from("subscriptions").select("*").eq("user_id", authUser.id),
      supabase.from("goals").select("*").eq("user_id", authUser.id),
      supabase.from("wallets").select("*").eq("user_id", authUser.id),
      supabase.from("budgets").select("*").eq("user_id", authUser.id),
    ]);

    const firstError =
      transactionsResult.error ??
      subscriptionsResult.error ??
      goalsResult.error ??
      walletsResult.error ??
      budgetsResult.error;

    if (firstError) {
      if (import.meta.env.DEV) {
        console.error("[AIInsights][generate] Failed to load finance data", {
          error: {
            message: firstError.message,
            code: (firstError as unknown as PostgrestErrorLike).code,
            details: (firstError as unknown as PostgrestErrorLike).details,
            hint: (firstError as unknown as PostgrestErrorLike).hint,
          },
        });
      }
      return fail(import.meta.env.DEV ? formatPostgrestError(firstError as unknown as PostgrestErrorLike) : firstError.message);
    }

    const transactions = (transactionsResult.data ?? []) as TransactionRow[];
    const subscriptions = (subscriptionsResult.data ?? []) as SubscriptionRow[];
    const goals = (goalsResult.data ?? []) as GoalRow[];
    const wallets = (walletsResult.data ?? []) as WalletRow[];
    const budgets = (budgetsResult.data ?? []) as BudgetRow[];

    const now = new Date();
    const currentMonth = monthKey(now);
    const monthExpenses = transactions
      .filter((tx) => isExpenseTransaction(tx) && monthKey(new Date(tx.date)) === currentMonth)
      .reduce((sum, tx) => sum + safeNumber(tx.amount), 0);
    const monthIncome = transactions
      .filter((tx) => isIncomeTransaction(tx) && monthKey(new Date(tx.date)) === currentMonth)
      .reduce((sum, tx) => sum + safeNumber(tx.amount), 0);

    const expenseByCategory = new Map<string, number>();
    for (const tx of transactions) {
      if (!isExpenseTransaction(tx)) continue;
      const key = (tx.category ?? "Uncategorized").trim() || "Uncategorized";
      const next = (expenseByCategory.get(key) ?? 0) + safeNumber(tx.amount);
      expenseByCategory.set(key, next);
    }
    const topCategoryEntry = [...expenseByCategory.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
    const topCategory = topCategoryEntry?.[0] ?? "Spending";
    const topCategorySpend = topCategoryEntry?.[1] ?? 0;
    const totalExpense = transactions.filter(isExpenseTransaction).reduce((sum, tx) => sum + safeNumber(tx.amount), 0);
    const topCategoryShare = totalExpense > 0 ? topCategorySpend / totalExpense : 0;

    const generated: Array<Omit<AIInsightInsert, "user_id">> = [];

    if (subscriptions.length > 0) {
      const monthlySubscriptions = subscriptions.reduce((sum, sub) => sum + estimateMonthlySubscriptionCost(sub), 0);
      const estimatedYearlySavings = monthlySubscriptions * 12 * 0.1;
      generated.push(
        createInsight({
          type: "saving_opportunity",
          title: "Recurring payments optimization opportunity",
          description: `Ruby AI found ${subscriptions.length} recurring payments totaling about ${monthlySubscriptions.toFixed(
            0
          )} per month. There may be opportunities to optimize billing cycles or cancel low-value services.`,
          severity: "success",
          confidence: 0.82,
          financial_impact: Math.round(estimatedYearlySavings),
          suggested_action: "Review subscription billing cycles and cancel low-value plans.",
          related_entity_type: "subscription",
          related_entity_id: null,
          is_resolved: false,
        })
      );
    }

    if (goals.length > 0) {
      const progressValues = goals
        .map((goal) => {
          const target = Math.max(1, safeNumber(goal.target_amount));
          const current = Math.max(0, safeNumber(goal.current_amount));
          return Math.min(1, current / target);
        })
        .filter((value) => Number.isFinite(value));
      const avgProgress = progressValues.length ? progressValues.reduce((s, v) => s + v, 0) / progressValues.length : 0;
      generated.push(
        createInsight({
          type: "goal_progress",
          title: "Goal tracking active",
          description: `Ruby AI is tracking ${goals.length} goals. Average progress is ${(avgProgress * 100).toFixed(
            0
          )}%. Keep contributions consistent to reach targets sooner.`,
          severity: avgProgress >= 0.5 ? "success" : "info",
          confidence: 0.78,
          financial_impact: null,
          suggested_action: "Set or confirm a monthly target on each goal to accelerate progress.",
          related_entity_type: "goal",
          related_entity_id: null,
          is_resolved: false,
        })
      );
    }

    if (wallets.length > 0) {
      const lowest = wallets
        .map((wallet) => ({ id: wallet.id, name: wallet.name, balance: safeNumber(wallet.balance) }))
        .sort((a, b) => a.balance - b.balance)[0];
      const lowBalanceThreshold = 50;
      const isLow = (lowest?.balance ?? 0) < lowBalanceThreshold;
      generated.push(
        createInsight({
          type: "wallet_alert",
          title: "Wallet balances connected",
          description: `Ruby AI is now analyzing ${wallets.length} wallets. Lowest balance is ${lowest?.balance.toFixed(
            0
          )} in "${lowest?.name ?? "Wallet"}".`,
          severity: isLow ? "warning" : "info",
          confidence: 0.76,
          financial_impact: null,
          suggested_action: isLow ? "Review upcoming charges and top up low-balance wallets." : "Monitor balances weekly to avoid surprises.",
          related_entity_type: "wallet",
          related_entity_id: lowest?.id ?? null,
          is_resolved: false,
        })
      );
    }

    if (transactions.length > 0) {
      const severity = topCategoryShare >= 0.35 ? "warning" : "info";
      generated.push(
        createInsight({
          type: "spending_warning",
          title: "Recent spending analysis",
          description: `Ruby AI analyzed your recent spending. Top category is "${topCategory}" with about ${topCategorySpend.toFixed(
            0
          )} spent. Total expenses are about ${totalExpense.toFixed(0)}.`,
          severity,
          confidence: 0.8,
          financial_impact: null,
          suggested_action:
            severity === "warning"
              ? `Set a weekly cap for "${topCategory}" and review high-variance days.`
              : "Keep tracking transactions to improve insight precision.",
          related_entity_type: "transaction",
          related_entity_id: null,
          is_resolved: false,
        })
      );
    }

    if (budgets.length > 0 && transactions.length > 0) {
      const monthExpensesByCategory = new Map<string, number>();
      for (const tx of transactions) {
        if (!isExpenseTransaction(tx)) continue;
        if (monthKey(new Date(tx.date)) !== currentMonth) continue;
        const key = (tx.category ?? "Uncategorized").trim() || "Uncategorized";
        monthExpensesByCategory.set(key, (monthExpensesByCategory.get(key) ?? 0) + safeNumber(tx.amount));
      }

      const budgetUtilizations = budgets.map((budget) => {
        const spent = monthExpensesByCategory.get(budget.category) ?? 0;
        const limit = Math.max(1, safeNumber(budget.limit_amount));
        return {
          id: budget.id,
          category: budget.category,
          spent,
          limit,
          utilization: spent / limit,
        };
      });

      const riskiest = budgetUtilizations.sort((a, b) => b.utilization - a.utilization)[0] ?? null;
      if (riskiest && riskiest.utilization >= 0.85) {
        generated.push(
          createInsight({
            type: "budget_risk",
            title: "Budget risk detected",
            description: `Ruby AI detected higher budget utilization in "${riskiest.category}". You've used ${(riskiest.utilization * 100).toFixed(
              0
            )}% of the limit this month.`,
            severity: "warning",
            confidence: 0.79,
            financial_impact: Math.round(Math.max(0, riskiest.spent - riskiest.limit)),
            suggested_action: "Adjust the budget limit or reduce spending in this category for the rest of the month.",
            related_entity_type: "budget",
            related_entity_id: riskiest.id,
            is_resolved: false,
          })
        );
      }
    }

    if (monthIncome > 0 || monthExpenses > 0) {
      const net = monthIncome - monthExpenses;
      const severity = net < 0 ? "warning" : "info";
      const savingsRate = monthIncome > 0 ? (net / monthIncome) * 100 : 0;
      generated.push(
        createInsight({
          type: "financial_health_tip",
          title: "Financial health tip",
          description: `This month, income is about ${monthIncome.toFixed(0)} and expenses are about ${monthExpenses.toFixed(
            0
          )}. Estimated net is ${net.toFixed(0)} (${savingsRate.toFixed(1)}% savings rate).`,
          severity,
          confidence: 0.77,
          financial_impact: Math.round(net),
          suggested_action:
            severity === "warning"
              ? "Reduce variable spending for 7 days and review recurring costs to restore positive cash flow."
              : "Automate a small transfer to savings to reinforce your current momentum.",
          related_entity_type: "report",
          related_entity_id: null,
          is_resolved: false,
        })
      );
    }

    let created = 0;
    let skipped = 0;

    for (const insight of generated) {
      const key = dedupeKey({
        type: String(insight.type),
        title: String(insight.title),
        related_entity_type: insight.related_entity_type ?? null,
        related_entity_id: insight.related_entity_id ?? null,
      } as Pick<AIInsightRow, "type" | "title" | "related_entity_type" | "related_entity_id">);

      if (existingKeySet.has(key)) {
        skipped += 1;
        continue;
      }

      const payload: AIInsightInsert = {
        ...insight,
        user_id: authUser.id,
      };

      const { error: insertError } = await supabase.from("ai_insights").insert(payload).select("*").single();
      if (insertError) {
        if (import.meta.env.DEV) {
          console.error("[AIInsights][generate] Insert failed", {
            payload,
            error: {
              message: insertError.message,
              code: (insertError as unknown as PostgrestErrorLike).code,
              details: (insertError as unknown as PostgrestErrorLike).details,
              hint: (insertError as unknown as PostgrestErrorLike).hint,
            },
          });
        }
        return fail(
          import.meta.env.DEV
            ? formatPostgrestError(insertError as unknown as PostgrestErrorLike)
            : "Could not generate insights. Please check authentication or permissions."
        );
      }

      existingKeySet.add(key);
      created += 1;
    }

    return ok({ created, skipped });
  } catch (error) {
    if (import.meta.env.DEV) console.error("[AIInsights][generate] Unexpected error", { userId, error });
    return fail(toFriendlyError(error, "Failed to generate AI insights."));
  }
};

export type { InsightGenerationSummary };
