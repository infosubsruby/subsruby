import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const OnboardingProgress = ({
  currentStep,
  totalSteps,
  stepTitle,
}: {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
}) => {
  const progress = Math.min(100, Math.max(0, (currentStep / totalSteps) * 100));
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-xl">
      <div className="mb-2 flex items-center justify-between text-xs">
        <p className="text-zinc-400">
          Step {currentStep} of {totalSteps}
        </p>
        <p className={cn("font-medium", progress >= 100 ? "text-emerald-300" : "text-red-200")}>{progress.toFixed(0)}%</p>
      </div>
      <Progress value={progress} className="h-2 bg-zinc-800 [&>div]:bg-gradient-to-r [&>div]:from-red-500 [&>div]:to-rose-300" />
      <p className="mt-2 text-xs text-zinc-300">{stepTitle}</p>
    </div>
  );
};
