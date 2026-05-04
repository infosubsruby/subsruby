import { useMemo } from "react";
import { addMonths, addYears, differenceInCalendarDays, startOfDay } from "date-fns";
import { CreditCard } from "lucide-react";
import type { Subscription } from "@/hooks/useSubscriptions";
import { subscriptionPresets } from "@/data/subscriptionPresets";
import { useTranslations } from "@/i18n/useTranslations";
import { formatDate, getActiveLocale } from "@/i18n/date";
import { formatCurrency } from "@/i18n/currency";

type UpcomingItem = {
  subscription: Subscription;
  nextPaymentDate: Date;
};

const toHexAlpha = (value: string, alphaHex: string) => {
  const hex = String(value || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return `${hex}${alphaHex}`;
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    const r = hex[1];
    const g = hex[2];
    const b = hex[3];
    return `#${r}${r}${g}${g}${b}${b}${alphaHex}`;
  }
  return "rgba(255,255,255,0.06)";
};

const computeNextPaymentDate = (subscription: Subscription): Date => {
  const rawBase =
    subscription.next_payment_date ??
    subscription.start_date ??
    subscription.created_at ??
    new Date().toISOString();
  let base = new Date(rawBase);
  if (Number.isNaN(base.getTime())) {
    base = new Date();
  }

  const today = startOfDay(new Date());
  let next = startOfDay(base);
  let guard = 0; // safety to prevent infinite loops

  while (next < today && guard < 240) {
    next =
      subscription.billing_cycle === "yearly"
        ? addYears(next, 1)
        : addMonths(next, 1);
    guard += 1;
  }

  return next < today ? today : next;
};

export const UpcomingTimeline = ({ subscriptions }: { subscriptions: Subscription[] }) => {
  const t = useTranslations("Dashboard");

  const relativeDayLabel = useMemo(() => {
    const locale = getActiveLocale();
    try {
      return new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    } catch {
      return null;
    }
  }, []);

  const items = useMemo<UpcomingItem[]>(
    () =>
      subscriptions
        .map((subscription) => ({
          subscription,
          nextPaymentDate: computeNextPaymentDate(subscription),
        }))
        .sort((a, b) => a.nextPaymentDate.getTime() - b.nextPaymentDate.getTime()),
    [subscriptions]
  );

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold mb-2">{t("upcoming_payments")}</h2>
        <button
          type="button"
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Tümünü Gör
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-gray-400">{t("no_upcoming")}</div>
      ) : (
        <div className="flex flex-col">
          {items.slice(0, 4).map(({ subscription, nextPaymentDate }) => {
            const preset = subscriptionPresets.find(
              (p) => p.slug === subscription.slug || p.name.toLowerCase() === subscription.name.toLowerCase()
            );
            const Icon = preset?.icon ?? CreditCard;
            const daysLeft = differenceInCalendarDays(nextPaymentDate, startOfDay(new Date()));
            const remainingLabel =
              relativeDayLabel?.format(daysLeft, "day") ??
              (daysLeft === 0 ? t("activity.today") : daysLeft > 0 ? `${daysLeft}` : "");

            return (
              <div
                key={subscription.id}
                className="w-full flex flex-row items-center gap-4 bg-transparent hover:bg-gray-800/30 py-2 px-2 border-b border-gray-800/40 last:border-0 transition-all duration-300 hover:-translate-y-0.5 hover:border-gray-600/60"
              >
                <div
                  className="w-8 h-8 shrink-0 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: toHexAlpha(subscription.card_color, "1A") }}
                >
                  <Icon className="w-4 h-4" style={{ color: subscription.card_color }} />
                </div>

                <div className="flex flex-col flex-1 min-w-0">
                  <p className="font-semibold text-gray-100 truncate">{subscription.name}</p>
                  <p className="text-sm text-gray-400">
                    {formatDate(nextPaymentDate, { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>

                <div className="flex flex-col items-end text-right shrink-0">
                  <p className="text-lg font-bold text-gray-100">
                    {formatCurrency(subscription.price, subscription.currency)}
                  </p>
                  <p className="text-xs text-gray-400 font-medium">{remainingLabel}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
