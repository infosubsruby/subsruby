import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export type RubySmartActionCard = {
  id: string;
  title: string;
  description: string;
  to: string;
  icon: ReactNode;
};

export const RubyAISmartActionCards = ({ actions }: { actions: RubySmartActionCard[] }) => {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      {actions.map((action) => (
        <article key={action.id} className="interactive-card rounded-xl border border-white/10 bg-black/25 p-3">
          <div className="mb-2 inline-flex rounded-full border border-white/10 bg-black/20 p-1.5 text-red-200">{action.icon}</div>
          <p className="text-sm font-medium text-zinc-100">{action.title}</p>
          <p className="mt-1 text-xs text-zinc-400">{action.description}</p>
          <Link
            to={action.to}
            className="mt-3 inline-flex items-center gap-1 rounded-full border border-red-500/35 bg-red-500/15 px-2.5 py-1 text-[11px] text-red-100 transition hover:bg-red-500/25"
          >
            Open Action
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </article>
      ))}
    </div>
  );
};
