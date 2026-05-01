import { useMemo } from "react";
import type { Subscription } from "@/hooks/useSubscriptions";
import { subscriptionPresets } from "@/data/subscriptionPresets";
import { convertWithDynamicRates } from "@/lib/currency";
import { formatCurrency } from "@/i18n/currency";
import { useTranslations } from "@/i18n/useTranslations";

type Insight = {
  id: string;
  tone: "good" | "warn" | "info";
  icon: string;
  message: string;
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

export const SmartInsights = ({
  subscriptions,
  currency,
  exchangeRates,
  monthlyIncome,
}: {
  subscriptions: Subscription[];
  currency: string;
  exchangeRates: Record<string, number>;
  monthlyIncome: number;
}) => {
  const t = useTranslations("Dashboard");

  const insights = useMemo<Insight[]>(() => {
    const list = subscriptions ?? [];
    if (list.length === 0) return [];

    const active = list.filter((s) => !s.is_marked_unused);

    const monthlySpend = active.reduce((sum, s) => {
      const raw = parseAmount(s.price);
      const monthly = s.billing_cycle === "yearly" ? raw / 12 : raw;
      const converted = convertWithDynamicRates(monthly, s.currency, currency, exchangeRates);
      const value = Number.isFinite(converted) ? converted : monthly;
      return sum + value;
    }, 0);

    const result: Insight[] = [];

    const discountBySlug: Record<string, number> = {
      "amazon-prime": 0.2,
      canva: 0.2,
      "disney-plus": 0.15,
      netflix: 0.15,
      spotify: 0.1,
      "youtube-premium": 0.1,
    };

    for (const s of active) {
      if (s.billing_cycle !== "monthly") continue;
      const discount = discountBySlug[s.slug];
      if (!discount) continue;

      const raw = parseAmount(s.price);
      const monthly = raw;
      const yearlyMonthly = monthly * (1 - discount);
      if (!(yearlyMonthly < monthly)) continue;

      const monthlyConverted = convertWithDynamicRates(monthly, s.currency, currency, exchangeRates);
      const yearlyMonthlyConverted = convertWithDynamicRates(yearlyMonthly, s.currency, currency, exchangeRates);
      const m = Number.isFinite(monthlyConverted) ? monthlyConverted : monthly;
      const y = Number.isFinite(yearlyMonthlyConverted) ? yearlyMonthlyConverted : yearlyMonthly;
      const yearlySavings = Math.max(0, (m - y) * 12);

      result.push({
        id: `yearly-${s.id}`,
        tone: "good",
        icon: "💡",
        message: t("insights.annual_savings", {
          planName: s.name,
          amount: formatCurrency(yearlySavings, currency),
          percentage: Math.round(discount * 100),
        }),
      });
      break;
    }

    const income = Number(monthlyIncome) || 0;
    if (income > 0 && monthlySpend > income * 0.1) {
      result.push({
        id: "budget",
        tone: "warn",
        icon: "⚠️",
        message: t("insights.budget_exceeded", {
          percentage: Math.round((monthlySpend / income) * 100),
        }),
      });
    }

    const categoryCounts = active.reduce((acc, s) => {
      const preset = subscriptionPresets.find((p) => p.slug === s.slug);
      const category = preset?.category ?? "Other";
      acc[category] = (acc[category] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const crowdedCategory = Object.entries(categoryCounts).find(([, count]) => count > 2);
    if (crowdedCategory) {
      result.push({
        id: "category",
        tone: "info",
        icon: "💡",
        message: t("insights.category_overlap"),
      });
    }

    return result.slice(0, 3);
  }, [subscriptions, currency, exchangeRates, monthlyIncome, t]);

  return (
    <div className="w-full">
      {insights.length === 0 ? (
        <div className="text-sm text-gray-400">{t("insights.empty")}</div>
      ) : (
        <div className="flex flex-col gap-3 w-full">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className={
                insight.tone === "good"
                  ? "w-full flex items-start gap-3 rounded-xl px-4 py-3 bg-emerald-500/10 border border-emerald-500/20"
                  : insight.tone === "warn"
                    ? "w-full flex items-start gap-3 rounded-xl px-4 py-3 bg-yellow-500/10 border border-yellow-500/20"
                    : "w-full flex items-start gap-3 rounded-xl px-4 py-3 bg-blue-500/10 border border-blue-500/20"
              }
            >
              <div
                className={
                  insight.tone === "good"
                    ? "shrink-0 w-7 h-7 rounded-md flex items-center justify-center bg-emerald-500/20 text-gray-200 text-sm"
                    : insight.tone === "warn"
                      ? "shrink-0 w-7 h-7 rounded-md flex items-center justify-center bg-yellow-500/20 text-yellow-200 text-sm"
                      : "shrink-0 w-7 h-7 rounded-md flex items-center justify-center bg-blue-500/20 text-blue-200 text-sm"
                }
              >
                {insight.icon}
              </div>
              <p
                className={
                  insight.tone === "good"
                    ? "text-sm text-gray-200 leading-snug line-clamp-2"
                    : "text-sm text-gray-300 leading-snug line-clamp-2"
                }
              >
                {insight.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
