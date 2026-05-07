import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/i18n/currency";
import { Activity, ArrowDown, ArrowUp, Banknote, CreditCard, Landmark, PiggyBank, Wallet } from "lucide-react";

export type WalletAccountType =
  | "Cash Wallet"
  | "Main Bank Account"
  | "Savings Account"
  | "Credit Card"
  | "Crypto Wallet"
  | "Investment Account"
  | "Student Card"
  | "Custom Wallet";

export type WalletHealthLabel =
  | "Healthy"
  | "High usage"
  | "Low balance"
  | "Growing"
  | "Needs attention"
  | "Credit risk";

export type WalletAccountCardData = {
  id: string;
  name: string;
  type: WalletAccountType;
  balance: number;
  monthlyChange: number;
  recentActivityCount: number;
  linkedTransactions: number;
  usagePercentage: number;
  healthLabel: WalletHealthLabel;
  aiNote: string;
};

const iconByType: Record<WalletAccountType, JSX.Element> = {
  "Cash Wallet": <Wallet className="h-4 w-4 text-emerald-300" />,
  "Main Bank Account": <Landmark className="h-4 w-4 text-sky-300" />,
  "Savings Account": <PiggyBank className="h-4 w-4 text-emerald-300" />,
  "Credit Card": <CreditCard className="h-4 w-4 text-amber-300" />,
  "Crypto Wallet": <Banknote className="h-4 w-4 text-violet-300" />,
  "Investment Account": <Activity className="h-4 w-4 text-cyan-300" />,
  "Student Card": <CreditCard className="h-4 w-4 text-indigo-300" />,
  "Custom Wallet": <Wallet className="h-4 w-4 text-zinc-300" />,
};

const healthTone: Record<WalletHealthLabel, string> = {
  Healthy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
  "High usage": "border-amber-500/35 bg-amber-500/10 text-amber-200",
  "Low balance": "border-amber-500/35 bg-amber-500/10 text-amber-200",
  Growing: "border-sky-500/30 bg-sky-500/10 text-sky-200",
  "Needs attention": "border-red-500/35 bg-red-500/10 text-red-200",
  "Credit risk": "border-red-500/35 bg-red-500/10 text-red-200",
};

export const WalletAccountCard = ({
  account,
  currency,
  onReview,
}: {
  account: WalletAccountCardData;
  currency: string;
  onReview?: () => void;
}) => {
  const isPositiveChange = account.monthlyChange >= 0;

  return (
    <article className="interactive-card rounded-2xl border border-white/10 bg-black/25 p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-white/10 bg-black/20 p-1.5">{iconByType[account.type]}</span>
            <p className="text-sm font-semibold text-zinc-100">{account.name}</p>
          </div>
          <p className="mt-1 text-xs text-zinc-400">{account.type}</p>
        </div>
        <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", healthTone[account.healthLabel])}>
          {account.healthLabel}
        </span>
      </div>

      <p className="text-2xl font-semibold text-zinc-100">{formatCurrency(account.balance, currency)}</p>
      <p className={cn("mt-1 inline-flex items-center gap-1 text-xs", isPositiveChange ? "text-emerald-300" : "text-red-300")}>
        {isPositiveChange ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
        {isPositiveChange ? "+" : "-"}
        {formatCurrency(Math.abs(account.monthlyChange), currency)} this month
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-400">
        <p>Activity: <span className="text-zinc-200">{account.recentActivityCount}</span></p>
        <p>Linked Tx: <span className="text-zinc-200">{account.linkedTransactions}</span></p>
        <p className="col-span-2">Usage: <span className="text-zinc-200">{account.usagePercentage.toFixed(1)}%</span></p>
      </div>

      <p className="mt-2 rounded-lg border border-white/10 bg-black/20 p-2 text-xs text-zinc-300">{account.aiNote}</p>

      <Button
        variant="outline"
        size="sm"
        className="mt-3 w-full border-white/15 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.08]"
        onClick={onReview}
      >
        Review Account
      </Button>
    </article>
  );
};
