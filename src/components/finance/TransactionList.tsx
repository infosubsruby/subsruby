import { format } from "date-fns";
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

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => Promise<{ success: boolean }>;
}

export const TransactionList = ({ transactions, onDelete }: TransactionListProps) => {
  const tFinance = useTranslations("Finance");
  const tCategories = useTranslations("Categories");

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

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      await onDelete(id);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No transactions yet. Add your first one!</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
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
          {transactions.map((transaction) => (
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
              <TableCell className="font-medium">
                {transaction.description || transaction.category}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="font-normal">
                  {getCategoryLabel(transaction.category)}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(transaction.date, { dateStyle: "medium" })}
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-semibold",
                  transaction.type === "income"
                    ? "text-success"
                    : "text-foreground"
                )}
              >
                {transaction.type === "income" ? "+" : "-"}$
                {Number(transaction.amount).toFixed(2)}
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
