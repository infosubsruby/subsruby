import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BillingCycle, PricingPlanDefinition } from "@/lib/monetization/plans";

type PricingToggleProps = {
  billingCycle: BillingCycle;
  onCycleChange: (cycle: BillingCycle) => void;
};

type PricingPlanCardProps = {
  plan: PricingPlanDefinition;
  billingCycle: BillingCycle;
  isCurrentPlan: boolean;
  onAction: () => void;
  actionLabel?: string;
};

type PricingComparisonRow = {
  feature: string;
  free: string;
  pro: string;
};

type PricingComparisonTableProps = {
  rows: PricingComparisonRow[];
};

type PricingFaqProps = {
  items: Array<{ question: string; answer: string }>;
};

export const PricingToggle = ({ billingCycle, onCycleChange }: PricingToggleProps) => {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 p-1">
      <button
        type="button"
        onClick={() => onCycleChange("monthly")}
        className={`rounded-lg px-3 py-1.5 text-sm transition ${
          billingCycle === "monthly" ? "bg-red-500/20 text-red-100" : "text-zinc-400 hover:text-zinc-200"
        }`}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onCycleChange("yearly")}
        className={`rounded-lg px-3 py-1.5 text-sm transition ${
          billingCycle === "yearly" ? "bg-red-500/20 text-red-100" : "text-zinc-400 hover:text-zinc-200"
        }`}
      >
        Yearly
      </button>
      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-200">
        Save yearly
      </span>
    </div>
  );
};

export const PricingPlanCard = ({
  plan,
  billingCycle,
  isCurrentPlan,
  onAction,
  actionLabel,
}: PricingPlanCardProps) => {
  const price = billingCycle === "yearly" ? plan.price.yearly : plan.price.monthly;
  const priceSuffix = billingCycle === "yearly" ? "/year" : "/month";

  return (
    <article
      className={`relative rounded-2xl border p-5 ${
        plan.recommended
          ? "border-red-500/35 bg-gradient-to-b from-red-500/10 to-black/20"
          : "border-white/10 bg-black/20"
      }`}
    >
      {plan.recommended ? (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-100">
          <Sparkles className="h-3 w-3" />
          Recommended
        </span>
      ) : null}
      <p className="text-sm font-medium text-zinc-100">{plan.name}</p>
      <p className="mt-1 text-xs text-zinc-400">{plan.tagline}</p>
      <div className="mt-4">
        <p className="text-3xl font-semibold text-zinc-100">
          ${price.toLocaleString()}
          <span className="ml-1 text-sm font-normal text-zinc-400">{priceSuffix}</span>
        </p>
        <p className="mt-1 text-xs text-zinc-500">{plan.price.yearlyDiscountLabel}</p>
      </div>
      <p className="mt-3 text-sm text-zinc-300">{plan.description}</p>
      <div className="mt-4 space-y-2">
        {plan.highlights.map((item) => (
          <p key={item} className="flex items-start gap-2 text-sm text-zinc-300">
            <Check className="mt-0.5 h-4 w-4 text-red-300" />
            <span>{item}</span>
          </p>
        ))}
      </div>
      <Button
        onClick={onAction}
        className="mt-5 w-full"
        variant={plan.recommended && !isCurrentPlan ? "default" : "outline"}
      >
        {actionLabel ?? (isCurrentPlan ? "Current plan" : plan.ctaLabel)}
      </Button>
    </article>
  );
};

export const PricingComparisonTable = ({ rows }: PricingComparisonTableProps) => {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-white/10 text-zinc-300">
          <tr>
            <th className="px-4 py-3 font-medium">Feature</th>
            <th className="px-4 py-3 font-medium">Free</th>
            <th className="px-4 py-3 font-medium">Ruby AI Pro</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feature} className="border-b border-white/5 text-zinc-300 last:border-0">
              <td className="px-4 py-3 text-zinc-100">{row.feature}</td>
              <td className="px-4 py-3">{row.free}</td>
              <td className="px-4 py-3">{row.pro}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const PricingFaq = ({ items }: PricingFaqProps) => {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <article key={item.question} className="rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-medium text-zinc-100">{item.question}</p>
          <p className="mt-1 text-sm text-zinc-400">{item.answer}</p>
        </article>
      ))}
    </div>
  );
};
