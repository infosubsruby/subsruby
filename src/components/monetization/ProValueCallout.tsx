import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

type ProValueCalloutProps = {
  message: string;
  ctaLabel?: string;
};

export const ProValueCallout = ({ message, ctaLabel = "Explore Pro" }: ProValueCalloutProps) => {
  return (
    <div className="rounded-xl border border-red-500/25 bg-gradient-to-r from-red-500/10 to-transparent px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <Sparkles className="h-4 w-4 text-red-300" />
          <span>{message}</span>
        </div>
        <Button asChild size="sm" variant="outline" className="border-white/15 bg-black/20 text-zinc-200 hover:bg-white/[0.03]">
          <Link to="/upgrade">{ctaLabel}</Link>
        </Button>
      </div>
    </div>
  );
};
