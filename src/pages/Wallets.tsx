import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  BrainCircuit,
  CalendarClock,
  CreditCard,
  Landmark,
  PiggyBank,
  ShieldAlert,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/i18n/currency";
import { formatDate } from "@/i18n/date";
import { useSettings } from "@/hooks/useSettings";
import { useFinance, type Transaction } from "@/hooks/useFinance";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useAuth } from "@/hooks/useAuth";
import type { WalletAccount as FinanceWallet, WalletType } from "@/domain/financeModels";
import {
  createWallet,
  deleteWallet,
  fetchWalletsSafe,
  updateWallet,
} from "@/services/core/walletService";
import type { WalletCreateInput } from "@/services/core/walletMockService";
import {
  WalletAccountCard,
  type WalletAccountCardData,
  type WalletAccountType,
} from "@/components/wallets/WalletAccountCard";
import {
  AccountHealthInsightCard,
  type AccountHealthInsight,
} from "@/components/wallets/AccountHealthInsightCard";

const monthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;

const accountTypeForTransaction = (tx: Transaction): WalletAccountType => {
  const desc = (tx.description || "").toLowerCase();
  if (desc.includes("crypto") || desc.includes("btc") || desc.includes("eth")) return "Crypto Wallet";
  if (tx.type === "income") return "Main Bank Account";
  if (tx.category === "Savings") return "Savings Account";
  if (tx.category === "Education") return "Student Card";
  if (["Subscriptions", "Shopping", "Entertainment", "Transportation"].includes(tx.category)) return "Credit Card";
  if (tx.category === "Housing" || tx.category === "Utilities") return "Main Bank Account";
  if (tx.category === "Food & Dining" || desc.includes("cash")) return "Cash Wallet";
  return "Custom Wallet";
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const Wallets = () => {
  const { profile, user, isLoading: authLoading, isMockMode } = useAuth();
  const { defaultCurrency } = useSettings();
  const { transactions } = useFinance();
  const { subscriptions } = useSubscriptions();
  const currency = defaultCurrency || "USD";
  const [walletItems, setWalletItems] = useState<FinanceWallet[]>([]);
  const [walletsLoading, setWalletsLoading] = useState(true);
  const [walletsError, setWalletsError] = useState<string | null>(null);
  const [newWalletName, setNewWalletName] = useState("");
  const [newWalletBalance, setNewWalletBalance] = useState("0");
  const [newWalletType, setNewWalletType] = useState<WalletType>("cash");

  const now = new Date();
  const currentKey = monthKey(now);
  const previousKey = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const monthlyStats = useMemo(() => {
    const currentMonthTransactions = transactions.filter((tx) => monthKey(new Date(tx.date)) === currentKey);
    const previousMonthTransactions = transactions.filter((tx) => monthKey(new Date(tx.date)) === previousKey);

    const currentIncome = currentMonthTransactions
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);
    const currentExpenses = currentMonthTransactions
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);
    const previousIncome = previousMonthTransactions
      .filter((tx) => tx.type === "income")
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);
    const previousExpenses = previousMonthTransactions
      .filter((tx) => tx.type === "expense")
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);
    const monthlySubscriptions = subscriptions.reduce((sum, sub) => {
      const amount = Math.abs(Number(sub.price) || 0);
      return sum + (sub.billing_cycle === "yearly" ? amount / 12 : amount);
    }, 0);

    return {
      currentMonthTransactions,
      currentIncome,
      currentExpenses,
      previousIncome,
      previousExpenses,
      monthlySubscriptions,
      monthlyNet: currentIncome - currentExpenses - monthlySubscriptions,
      previousMonthlyNet: previousIncome - previousExpenses - monthlySubscriptions,
    };
  }, [transactions, subscriptions, currentKey, previousKey]);

  const accounts = useMemo<WalletAccountCardData[]>(() => {
    const hasLiveData = monthlyStats.currentMonthTransactions.length > 0;
    const txByAccountCurrent = monthlyStats.currentMonthTransactions.reduce<Record<WalletAccountType, number>>(
      (acc, tx) => {
        const key = accountTypeForTransaction(tx);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {
        "Cash Wallet": 0,
        "Main Bank Account": 0,
        "Savings Account": 0,
        "Credit Card": 0,
        "Crypto Wallet": 0,
        "Investment Account": 0,
        "Student Card": 0,
        "Custom Wallet": 0,
      }
    );

    const totalActivity = Object.values(txByAccountCurrent).reduce((sum, count) => sum + count, 0);
    const income = hasLiveData ? monthlyStats.currentIncome : 6200;
    const expense = hasLiveData ? monthlyStats.currentExpenses : 4380;
    const monthlyNet = hasLiveData ? monthlyStats.monthlyNet : 1734;
    const previousNet = hasLiveData ? monthlyStats.previousMonthlyNet : 1540;
    const netDelta = monthlyNet - previousNet;
    const subs = hasLiveData ? monthlyStats.monthlySubscriptions : 86;

    const creditLimit = 5000;
    const creditUsed = clamp(Math.max(340, expense * 0.27 + subs * 4), 280, creditLimit * 0.95);
    const currentBalances: Record<WalletAccountType, number> = {
      "Cash Wallet": Math.max(140, expense * 0.07),
      "Main Bank Account": Math.max(900, income * 0.44 + monthlyNet * 0.28),
      "Savings Account": Math.max(1200, income * 0.35 + Math.max(monthlyNet, 0) * 1.1),
      "Credit Card": -creditUsed,
      "Crypto Wallet": Math.max(260, Math.abs(monthlyNet) * 0.18 + 840),
      "Investment Account": Math.max(720, income * 0.24 + 1240),
      "Student Card": Math.max(120, income * 0.05 + 200),
      "Custom Wallet": Math.max(200, 300 + netDelta * 0.2),
    };
    const previousBalances: Record<WalletAccountType, number> = {
      "Cash Wallet": Math.max(120, expense * 0.075 - 25),
      "Main Bank Account": Math.max(860, income * 0.42 + previousNet * 0.26),
      "Savings Account": Math.max(1100, income * 0.33 + Math.max(previousNet, 0)),
      "Credit Card": -Math.max(300, expense * 0.24 + subs * 3.5),
      "Crypto Wallet": Math.max(220, Math.abs(previousNet) * 0.16 + 780),
      "Investment Account": Math.max(650, income * 0.22 + 1170),
      "Student Card": Math.max(110, income * 0.045 + 180),
      "Custom Wallet": Math.max(180, 280 + (previousNet - netDelta) * 0.15),
    };

    const accountOrder: { type: WalletAccountType; name: string; aiNote: string }[] = [
      {
        type: "Cash Wallet",
        name: "Cash Wallet",
        aiNote: "Cash covers small daily spend; keep at least one week of essentials available.",
      },
      {
        type: "Main Bank Account",
        name: "Main Bank Account",
        aiNote: "Primary account handles most income and bill outflows. Keep a liquidity buffer.",
      },
      {
        type: "Savings Account",
        name: "Savings Account",
        aiNote: "Savings momentum is a key resilience signal in your financial health profile.",
      },
      {
        type: "Credit Card",
        name: "Credit Card",
        aiNote: "Credit usage should stay below 30% utilization to reduce risk and improve score quality.",
      },
      {
        type: "Crypto Wallet",
        name: "Crypto Wallet",
        aiNote: "Crypto allocation introduces volatility. Keep it aligned with your risk tolerance.",
      },
      {
        type: "Investment Account",
        name: "Investment Account",
        aiNote: "Long-term compounding improves net worth stability over multi-year periods.",
      },
      {
        type: "Student Card",
        name: "Student Card",
        aiNote: "Track educational spend separately to understand skill investment ROI.",
      },
      {
        type: "Custom Wallet",
        name: "Travel Cash Envelope",
        aiNote: "Use custom wallets for planned spending pools and short-term goals.",
      },
    ];

    return accountOrder.map(({ type, name, aiNote }) => {
      const balance = currentBalances[type];
      const monthlyChange = balance - previousBalances[type];
      const activity = txByAccountCurrent[type] || 0;
      const usagePercentage = totalActivity > 0 ? (activity / totalActivity) * 100 : type === "Main Bank Account" ? 34 : 8;
      const creditUtilization = type === "Credit Card" ? (Math.abs(balance) / creditLimit) * 100 : 0;

      const healthLabel: WalletAccountCardData["healthLabel"] =
        type === "Credit Card" && creditUtilization > 30
          ? "Credit risk"
          : type !== "Credit Card" && balance < 250
          ? "Low balance"
          : usagePercentage > 28
          ? "High usage"
          : monthlyChange > 0
          ? "Growing"
          : monthlyChange < -120
          ? "Needs attention"
          : "Healthy";

      return {
        id: type.toLowerCase().replace(/\s+/g, "-"),
        name,
        type,
        balance,
        monthlyChange,
        recentActivityCount: activity,
        linkedTransactions: activity,
        usagePercentage,
        healthLabel,
        aiNote,
      };
    });
  }, [monthlyStats]);

  const walletSummary = useMemo(() => {
    const assets = accounts.filter((a) => a.balance >= 0).reduce((sum, a) => sum + a.balance, 0);
    const liabilities = accounts.filter((a) => a.balance < 0).reduce((sum, a) => sum + Math.abs(a.balance), 0);
    const netWorth = assets - liabilities;
    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
    const cash = accounts
      .filter((a) => ["Cash Wallet", "Main Bank Account"].includes(a.type))
      .reduce((sum, a) => sum + Math.max(a.balance, 0), 0);
    const savings = accounts
      .filter((a) => ["Savings Account", "Investment Account"].includes(a.type))
      .reduce((sum, a) => sum + Math.max(a.balance, 0), 0);
    const creditUsed = Math.abs(accounts.find((a) => a.type === "Credit Card")?.balance || 0);
    const monthlyMovement = accounts.reduce((sum, a) => sum + a.monthlyChange, 0);
    const mostUsed = [...accounts].sort((a, b) => b.recentActivityCount - a.recentActivityCount)[0];
    const assetAllocation = [
      { label: "Cash", value: cash },
      { label: "Savings", value: Math.max(accounts.find((a) => a.type === "Savings Account")?.balance || 0, 0) },
      { label: "Investments", value: Math.max(accounts.find((a) => a.type === "Investment Account")?.balance || 0, 0) },
      { label: "Crypto", value: Math.max(accounts.find((a) => a.type === "Crypto Wallet")?.balance || 0, 0) },
    ];
    const liabilityRatio = assets > 0 ? (liabilities / assets) * 100 : 0;
    return {
      totalBalance,
      netWorth,
      assets,
      liabilities,
      cash,
      savings,
      creditUsed,
      monthlyMovement,
      mostUsed,
      accountCount: accounts.length,
      assetAllocation,
      liabilityRatio,
    };
  }, [accounts]);

  const accountHealthInsights = useMemo<AccountHealthInsight[]>(() => {
    const savingsAccount = accounts.find((a) => a.type === "Savings Account");
    const mainAccount = accounts.find((a) => a.type === "Main Bank Account");
    const creditAccount = accounts.find((a) => a.type === "Credit Card");
    const cashAccount = accounts.find((a) => a.type === "Cash Wallet");
    const cryptoAccount = accounts.find((a) => a.type === "Crypto Wallet");

    const averageDailySpend = monthlyStats.currentExpenses > 0 ? monthlyStats.currentExpenses / 30 : 0;
    const coverageDays = mainAccount && averageDailySpend > 0 ? mainAccount.balance / averageDailySpend : 0;
    const creditLimit = 5000;
    const creditUtilization = creditAccount ? (Math.abs(creditAccount.balance) / creditLimit) * 100 : 0;

    return [
      {
        id: "savings-growth",
        title: "Savings account increased this month",
        category: "Savings Momentum",
        explanation: `Savings balance changed by ${formatCurrency(savingsAccount?.monthlyChange || 0, currency)} this month.`,
        severity: (savingsAccount?.monthlyChange || 0) > 0 ? "low" : "medium",
        confidencePct: 91,
        suggestedAction: "Continue auto-transfer from your main account to sustain growth velocity.",
      },
      {
        id: "credit-usage",
        title: "Credit card usage is above recommended range",
        category: "Credit Risk",
        explanation: `Current credit utilization is ${creditUtilization.toFixed(1)}%.`,
        severity: creditUtilization > 35 ? "high" : "medium",
        confidencePct: 94,
        suggestedAction: "Lower card balance below 30% utilization before the next statement date.",
      },
      {
        id: "cash-level",
        title: "Cash wallet level versus spending habits",
        category: "Liquidity",
        explanation: `Cash wallet currently holds ${formatCurrency(cashAccount?.balance || 0, currency)}.`,
        severity: (cashAccount?.balance || 0) < averageDailySpend * 7 ? "medium" : "low",
        confidencePct: 83,
        suggestedAction: "Keep at least one week of daily spend in cash for short-term flexibility.",
      },
      {
        id: "main-coverage",
        title: "Main account coverage horizon",
        category: "Runway",
        explanation: `Main account can cover approximately ${Math.max(0, coverageDays).toFixed(0)} days of average spending.`,
        severity: coverageDays < 14 ? "high" : coverageDays < 21 ? "medium" : "low",
        confidencePct: 87,
        suggestedAction: "Increase buffer in your main account to strengthen near-term resilience.",
      },
      {
        id: "crypto-volatility",
        title: "Crypto wallet volatility may affect net worth",
        category: "Volatility",
        explanation: `Crypto currently represents ${((Math.max(cryptoAccount?.balance || 0, 0) / Math.max(walletSummary.assets, 1)) * 100).toFixed(1)}% of assets.`,
        severity: (cryptoAccount?.balance || 0) > walletSummary.assets * 0.2 ? "medium" : "low",
        confidencePct: 78,
        suggestedAction: "Keep volatile allocations within your target risk policy.",
      },
    ];
  }, [accounts, monthlyStats.currentExpenses, currency, walletSummary.assets]);

  const accountCashFlow = useMemo(() => {
    const rows = accounts.map((account) => {
      const linked = monthlyStats.currentMonthTransactions.filter((tx) => accountTypeForTransaction(tx) === account.type);
      const incomeReceived = linked.filter((tx) => tx.type === "income").reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);
      const expensesPaid = linked.filter((tx) => tx.type === "expense").reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);
      const transferBase = monthlyStats.monthlyNet > 0 ? monthlyStats.monthlyNet * 0.12 : 0;
      const transfers =
        account.type === "Savings Account" || account.type === "Investment Account"
          ? transferBase
          : account.type === "Credit Card"
          ? -Math.abs(transferBase * 0.7)
          : 0;
      return {
        id: account.id,
        name: account.name,
        incomeReceived,
        expensesPaid,
        transfers,
        balanceChange: account.monthlyChange,
      };
    });
    const mostActive = [...accounts].sort((a, b) => b.recentActivityCount - a.recentActivityCount)[0];
    return { rows, mostActive };
  }, [accounts, monthlyStats]);

  const creditOverview = useMemo(() => {
    const credit = accounts.find((a) => a.type === "Credit Card");
    const limit = 5000;
    const used = Math.abs(credit?.balance || 0);
    const remaining = Math.max(0, limit - used);
    const utilization = (used / limit) * 100;
    const paymentDue = new Date(now.getFullYear(), now.getMonth(), 26);
    const riskLabel = utilization > 45 ? "High risk" : utilization > 30 ? "Needs attention" : "Healthy";
    const recommendation =
      utilization > 30
        ? "Your credit utilization is above 30%. Consider lowering usage to improve financial health."
        : "Credit utilization is currently in a healthy range.";
    return { used, remaining, utilization, paymentDue, riskLabel, recommendation, limit };
  }, [accounts, now]);

  const recentActivity = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .map((tx) => ({
        id: tx.id,
        accountType: accountTypeForTransaction(tx),
        merchant: tx.description || tx.category,
        category: tx.category,
        date: tx.date,
        amount: Math.abs(Number(tx.amount) || 0),
        type: tx.type,
      }));
  }, [transactions]);

  const walletTypes: WalletAccountType[] = [
    "Cash Wallet",
    "Main Bank Account",
    "Savings Account",
    "Credit Card",
    "Crypto Wallet",
    "Investment Account",
    "Student Card",
    "Custom Wallet",
  ];

  const displayName = profile?.first_name || user?.email?.split("@")[0] || "User";
  const lastSynced = new Date(now.getTime() - 1000 * 60 * 35);

  const loadWallets = useCallback(async () => {
    if (!user?.id) {
      setWalletItems([]);
      setWalletsLoading(false);
      setWalletsError(authLoading ? null : "Sign in required to load wallets.");
      return;
    }
    setWalletsLoading(true);
    const result = await fetchWalletsSafe(user.id);
    if (result.error) {
      setWalletsError(result.error);
      setWalletItems(result.data ?? []);
      setWalletsLoading(false);
      return;
    }
    setWalletItems(result.data ?? []);
    setWalletsError(null);
    setWalletsLoading(false);
  }, [authLoading, user?.id]);

  useEffect(() => {
    void loadWallets();
  }, [loadWallets]);

  const handleCreateWallet = async () => {
    if (!user?.id) {
      setWalletsError("Could not save wallet. Please sign in first.");
      return;
    }
    const name = newWalletName.trim();
    const balance = Number(newWalletBalance);
    if (!name || !Number.isFinite(balance)) return;
    const payload: WalletCreateInput = {
      name,
      type: newWalletType,
      balance,
      currency,
      provider: "Manual",
      isManual: true,
      lastSyncedAt: null,
    };
    const result = await createWallet(user.id, payload);
    if (result.error) {
      setWalletsError("Could not save wallet. Please check authentication or permissions.");
      if (import.meta.env.DEV) console.error("[Wallets][UI][create]", { userId: user.id, mode: isMockMode ? "mock" : "supabase", error: result.error });
      return;
    }
    setWalletsError(null);
    setNewWalletName("");
    setNewWalletBalance("0");
    await loadWallets();
  };

  const handleUpdateWallet = async (wallet: FinanceWallet) => {
    if (!user?.id) {
      setWalletsError("Could not update wallet. Please sign in first.");
      return;
    }
    const result = await updateWallet(user.id, wallet.id, {
      balance: wallet.balance + 100,
      lastSyncedAt: new Date().toISOString(),
    });
    if (result.error) {
      setWalletsError(result.error);
      if (import.meta.env.DEV) console.error("[Wallets][UI][update]", { userId: user.id, mode: isMockMode ? "mock" : "supabase", error: result.error });
      return;
    }
    setWalletsError(null);
    await loadWallets();
  };

  const handleDeleteWallet = async (walletId: string) => {
    if (!user?.id) {
      setWalletsError("Could not delete wallet. Please sign in first.");
      return;
    }
    const result = await deleteWallet(user.id, walletId);
    if (result.error) {
      setWalletsError(result.error);
      if (import.meta.env.DEV) console.error("[Wallets][UI][delete]", { userId: user.id, mode: isMockMode ? "mock" : "supabase", error: result.error });
      return;
    }
    setWalletsError(null);
    await loadWallets();
  };

  return (
    <div className="premium-page">
      <section className="premium-section rounded-[28px] p-6 sm:p-7">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Accounts Summary Hero</p>
            <h1 className="mt-1 text-2xl font-semibold text-zinc-100">Financial Accounts Hub</h1>
            <p className="mt-2 max-w-3xl text-sm text-zinc-300">
              Ruby AI analyzed your accounts, {displayName}. Your savings balance is growing, and credit usage is being monitored against recommended thresholds.
            </p>
          </div>
          <div className="rounded-full border border-red-500/35 bg-red-500/10 px-3 py-1 text-xs text-red-200">
            Financial OS mode active
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Total Balance</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{formatCurrency(walletSummary.totalBalance, currency)}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Net Worth</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{formatCurrency(walletSummary.netWorth, currency)}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Cash Available</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{formatCurrency(walletSummary.cash, currency)}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Savings Balance</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{formatCurrency(walletSummary.savings, currency)}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Credit Used</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{formatCurrency(walletSummary.creditUsed, currency)}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Number of Accounts</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{walletSummary.accountCount}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Monthly Account Movement</p>
            <p className={`mt-1 text-lg font-semibold ${walletSummary.monthlyMovement >= 0 ? "text-emerald-300" : "text-red-300"}`}>
              {walletSummary.monthlyMovement >= 0 ? "+" : "-"}
              {formatCurrency(Math.abs(walletSummary.monthlyMovement), currency)}
            </p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Most Used Wallet</p>
            <p className="mt-1 text-sm font-semibold text-zinc-100">{walletSummary.mostUsed?.name || "No activity yet"}</p>
          </article>
        </div>
      </section>

      <section className="premium-section rounded-[24px]">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Wallets (Supabase + Fallback)</h2>
        {walletsLoading ? (
          <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">Loading wallets...</div>
        ) : walletsError ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">{walletsError}</div>
        ) : walletItems.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">
            No wallets yet. Create one below.
          </div>
        ) : (
          <div className="space-y-2">
            {walletItems.map((wallet) => (
              <article key={wallet.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{wallet.name}</p>
                    <p className="text-xs text-zinc-400">
                      {wallet.type} • {formatCurrency(wallet.balance, wallet.currency)} • {wallet.isManual ? "manual" : "synced"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleUpdateWallet(wallet)}
                      className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200"
                    >
                      +100
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteWallet(wallet.id)}
                      className="rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs text-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_140px_160px_auto]">
          <input
            value={newWalletName}
            onChange={(event) => setNewWalletName(event.target.value)}
            placeholder="Wallet name"
            className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-zinc-100"
          />
          <select
            value={newWalletType}
            onChange={(event) => setNewWalletType(event.target.value as WalletType)}
            className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-zinc-100"
          >
            <option value="cash">cash</option>
            <option value="checking">bank</option>
            <option value="savings">savings</option>
            <option value="credit">credit_card</option>
            <option value="crypto">crypto</option>
            <option value="investment">investment</option>
            <option value="custom">custom</option>
          </select>
          <input
            type="number"
            value={newWalletBalance}
            onChange={(event) => setNewWalletBalance(event.target.value)}
            placeholder="Balance"
            className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-zinc-100"
          />
          <button
            type="button"
            onClick={() => void handleCreateWallet()}
            className="rounded-lg border border-red-500/40 bg-red-600/80 px-3 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Create Wallet
          </button>
        </div>
      </section>

      <section className="premium-section rounded-[26px]">
        <div className="mb-3 flex items-center gap-2">
          <Landmark className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Net Worth Overview</h2>
        </div>
        <div className="grid gap-4 xl:grid-cols-12">
          <article className="rounded-xl border border-white/10 bg-black/25 p-4 xl:col-span-5">
            <p className="text-xs text-zinc-500">Assets</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-100">{formatCurrency(walletSummary.assets, currency)}</p>
            <p className="mt-3 text-xs text-zinc-500">Liabilities</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{formatCurrency(walletSummary.liabilities, currency)}</p>
            <p className="mt-3 text-xs text-zinc-500">Net Worth Total</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-100">{formatCurrency(walletSummary.netWorth, currency)}</p>
            <p className="mt-1 text-xs text-zinc-400">Liability ratio: {walletSummary.liabilityRatio.toFixed(1)}%</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-4 xl:col-span-7">
            <p className="mb-2 text-xs text-zinc-500">Asset Allocation</p>
            <div className="space-y-2">
              {walletSummary.assetAllocation.map((row) => {
                const pct = walletSummary.assets > 0 ? (row.value / walletSummary.assets) * 100 : 0;
                return (
                  <div key={row.label}>
                    <div className="mb-1 flex items-center justify-between text-xs text-zinc-300">
                      <span>{row.label}</span>
                      <span>
                        {formatCurrency(row.value, currency)} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-800/90">
                      <div className="h-1.5 rounded-full bg-red-400" style={{ width: `${Math.max(4, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Wallet Cards</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => (
            <WalletAccountCard key={account.id} account={account} currency={currency} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Account Health Insights</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accountHealthInsights.map((insight) => (
            <AccountHealthInsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </section>

      <section className="premium-section rounded-[26px]">
        <div className="mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Cash Flow by Account</h2>
        </div>
        <div className="mb-3 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-zinc-300">
          Most active account: <span className="font-medium text-zinc-100">{accountCashFlow.mostActive?.name || "No activity yet"}</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {accountCashFlow.rows.map((row) => (
            <article key={row.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
              <p className="text-sm font-medium text-zinc-100">{row.name}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <p className="text-zinc-400">Income received: <span className="text-zinc-200">{formatCurrency(row.incomeReceived, currency)}</span></p>
                <p className="text-zinc-400">Expenses paid: <span className="text-zinc-200">{formatCurrency(row.expensesPaid, currency)}</span></p>
                <p className="text-zinc-400">Transfers: <span className="text-zinc-200">{formatCurrency(row.transfers, currency)}</span></p>
                <p className={`${row.balanceChange >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                  Balance change: {row.balanceChange >= 0 ? "+" : "-"}
                  {formatCurrency(Math.abs(row.balanceChange), currency)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="premium-section rounded-[26px]">
        <div className="mb-3 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Credit / Debt Overview</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Credit Used</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{formatCurrency(creditOverview.used, currency)}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Remaining Limit</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{formatCurrency(creditOverview.remaining, currency)}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Utilization</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{creditOverview.utilization.toFixed(1)}%</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Payment Due</p>
            <p className="mt-1 text-sm font-semibold text-zinc-100">{formatDate(creditOverview.paymentDue, { dateStyle: "medium" })}</p>
            <p className={`text-xs ${creditOverview.riskLabel === "High risk" ? "text-red-300" : "text-amber-200"}`}>{creditOverview.riskLabel}</p>
          </article>
        </div>
        <p className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-300">
          {creditOverview.recommendation}
        </p>
      </section>

      <section className="premium-section rounded-[26px]">
        <div className="mb-3 flex items-center gap-2">
          <PiggyBank className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Savings Accounts</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {accounts
            .filter((a) => a.type === "Savings Account" || a.type === "Investment Account")
            .map((account) => (
              <article key={account.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
                <p className="text-sm font-medium text-zinc-100">{account.name}</p>
                <p className="mt-1 text-lg font-semibold text-zinc-100">{formatCurrency(account.balance, currency)}</p>
                <p className={`text-xs ${account.monthlyChange >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                  {account.monthlyChange >= 0 ? <ArrowUpRight className="inline h-3.5 w-3.5" /> : <ArrowDownRight className="inline h-3.5 w-3.5" />}
                  {account.monthlyChange >= 0 ? "+" : "-"}
                  {formatCurrency(Math.abs(account.monthlyChange), currency)} monthly trend
                </p>
                <p className="mt-1 text-xs text-zinc-400">{account.aiNote}</p>
              </article>
            ))}
        </div>
      </section>

      <section className="premium-section rounded-[26px]">
        <div className="mb-3 flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Account Activity</h2>
        </div>
        {recentActivity.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
            No account activity yet. Add transactions in Classic Finance to activate live account monitoring.
          </div>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((item) => (
              <article key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-zinc-100">{item.merchant}</p>
                  <p className="text-xs text-zinc-400">
                    {item.accountType} • {item.category} • {formatDate(item.date, { dateStyle: "medium" })}
                  </p>
                </div>
                <p className={`text-sm font-semibold ${item.type === "income" ? "text-emerald-300" : "text-zinc-100"}`}>
                  {item.type === "income" ? "+" : "-"}
                  {formatCurrency(item.amount, currency)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="premium-section rounded-[26px]">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-red-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Add Account / Wallet CTA</h2>
        </div>
        <div className="grid gap-4 xl:grid-cols-12">
          <article className="rounded-xl border border-white/10 bg-black/25 p-4 xl:col-span-7">
            <p className="text-sm text-zinc-200">Supported account types</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {walletTypes.map((type) => (
                <span key={type} className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[11px] text-zinc-300">
                  {type}
                </span>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
                <Link to="/finance">Add Manual Account</Link>
              </Button>
              <Button variant="outline" className="border-white/15 bg-white/[0.03] text-zinc-200">
                Connect Bank (Coming Soon)
              </Button>
            </div>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-4 xl:col-span-5">
            <div className="mb-2 flex items-center gap-2">
              <Banknote className="h-4 w-4 text-red-300" />
              <p className="text-sm font-medium text-zinc-100">Future Bank Sync Preparation</p>
            </div>
            <div className="space-y-2 text-xs text-zinc-300">
              <p>Sync status: <span className="text-emerald-300">Ready for provider connection</span></p>
              <p>Last synced time: {formatDate(lastSynced, { dateStyle: "medium", timeStyle: "short" })}</p>
              <p>Account provider: Plaid / Tink / Bank API (placeholder)</p>
              <p>Manual account option: enabled via Classic Finance</p>
            </div>
            <p className="mt-3 rounded-lg border border-white/10 bg-black/20 p-2 text-xs text-zinc-400">
              Bank sync infrastructure is represented at UI layer and ready for future API integration.
            </p>
          </article>
        </div>
      </section>

      {creditOverview.utilization > 30 ? (
        <div className="rounded-xl border border-red-500/35 bg-red-500/10 p-3 text-sm text-red-100">
          <ShieldAlert className="mr-2 inline h-4 w-4" />
          Your credit utilization is above 30%. Consider lowering usage to improve financial health.
        </div>
      ) : null}
    </div>
  );
};

export default Wallets;
