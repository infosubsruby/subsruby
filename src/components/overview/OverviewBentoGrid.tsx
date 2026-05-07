import { ArrowRightLeft, CalendarClock, Goal, PieChart, TrendingDown, TrendingUp, Wallet2 } from "lucide-react";
import { cn } from "@/lib/utils";

type OverviewMetric = {
  title: string;
  value: string;
  hint: string;
};

type OverviewBentoGridProps = {
  balanceCard: OverviewMetric;
  monthlySpending: OverviewMetric;
  savingsRate: OverviewMetric;
  dailySafeSpend: OverviewMetric;
  upcomingBills: OverviewMetric;
  goalProgress: OverviewMetric;
  spendingDistribution: OverviewMetric;
  cashFlowAnalytics: OverviewMetric;
};

const tileBase =
  "rounded-[24px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_14px_35px_rgba(0,0,0,0.35)] backdrop-blur-xl transition duration-200 hover:border-red-500/30 hover:shadow-[0_0_24px_rgba(239,68,68,0.12)]";

const MetricTile = ({
  icon,
  metric,
  tone = "text-zinc-100",
  className,
}: {
  icon: React.ReactNode;
  metric: OverviewMetric;
  tone?: string;
  className?: string;
}) => {
  return (
    <article className={cn(tileBase, className)}>
      <div className="mb-3 flex items-center gap-2 text-zinc-400">
        {icon}
        <p className="text-xs uppercase tracking-[0.14em]">{metric.title}</p>
      </div>
      <p className={cn("text-2xl font-semibold tracking-tight", tone)}>{metric.value}</p>
      <p className="mt-1 text-xs text-zinc-500">{metric.hint}</p>
    </article>
  );
};

export const OverviewBentoGrid = (props: OverviewBentoGridProps) => {
  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-12">
      <MetricTile
        className="xl:col-span-4"
        icon={<Wallet2 className="h-4 w-4 text-red-300" />}
        metric={props.balanceCard}
        tone="text-emerald-300"
      />
      <MetricTile
        className="xl:col-span-4"
        icon={<TrendingDown className="h-4 w-4 text-red-300" />}
        metric={props.monthlySpending}
      />
      <MetricTile
        className="xl:col-span-4"
        icon={<TrendingUp className="h-4 w-4 text-red-300" />}
        metric={props.savingsRate}
      />

      <MetricTile
        className="xl:col-span-3"
        icon={<CalendarClock className="h-4 w-4 text-red-300" />}
        metric={props.dailySafeSpend}
      />
      <MetricTile
        className="xl:col-span-3"
        icon={<CalendarClock className="h-4 w-4 text-red-300" />}
        metric={props.upcomingBills}
      />
      <MetricTile
        className="xl:col-span-3"
        icon={<Goal className="h-4 w-4 text-red-300" />}
        metric={props.goalProgress}
      />
      <MetricTile
        className="xl:col-span-3"
        icon={<PieChart className="h-4 w-4 text-red-300" />}
        metric={props.spendingDistribution}
      />

      <MetricTile
        className="xl:col-span-12"
        icon={<ArrowRightLeft className="h-4 w-4 text-red-300" />}
        metric={props.cashFlowAnalytics}
      />
    </section>
  );
};
