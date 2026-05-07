import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

type UpgradeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  benefits?: string[];
  ctaLabel?: string;
  secondaryLabel?: string;
};

const DEFAULT_BENEFITS = [
  "Predictive insights and smarter forecasts",
  "Advanced budgeting and safe-to-spend guidance",
  "Monthly reports with deeper recommendations",
];

export const UpgradeModal = ({
  open,
  onOpenChange,
  title = "Unlock Ruby AI Pro",
  description = "Get predictive insights, advanced budgeting, monthly reports, and deeper financial recommendations.",
  benefits = DEFAULT_BENEFITS,
  ctaLabel = "Upgrade to Pro",
  secondaryLabel = "Maybe later",
}: UpgradeModalProps) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate("/upgrade");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden border border-red-500/25 bg-[#0d0d10] p-0 text-zinc-100">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-red-600/15 blur-3xl" />
        <div className="relative border-b border-white/10 bg-white/[0.02] p-6">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/35 bg-red-500/10">
            <Sparkles className="h-5 w-5 text-red-200" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl text-zinc-100">{title}</DialogTitle>
            <DialogDescription className="text-zinc-400">{description}</DialogDescription>
          </DialogHeader>
        </div>
        <div className="relative space-y-4 p-6">
          <div className="space-y-2">
            {benefits.slice(0, 3).map((benefit) => (
              <div key={benefit} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-300">
                {benefit}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleUpgrade} className="bg-red-500 text-white hover:bg-red-400">
              {ctaLabel}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-white/15 bg-transparent text-zinc-200 hover:bg-white/[0.03]"
            >
              {secondaryLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
