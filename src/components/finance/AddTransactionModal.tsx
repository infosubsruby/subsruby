import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { CATEGORIES, CreateTransactionData } from "@/hooks/useFinance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
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

interface AddTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTransaction: (
    data: CreateTransactionData
  ) => Promise<{ success: boolean }>;
}

export const AddTransactionModal = ({
  open,
  onOpenChange,
  onCreateTransaction,
}: AddTransactionModalProps) => {
  const [formData, setFormData] = useState<CreateTransactionData>({
    amount: 0,
    type: "expense",
    category: CATEGORIES[0],
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) return;

    // Reset + close instantly for optimistic UX
    setFormData({
      amount: 0,
      type: "expense",
      category: CATEGORIES[0],
      description: "",
      date: format(new Date(), "yyyy-MM-dd"),
    });
    setSelectedDate(new Date());
    onOpenChange(false);

    // Persist in background (optimistic updates + rollback handled in hook)
    void onCreateTransaction({
      ...formData,
      date: format(selectedDate, "yyyy-MM-dd"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Add Transaction
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selection */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={formData.type === "income" ? "default" : "outline"}
              className={cn(
                formData.type === "income" &&
                  "bg-success hover:bg-success/90 text-success-foreground"
              )}
              onClick={() => setFormData((prev) => ({ ...prev, type: "income" }))}
            >
              Income
            </Button>
            <Button
              type="button"
              variant={formData.type === "expense" ? "default" : "outline"}
              className={cn(
                formData.type === "expense" &&
                  "ruby-gradient border-0"
              )}
              onClick={() => setFormData((prev) => ({ ...prev, type: "expense" }))}
            >
              Expense
            </Button>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
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

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger className="input-ruby">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
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
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
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
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a note..."
              value={formData.description || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              className="input-ruby resize-none"
              rows={2}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full ruby-gradient border-0 shadow-ruby hover:shadow-ruby-strong"
            disabled={formData.amount <= 0}
          >
            Add Transaction
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
