import { Trash2, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Transaction } from "@/hooks/useFinance";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/i18n/useTranslations";
import { formatDate } from "@/i18n/date";
import { formatCurrency } from "@/i18n/currency";
import { useSettings } from "@/hooks/useSettings";

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => Promise<{ success: boolean }>;
}

export const TransactionList = ({ transactions, onDelete }: TransactionListProps) => {
  const tFinance = useTranslations("Finance");
  const tCategories = useTranslations("Categories");
  const { defaultCurrency } = useSettings();

  const CATEGORY_KEY_MAP: Record<string, string> = {
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
    Salary: "salary",
    Freelance: "freelance",
    Investments: "investments",
    Gifts: "gifts",
    "Other Income": "other_income",
  };

  const getCategoryLabel = (cat: string) => {
    const categoryToKey = (value: string) =>
      value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/&/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

    const mappedKey = CATEGORY_KEY_MAP[cat];
    if (mappedKey) return tCategories(mappedKey, { defaultValue: cat });

    const normalizedKey = categoryToKey(cat);
    return normalizedKey ? tCategories(normalizedKey, { defaultValue: cat }) : cat;
  };

  const handleDelete = async (id: string) => {
    await onDelete(id);
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No transactions yet. Add your first one!</p>
      </div>
    );
  }

  return (
    <>
      <div className="md:hidden glass-card rounded-xl overflow-hidden border border-border/50">
        {transactions.map((transaction) => {
          const rawDesc = (transaction.description ?? "").trim();
          const categoryLabel = getCategoryLabel(transaction.category);
          const isFallback = !rawDesc || rawDesc === transaction.category;
          const isEnglishCategoryDesc = rawDesc in CATEGORY_KEY_MAP;
          const displayDesc = isFallback
            ? categoryLabel
            : isEnglishCategoryDesc
              ? getCategoryLabel(rawDesc)
              : rawDesc;

          const absAmount = Math.abs(Number(transaction.amount) || 0);
          const currency = transaction.currency || defaultCurrency || "USD";
          const formattedAmount =
            transaction.type === "income"
              ? `+${formatCurrency(absAmount, currency)}`
              : formatCurrency(-absAmount, currency);

          return (
            <div
              key={transaction.id}
              className="flex items-center justify-between gap-3 px-3 py-2 border-b border-border/50 last:border-b-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      transaction.type === "income"
                        ? "bg-success/20 text-success"
                        : "bg-destructive/20 text-destructive"
                    )}
                  >
                    {transaction.type === "income" ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium truncate">{displayDesc}</span>
                    <Badge variant="secondary" className="font-normal text-[10px] px-1.5 py-0.5 shrink-0">
                      {categoryLabel}
                    </Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {formatDate(transaction.date, { dateStyle: "medium" })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div
                  className={cn(
                    "font-semibold text-sm",
                    transaction.type === "income" ? "text-success" : "text-foreground"
                  )}
                >
                  {formattedAmount}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(transaction.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden md:block w-full overflow-x-auto rounded-lg border border-border">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50">
              <TableHead className="w-12"></TableHead>
              <TableHead>{tFinance("table_desc")}</TableHead>
              <TableHead>{tFinance("table_category")}</TableHead>
              <TableHead>{tFinance("table_date")}</TableHead>
              <TableHead className="text-right">{tFinance("table_amount")}</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => {
              const rawDesc = (transaction.description ?? "").trim();
              const categoryLabel = getCategoryLabel(transaction.category);
              const isFallback = !rawDesc || rawDesc === transaction.category;
              const isEnglishCategoryDesc = rawDesc in CATEGORY_KEY_MAP;
              const displayDesc = isFallback
                ? categoryLabel
                : isEnglishCategoryDesc
                  ? getCategoryLabel(rawDesc)
                  : rawDesc;

              const absAmount = Math.abs(Number(transaction.amount) || 0);
              const currency = transaction.currency || defaultCurrency || "USD";
              const formattedAmount =
                transaction.type === "income"
                  ? `+${formatCurrency(absAmount, currency)}`
                  : formatCurrency(-absAmount, currency);

              return (
                <TableRow key={transaction.id} className="hover:bg-secondary/30">
                  <TableCell>
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        transaction.type === "income"
                          ? "bg-success/20 text-success"
                          : "bg-destructive/20 text-destructive"
                      )}
                    >
                      {transaction.type === "income" ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{displayDesc}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">
                      {categoryLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(transaction.date, { dateStyle: "medium" })}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-semibold",
                      transaction.type === "income" ? "text-success" : "text-foreground"
                    )}
                  >
                    {formattedAmount}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(transaction.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
};
