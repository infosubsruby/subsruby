import { Goal } from "lucide-react";
import { FeaturePlaceholder } from "@/components/layout/FeaturePlaceholder";

const Goals = () => {
  return (
    <FeaturePlaceholder
      title="Goals"
      subtitle="Plan and track short-term and long-term financial milestones in one workspace."
      sections={["Savings Targets", "Spending Guardrails", "Milestone Tracker", "Deadline Signals", "Goal Health Timeline"]}
      icon={<Goal className="h-5 w-5" />}
    />
  );
};

export default Goals;
