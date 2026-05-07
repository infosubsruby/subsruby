import { AlertTriangle, BadgeAlert, CircleCheckBig, CreditCard, Utensils, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

type InsightSeverity = "low" | "medium" | "high";

export type AIInsightCard = {
  title: string;
  detail: string;
  severity: InsightSeverity;
  category: "food" | "subscription" | "saving" | "behavior";
};

const severityStyles: Record<InsightSeverity, string> = {
  low: "border-emerald-500/35 bg-emerald-500/8",
  medium: "border-amber-500/35 bg-amber-500/8",
  high: "border-red-500/40 bg-red-500/10",
};

const severityBadge: Record<InsightSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const iconForCategory = (category: AIInsightCard["category"]) => {
  switch (category) {
    case "food":
      return <Utensils className="h-4 w-4 text-amber-300" />;
    case "subscription":
      return <CreditCard className="h-4 w-4 text-red-300" />;
    case "saving":
      return <Wallet className="h-4 w-4 text-emerald-300" />;
    default:
      return <BadgeAlert className="h-4 w-4 text-zinc-300" />;
  }
};

const indicatorForSeverity = (severity: InsightSeverity) => {
  if (severity === "low") return <CircleCheckBig className="h-4 w-4 text-emerald-300" />;
  if (severity === "medium") return <AlertTriangle className="h-4 w-4 text-amber-300" />;
  return <BadgeAlert className="h-4 w-4 text-red-300" />;
};

export const OverviewAIInsightsFeed = ({ cards }: { cards: AIInsightCard[] }) => {
  return (
    <section className="space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">AI Insights Feed</h2>
          <p className="mt-1 text-sm text-zinc-400">Adaptive intelligence cards generated from your live financial behavior.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {cards.map((card) => (
          <article
            key={card.title}
            className={cn(
              "group rounded-[22px] border p-5 shadow-[0_14px_35px_rgba(0,0,0,0.35)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_35px_rgba(239,68,68,0.18)]",
              severityStyles[card.severity]
            )}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="rounded-lg border border-white/10 bg-black/30 p-2">{iconForCategory(card.category)}</span>
                <h3 className="text-base font-medium text-zinc-100">{card.title}</h3>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] text-zinc-300">
                {indicatorForSeverity(card.severity)}
                {severityBadge[card.severity]}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-zinc-300">{card.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
