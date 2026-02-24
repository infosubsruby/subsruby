import { CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

export type InsightSeverity = "good" | "warning" | "danger";

export interface SubscriptionInsightProps {
  insight: {
    severity: InsightSeverity;
    title: string;
    message: string;
  };
  className?: string;
}

export const SubscriptionInsightBox: React.FC<SubscriptionInsightProps> = ({
  insight,
  className,
}) => {
  const icon =
    insight.severity === "good"
      ? CheckCircle
      : insight.severity === "warning"
      ? AlertCircle
      : AlertTriangle;

  const Icon = icon;

  const bgClass =
    insight.severity === "good"
      ? "from-emerald-500/12 to-emerald-500/6"
      : insight.severity === "warning"
      ? "from-amber-500/12 to-amber-500/6"
      : "from-rose-500/12 to-rose-500/6";

  const ringClass =
    insight.severity === "good"
      ? "ring-emerald-400/25"
      : insight.severity === "warning"
      ? "ring-amber-400/25"
      : "ring-rose-400/25";

  const borderClass =
    insight.severity === "good"
      ? "border-emerald-400/30"
      : insight.severity === "warning"
      ? "border-amber-400/30"
      : "border-rose-400/30";

  const iconBgClass =
    insight.severity === "good"
      ? "bg-emerald-500"
      : insight.severity === "warning"
      ? "bg-amber-500"
      : "bg-rose-500";

  const shadowClass =
    insight.severity === "good"
      ? "shadow-[0_0_24px_rgba(16,185,129,0.15)]"
      : insight.severity === "warning"
      ? "shadow-[0_0_24px_rgba(245,158,11,0.15)]"
      : "shadow-[0_0_24px_rgba(244,63,94,0.18)]";

  return (
    <div
      className={cn(
        "rounded-xl p-5 bg-gradient-to-br",
        bgClass,
        "border",
        borderClass,
        "ring-1",
        ringClass,
        shadowClass,
        "transition-colors",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", iconBgClass)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-display font-semibold text-lg leading-tight">
            {insight.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {insight.message}
          </p>
        </div>
      </div>
    </div>
  );
};

