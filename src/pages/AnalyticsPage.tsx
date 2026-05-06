import { BarChart3 } from "lucide-react";
import { FeaturePlaceholder } from "@/components/layout/FeaturePlaceholder";

const AnalyticsPage = () => {
  return (
    <FeaturePlaceholder
      title="Analytics"
      subtitle="Unified analytics layer for subscriptions, transactions, and recurring financial behavior."
      sections={["Revenue vs Spend", "Category Heatmap", "Monthly Variance", "Recurring Cost Trends", "Performance Snapshot"]}
      icon={<BarChart3 className="h-5 w-5" />}
    />
  );
};

export default AnalyticsPage;
