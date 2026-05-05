import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { CATEGORIES, CreateTransactionData } from "@/hooks/useFinance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/i18n/useTranslations";
import { formatDate } from "@/i18n/date";
import { useSettings } from "@/hooks/useSettings";

interface AddTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTransaction: (
    data: CreateTransactionData
  ) => Promise<{ success: boolean }>;
  onSaveQuickAdd?: (item: {
    label: string;
    type: "income" | "expense";
    category: string;
    amount: number;
    currency: string;
  }) => void;
  onSaveRecurringRule?: (item: {
    type: "income" | "expense";
    category: string;
    description: string;
    amount: number;
    currency: string;
    recurringDay: string;
  }) => void;
  initialTransactionData?: Partial<CreateTransactionData> & { currency?: string };
  forcedType?: "income" | "expense";
}

export const AddTransactionModal = ({
  open,
  onOpenChange,
  onCreateTransaction,
  onSaveQuickAdd,
  onSaveRecurringRule,
  initialTransactionData,
  forcedType,
}: AddTransactionModalProps) => {
  const tModals = useTranslations("Modals");
  const tFinance = useTranslations("Finance");
  const tCategories = useTranslations("Categories");
  const { defaultCurrency } = useSettings();
  const initialType = forcedType ?? "expense";
  const currencyOptions = ["USD", "EUR", "GBP", "TRY", "MXN", "CAD", "AUD", "JPY", "INR", "BRL"];
  const INCOME_CATEGORIES = ["Salary", "Freelance", "Investments", "Gifts", "Other Income"];
  const getCategoriesForType = (type: "income" | "expense") =>
    type === "income" ? INCOME_CATEGORIES : CATEGORIES;
  const initialFormData = useMemo<CreateTransactionData>(
    () => ({
      amount: 0,
      type: initialType,
      category: "",
      description: "",
      date: format(new Date(), "yyyy-MM-dd"),
    }),
    [initialType]
  );
  const [formData, setFormData] = useState<CreateTransactionData>(initialFormData);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currency, setCurrency] = useState<string>(defaultCurrency || "USD");
  const [saveAsQuickAdd, setSaveAsQuickAdd] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "Salary":
        return tCategories("salary");
      case "Freelance":
        return tCategories("freelance");
      case "Investments":
        return tCategories("investments");
      case "Gifts":
        return tCategories("gifts");
      case "Other Income":
        return tCategories("other_income");
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

  useEffect(() => {
    if (!open) return;
    const presetType = initialTransactionData?.type ?? initialFormData.type;
    setFormData({
      ...initialFormData,
      ...initialTransactionData,
      type: presetType,
      category: "",
      description: initialTransactionData?.description ?? "",
      amount: initialTransactionData?.amount ?? 0,
    });
    setSelectedDate(new Date());
    setCurrency(initialTransactionData?.currency || defaultCurrency || "USD");
    setSaveAsQuickAdd(false);
    setIsRecurring(false);
  }, [open, initialFormData, defaultCurrency, initialTransactionData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) return;
    const effectiveType = forcedType ?? formData.type;
    const trimmedDescription = (formData.description || "").trim();

    // Reset + close instantly for optimistic UX
    setFormData(initialFormData);
    setSelectedDate(new Date());
    setSaveAsQuickAdd(false);
    setIsRecurring(false);
    onOpenChange(false);

    if (
      saveAsQuickAdd &&
      trimmedDescription.length > 0 &&
      onSaveQuickAdd
    ) {
      onSaveQuickAdd({
        label: trimmedDescription,
        type: effectiveType,
        category: formData.category,
        amount: formData.amount,
        currency,
      });
    }

    const dayToRepeat = selectedDate.getDate();

    if (isRecurring && trimmedDescription.length > 0 && onSaveRecurringRule) {
      onSaveRecurringRule({
        type: effectiveType,
        category: formData.category,
        description: trimmedDescription,
        amount: formData.amount,
        currency,
        recurringDay: String(dayToRepeat),
      });
    }

    // Persist in background (optimistic updates + rollback handled in hook)
    void onCreateTransaction({
      ...formData,
      currency,
      type: effectiveType,
      date: format(selectedDate, "yyyy-MM-dd"),
      ...(isRecurring ? { isRecurring: true, recurringDay: String(dayToRepeat) } : {}),
    });
  };

  const showQuickAddOption = (formData.description || "").trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95%] sm:w-full sm:max-w-md bg-card border-border max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {tModals("add_transaction")}
          </DialogTitle>
          <DialogDescription>
            {tModals("transaction_desc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selection */}
          {!forcedType && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={formData.type === "income" ? "default" : "outline"}
                className={cn(
                  formData.type === "income" &&
                    "bg-success hover:bg-success/90 text-success-foreground"
                )}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    type: "income",
                    category: "",
                  }))
                }
              >
                {tModals("income")}
              </Button>
              <Button
                type="button"
                variant={formData.type === "expense" ? "default" : "outline"}
                className={cn(
                  formData.type === "expense" &&
                    "ruby-gradient border-0"
                )}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    type: "expense",
                    category: "",
                  }))
                }
              >
                {tModals("expense")}
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">{tFinance("table_amount")}</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    amount: parseFloat(e.target.value) || 0,
                  }))
                }
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

          {/* Category */}
          <div className="space-y-2">
            <Label>{tFinance("table_category")}</Label>
            <Select
              value={formData.category || undefined}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger className="input-ruby">
                <SelectValue placeholder={tModals("select_category")} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="__placeholder__" disabled>
                  {tModals("select_category")}
                </SelectItem>
                {getCategoriesForType(forcedType ?? formData.type).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {getCategoryLabel(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>{tFinance("table_date")}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal input-ruby",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? formatDate(selectedDate, { dateStyle: "long" }) : tFinance("table_date")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{tModals("desc_optional")}</Label>
            <Textarea
              id="description"
              placeholder={tModals("add_note")}
              value={formData.description || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              className="input-ruby resize-none"
              rows={2}
            />
          </div>

          {showQuickAddOption && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="saveAsQuickAdd"
                checked={saveAsQuickAdd}
                onCheckedChange={(checked) => setSaveAsQuickAdd(Boolean(checked))}
              />
              <Label htmlFor="saveAsQuickAdd" className="text-sm text-gray-400 font-normal">
                Save as Quick Add shortcut
              </Label>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isRecurring" className="text-sm text-gray-400 font-normal">
                Repeat this transaction monthly
              </Label>
              <Switch
                id="isRecurring"
                checked={isRecurring}
                onCheckedChange={() => setIsRecurring(!isRecurring)}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full ruby-gradient border-0 shadow-ruby hover:shadow-ruby-strong"
            disabled={formData.amount <= 0 || !formData.category}
          >
            {tModals("add_transaction")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
