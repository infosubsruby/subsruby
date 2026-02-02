import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommunitySuggestionBadgeProps {
  className?: string;
  matchCount?: number;
}

export const CommunitySuggestionBadge = ({ 
  className, 
  matchCount 
}: CommunitySuggestionBadgeProps) => {
  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full",
        "bg-primary/10 border border-primary/30",
        "text-primary text-[10px] font-medium",
        "animate-in fade-in-0 duration-300",
        className
      )}
    >
      <Sparkles className="w-3 h-3" />
      <span>
        Community suggestion
        {matchCount && matchCount > 1 && ` (${matchCount} users)`}
      </span>
    </div>
  );
};
