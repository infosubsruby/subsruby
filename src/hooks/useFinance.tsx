import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useSubscriptions, Subscription } from "./useSubscriptions";
import { toast } from "sonner";
import { formatMonthShortYear } from "@/i18n/date";
import type { Database } from "@/integrations/supabase/types";
import type { TransactionType } from "@/types/common";
import { financeMockDataBundle } from "@/data/mock/financeMockData";

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: Extract<TransactionType, "income" | "expense">;
  category: string;
  description: string | null;
  currency?: string | null;
  is_recurring?: boolean | null;
  recurring_day?: string | null;
  date: string;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  limit_amount: number;
  currency?: string | null;
  created_at: string;
}

export interface CreateTransactionData {
  amount: number;
  type: Extract<TransactionType, "income" | "expense">;
  category: string;
  description?: string;
  currency?: string;
  date: string;
  isRecurring?: boolean;
  recurringDay?: string;
}

export interface CreateBudgetData {
  category: string;
  limit_amount: number;
  currency?: string;
}

export const CATEGORIES = [
  "Entertainment",
  "Food & Dining",
  "Shopping",
  "Transportation",
  "Utilities",
  "Health",
  "Education",
  "Travel",
  "Subscriptions",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];
type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];
type TransactionUpdate = Database["public"]["Tables"]["transactions"]["Update"];

const createOptimisticId = (prefix: string) => {
  const rand =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `optimistic-${prefix}-${rand}`;
};

const normalizeDesc = (d: string | null | undefined) => (d ?? "").trim();

export const normalizeRecurringDayForDb = (
  value: string | number | null | undefined
): number | null => {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    const asInt = Math.trunc(value);
    return asInt >= 1 && asInt <= 31 ? asInt : null;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    const asInt = Math.trunc(parsed);
    return asInt >= 1 && asInt <= 31 ? asInt : null;
  }
  return null;
};

export const normalizeRecurringDayFromDb = (
  value: number | string | null | undefined
): string | null => {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    const asInt = Math.trunc(value);
    return asInt >= 1 && asInt <= 31 ? String(asInt) : null;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    const asInt = Math.trunc(parsed);
    return asInt >= 1 && asInt <= 31 ? String(asInt) : null;
  }
  return null;
};

const mapTransactionRowToTransaction = (row: TransactionRow): Transaction => ({
  id: row.id,
  user_id: row.user_id,
  amount: Number(row.amount),
  type: row.type === "income" ? "income" : "expense",
  category: row.category ?? "Other",
  description: row.description,
  currency: row.currency,
  is_recurring: row.is_recurring,
  recurring_day: normalizeRecurringDayFromDb(row.recurring_day),
  date: row.date ?? row.created_at.slice(0, 10),
  created_at: row.created_at,
});

const isOptimistic = (id: string) => id.startsWith("optimistic-");

const isSameTransactionPayload = (a: Transaction, b: Transaction) => {
  return (
    a.type === b.type &&
    Number(a.amount) === Number(b.amount) &&
    a.category === b.category &&
    a.date === b.date &&
    normalizeDesc(a.description) === normalizeDesc(b.description)
  );
};

export const useFinance = () => {
  const { user, isMockMode } = useAuth();
  const { subscriptions } = useSubscriptions();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      return true;
    }
    if (isMockMode) {
      const demoRows: Transaction[] = financeMockDataBundle.transactions
        .filter((item) => item.userId === user.id)
        .map((item) => ({
          id: item.id,
          user_id: item.userId,
          amount: item.amount,
          type: item.type === "income" ? "income" : "expense",
          category: item.category,
          description: item.description,
          currency: item.currency,
          is_recurring: item.isRecurring,
          recurring_day: null,
          date: item.date,
          created_at: item.createdAt,
        }));
      setTransactions(demoRows);
      return true;
    }

    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error || !data) {
        setTransactions([]);
        toast.error("Failed to fetch transactions");
        console.error(error);
        return false;
      }

      setTransactions(Array.isArray(data) ? data.map(mapTransactionRowToTransaction) : []);
      return true;
    } catch (error) {
      setTransactions([]);
      toast.error("Failed to fetch transactions");
      console.error(error);
      return false;
    }
  }, [isMockMode, user]);

  const fetchBudgets = useCallback(async () => {
    if (!user) {
      setBudgets([]);
      return true;
    }
    if (isMockMode) {
      const demoRows: Budget[] = financeMockDataBundle.budgets
        .filter((item) => item.userId === user.id)
        .map((item) => ({
          id: item.id,
          user_id: item.userId,
          category: item.categoryName,
          limit_amount: item.limitAmount,
          currency: item.currency,
          created_at: item.createdAt,
        }));
      setBudgets(demoRows);
      return true;
    }

    try {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", user.id);

      if (error || !data) {
        setBudgets([]);
        toast.error("Failed to fetch budgets");
        console.error(error);
        return false;
      }

      setBudgets(Array.isArray(data) ? (data as Budget[]) : []);
      return true;
    } catch (error) {
      setBudgets([]);
      toast.error("Failed to fetch budgets");
      console.error(error);
      return false;
    }
  }, [isMockMode, user]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const [transactionsOk, budgetsOk] = await Promise.all([
          fetchTransactions(),
          fetchBudgets(),
        ]);

        if (!transactionsOk || !budgetsOk) {
          setErrorMessage(
            "Veriler yüklenirken bir sorun oluştu, lütfen sayfayı yenileyin"
          );
        }
      } catch (error) {
        setTransactions([]);
        setBudgets([]);
        setErrorMessage(
          "Veriler yüklenirken bir sorun oluştu, lütfen sayfayı yenileyin"
        );
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, [fetchTransactions, fetchBudgets]);

  // Real-time for transactions
  useEffect(() => {
    if (!user || isMockMode) return;

    const channel = supabase
      .channel("transactions-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const incoming = payload.new as Transaction;
            const normalizedIncoming = mapTransactionRowToTransaction(payload.new as TransactionRow);
            setTransactions((prev) => {
              if (prev.some((t) => t.id === normalizedIncoming.id)) return prev;

              // If this matches an optimistic entry, replace it to avoid duplicates.
              const optimisticIndex = prev.findIndex(
                (t) => isOptimistic(t.id) && isSameTransactionPayload(t, normalizedIncoming)
              );

              if (optimisticIndex >= 0) {
                const next = [...prev];
                next[optimisticIndex] = normalizedIncoming;
                return next;
              }

              return [normalizedIncoming, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            const normalizedIncoming = mapTransactionRowToTransaction(payload.new as TransactionRow);
            setTransactions((prev) =>
              prev.map((t) =>
                t.id === normalizedIncoming.id
                  ? normalizedIncoming
                  : t
              )
            );
          } else if (payload.eventType === "DELETE") {
            setTransactions((prev) =>
              prev.filter((t) => t.id !== (payload.old as Transaction).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isMockMode, user]);

  // Real-time for budgets
  useEffect(() => {
    if (!user || isMockMode) return;

    const channel = supabase
      .channel("budgets-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "budgets",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const incoming = payload.new as Budget;
            setBudgets((prev) => {
              if (prev.some((b) => b.id === incoming.id)) return prev;

              // If this matches an optimistic entry (same category), replace it.
              const optimisticIndex = prev.findIndex(
                (b) => isOptimistic(b.id) && b.category === incoming.category
              );

              if (optimisticIndex >= 0) {
                const next = [...prev];
                next[optimisticIndex] = incoming;
                return next;
              }

              return [incoming, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            setBudgets((prev) =>
              prev.map((b) =>
                b.id === (payload.new as Budget).id
                  ? (payload.new as Budget)
                  : b
              )
            );
          } else if (payload.eventType === "DELETE") {
            setBudgets((prev) =>
              prev.filter((b) => b.id !== (payload.old as Budget).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isMockMode, user]);

  const createTransaction = async (data: CreateTransactionData) => {
    if (!user) {
      toast.error("Please sign in to add transactions");
      return { success: false };
    }
    const safeAmount = Number(data.amount);
    if (!Number.isFinite(safeAmount)) {
      toast.error("Invalid transaction amount");
      return { success: false };
    }
    const safeDate = typeof data.date === "string" ? data.date : "";
    if (!safeDate) {
      toast.error("Invalid transaction date");
      return { success: false };
    }
    const safeCategory = typeof data.category === "string" ? data.category : "";
    if (!safeCategory) {
      toast.error("Invalid transaction category");
      return { success: false };
    }
    if (isMockMode) {
      const now = new Date().toISOString();
      const demoTx: Transaction = {
        id: createOptimisticId("demo-transaction"),
        user_id: user.id,
        amount: safeAmount,
        type: data.type,
        category: safeCategory,
        description: data.description ?? null,
        currency: data.currency ?? "USD",
        is_recurring: Boolean(data.isRecurring),
        recurring_day: normalizeRecurringDayFromDb(data.recurringDay),
        date: safeDate,
        created_at: now,
      };
      setTransactions((prev) => [demoTx, ...prev]);
      toast.success("Transaction added successfully!");
      return { success: true };
    }

    // Optimistically add to UI immediately.
    const optimisticId = createOptimisticId("transaction");
    const optimistic: Transaction = {
      id: optimisticId,
      user_id: user.id,
      amount: safeAmount,
      type: data.type,
      category: safeCategory,
      description: data.description ?? null,
      currency: data.currency ?? null,
      is_recurring: Boolean(data.isRecurring),
      recurring_day: normalizeRecurringDayFromDb(data.recurringDay),
      date: safeDate,
      created_at: new Date().toISOString(),
    };

    setTransactions((prev) => [optimistic, ...prev]);

    const recurringDayForDb = normalizeRecurringDayForDb(data.recurringDay);
    const insertPayload: TransactionInsert = {
      user_id: user.id,
      amount: safeAmount,
      type: data.type,
      category: safeCategory,
      description: data.description ?? null,
      currency: data.currency ?? null,
      date: safeDate,
      is_recurring: Boolean(data.isRecurring),
      recurring_day: data.isRecurring ? recurringDayForDb : null,
    };

    const firstAttempt = await supabase.from("transactions").insert([insertPayload]).select("*").maybeSingle();
    let inserted = firstAttempt.data;
    let error = firstAttempt.error;

    if (error && data.currency != null) {
      const msg = error.message.toLowerCase();
      const isMissingCurrencyColumn =
        msg.includes("currency") && (msg.includes("column") || msg.includes("schema cache") || msg.includes("could not find"));
      if (isMissingCurrencyColumn) {
        const retryWithoutCurrency: TransactionInsert = {
          ...insertPayload,
          currency: undefined,
        };
        const retry = await supabase.from("transactions").insert([retryWithoutCurrency]).select("*").maybeSingle();
        inserted = retry.data;
        error = retry.error;
      }
    }

    if (error || !inserted) {
      setTransactions((prev) => prev.filter((t) => t.id !== optimisticId));
      toast.error("Failed to create transaction");
      console.error(error);
      return { success: false };
    }

    setTransactions((prev) => {
      const withoutOptimistic = prev.filter((t) => t.id !== optimisticId);
      if (withoutOptimistic.some((t) => t.id === inserted.id)) return withoutOptimistic;
      return [mapTransactionRowToTransaction(inserted), ...withoutOptimistic];
    });

    toast.success("Transaction added successfully!");
    return { success: true };
  };

  const deleteTransaction = async (id: string) => {
    const previous = transactions;
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    if (isMockMode) {
      toast.success("Transaction deleted!");
      return { success: true };
    }

    const { error } = await supabase.from("transactions").delete().eq("id", id);

    if (error) {
      setTransactions(previous);
      toast.error("Failed to delete transaction");
      console.error(error);
      return { success: false };
    }

    toast.success("Transaction deleted!");
    return { success: true };
  };

  const toggleTransactionRecurring = async (id: string) => {
    const target = transactions.find((t) => t.id === id);
    if (!target) return { success: false };

    const nextValue = !target.is_recurring;
    const previous = transactions;
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              is_recurring: nextValue,
              recurring_day: nextValue
                ? (t.recurring_day ?? String(new Date(`${t.date}T00:00:00`).getDate()))
                : null,
            }
          : t
      )
    );

    if (isMockMode) {
      return { success: true };
    }

    const fallbackDay = String(new Date(`${target.date}T00:00:00`).getDate());
    const normalizedRecurringDay = normalizeRecurringDayForDb(
      nextValue ? (target.recurring_day ?? fallbackDay) : null
    );
    const updatePayload: TransactionUpdate = {
      is_recurring: nextValue,
      recurring_day: nextValue ? normalizedRecurringDay : null,
    };

    const { error } = await supabase
      .from("transactions")
      .update({
        ...updatePayload,
      })
      .eq("id", id);

    if (error) {
      setTransactions(previous);
      toast.error("Failed to update recurring status");
      console.error(error);
      return { success: false };
    }

    return { success: true };
  };

  const createBudget = async (data: CreateBudgetData) => {
    if (!user) {
      toast.error("Please sign in to add budgets");
      return { success: false };
    }
    const safeLimitAmount = Number(data.limit_amount);
    if (!Number.isFinite(safeLimitAmount)) {
      toast.error("Invalid budget amount");
      return { success: false };
    }
    const safeCategory = typeof data.category === "string" ? data.category : "";
    if (!safeCategory) {
      toast.error("Invalid budget category");
      return { success: false };
    }
    if (isMockMode) {
      const demoBudget: Budget = {
        id: createOptimisticId("demo-budget"),
        user_id: user.id,
        category: safeCategory,
        limit_amount: safeLimitAmount,
        currency: data.currency ?? "USD",
        created_at: new Date().toISOString(),
      };
      setBudgets((prev) => [demoBudget, ...prev]);
      toast.success("Budget created successfully!");
      return { success: true };
    }

    // Optimistically add to UI immediately.
    const optimisticId = createOptimisticId("budget");
    const optimistic: Budget = {
      id: optimisticId,
      user_id: user.id,
      category: safeCategory,
      limit_amount: safeLimitAmount,
      currency: data.currency ?? null,
      created_at: new Date().toISOString(),
    };

    setBudgets((prev) => [optimistic, ...prev]);

    type BudgetInsert = Database["public"]["Tables"]["budgets"]["Insert"];
    const baseInsert: BudgetInsert = {
      user_id: user.id,
      category: safeCategory,
      limit_amount: safeLimitAmount,
    };
    const withCurrency = data.currency
      ? ({ ...baseInsert, currency: data.currency } as unknown as BudgetInsert)
      : baseInsert;

    const firstAttempt = await supabase.from("budgets").insert([withCurrency]).select("*").maybeSingle();
    let inserted = firstAttempt.data;
    let error = firstAttempt.error;

    if (error && data.currency) {
      const msg = error.message.toLowerCase();
      const isMissingCurrencyColumn =
        msg.includes("currency") && (msg.includes("column") || msg.includes("schema cache") || msg.includes("could not find"));
      if (isMissingCurrencyColumn) {
        const retry = await supabase.from("budgets").insert([baseInsert]).select("*").maybeSingle();
        inserted = retry.data;
        error = retry.error;
      }
    }

    if (error) {
      setBudgets((prev) => prev.filter((b) => b.id !== optimisticId));
      if (error.code === "23505") {
        toast.error("Budget for this category already exists");
      } else {
        toast.error("Failed to create budget");
      }
      console.error(error);
      return { success: false };
    }

    if (!inserted) {
      setBudgets((prev) => prev.filter((b) => b.id !== optimisticId));
      toast.error("Failed to create budget");
      return { success: false };
    }

    setBudgets((prev) => {
      const withoutOptimistic = prev.filter((b) => b.id !== optimisticId);
      if (withoutOptimistic.some((b) => b.id === inserted.id)) return withoutOptimistic;
      return [inserted as Budget, ...withoutOptimistic];
    });

    toast.success("Budget created successfully!");
    return { success: true };
  };

  const updateBudget = async (id: string, limit_amount: number) => {
    if (isMockMode) {
      setBudgets((prev) =>
        prev.map((b) => (b.id === id ? { ...b, limit_amount } : b))
      );
      toast.success("Budget updated!");
      return { success: true };
    }

    const { error } = await supabase
      .from("budgets")
      .update({ limit_amount })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update budget");
      console.error(error);
      return { success: false };
    }

    setBudgets((prev) =>
      prev.map((b) => (b.id === id ? { ...b, limit_amount } : b))
    );
    toast.success("Budget updated!");
    return { success: true };
  };

  const deleteBudget = async (id: string) => {
    const previous = budgets;
    setBudgets((prev) => prev.filter((b) => b.id !== id));

    if (isMockMode) {
      toast.success("Budget deleted!");
      return { success: true };
    }

    const { error } = await supabase.from("budgets").delete().eq("id", id);

    if (error) {
      setBudgets(previous);
      toast.error("Failed to delete budget");
      console.error(error);
      return { success: false };
    }

    toast.success("Budget deleted!");
    return { success: true };
  };

  // Calculate spending by category (subscriptions + transactions)
  const getSpentByCategory = (category: string): number => {
    // Get subscription costs for this category
    const subscriptionCost = subscriptions
      .filter((sub) => getCategoryFromSubscription(sub) === category)
      .reduce((total, sub) => {
        const monthlyPrice =
          sub.billing_cycle === "yearly" ? sub.price / 12 : sub.price;
        return total + monthlyPrice;
      }, 0);

    // Get transaction expenses for this category (current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const transactionCost = transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          t.category === category &&
          new Date(t.date) >= startOfMonth
      )
      .reduce((total, t) => total + Number(t.amount), 0);

    return subscriptionCost + transactionCost;
  };

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((total, t) => total + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((total, t) => total + Number(t.amount), 0);

  // Calculate current monthly income
  const currentMonthlyIncome = (() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return transactions
      .filter((t) => {
        const tDate = new Date(t.date);
        return t.type === "income" && tDate >= startOfMonth && tDate <= endOfMonth;
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);
  })();

  // Calculate total monthly subscription cost (no currency conversion here - let the UI handle it)
  const totalMonthlyCost = subscriptions.reduce((total, sub) => {
    const rawPrice = Number(sub.price ?? 0);
    return total + (sub.billing_cycle === "yearly" ? rawPrice / 12 : rawPrice);
  }, 0);

  const netWorth = totalIncome - (totalExpenses + totalMonthlyCost);

  // Monthly cash flow data for charts
  const getMonthlyCashFlow = () => {
    const months: { month: string; income: number; expenses: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = formatMonthShortYear(date);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthlyIncome = transactions
        .filter((t) => {
          const tDate = new Date(t.date);
          return (
            t.type === "income" && tDate >= startOfMonth && tDate <= endOfMonth
          );
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const monthlyExpenses = transactions
        .filter((t) => {
          const tDate = new Date(t.date);
          return (
            t.type === "expense" && tDate >= startOfMonth && tDate <= endOfMonth
          );
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Add subscription costs to expenses
      const monthlySubCost = totalMonthlyCost;

      months.push({
        month: monthStr,
        income: monthlyIncome,
        expenses: monthlyExpenses + monthlySubCost,
      });
    }

    return months;
  };

  // Spending distribution for pie chart
  const getSpendingDistribution = () => {
    const distribution: { name: string; value: number }[] = [];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Group transactions by category
    const categoryTotals: Record<string, number> = {};

    transactions
      .filter((t) => t.type === "expense" && new Date(t.date) >= startOfMonth)
      .forEach((t) => {
        categoryTotals[t.category] =
          (categoryTotals[t.category] || 0) + Number(t.amount);
      });

    // Add subscriptions as "Subscriptions" category
    if (totalMonthlyCost > 0) {
      categoryTotals["Subscriptions"] =
        (categoryTotals["Subscriptions"] || 0) + totalMonthlyCost;
    }

    Object.entries(categoryTotals).forEach(([name, value]) => {
      if (value > 0) {
        distribution.push({ name, value });
      }
    });

    return distribution;
  };

  return {
    transactions,
    budgets,
    subscriptions,
    isLoading,
    errorMessage,
    createTransaction,
    deleteTransaction,
    toggleTransactionRecurring,
    createBudget,
    updateBudget,
    deleteBudget,
    getSpentByCategory,
    totalIncome,
    currentMonthlyIncome,
    totalExpenses,
    totalMonthlyCost,
    netWorth,
    getMonthlyCashFlow,
    getSpendingDistribution,
    refreshTransactions: fetchTransactions,
  };
};

// Helper to categorize subscriptions
const getCategoryFromSubscription = (sub: Subscription): string => {
  const name = sub.name.toLowerCase();
  if (
    name.includes("netflix") ||
    name.includes("spotify") ||
    name.includes("disney") ||
    name.includes("hbo") ||
    name.includes("youtube") ||
    name.includes("apple music") ||
    name.includes("audible")
  ) {
    return "Entertainment";
  }
  if (name.includes("xbox") || name.includes("playstation")) {
    return "Entertainment";
  }
  if (name.includes("adobe") || name.includes("creative")) {
    return "Education";
  }
  if (name.includes("amazon") || name.includes("prime")) {
    return "Shopping";
  }
  if (name.includes("icloud") || name.includes("cloud")) {
    return "Utilities";
  }
  return "Subscriptions";
};
