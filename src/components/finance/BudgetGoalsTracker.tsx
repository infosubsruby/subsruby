import { useTranslations } from "@/i18n/useTranslations";
import { formatCurrency } from "@/i18n/currency";
import type { Budget, Transaction } from "@/hooks/useFinance";
import { useMemo } from "react";

interface BudgetGoalsTrackerProps {
  budgets: Budget[];
  transactions: Transaction[];
  currency: string;
}

const categoryKeyMap: Record<string, string> = {
  Entertainment: "entertainment",
  "Food & Dining": "food_dining",
  Shopping: "shopping",
  Transportation: "transportation",
  Utilities: "utilities",
  Health: "health",
  Education: "education",
  Travel: "travel",
  Subscriptions: "subscriptions",
  Other: "other",
};

export const BudgetGoalsTracker = ({ budgets, transactions, currency }: BudgetGoalsTrackerProps) => {
  const t = useTranslations("finance_sidebar");
  const tCategories = useTranslations("Categories");

  const budgetGoals = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const parseLocalDate = (value: string) => new Date(`${value}T00:00:00`);

    return budgets.map((budget) => {
      const spent = transactions
        .filter((tx) => {
          if (tx.type !== "expense" || tx.category !== budget.category || !tx.date) return false;
          const txDate = parseLocalDate(tx.date);
          return txDate >= startOfMonth && txDate <= endOfMonth;
        })
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

      const total = Number(budget.limit_amount || 0);
      const remaining = total - spent;
      const percentage = total > 0 ? (spent / total) * 100 : 0;
      const clampedPercentage = Math.min(percentage, 100);

      const barColorClass =
        percentage >= 100 ? "bg-red-500" : percentage >= 80 ? "bg-yellow-500" : "bg-green-500";

      return {
        id: budget.id,
        category: budget.category,
        spent,
        total,
        remaining,
        percentage,
        clampedPercentage,
        barColorClass,
      };
    });
  }, [budgets, transactions]);

  const getCategoryLabel = (category: string) => {
    const key = categoryKeyMap[category];
    return key ? tCategories(key) : category;
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-border/50 w-full">
      <h3 className="font-display text-lg font-semibold">{t("budget_goals_title")}</h3>
      <div className="mt-4 space-y-4">
        {budgetGoals.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No budgets set for this month. Click Add Budget to start tracking.
          </div>
        ) : (
          budgetGoals.map((g) => {
            const roundedPercentage = Math.round(g.percentage);
          return (
            <div key={g.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{getCategoryLabel(g.category)}</span>
                <span className="text-muted-foreground">
                  {formatCurrency(g.spent, currency)} / {formatCurrency(g.total, currency)}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${g.barColorClass}`}
                  style={{ width: `${g.clampedPercentage}%` }}
                />
              </div>
              <div className="text-[11px] text-muted-foreground">
                {`${t("status.spent")}: ${roundedPercentage}% • ${t("status.remaining")}: ${formatCurrency(
                  g.remaining,
                  currency
                )}`}
              </div>
            </div>
          );
          })
        )}
      </div>
    </div>
  );
};
