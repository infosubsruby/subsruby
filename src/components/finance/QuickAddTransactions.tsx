import { useTranslations } from "@/i18n/useTranslations";
import { Button } from "@/components/ui/button";

export interface QuickAddItem {
  id: string;
  label: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  currency: string;
}

interface QuickAddTransactionsProps {
  items: QuickAddItem[];
  onQuickAddClick: (item: QuickAddItem) => void;
}

export const QuickAddTransactions = ({ items, onQuickAddClick }: QuickAddTransactionsProps) => {
  const t = useTranslations("finance_sidebar");

  return (
    <div className="glass-card rounded-2xl p-6 border border-border/50 w-full">
      <h3 className="font-display text-lg font-semibold">{t("quick_add_title")}</h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((it) => (
          <Button
            key={it.id}
            variant="outline"
            className="h-8 px-3 rounded-lg"
            onClick={() => onQuickAddClick(it)}
          >
            {it.label}
          </Button>
        ))}
      </div>
    </div>
  );
};
