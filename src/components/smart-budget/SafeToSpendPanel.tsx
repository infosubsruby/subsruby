import { Gauge, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/i18n/currency";

export const SafeToSpendPanel = ({
  safeToday,
  safeWeek,
  remainingFlexible,
  upcomingBillsImpact,
  overspendingRiskPct,
  aiExplanation,
  currency,
}: {
  safeToday: number;
  safeWeek: number;
  remainingFlexible: number;
  upcomingBillsImpact: number;
  overspendingRiskPct: number;
  aiExplanation: string;
  currency: string;
}) => {
  return (
    <section className="premium-section rounded-[24px]">
      <div className="mb-3 flex items-center gap-2">
        <Gauge className="h-4 w-4 text-red-300" />
        <h2 className="premium-heading">Safe-to-Spend System</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <article className="premium-card-quiet">
          <p className="premium-subheading">Safe Today</p>
          <p className="mt-1 text-lg font-semibold text-zinc-100">{formatCurrency(safeToday, currency)}</p>
        </article>
        <article className="premium-card-quiet">
          <p className="premium-subheading">Safe This Week</p>
          <p className="mt-1 text-lg font-semibold text-zinc-100">{formatCurrency(safeWeek, currency)}</p>
        </article>
        <article className="premium-card-quiet">
          <p className="premium-subheading">Remaining Flexible Budget</p>
          <p className="mt-1 text-sm font-medium text-zinc-100">{formatCurrency(remainingFlexible, currency)}</p>
        </article>
        <article className="premium-card-quiet">
          <p className="premium-subheading">Upcoming Bills Impact</p>
          <p className="mt-1 text-sm font-medium text-zinc-100">{formatCurrency(upcomingBillsImpact, currency)}</p>
        </article>
        <article className="premium-card-quiet">
          <p className="premium-subheading">Overspending Risk</p>
          <p className={`mt-1 text-sm font-medium ${overspendingRiskPct > 55 ? "text-red-300" : overspendingRiskPct > 35 ? "text-amber-200" : "text-emerald-300"}`}>
            {overspendingRiskPct.toFixed(1)}%
          </p>
        </article>
      </div>
      <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">
        <p className="inline-flex items-center gap-1 text-zinc-200">
          <ShieldCheck className="h-4 w-4 text-emerald-300" />
          Ruby AI explanation
        </p>
        <p className="mt-1">{aiExplanation}</p>
      </div>
    </section>
  );
};
