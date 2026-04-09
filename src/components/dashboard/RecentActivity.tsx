import { useMemo } from "react";
import type { Subscription } from "@/hooks/useSubscriptions";
import { convertWithDynamicRates } from "@/lib/currency";
import { formatCurrency } from "@/i18n/currency";
import { formatDate } from "@/i18n/date";
import { useTranslations } from "@/i18n/useTranslations";

type ActivityItem = {
  id: number;
  name: string;
  dateLabel: string;
  amountLabel: string;
  date: Date;
};

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

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
};

const addMonths = (date: Date, months: number) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};

const addYears = (date: Date, years: number) => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
};

const relativeLabel = (date: Date) => {
  const now = new Date();
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const b = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
  return { diffDays, absolute: formatDate(date, { day: "numeric", month: "long" }) };
};

export const RecentActivity = ({
  subscriptions,
  currency,
  exchangeRates,
}: {
  subscriptions: Subscription[];
  currency: string;
  exchangeRates: Record<string, number>;
}) => {
  const t = useTranslations("Dashboard");

  const items = useMemo<ActivityItem[]>(() => {
    const list = subscriptions ?? [];
    if (list.length === 0) return [];

    const now = new Date();

    return list
      .filter((s) => !s.is_marked_unused)
      .map((s) => {
        const lastRaw =
          toDate((s as unknown as { last_payment_date?: unknown }).last_payment_date) ??
          toDate((s as unknown as { lastPaymentDate?: unknown }).lastPaymentDate) ??
          (() => {
            const next = toDate(s.next_payment_date);
            if (!next) return null;
            return s.billing_cycle === "yearly" ? addYears(next, -1) : addMonths(next, -1);
          })();

        const last = lastRaw ?? toDate(s.created_at) ?? now;

        const rawAmount = parseAmount(s.price);
        const converted = convertWithDynamicRates(rawAmount, s.currency, currency, exchangeRates);
        const amount = Number.isFinite(converted) ? converted : rawAmount;

        const { diffDays, absolute } = relativeLabel(last);
        const dateLabel =
          diffDays === 0
            ? t("activity.today")
            : diffDays === 1
              ? t("activity.yesterday")
              : diffDays > 1 && diffDays <= 7
                ? t("activity.days_ago", { days: diffDays })
                : absolute;

        return {
          id: s.id,
          name: s.name,
          dateLabel,
          amountLabel: `${formatCurrency(amount, currency)} ${t("activity.paid")}`,
          date: last,
        };
      })
      .filter((i) => i.date.getTime() <= now.getTime())
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 4);
  }, [subscriptions, currency, exchangeRates, t]);

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 w-full h-full">
      <h3 className="font-display text-lg font-semibold">{t("recent_activity")}</h3>
      {items.length === 0 ? (
        <div className="mt-4 text-sm text-gray-400">{t("activity.empty")}</div>
      ) : (
        <div className="mt-4 relative">
          <div className="absolute left-2 top-1 bottom-1 w-px bg-gray-800" />
          <div className="space-y-4">
            {items.map((it) => (
              <div key={it.id} className="relative pl-6">
                <div className="absolute left-1 top-3 w-2.5 h-2.5 rounded-full bg-gray-400/30 border border-gray-800" />
                <div className="flex items-start justify-between gap-3 text-gray-400">
                  <div className="min-w-0">
                    <div className="text-sm truncate">{it.name}</div>
                    <div className="text-xs">{it.dateLabel}</div>
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-gray-400 text-right">
                    {it.amountLabel}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
