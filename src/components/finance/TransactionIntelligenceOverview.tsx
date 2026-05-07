import { BrainCircuit, ShieldAlert, Sparkles } from "lucide-react";
import type { TransactionGlobalInsight } from "@/lib/transactionIntelligence";

const toneStyle: Record<TransactionGlobalInsight["tone"], string> = {
  info: "border-white/10 bg-black/25 text-zinc-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  positive: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
};

export const TransactionIntelligenceOverview = ({
  insights,
}: {
  insights: TransactionGlobalInsight[];
}) => {
  return (
    <section className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-2">
        <BrainCircuit className="h-4 w-4 text-red-300" />
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">
          Transaction Intelligence
        </h3>
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        {insights.map((item, index) => (
          <article key={item.id} className={`rounded-xl border px-3 py-2 ${toneStyle[item.tone]}`}>
            <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em]">
              {index === 0 ? <Sparkles className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
              {item.title}
            </div>
            <p className="text-xs leading-relaxed">{item.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

