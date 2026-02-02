import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";

interface BillingDayPickerProps {
  billingCycle: "monthly" | "yearly";
  billingDay: number;
  billingMonth: number;
  onBillingDayChange: (day: number) => void;
  onBillingMonthChange: (month: number) => void;
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export const BillingDayPicker = ({
  billingCycle,
  billingDay,
  billingMonth,
  onBillingDayChange,
  onBillingMonthChange,
}: BillingDayPickerProps) => {
  const getDaySuffix = (day: number): string => {
    if (day >= 11 && day <= 13) return "th";
    switch (day % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        {billingCycle === "monthly" ? "Billing Day" : "Billing Date"}
      </Label>
      
      <div className={`grid gap-3 ${billingCycle === "yearly" ? "grid-cols-2" : "grid-cols-1"}`}>
        {/* Month selector - only for yearly */}
        {billingCycle === "yearly" && (
          <Select 
            value={billingMonth.toString()} 
            onValueChange={(v) => onBillingMonthChange(parseInt(v))}
          >
            <SelectTrigger className="input-ruby">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border max-h-60">
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Day selector */}
        <Select 
          value={billingDay.toString()} 
          onValueChange={(v) => onBillingDayChange(parseInt(v))}
        >
          <SelectTrigger className="input-ruby">
            <SelectValue placeholder="Day" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border max-h-60">
            {DAYS.map((day) => (
              <SelectItem key={day} value={day.toString()}>
                {day}{getDaySuffix(day)}{billingCycle === "monthly" ? " of every month" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">
        {billingCycle === "monthly" 
          ? `You'll be billed on the ${billingDay}${getDaySuffix(billingDay)} of each month`
          : `You'll be billed on ${MONTHS.find(m => m.value === billingMonth)?.label} ${billingDay}${getDaySuffix(billingDay)} each year`
        }
      </p>
    </div>
  );
};
