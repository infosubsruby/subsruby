import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Subscription } from "@/hooks/useSubscriptions";
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
    <div className="glass-card rounded-2xl p-5 border border-border/50 w-full h-[260px] overflow-hidden">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-200 tracking-wide">{t("subscription_breakdown")}</h3>
        <div className="text-sm font-semibold text-muted-foreground">
          {formatCurrency(total, currency)}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-sm text-muted-foreground mt-3">—</div>
      ) : (
        <div className="mt-3 flex flex-row items-center gap-4 h-[calc(100%-28px)] min-h-0">
          <div className="w-36 h-36 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={38}
                  outerRadius={62}
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

          <div className="flex-1 min-w-0 h-full overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {data.map((item) => (
              <div key={item.id} className="flex items-center gap-2 w-full">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate text-xs text-gray-400 flex-1">{item.name}</span>
                <span className="text-xs font-medium text-gray-200 shrink-0">
                  {formatCurrency(item.value, currency)}
                </span>
              </div>
            ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
