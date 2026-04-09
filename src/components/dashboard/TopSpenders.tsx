import { useMemo } from "react";
import { CreditCard } from "lucide-react";
import type { Subscription } from "@/hooks/useSubscriptions";
import { subscriptionPresets } from "@/data/subscriptionPresets";
import { convertWithDynamicRates } from "@/lib/currency";
import { useTranslations } from "@/i18n/useTranslations";
import { formatCurrency } from "@/i18n/currency";
import { cn } from "@/lib/utils";

type Item = {
  id: number;
  name: string;
  monthlyValue: number;
  color: string;
  slug: string;
};

const COLORS = ["#EF4444", "#F97316", "#3B82F6"];

const parseAmount = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const cleaned = value.trim().replace(/[^0-9,.-]/g, "");
  if (!cleaned) return 0;
  const normalized =
    cleaned.includes(",") && cleaned.includes(".")
      ? cleaned.replace(/,/g, "")
      : cleaned.replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const TopSpenders = ({
  subscriptions,
  currency,
  exchangeRates,
}: {
  subscriptions: Subscription[];
  currency: string;
  exchangeRates: Record<string, number>;
}) => {
  const t = useTranslations("Dashboard");

  const { total, top } = useMemo(() => {
    const list = subscriptions ?? [];
    const mapped: Item[] = list.map((s, idx) => {
      const raw = parseAmount(s.price);
      const monthly = s.billing_cycle === "yearly" ? raw / 12 : raw;
      const converted = convertWithDynamicRates(monthly, s.currency, currency, exchangeRates);
      const monthlyValue = Number.isFinite(converted) ? converted : monthly;
      return {
        id: s.id,
        name: s.name,
        monthlyValue,
        color: COLORS[idx % COLORS.length],
        slug: s.slug,
      };
    });

    const totalMonthly = mapped.reduce((sum, i) => sum + i.monthlyValue, 0);
    const top3 = mapped
      .sort((a, b) => b.monthlyValue - a.monthlyValue)
      .slice(0, 3)
      .map((i, idx) => ({ ...i, color: COLORS[idx] ?? i.color }));

    return { total: totalMonthly, top: top3 };
  }, [subscriptions, currency, exchangeRates]);

  return (
    <div className="glass-card rounded-2xl p-5 border border-border/50 w-full">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">{t("top_spenders")}</h3>
        <div className="text-sm font-semibold text-muted-foreground">{formatCurrency(total, currency)}</div>
      </div>

      {top.length === 0 ? (
        <div className="text-sm text-muted-foreground mt-4">—</div>
      ) : (
        <div className="mt-4 space-y-4">
          {top.map((item) => {
            const percent = total > 0 ? (item.monthlyValue / total) * 100 : 0;
            const preset = subscriptionPresets.find(
              (p) => p.slug === item.slug || p.name.toLowerCase() === item.name.toLowerCase()
            );
            const Icon = preset?.icon ?? CreditCard;

            return (
              <div key={item.id} className="w-full">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: item.color }}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{Math.round(percent)}%</div>
                    </div>
                  </div>
                  <div className="font-semibold shrink-0">{formatCurrency(item.monthlyValue, currency)}</div>
                </div>

                <div className="mt-2 h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className={cn("h-full rounded-full")}
                    style={{ width: `${Math.min(100, Math.max(0, percent))}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
