import { BrainCircuit } from "lucide-react";
import { FeaturePlaceholder } from "@/components/layout/FeaturePlaceholder";

const AIInsights = () => {
  return (
    <FeaturePlaceholder
      title="AI Insights"
      subtitle="Actionable intelligence generated from your existing subscription and transaction data."
      sections={["Anomaly Detector", "Spending Pattern Radar", "Forecast Recommendations", "Renewal Risk Alerts", "Optimization Opportunities"]}
      icon={<BrainCircuit className="h-5 w-5" />}
    />
  );
};

export default AIInsights;
