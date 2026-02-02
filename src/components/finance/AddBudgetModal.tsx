import { useState } from "react";
import { CATEGORIES, CreateBudgetData } from "@/hooks/useFinance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [category, setCategory] = useState("");
  const [limitAmount, setLimitAmount] = useState(0);

  const availableCategories = CATEGORIES.filter(
    (cat) => !existingCategories.includes(cat)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || limitAmount <= 0) return;

    // Reset + close instantly for optimistic UX
    setCategory("");
    setLimitAmount(0);
    onOpenChange(false);

    // Persist in background (optimistic updates + rollback handled in hook)
    void onCreateBudget({ category, limit_amount: limitAmount });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Create Budget
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="input-ruby">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {availableCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Limit Amount */}
          <div className="space-y-2">
            <Label htmlFor="limit">Monthly Limit ($)</Label>
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

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full ruby-gradient border-0 shadow-ruby hover:shadow-ruby-strong"
            disabled={!category || limitAmount <= 0}
          >
            Create Budget
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
