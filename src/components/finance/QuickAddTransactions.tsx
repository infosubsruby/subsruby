import { useTranslations } from "@/i18n/useTranslations";
import { Button } from "@/components/ui/button";

export const QuickAddTransactions = () => {
  const t = useTranslations("finance_sidebar");
  const items = [
    { key: "coffee", label: t("categories.coffee") },
    { key: "groceries", label: t("categories.groceries") },
    { key: "gas", label: t("categories.gas") },
    { key: "shopping", label: t("categories.shopping") },
    { key: "food", label: t("categories.food") },
  ];

  return (
    <div className="glass-card rounded-2xl p-6 border border-border/50 w-full">
      <h3 className="font-display text-lg font-semibold">{t("quick_add_title")}</h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((it) => (
          <Button key={it.key} variant="outline" className="h-8 px-3 rounded-lg">
            {it.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

