import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const OnboardingChoiceChip = ({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition",
        selected
          ? "border-red-500/45 bg-red-500/15 text-red-100"
          : "border-white/12 bg-black/25 text-zinc-300 hover:border-white/20 hover:text-zinc-100"
      )}
    >
      {selected ? <Check className="h-3.5 w-3.5" /> : null}
      {label}
    </button>
  );
};
