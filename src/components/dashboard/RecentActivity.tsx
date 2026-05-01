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
    <div className="w-full flex flex-col gap-4">
      <h3 className="text-base font-semibold text-gray-200 tracking-wide">{t("recent_activity")}</h3>
      {items.length === 0 ? (
        <div className="text-sm text-gray-400">{t("activity.empty")}</div>
      ) : (
        <div className="flex flex-col">
          {items.map((it) => (
            <div
              key={it.id}
              className="w-full flex items-center justify-between gap-3 bg-transparent hover:bg-gray-800/30 transition-colors py-3 px-2 border-b border-gray-800/50 last:border-0"
            >
              <div className="min-w-0">
                <div className="text-sm text-gray-200 truncate">{it.name}</div>
                <div className="text-xs text-gray-400">{it.dateLabel}</div>
              </div>
              <div className="text-xs sm:text-sm font-medium text-gray-200 text-right shrink-0">
                {it.amountLabel}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
