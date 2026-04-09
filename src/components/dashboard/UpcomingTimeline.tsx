import { useMemo } from "react";
import { addMonths, addYears, startOfDay } from "date-fns";
import { CreditCard } from "lucide-react";
import type { Subscription } from "@/hooks/useSubscriptions";
import { subscriptionPresets } from "@/data/subscriptionPresets";
import { useTranslations } from "@/i18n/useTranslations";
import { formatDate } from "@/i18n/date";
import { formatCurrency } from "@/i18n/currency";

type UpcomingItem = {
  subscription: Subscription;
  nextPaymentDate: Date;
};

const computeNextPaymentDate = (subscription: Subscription): Date | null => {
  const rawBase = subscription.next_payment_date ?? subscription.start_date;
  const base = new Date(rawBase);
  if (Number.isNaN(base.getTime())) return null;

  const today = startOfDay(new Date());
  let next = base;
  let guard = 0;

  while (next < today && guard < 60) {
    next =
      subscription.billing_cycle === "yearly"
        ? addYears(next, 1)
        : addMonths(next, 1);
    guard += 1;
  }

  return next;
};

export const UpcomingTimeline = ({ subscriptions }: { subscriptions: Subscription[] }) => {
  const t = useTranslations("Dashboard");

  const items = useMemo<UpcomingItem[]>(() => {
    return subscriptions
      .filter((s) => !s.is_marked_unused)
      .map((subscription) => {
        const nextPaymentDate = computeNextPaymentDate(subscription);
        if (!nextPaymentDate) return null;
        return { subscription, nextPaymentDate };
      })
      .filter((v): v is UpcomingItem => v !== null)
      .sort((a, b) => a.nextPaymentDate.getTime() - b.nextPaymentDate.getTime());
  }, [subscriptions]);

  return (
    <div className="glass-card rounded-2xl p-4 lg:sticky lg:top-24">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">{t("upcoming_payments")}</h3>
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground mt-4">{t("no_upcoming")}</div>
      ) : (
        <div className="mt-4 relative">
          <div className="absolute left-2 top-1 bottom-1 w-px bg-border/60" />
          <div className="space-y-4">
            {items.map(({ subscription, nextPaymentDate }) => {
              const preset = subscriptionPresets.find(
                (p) => p.slug === subscription.slug || p.name.toLowerCase() === subscription.name.toLowerCase()
              );
              const Icon = preset?.icon ?? CreditCard;

              return (
                <div key={subscription.id} className="relative pl-7">
                  <div
                    className="absolute left-[5px] top-3 w-3 h-3 rounded-full bg-background border-2"
                    style={{ borderColor: subscription.card_color }}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: subscription.card_color }}
                      >
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{subscription.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(nextPaymentDate, { day: "numeric", month: "long" })}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-semibold shrink-0">
                      {formatCurrency(subscription.price, subscription.currency)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

