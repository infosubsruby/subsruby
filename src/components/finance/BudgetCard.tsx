import { Trash2 } from "lucide-react";
import { Budget } from "@/hooks/useFinance";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BudgetCardProps {
  budget: Budget;
  spent: number;
  onDelete: (id: string) => Promise<{ success: boolean }>;
}

export const BudgetCard = ({ budget, spent, onDelete }: BudgetCardProps) => {
  const percentage = Math.min((spent / budget.limit_amount) * 100, 100);
  const isOverBudget = spent > budget.limit_amount;

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this budget?")) {
      await onDelete(budget.id);
    }
  };

  return (
    <div className="glass-card rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-lg">{budget.category}</h3>
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
          <span className="text-muted-foreground">Spent</span>
          <span
            className={cn(
              "font-medium",
              isOverBudget ? "text-destructive" : "text-foreground"
            )}
          >
            ${spent.toFixed(2)} / ${budget.limit_amount.toFixed(2)}
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
            Over budget by ${(spent - budget.limit_amount).toFixed(2)}
          </p>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        {((budget.limit_amount - spent) / budget.limit_amount * 100).toFixed(0)}% remaining
      </div>
    </div>
  );
};
