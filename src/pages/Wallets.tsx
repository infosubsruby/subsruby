import { Wallet } from "lucide-react";
import { FeaturePlaceholder } from "@/components/layout/FeaturePlaceholder";

const Wallets = () => {
  return (
    <FeaturePlaceholder
      title="Wallets"
      subtitle="Manage all account balances and cash movement channels in one premium control layer."
      sections={["Account Balances", "Payment Methods", "Cash Position Stream", "Currency Exposure", "Allocation Summary"]}
      icon={<Wallet className="h-5 w-5" />}
    />
  );
};

export default Wallets;
