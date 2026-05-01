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
      <h2 className="text-xl font-semibold mb-2">{t("upcoming_payments")}</h2>

      {items.length === 0 ? (
        <div className="text-sm text-gray-400">{t("no_upcoming")}</div>
      ) : (
        <div className="flex flex-col">
          {items.map(({ subscription, nextPaymentDate }) => {
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
                className="w-full flex flex-row items-center gap-4 bg-transparent hover:bg-gray-800/30 transition-colors py-3 px-2 border-b border-gray-800/50 last:border-0"
              >
                <div
                  className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: subscription.card_color }}
                >
                  <Icon className="w-5 h-5 text-white" />
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
                  <p className="text-sm text-green-400">{remainingLabel}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
