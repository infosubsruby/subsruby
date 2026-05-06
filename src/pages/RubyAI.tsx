import { Bot } from "lucide-react";
import { FeaturePlaceholder } from "@/components/layout/FeaturePlaceholder";

const RubyAI = () => {
  return (
    <FeaturePlaceholder
      title="Ruby AI"
      subtitle="Your premium AI copilot for financial decisions, optimization, and forward planning."
      sections={["Conversational Finance", "What-If Simulator", "Cost Optimization Agent", "Smart Action Queue", "Decision Notes"]}
      icon={<Bot className="h-5 w-5" />}
    />
  );
};

export default RubyAI;
