import type { TransactionTag } from "@/lib/transactionIntelligence";

const toneClass: Record<TransactionTag["tone"], string> = {
  info: "border-white/15 bg-black/25 text-zinc-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  critical: "border-red-500/35 bg-red-500/10 text-red-200",
  positive: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
};

export const TransactionAITag = ({ tag }: { tag: TransactionTag }) => {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-[0.08em] ${toneClass[tag.tone]}`}
    >
      {tag.label}
    </span>
  );
};

