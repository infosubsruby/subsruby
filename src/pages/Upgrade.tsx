import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { Button } from "@/components/ui/button";
import {
  PLAN_COMPARISON_ROWS,
  PRICING_FAQ,
  PRICING_PLANS,
  type BillingCycle,
} from "@/lib/monetization/plans";
import {
  PricingComparisonTable,
  PricingFaq,
  PricingPlanCard,
  PricingToggle,
} from "@/components/monetization/PricingBlocks";

export default function Upgrade() {
  const { activePlan, devPlanOverride, setDevPlanOverride } = usePlanAccess();
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in first.");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers,
        body: JSON.stringify({
          user_id: user.id,
          plan: billingCycle,
        }),
      });

      const data = await response.json();
      const checkoutUrl = data?.checkoutUrl;
      if (!checkoutUrl) {
        throw new Error("Checkout URL not returned");
      }

      window.location.href = checkoutUrl;
    } catch (error) {
      console.error(error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const yearlySavingsLabel = useMemo(() => {
    const proPlan = PRICING_PLANS.find((plan) => plan.id === "pro");
    if (!proPlan) return null;
    const monthlyAnnualized = proPlan.price.monthly * 12;
    const yearly = proPlan.price.yearly;
    const savings = Math.max(0, monthlyAnnualized - yearly);
    return `Save $${savings.toFixed(2)} yearly`;
  }, []);

  return (
    <div className="premium-page">
      <section className="premium-section relative overflow-hidden rounded-[30px] p-6 sm:p-7">
        <div className="pointer-events-none absolute -left-16 top-[-50px] h-52 w-52 rounded-full bg-red-600/15 blur-3xl" />
        <div className="pointer-events-none absolute right-[-50px] top-8 h-44 w-44 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-red-200">
              <Sparkles className="h-3.5 w-3.5" />
              Ruby AI Pro
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
              Pricing & Upgrade
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-zinc-400">
              Free keeps your core finance workflow useful. Ruby AI Pro unlocks predictive intelligence,
              deeper recommendations, advanced planning, and full financial command-center features.
            </p>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            Pricing shown here is mock product UI for monetization architecture.
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PricingToggle billingCycle={billingCycle} onCycleChange={setBillingCycle} />
          {yearlySavingsLabel ? (
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-200">
              {yearlySavingsLabel}
            </span>
          ) : null}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {PRICING_PLANS.map((plan) => {
            const isCurrentPlan =
              (activePlan === "free" && plan.id === "free") ||
              (activePlan === "pro" && plan.id === "pro");
            return (
              <PricingPlanCard
                key={plan.id}
                plan={plan}
                billingCycle={billingCycle}
                isCurrentPlan={isCurrentPlan}
                onAction={() => {
                  if (plan.id === "pro" && !isCurrentPlan) {
                    void handleCheckout();
                    return;
                  }
                }}
                actionLabel={plan.id === "pro" && !isCurrentPlan && loading ? "Starting checkout..." : undefined}
              />
            );
          })}
        </div>
      </section>

      <section className="premium-section rounded-[24px]">
        <h2 className="premium-heading mb-3">Plan Comparison</h2>
        <PricingComparisonTable rows={PLAN_COMPARISON_ROWS} />
      </section>

      <section className="premium-section rounded-[24px]">
        <h2 className="premium-heading mb-2">Why Ruby AI Pro</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <article className="rounded-xl border border-white/10 bg-black/25 p-4">
            <p className="text-sm font-medium text-zinc-100">Predictive finance engine</p>
            <p className="mt-1 text-xs text-zinc-400">
              Move from reactive tracking to forward-looking recommendations and risk signals.
            </p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-4">
            <p className="text-sm font-medium text-zinc-100">Personal AI CFO workflow</p>
            <p className="mt-1 text-xs text-zinc-400">
              Unlock deeper Ruby AI guidance across budgeting, reports, subscriptions, and planning.
            </p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-4">
            <p className="text-sm font-medium text-zinc-100">Full analytics and reports</p>
            <p className="mt-1 text-xs text-zinc-400">
              See advanced analytics, complete monthly reviews, and export-ready report workflows.
            </p>
          </article>
        </div>
      </section>

      <section className="premium-section rounded-[24px]">
        <h2 className="premium-heading mb-3">FAQ</h2>
        <PricingFaq items={PRICING_FAQ} />
      </section>

      <section className="premium-section rounded-[24px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-zinc-100">Ready to unlock full Ruby AI finance intelligence?</p>
            <p className="mt-1 text-xs text-zinc-400">
              Keep using Free or move to Pro when you want predictive planning, deeper insights, and advanced controls.
            </p>
          </div>
          <Button onClick={() => void handleCheckout()} disabled={loading} className="gap-2 bg-red-500 text-white hover:bg-red-400">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Upgrade to Pro
          </Button>
        </div>
      </section>

      <section className="premium-section rounded-[24px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Dev / Demo Plan Switch</p>
            <p className="mt-1 text-sm text-zinc-300">
              Active plan: <span className="font-medium text-zinc-100">{activePlan.toUpperCase()}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={devPlanOverride === "free" ? "default" : "outline"}
              onClick={() => setDevPlanOverride("free")}
            >
              Force Free
            </Button>
            <Button
              size="sm"
              variant={devPlanOverride === "pro" ? "default" : "outline"}
              onClick={() => setDevPlanOverride("pro")}
            >
              Force Pro
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDevPlanOverride(null)}>
              Use Real Subscription State
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
