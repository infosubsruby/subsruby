import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "lucide-react";
import { useTranslations } from "@/i18n/useTranslations";
import { getActiveLocale } from "@/i18n/date";

interface BillingDayPickerProps {
  billingCycle: "monthly" | "yearly";
  billingDay: number;
  billingMonth: number;
  onBillingDayChange: (day: number) => void;
  onBillingMonthChange: (month: number) => void;
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export const BillingDayPicker = ({
  billingCycle,
  billingDay,
  billingMonth,
  onBillingDayChange,
  onBillingMonthChange,
}: BillingDayPickerProps) => {
  const t = useTranslations("Subscriptions");
  const locale = getActiveLocale();
  const months = Array.from({ length: 12 }, (_, i) => {
    const label = new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(2020, i, 1));
    return { value: i + 1, label };
  });

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        {t("billing_day")}
      </Label>
      
      <div className={`grid gap-3 ${billingCycle === "yearly" ? "grid-cols-2" : "grid-cols-1"}`}>
        {/* Month selector - only for yearly */}
        {billingCycle === "yearly" && (
          <Select 
            value={billingMonth.toString()} 
            onValueChange={(v) => onBillingMonthChange(parseInt(v))}
          >
            <SelectTrigger className="input-ruby">
              <SelectValue placeholder={t("billing_day")} />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border max-h-60">
              {months.map((month) => (
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
            <SelectValue placeholder={t("billing_day")} />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border max-h-60">
            {DAYS.map((day) => (
              <SelectItem key={day} value={day.toString()}>
                {billingCycle === "yearly" ? `${months[billingMonth - 1]?.label ?? ""} ${day}` : String(day)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("billed_on", { day: billingDay })}
      </p>
    </div>
  );
};
