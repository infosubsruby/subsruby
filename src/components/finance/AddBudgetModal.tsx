import { useEffect, useState } from "react";
import { CATEGORIES, CreateBudgetData } from "@/hooks/useFinance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "@/i18n/useTranslations";
import { useSettings } from "@/hooks/useSettings";

interface AddBudgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingCategories: string[];
  onCreateBudget: (data: CreateBudgetData) => Promise<{ success: boolean }>;
}

export const AddBudgetModal = ({
  open,
  onOpenChange,
  existingCategories,
  onCreateBudget,
}: AddBudgetModalProps) => {
  const tModals = useTranslations("Modals");
  const tFinance = useTranslations("Finance");
  const tCategories = useTranslations("Categories");
  const { defaultCurrency } = useSettings();
  const currencyOptions = ["USD", "EUR", "TRY", "GBP", "MXN"];
  const [category, setCategory] = useState("");
  const [limitAmount, setLimitAmount] = useState(0);
  const [currency, setCurrency] = useState<string>(defaultCurrency || "USD");

  useEffect(() => {
    if (!open) return;
    setCurrency(defaultCurrency || "USD");
  }, [open, defaultCurrency]);

  const availableCategories = CATEGORIES.filter(
    (cat) => !existingCategories.includes(cat)
  );

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || limitAmount <= 0) return;

    // Reset + close instantly for optimistic UX
    setCategory("");
    setLimitAmount(0);
    setCurrency(defaultCurrency || "USD");
    onOpenChange(false);

    // Persist in background (optimistic updates + rollback handled in hook)
    void onCreateBudget({ category, limit_amount: limitAmount, currency });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {tModals("create_budget")}
          </DialogTitle>
          <DialogDescription>
            {tModals("budget_desc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div className="space-y-2">
            <Label>{tFinance("table_category")}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="input-ruby">
                <SelectValue placeholder={tModals("select_category")} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {availableCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {getCategoryLabel(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Limit Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="limit">{tModals("monthly_limit")}</Label>
              <Input
                id="limit"
                type="number"
                step="1"
                min="0"
                placeholder="500"
                value={limitAmount || ""}
                onChange={(e) => setLimitAmount(parseFloat(e.target.value) || 0)}
                className="input-ruby"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{tModals("currency")}</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="input-ruby">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {currencyOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full ruby-gradient border-0 shadow-ruby hover:shadow-ruby-strong"
            disabled={!category || limitAmount <= 0}
          >
            {tModals("create_budget")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
