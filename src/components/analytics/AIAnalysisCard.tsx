import { BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SeverityLevel } from "@/types/common";

type AIAnalysisCardProps = {
  title: string;
  detail: string;
  severity: Extract<SeverityLevel, "info" | "success" | "warning">;
};

const tone = {
  info: "border-red-500/20 bg-red-500/10 text-zinc-200",
  warning: "border-amber-500/25 bg-amber-500/10 text-amber-100",
  success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-100",
} as const;

export const AIAnalysisCard = ({ title, detail, severity }: AIAnalysisCardProps) => {
  return (
    <article className={cn("rounded-xl border p-3 transition hover:brightness-110", tone[severity])}>
      <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em]">
        <BrainCircuit className="h-3.5 w-3.5" />
        AI Summary
      </div>
      <h4 className="text-sm font-semibold">{title}</h4>
      <p className="mt-1 text-xs leading-relaxed opacity-90">{detail}</p>
    </article>
  );
};
