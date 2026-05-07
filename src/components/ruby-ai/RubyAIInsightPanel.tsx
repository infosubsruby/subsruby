import { BrainCircuit, Sparkles } from "lucide-react";
import type { RubyAIInsightCard } from "@/lib/rubyAI";

const toneMap: Record<RubyAIInsightCard["tone"], string> = {
  info: "border-white/10 bg-black/25 text-zinc-200",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  positive: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
};

export const RubyAIInsightPanel = ({ cards }: { cards: RubyAIInsightCard[] }) => {
  return (
    <section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_16px_45px_rgba(0,0,0,0.4)] backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-2">
        <BrainCircuit className="h-4 w-4 text-red-300" />
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Ruby AI Insight Summary</h3>
      </div>
      <div className="space-y-2.5">
        {cards.map((card) => (
          <article key={card.title} className={`rounded-xl border px-3 py-2 ${toneMap[card.tone]}`}>
            <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em]">
              <Sparkles className="h-3.5 w-3.5" />
              {card.title}
            </div>
            <p className="text-lg font-semibold">{card.value}</p>
            <p className="text-xs opacity-90">{card.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

