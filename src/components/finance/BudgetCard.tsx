import { Trash2 } from "lucide-react";
import { Budget } from "@/hooks/useFinance";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/i18n/useTranslations";
import { formatCurrency } from "@/i18n/currency";

interface BudgetCardProps {
  budget: Budget;
  spent: number;
  currency: string;
  onDelete: (id: string) => Promise<{ success: boolean }>;
}

export const BudgetCard = ({ budget, spent, currency, onDelete }: BudgetCardProps) => {
  const tBudgets = useTranslations("Budgets");
  const tCategories = useTranslations("Categories");
  const percentage = Math.min((spent / budget.limit_amount) * 100, 100);
  const isOverBudget = spent > budget.limit_amount;
  const remainingPercent = Math.max(0, ((budget.limit_amount - spent) / budget.limit_amount) * 100);

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "Entertainment":
        return tCategories("entertainment");
      case "Food & Dining":
        return tCategories("food_dining");
      case "Shopping":
        return tCategories("shopping");
      case "Transportation":
        return tCategories("transportation");
      case "Utilities":
        return tCategories("utilities");
      case "Health":
        return tCategories("health");
      case "Education":
        return tCategories("education");
      case "Travel":
        return tCategories("travel");
      case "Subscriptions":
        return tCategories("subscriptions");
      case "Other":
        return tCategories("other");
      default:
        return cat;
    }
  };

  const handleDelete = async () => {
    await onDelete(budget.id);
  };

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-lg">{getCategoryLabel(budget.category)}</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={handleDelete}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{tBudgets("spent")}</span>
          <span
            className={cn(
              "font-medium",
              isOverBudget ? "text-destructive" : "text-foreground"
            )}
          >
            {formatCurrency(spent, currency)} / {formatCurrency(budget.limit_amount, currency)}
          </span>
        </div>

        <Progress
          value={percentage}
          className={cn(
            "h-3",
            isOverBudget && "[&>div]:bg-destructive"
          )}
        />

        {isOverBudget && (
          <p className="text-xs text-destructive font-medium">
            {tBudgets("over_budget", { amount: formatCurrency(spent - budget.limit_amount, currency) })}
          </p>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        {tBudgets("remaining", { percent: remainingPercent.toFixed(0) })}
      </div>
    </div>
  );
};
