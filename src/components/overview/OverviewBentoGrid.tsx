import { ArrowDownRight, ArrowUpRight, CalendarClock, Gauge, TrendingDown, TrendingUp, Wallet2 } from "lucide-react";
import { cn } from "@/lib/utils";

type OverviewMetric = {
  title: string;
  value: string;
  trend: string;
  trendPositive: boolean;
  description: string;
  icon: React.ReactNode;
};

type OverviewBentoGridProps = {
  metrics: OverviewMetric[];
};

const tileBase =
  "rounded-[24px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_14px_35px_rgba(0,0,0,0.35)] backdrop-blur-xl transition duration-200 hover:border-red-500/30 hover:shadow-[0_0_24px_rgba(239,68,68,0.12)]";

const MetricTile = ({
  metric,
  className,
}: {
  metric: OverviewMetric;
  className?: string;
}) => {
  return (
    <article className={cn(tileBase, className)}>
      <div className="mb-3 flex items-center gap-2 text-zinc-400">
        {metric.icon}
        <p className="text-xs uppercase tracking-[0.14em]">{metric.title}</p>
      </div>
      <p className="text-2xl font-semibold tracking-tight text-zinc-100">{metric.value}</p>
      <div className="mt-2 flex items-center gap-1 text-xs">
        {metric.trendPositive ? (
          <ArrowUpRight className="h-3.5 w-3.5 text-emerald-300" />
        ) : (
          <ArrowDownRight className="h-3.5 w-3.5 text-red-300" />
        )}
        <span className={metric.trendPositive ? "text-emerald-300" : "text-red-300"}>{metric.trend}</span>
      </div>
      <p className="mt-1 text-xs text-zinc-500">{metric.description}</p>
    </article>
  );
};

export const OverviewBentoGrid = ({ metrics }: OverviewBentoGridProps) => {
  const [balance, income, expenses, savingsRate, safeSpend, upcomingBills] = metrics;
  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-12">
      <MetricTile className="xl:col-span-4" metric={balance ?? { title: "Total Balance", value: "-", trend: "-", trendPositive: true, description: "Current net monthly position.", icon: <Wallet2 className="h-4 w-4 text-red-300" /> }} />
      <MetricTile className="xl:col-span-4" metric={income ?? { title: "Monthly Income", value: "-", trend: "-", trendPositive: true, description: "Income captured this month.", icon: <TrendingUp className="h-4 w-4 text-red-300" /> }} />
      <MetricTile className="xl:col-span-4" metric={expenses ?? { title: "Monthly Expenses", value: "-", trend: "-", trendPositive: false, description: "Outgoing cash flow this month.", icon: <TrendingDown className="h-4 w-4 text-red-300" /> }} />
      <MetricTile className="xl:col-span-4" metric={savingsRate ?? { title: "Savings Rate", value: "-", trend: "-", trendPositive: true, description: "Savings efficiency relative to income.", icon: <TrendingUp className="h-4 w-4 text-red-300" /> }} />
      <MetricTile className="xl:col-span-4" metric={safeSpend ?? { title: "Safe To Spend Today", value: "-", trend: "-", trendPositive: true, description: "Daily AI affordability guardrail.", icon: <Gauge className="h-4 w-4 text-red-300" /> }} />
      <MetricTile className="xl:col-span-4" metric={upcomingBills ?? { title: "Upcoming Bills", value: "-", trend: "-", trendPositive: false, description: "Recurring payments due soon.", icon: <CalendarClock className="h-4 w-4 text-red-300" /> }} />
    </section>
  );
};
