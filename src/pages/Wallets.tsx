import { Wallet } from "lucide-react";
import { PremiumEmptyState } from "@/components/shared/PremiumEmptyState";
import { DEMO_WALLETS } from "@/data/demoFinanceData";

const Wallets = () => {
  return (
    <div className="premium-page">
      <PremiumEmptyState
        icon={<Wallet className="h-5 w-5" />}
        headline="Connect or create your first wallet"
        description="Track cash, cards, savings, crypto, or bank balances in one place."
        primaryAction={{ label: "Add Wallet", to: "/finance" }}
        secondaryAction={{ label: "Open Overview", to: "/overview" }}
        badges={DEMO_WALLETS}
      />
    </div>
  );
};

export default Wallets;
