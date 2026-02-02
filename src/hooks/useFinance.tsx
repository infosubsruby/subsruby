import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useSubscriptions, Subscription } from "./useSubscriptions";
import { toast } from "sonner";

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  description: string | null;
  date: string;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  limit_amount: number;
  created_at: string;
}

export interface CreateTransactionData {
  amount: number;
  type: "income" | "expense";
  category: string;
  description?: string;
  date: string;
}

export interface CreateBudgetData {
  category: string;
  limit_amount: number;
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

const createOptimisticId = (prefix: string) => {
  const rand =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `optimistic-${prefix}-${rand}`;
};

const normalizeDesc = (d: string | null | undefined) => (d ?? "").trim();

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
  const { user } = useAuth();
  const { subscriptions } = useSubscriptions();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      return;
    }

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (error) {
      toast.error("Failed to fetch transactions");
      console.error(error);
    } else {
      setTransactions(data as Transaction[]);
    }
  }, [user]);

  const fetchBudgets = useCallback(async () => {
    if (!user) {
      setBudgets([]);
      return;
    }

    const { data, error } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to fetch budgets");
      console.error(error);
    } else {
      setBudgets(data as Budget[]);
    }
  }, [user]);

  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      await Promise.all([fetchTransactions(), fetchBudgets()]);
      setIsLoading(false);
    };
    fetchAll();
  }, [fetchTransactions, fetchBudgets]);

  // Real-time for transactions
  useEffect(() => {
    if (!user) return;

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
            setTransactions((prev) => {
              if (prev.some((t) => t.id === incoming.id)) return prev;

              // If this matches an optimistic entry, replace it to avoid duplicates.
              const optimisticIndex = prev.findIndex(
                (t) => isOptimistic(t.id) && isSameTransactionPayload(t, incoming)
              );

              if (optimisticIndex >= 0) {
                const next = [...prev];
                next[optimisticIndex] = incoming;
                return next;
              }

              return [incoming, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            setTransactions((prev) =>
              prev.map((t) =>
                t.id === (payload.new as Transaction).id
                  ? (payload.new as Transaction)
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
  }, [user]);

  // Real-time for budgets
  useEffect(() => {
    if (!user) return;

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
  }, [user]);

  const createTransaction = async (data: CreateTransactionData) => {
    if (!user) {
      toast.error("Please sign in to add transactions");
      return { success: false };
    }

    // Optimistically add to UI immediately.
    const optimisticId = createOptimisticId("transaction");
    const optimistic: Transaction = {
      id: optimisticId,
      user_id: user.id,
      amount: Number(data.amount),
      type: data.type,
      category: data.category,
      description: data.description ?? null,
      date: data.date,
      created_at: new Date().toISOString(),
    };

    setTransactions((prev) => [optimistic, ...prev]);

    const { data: inserted, error } = await supabase
      .from("transactions")
      .insert([{ ...data, user_id: user.id }])
      .select("*")
      .maybeSingle();

    if (error || !inserted) {
      setTransactions((prev) => prev.filter((t) => t.id !== optimisticId));
      toast.error("Failed to create transaction");
      console.error(error);
      return { success: false };
    }

    setTransactions((prev) => {
      const withoutOptimistic = prev.filter((t) => t.id !== optimisticId);
      if (withoutOptimistic.some((t) => t.id === inserted.id)) return withoutOptimistic;
      return [inserted as Transaction, ...withoutOptimistic];
    });

    toast.success("Transaction added successfully!");
    return { success: true };
  };

  const deleteTransaction = async (id: string) => {
    const previous = transactions;
    setTransactions((prev) => prev.filter((t) => t.id !== id));

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

  const createBudget = async (data: CreateBudgetData) => {
    if (!user) {
      toast.error("Please sign in to add budgets");
      return { success: false };
    }

    // Optimistically add to UI immediately.
    const optimisticId = createOptimisticId("budget");
    const optimistic: Budget = {
      id: optimisticId,
      user_id: user.id,
      category: data.category,
      limit_amount: Number(data.limit_amount),
      created_at: new Date().toISOString(),
    };

    setBudgets((prev) => [optimistic, ...prev]);

    const { data: inserted, error } = await supabase
      .from("budgets")
      .insert([{ ...data, user_id: user.id }])
      .select("*")
      .maybeSingle();

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
      const monthStr = date.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      });
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
    createTransaction,
    deleteTransaction,
    createBudget,
    updateBudget,
    deleteBudget,
    getSpentByCategory,
    totalIncome,
    totalExpenses,
    totalMonthlyCost,
    netWorth,
    getMonthlyCashFlow,
    getSpendingDistribution,
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
