import { ArrowUpRight, BrainCircuit, CreditCard, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { LandingCard } from "@/components/landing/LandingPrimitives";

export const LandingMockPreview = () => {
  return (
    <div className="grid gap-3 lg:grid-cols-12">
      <div className="rounded-3xl border border-white/10 bg-black/30 p-4 shadow-[0_22px_55px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:col-span-8">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">AI Overview Dashboard</p>
          <span className="rounded-full border border-emerald-500/35 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-200">Health 78/100</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-xs text-zinc-500">Safe To Spend Today</p>
            <p className="mt-1 text-xl font-semibold text-zinc-100">$18.40</p>
            <p className="mt-1 text-xs text-zinc-400">Aligned with your monthly savings target.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-xs text-zinc-500">Subscription Savings</p>
            <p className="mt-1 text-xl font-semibold text-zinc-100">$36/year</p>
            <p className="mt-1 text-xs text-zinc-400">Two renewals are likely over-priced.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 sm:col-span-2">
            <p className="text-xs text-zinc-500">Ruby AI Signal</p>
            <p className="mt-1 text-sm text-zinc-200">
              Food spending is trending 18% above your weekly average. Reducing by $12/day for the next 10 days keeps your goal pace stable.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:col-span-4">
        <LandingCard title="Financial Health" description="Real-time score and factors." icon={<ShieldCheck className="h-4 w-4" />}>
          <p className="text-sm text-zinc-200">Savings rate improved. Subscription burden remains controlled.</p>
        </LandingCard>
        <LandingCard title="Ruby AI Assistant" description="Your personal AI CFO." icon={<BrainCircuit className="h-4 w-4" />}>
          <div className="space-y-1 text-xs text-zinc-300">
            <p className="inline-flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-red-300" />
              Can I afford this purchase?
            </p>
            <p className="inline-flex items-center gap-1">
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-300" />
              How can I save $200 this month?
            </p>
          </div>
        </LandingCard>
      </div>
    </div>
  );
};

export const LandingMiniStack = () => {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <LandingCard title="Smart Budget Planner" icon={<Wallet className="h-4 w-4" />} description="AI-driven category targets based on income and goals." />
      <LandingCard title="Subscription Optimizer" icon={<CreditCard className="h-4 w-4" />} description="Detect recurring waste, renewal risk, and yearly cost." />
      <LandingCard title="Predictive Finance" icon={<Sparkles className="h-4 w-4" />} description="Forecast month-end balance and prevent overspending." />
    </div>
  );
};
