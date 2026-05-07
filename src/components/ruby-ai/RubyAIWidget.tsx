import { Bot, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

type RubyAIWidgetProps = {
  title: string;
  summary: string;
  actionLabel?: string;
  compact?: boolean;
};

export const RubyAIWidget = ({
  title,
  summary,
  actionLabel = "Open Ruby AI",
  compact = false,
}: RubyAIWidgetProps) => {
  const navigate = useNavigate();

  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl ${
        compact ? "" : "min-h-[160px]"
      }`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-500/15 blur-3xl" />
      <div className="mb-2 flex items-center gap-2">
        <Bot className="h-4 w-4 text-red-300" />
        <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">{title}</p>
      </div>
      <p className="text-sm leading-relaxed text-zinc-200">{summary}</p>
      <button
        type="button"
        onClick={() => navigate("/ruby-ai")}
        className="mt-3 inline-flex items-center gap-1 rounded-full border border-red-500/35 bg-red-500/15 px-3 py-1.5 text-xs text-red-100 transition hover:bg-red-500/25"
      >
        {actionLabel}
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </section>
  );
};

