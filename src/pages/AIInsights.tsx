import { BrainCircuit } from "lucide-react";
import { PremiumEmptyState } from "@/components/shared/PremiumEmptyState";
import { DEMO_CATEGORIES } from "@/data/demoFinanceData";

const AIInsights = () => {
  return (
    <div className="premium-page">
      <PremiumEmptyState
        icon={<BrainCircuit className="h-5 w-5" />}
        headline="Ruby AI is waiting for financial data"
        description="Once you add transactions, subscriptions, or goals, insights will appear here automatically."
        primaryAction={{ label: "Add Financial Data", to: "/finance" }}
        secondaryAction={{ label: "Go to Subscriptions", to: "/dashboard#subscriptions" }}
        badges={DEMO_CATEGORIES.slice(0, 5)}
      />
    </div>
  );
};

export default AIInsights;
