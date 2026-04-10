import { useTranslations } from "@/i18n/useTranslations";
import { formatCurrency } from "@/i18n/currency";

type Goal = {
  id: string;
  nameKey: string;
  spent: number;
  total: number;
};

export const BudgetGoalsTracker = () => {
  const t = useTranslations("finance_sidebar");
  const goals: Goal[] = [
    { id: "shopping", nameKey: "categories.shopping", spent: 400, total: 500 },
    { id: "food", nameKey: "categories.food", spent: 200, total: 300 },
    { id: "gas", nameKey: "categories.gas", spent: 120, total: 200 },
  ];

  return (
    <div className="glass-card rounded-2xl p-6 border border-border/50 w-full">
      <h3 className="font-display text-lg font-semibold">{t("budget_goals_title")}</h3>
      <div className="mt-4 space-y-4">
        {goals.map((g) => {
          const pct = Math.min(100, Math.round((g.spent / g.total) * 100));
          const over = g.spent > g.total;
          return (
            <div key={g.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{t(g.nameKey)}</span>
                <span className="text-muted-foreground">
                  {formatCurrency(g.spent, "USD")} / {formatCurrency(g.total, "USD")}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${over ? "bg-destructive" : pct > 80 ? "bg-amber-500" : "bg-green-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-[11px] text-muted-foreground">
                {over ? t("status.over_budget") : `${t("status.spent")}: ${pct}% • ${t("status.remaining")}: ${Math.max(0, 100 - pct)}%`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

