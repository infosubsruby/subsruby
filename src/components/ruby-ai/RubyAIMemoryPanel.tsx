import { DatabaseZap } from "lucide-react";

export const RubyAIMemoryPanel = ({ memory }: { memory: string[] }) => {
  return (
    <section className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 shadow-[0_16px_45px_rgba(0,0,0,0.4)] backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-2">
        <DatabaseZap className="h-4 w-4 text-red-300" />
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Ruby Memory Stream</h3>
      </div>
      <div className="space-y-2">
        {memory.map((item) => (
          <div key={item} className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-xs text-zinc-300">
            {item}
          </div>
        ))}
      </div>
    </section>
  );
};

