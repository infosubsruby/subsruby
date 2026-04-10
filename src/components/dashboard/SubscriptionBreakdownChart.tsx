import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Subscription } from "@/hooks/useSubscriptions";
import { subscriptionPresets } from "@/data/subscriptionPresets";
import { convertWithDynamicRates } from "@/lib/currency";
import { useTranslations } from "@/i18n/useTranslations";
import { formatCurrency } from "@/i18n/currency";

type BreakdownItem = {
  id: number;
  name: string;
  slug: string;
  value: number;
  color: string;
};

const COLORS = [
  "#22C55E",
  "#3B82F6",
  "#A855F7",
  "#F97316",
  "#EF4444",
  "#06B6D4",
  "#EAB308",
  "#10B981",
];

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

export const SubscriptionBreakdownChart = ({
  subscriptions,
  currency,
  exchangeRates,
}: {
  subscriptions: Subscription[];
  currency: string;
  exchangeRates: Record<string, number>;
}) => {
  const t = useTranslations("Dashboard");

  const data = useMemo<BreakdownItem[]>(() => {
    const list = subscriptions ?? [];
    return list
      .map((s, idx) => {
        const raw = parseAmount(s.price);
        const monthly = s.billing_cycle === "yearly" ? raw / 12 : raw;
        const converted = convertWithDynamicRates(monthly, s.currency, currency, exchangeRates);
        const value = Number.isFinite(converted) ? converted : monthly;
        return {
          id: s.id,
          name: s.name,
          slug: s.slug,
          value,
          color: COLORS[idx % COLORS.length],
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [subscriptions, currency, exchangeRates]);

  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  return (
    <div className="glass-card rounded-2xl p-6 border border-border/50 w-full overflow-hidden">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">{t("subscription_breakdown")}</h3>
        <div className="text-sm font-semibold text-muted-foreground">
          {formatCurrency(total, currency)}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-sm text-muted-foreground mt-4">—</div>
      ) : (
        <div className="mt-4 flex flex-row items-center gap-4 h-[350px]">
          <div className="w-56 h-56 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={56}
                  outerRadius={86}
                  paddingAngle={2}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                  label={false}
                  labelLine={false}
                >
                  {data.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0]?.payload as BreakdownItem | undefined;
                    if (!item) return null;
                    return (
                      <div className="rounded-xl border border-border bg-popover/95 px-3 py-2 shadow-lg">
                        <div className="text-sm font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{formatCurrency(item.value, currency)}</div>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-2 flex-1 max-h-full overflow-y-auto pr-2 custom-scrollbar">
            {data.map((d) => {
              const preset = subscriptionPresets.find(
                (p) => p.slug === d.slug || p.name.toLowerCase() === d.name.toLowerCase()
              );
              const Icon = preset?.icon;
              return (
                <div key={d.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    {Icon ? <Icon className="w-4 h-4 text-muted-foreground shrink-0" /> : null}
                    <span className="text-sm truncate">{d.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap shrink-0">
                    {formatCurrency(d.value, currency)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
