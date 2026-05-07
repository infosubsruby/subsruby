import { useMemo, useState } from "react";
import {
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  BadgeInfo,
  Car,
  Briefcase,
  Film,
  Gamepad2,
  Monitor,
  Music,
  Package,
  ReceiptText,
  Smartphone,
  Receipt,
  BrainCircuit,
  CalendarClock,
  Search,
  ShieldAlert,
  Filter,
} from "lucide-react";
import { Budget, Transaction } from "@/hooks/useFinance";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/i18n/useTranslations";
import { formatDate } from "@/i18n/date";
import { formatCurrency } from "@/i18n/currency";
import { useSettings } from "@/hooks/useSettings";
import {
  buildTransactionIntelligence,
  type TransactionAnalysis,
} from "@/lib/transactionIntelligence";
import { TransactionAITag } from "@/components/finance/TransactionAITag";
import { TransactionIntelligenceOverview } from "@/components/finance/TransactionIntelligenceOverview";
import { TransactionInsightCard, type TransactionInsightItem } from "@/components/finance/TransactionInsightCard";
import { PremiumEmptyState } from "@/components/shared/PremiumEmptyState";
import { DEMO_TRANSACTIONS } from "@/data/demoFinanceData";

interface TransactionListProps {
  transactions: Transaction[];
  budgets: Budget[];
  onDelete: (id: string) => Promise<{ success: boolean }>;
  onToggleRecurring: (id: string) => Promise<{ success: boolean }>;
  onAddTransaction?: () => void;
}

const ICONS = {
  film: Film,
  music: Music,
  package: Package,
  car: Car,
  fuel: Car,
  smartphone: Smartphone,
  monitor: Monitor,
  gamepad: Gamepad2,
  briefcase: Briefcase,
  banknote: Briefcase,
  receipt: ReceiptText,
  utensils: ReceiptText,
} as const;

const getDateBucket = (date: string) => {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "Earlier";
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startWeek = new Date(startToday);
  startWeek.setDate(startToday.getDate() - 6);
  if (d >= startToday) return "Today";
  if (d >= startWeek) return "This Week";
  return "Earlier";
};

const SMART_CATEGORIES = [
  "All",
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Subscriptions",
  "Housing",
  "Entertainment",
  "Education",
  "Health",
] as const;

const SMART_WALLETS = ["All", "Cash Wallet", "Main Bank Account", "Savings Account", "Credit Card", "Crypto Wallet"] as const;

const getWalletLabel = (tx: Transaction) => {
  const desc = (tx.description || "").toLowerCase();
  if (desc.includes("cash")) return "Cash Wallet";
  if (desc.includes("crypto") || desc.includes("coin") || desc.includes("btc")) return "Crypto Wallet";
  if (tx.type === "income") return "Main Bank Account";
  if (tx.category === "Subscriptions") return "Credit Card";
  if (tx.category === "Shopping") return "Credit Card";
  if (tx.category === "Housing") return "Main Bank Account";
  return "Main Bank Account";
};

export const TransactionList = ({
  transactions,
  budgets,
  onDelete,
  onToggleRecurring,
  onAddTransaction,
}: TransactionListProps) => {
  const tFinance = useTranslations("Finance");
  const tCategories = useTranslations("Categories");
  const { defaultCurrency } = useSettings();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [smartSearch, setSmartSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [walletFilter, setWalletFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [recurringOnly, setRecurringOnly] = useState(false);
  const [unusualOnly, setUnusualOnly] = useState(false);
  const [aiFlaggedOnly, setAiFlaggedOnly] = useState(false);

  const CATEGORY_KEY_MAP: Record<string, string> = {
    Entertainment: "entertainment",
    "Food & Dining": "food_dining",
    Shopping: "shopping",
    Transportation: "transportation",
    Utilities: "utilities",
    Health: "health",
    Education: "education",
    Travel: "travel",
    Subscriptions: "subscriptions",
    Other: "other",
    Salary: "salary",
    Freelance: "freelance",
    Investments: "investments",
    Gifts: "gifts",
    "Other Income": "other_income",
  };

  const getCategoryLabel = (cat: string) => {
    const categoryToKey = (value: string) =>
      value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/&/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

    const mappedKey = CATEGORY_KEY_MAP[cat];
    if (mappedKey) return tCategories(mappedKey, { defaultValue: cat });

    const normalizedKey = categoryToKey(cat);
    return normalizedKey ? tCategories(normalizedKey, { defaultValue: cat }) : cat;
  };

  const handleDelete = async (id: string) => {
    await onDelete(id);
  };

  const handleToggleRecurring = async (id: string) => {
    await onToggleRecurring(id);
  };

  const intelligence = useMemo(
    () => buildTransactionIntelligence(transactions, budgets),
    [transactions, budgets]
  );

  const monthStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const previousMonthDate = new Date(currentYear, currentMonth - 1, 1);

    const current = transactions.filter((tx) => {
      const d = new Date(`${tx.date}T00:00:00`);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const previous = transactions.filter((tx) => {
      const d = new Date(`${tx.date}T00:00:00`);
      return d.getMonth() === previousMonthDate.getMonth() && d.getFullYear() === previousMonthDate.getFullYear();
    });

    const income = current.filter((tx) => tx.type === "income").reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);
    const expense = current.filter((tx) => tx.type === "expense").reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);
    const recurringCount = current.filter((tx) => {
      const analysis = intelligence.byId[tx.id];
      return tx.is_recurring || (analysis?.recurringLikelihood || 0) >= 0.72;
    }).length;
    const unusualCount = current.filter((tx) => {
      const analysis = intelligence.byId[tx.id];
      return (analysis?.riskScore || 0) > 64 || (analysis?.tags || []).some((tag) => tag.type === "anomaly_large" || tag.type === "duplicate_possible" || tag.type === "category_spike");
    }).length;
    const currentExpenseCategories = current
      .filter((tx) => tx.type === "expense")
      .reduce<Record<string, number>>((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + Math.abs(Number(tx.amount) || 0);
        return acc;
      }, {});
    const topCategoryEntry = Object.entries(currentExpenseCategories).sort((a, b) => b[1] - a[1])[0];

    const weekendSpendCurrent = current
      .filter((tx) => tx.type === "expense")
      .filter((tx) => {
        const day = new Date(`${tx.date}T00:00:00`).getDay();
        return day === 0 || day === 6;
      })
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);
    const weekendSpendPrevious = previous
      .filter((tx) => tx.type === "expense")
      .filter((tx) => {
        const day = new Date(`${tx.date}T00:00:00`).getDay();
        return day === 0 || day === 6;
      })
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);

    return {
      income,
      expense,
      net: income - expense,
      transactionCount: current.length,
      recurringCount,
      unusualCount,
      topCategory: topCategoryEntry?.[0] || "No category data yet",
      weekendTrendPct:
        weekendSpendPrevious > 0 ? ((weekendSpendCurrent - weekendSpendPrevious) / weekendSpendPrevious) * 100 : 0,
      currentMonthTx: current,
      previousMonthTx: previous,
    };
  }, [transactions, intelligence.byId]);

  const recurringGroups = useMemo(() => {
    const groups = transactions
      .filter((tx) => tx.type === "expense")
      .reduce<Record<string, Transaction[]>>((acc, tx) => {
        const analysis = intelligence.byId[tx.id];
        const merchant = (analysis?.merchantName || tx.description || tx.category || "Merchant").trim();
        const recurringLikelihood = analysis?.recurringLikelihood || 0;
        if (!tx.is_recurring && recurringLikelihood < 0.72) return acc;
        acc[merchant] = [...(acc[merchant] || []), tx];
        return acc;
      }, {});

    return Object.entries(groups)
      .map(([merchant, txs]) => {
        const ordered = [...txs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const latest = ordered[ordered.length - 1];
        const amount = Math.abs(Number(latest?.amount) || 0);
        const confidenceAvg =
          txs.reduce((sum, tx) => sum + (intelligence.byId[tx.id]?.recurringLikelihood || (tx.is_recurring ? 0.98 : 0.7)), 0) /
          Math.max(1, txs.length);
        const frequency = txs.length >= 3 ? "Monthly" : "Recurring";
        const nextExpectedDate = latest ? new Date(`${latest.date}T00:00:00`) : new Date();
        nextExpectedDate.setMonth(nextExpectedDate.getMonth() + 1);
        return {
          id: merchant,
          merchant,
          amount,
          frequency,
          nextExpectedDate,
          confidencePct: Math.round(confidenceAvg * 100),
          yearlyImpact: amount * 12,
        };
      })
      .sort((a, b) => b.yearlyImpact - a.yearlyImpact)
      .slice(0, 6);
  }, [transactions, intelligence.byId]);

  const anomalyAlerts = useMemo(() => {
    return transactions
      .map((tx) => ({ tx, analysis: intelligence.byId[tx.id] }))
      .filter(({ tx, analysis }) => tx.type === "expense" && analysis)
      .filter(
        ({ analysis }) =>
          (analysis?.riskScore || 0) > 64 ||
          (analysis?.tags || []).some((tag) =>
            ["anomaly_large", "duplicate_possible", "category_spike", "budget_deviation"].includes(tag.type)
          )
      )
      .slice(0, 6)
      .map(({ tx, analysis }) => {
        const firstCritical = analysis?.tags.find((tag) =>
          ["anomaly_large", "duplicate_possible", "category_spike", "budget_deviation"].includes(tag.type)
        );
        const severity: "low" | "medium" | "high" =
          (analysis?.riskScore || 0) > 80 ? "high" : (analysis?.riskScore || 0) > 64 ? "medium" : "low";
        return {
          id: tx.id,
          title: `${analysis?.merchantName || tx.description || tx.category} flagged for review`,
          reason: firstCritical?.label || "Unusual spending pattern detected",
          severity,
          nextStep:
            firstCritical?.type === "duplicate_possible"
              ? "Verify statement and dispute if duplicated."
              : "Review receipt and compare against your recent category baseline.",
        };
      });
  }, [transactions, intelligence.byId]);

  const categoryBreakdown = useMemo(() => {
    const tracked = SMART_CATEGORIES.filter((c) => c !== "All");
    const currentMonthExpenses = monthStats.currentMonthTx.filter((tx) => tx.type === "expense");
    const previousMonthExpenses = monthStats.previousMonthTx.filter((tx) => tx.type === "expense");
    const currentTotal = currentMonthExpenses.reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);
    return tracked.map((category) => {
      const current = currentMonthExpenses
        .filter((tx) => tx.category === category)
        .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);
      const previous = previousMonthExpenses
        .filter((tx) => tx.category === category)
        .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);
      const trendPct = previous > 0 ? ((current - previous) / previous) * 100 : 0;
      const percentage = currentTotal > 0 ? (current / currentTotal) * 100 : 0;
      const aiComment =
        trendPct > 15
          ? "Category is accelerating. Monitor weekly."
          : trendPct < -10
          ? "Trend is improving versus last month."
          : "Spending remains within expected range.";
      return { category, current, trendPct, percentage, aiComment };
    });
  }, [monthStats]);

  const topGrowingCategory = useMemo(
    () => [...categoryBreakdown].sort((a, b) => b.trendPct - a.trendPct)[0]?.category || "N/A",
    [categoryBreakdown]
  );

  const insightCards = useMemo<TransactionInsightItem[]>(() => {
    const cards: TransactionInsightItem[] = [];
    const currentExpenses = monthStats.currentMonthTx.filter((tx) => tx.type === "expense");
    const foodCurrent = currentExpenses
      .filter((tx) => tx.category === "Food & Dining")
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);
    const weeklyAverage = currentExpenses.length > 0 ? currentExpenses.reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0) / 4 : 0;
    if (foodCurrent > weeklyAverage * 1.2 && weeklyAverage > 0) {
      cards.push({
        id: "food-spike",
        insightType: "Category Spike",
        title: "Food spending is above your normal weekly average",
        explanation: `Food & Dining is ${(((foodCurrent - weeklyAverage) / weeklyAverage) * 100).toFixed(0)}% above the baseline.`,
        category: "Food & Dining",
        severity: "medium",
        confidencePct: 88,
        suggestedAction: "Cap dining spend for the next 7 days and compare weekly trend.",
      });
    }

    const uberCurrent = currentExpenses
      .filter((tx) => (tx.description || "").toLowerCase().includes("uber"))
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);
    const uberPrevious = monthStats.previousMonthTx
      .filter((tx) => tx.type === "expense" && (tx.description || "").toLowerCase().includes("uber"))
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount) || 0), 0);
    if (uberCurrent > uberPrevious && uberCurrent > 0) {
      cards.push({
        id: "uber-trend",
        insightType: "Merchant Trend",
        title: "Uber expenses increased compared to last month",
        explanation: `Transportation via Uber increased to ${formatCurrency(uberCurrent, defaultCurrency || "USD")}.`,
        category: "Transportation",
        severity: "medium",
        confidencePct: 83,
        suggestedAction: "Bundle trips or use public transit for non-urgent routes.",
      });
    }

    const topAnomaly = transactions
      .map((tx) => ({ tx, analysis: intelligence.byId[tx.id] }))
      .filter(({ tx, analysis }) => tx.type === "expense" && (analysis?.riskScore || 0) > 70)
      .sort((a, b) => (b.analysis?.riskScore || 0) - (a.analysis?.riskScore || 0))[0];
    if (topAnomaly) {
      cards.push({
        id: "anomaly",
        insightType: "Anomaly",
        title: "A recent purchase is unusually high for your pattern",
        explanation: topAnomaly.analysis?.summary || "Detected unusual transaction behavior.",
        category: topAnomaly.tx.category,
        severity: "high",
        confidencePct: Math.round((topAnomaly.analysis?.riskScore || 80)),
        suggestedAction: "Review the merchant, amount, and receipt details now.",
        relatedTransaction: topAnomaly.tx.description || topAnomaly.tx.category,
      });
    }

    const recurringSample = recurringGroups[0];
    if (recurringSample) {
      cards.push({
        id: "recurring",
        insightType: "Recurring Detection",
        title: `${recurringSample.merchant} appears to be recurring`,
        explanation: `Detected ${recurringSample.frequency.toLowerCase()} cadence with ${recurringSample.confidencePct}% confidence.`,
        category: "Subscriptions",
        severity: "low",
        confidencePct: recurringSample.confidencePct,
        suggestedAction: "Tag it as recurring and include it in budget planning.",
      });
    }

    if (monthStats.weekendTrendPct > 10) {
      cards.push({
        id: "weekend",
        insightType: "Behavior Pattern",
        title: "Weekend spending is increasing",
        explanation: `Weekend expenses are up ${monthStats.weekendTrendPct.toFixed(0)}% compared to previous month.`,
        category: "Behavior",
        severity: "medium",
        confidencePct: 79,
        suggestedAction: "Set a weekend-only discretionary limit.",
      });
    }

    return cards.slice(0, 5);
  }, [monthStats, transactions, intelligence.byId, recurringGroups, defaultCurrency]);

  const filteredTransactions = useMemo(() => {
    const query = smartSearch.trim().toLowerCase();
    return transactions.filter((tx) => {
      const analysis = intelligence.byId[tx.id];
      const amount = Math.abs(Number(tx.amount) || 0);
      const txDate = new Date(`${tx.date}T00:00:00`);
      const wallet = getWalletLabel(tx);
      const text = `${tx.description || ""} ${tx.category} ${analysis?.merchantName || ""}`.toLowerCase();

      if (categoryFilter !== "All" && tx.category !== categoryFilter) return false;
      if (walletFilter !== "All" && wallet !== walletFilter) return false;
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (dateFrom && txDate < new Date(`${dateFrom}T00:00:00`)) return false;
      if (dateTo && txDate > new Date(`${dateTo}T23:59:59`)) return false;
      if (minAmount && amount < Number(minAmount)) return false;
      if (maxAmount && amount > Number(maxAmount)) return false;
      if (recurringOnly && !tx.is_recurring && (analysis?.recurringLikelihood || 0) < 0.72) return false;
      if (
        unusualOnly &&
        (analysis?.riskScore || 0) < 64 &&
        !(analysis?.tags || []).some((tag) =>
          ["anomaly_large", "duplicate_possible", "category_spike", "budget_deviation"].includes(tag.type)
        )
      ) {
        return false;
      }
      if (aiFlaggedOnly && ((analysis?.tags || []).length === 0 && (analysis?.riskScore || 0) < 50)) return false;

      if (query.length === 0) return true;
      if (query.includes("last week")) {
        const lastWeekStart = new Date();
        lastWeekStart.setDate(lastWeekStart.getDate() - 7);
        if (txDate < lastWeekStart) return false;
      }
      if (query.includes("subscriptions") && tx.category !== "Subscriptions") return false;
      if (query.includes("large expenses") && (tx.type !== "expense" || amount < 100)) return false;
      if (query.includes("unusual") && (analysis?.riskScore || 0) < 64) return false;

      return text.includes(query) || wallet.toLowerCase().includes(query);
    });
  }, [
    transactions,
    intelligence.byId,
    smartSearch,
    categoryFilter,
    walletFilter,
    typeFilter,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
    recurringOnly,
    unusualOnly,
    aiFlaggedOnly,
  ]);

  const grouped = useMemo(() => {
    const buckets: Record<string, Transaction[]> = { Today: [], "This Week": [], Earlier: [] };
    filteredTransactions.forEach((tx) => {
      buckets[getDateBucket(tx.date)] = [...buckets[getDateBucket(tx.date)], tx];
    });
    return buckets;
  }, [filteredTransactions]);

  if (transactions.length === 0) {
    return (
      <PremiumEmptyState
        icon={<Receipt className="h-5 w-5" />}
        headline="Start tracking your financial activity"
        description="Add your first transaction and Ruby AI will begin analyzing your spending patterns."
        primaryAction={{ label: "Add Transaction", onClick: onAddTransaction }}
        secondaryAction={{ label: "Open Overview", to: "/overview" }}
        badges={DEMO_TRANSACTIONS.slice(0, 5).map((item) => item.merchant)}
      />
    );
  }

  const renderMerchantIcon = (analysis: TransactionAnalysis | undefined) => {
    const key = (analysis?.merchantIcon || "receipt") as keyof typeof ICONS;
    const Icon = ICONS[key] || ReceiptText;
    return <Icon className="h-4 w-4 text-red-300" />;
  };

  return (
    <div className="space-y-6">
      <section className="premium-section rounded-[26px] p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Transaction Intelligence Hero</p>
            <h2 className="mt-1 text-2xl font-semibold text-zinc-100">Smart Financial Activity Center</h2>
            <p className="mt-2 text-sm text-zinc-300">
              Ruby AI analyzed {monthStats.transactionCount} transactions this month. {getCategoryLabel(monthStats.topCategory)} spending is a key focus, and {monthStats.recurringCount} recurring payments were detected.
            </p>
          </div>
          <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-200">
            AI monitoring active
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Total Income This Month</p>
            <p className="mt-1 text-lg font-semibold text-emerald-300">{formatCurrency(monthStats.income, defaultCurrency || "USD")}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Total Expenses This Month</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{formatCurrency(monthStats.expense, defaultCurrency || "USD")}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Net Cash Flow</p>
            <p className={cn("mt-1 text-lg font-semibold", monthStats.net >= 0 ? "text-emerald-300" : "text-red-300")}>
              {formatCurrency(monthStats.net, defaultCurrency || "USD")}
            </p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Number Of Transactions</p>
            <p className="mt-1 text-lg font-semibold text-zinc-100">{monthStats.transactionCount}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Biggest Spending Category</p>
            <p className="mt-1 text-sm font-semibold text-zinc-100">{getCategoryLabel(monthStats.topCategory)}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Unusual Spending Count</p>
            <p className="mt-1 text-lg font-semibold text-amber-200">{monthStats.unusualCount}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Recurring Payment Count</p>
            <p className="mt-1 text-lg font-semibold text-sky-200">{monthStats.recurringCount}</p>
          </article>
          <article className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-xs text-zinc-500">Weekend Spend Trend</p>
            <p className={cn("mt-1 text-lg font-semibold", monthStats.weekendTrendPct > 0 ? "text-red-300" : "text-emerald-300")}>
              {monthStats.weekendTrendPct.toFixed(0)}%
            </p>
          </article>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-red-300" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">AI Transaction Insights</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {insightCards.map((insight) => (
            <TransactionInsightCard
              key={insight.id}
              insight={insight}
              onOpenRelated={() => {
                const related = transactions.find((tx) =>
                  `${tx.description || tx.category}`.toLowerCase().includes((insight.relatedTransaction || "").toLowerCase())
                );
                if (related) setExpandedId(related.id);
              }}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-red-300" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Smart Transaction List</h3>
        </div>
        <TransactionIntelligenceOverview insights={intelligence.globalInsights} />
        {(["Today", "This Week", "Earlier"] as const).map((bucket) => {
          const bucketTransactions = grouped[bucket] || [];
          if (!bucketTransactions.length) return null;
          return (
            <section key={bucket}>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">{bucket}</h4>
              <div className="space-y-2">
                {bucketTransactions.map((transaction, index) => {
                  const analysis = intelligence.byId[transaction.id];
                  const rawDesc = (transaction.description ?? "").trim();
                  const categoryLabel = getCategoryLabel(transaction.category);
                  const isFallback = !rawDesc || rawDesc === transaction.category;
                  const isEnglishCategoryDesc = rawDesc in CATEGORY_KEY_MAP;
                  const displayDesc = isFallback ? categoryLabel : isEnglishCategoryDesc ? getCategoryLabel(rawDesc) : rawDesc;
                  const absAmount = Math.abs(Number(transaction.amount) || 0);
                  const currency = transaction.currency || defaultCurrency || "USD";
                  const formattedAmount = transaction.type === "income" ? `+${formatCurrency(absAmount, currency)}` : formatCurrency(-absAmount, currency);
                  const expanded = expandedId === transaction.id;
                  const walletLabel = getWalletLabel(transaction);
                  const riskScore = analysis?.riskScore || 0;
                  const smartLabel =
                    riskScore > 80
                      ? "Needs review"
                      : riskScore > 64
                      ? "Unusual"
                      : transaction.is_recurring
                      ? "Recurring"
                      : absAmount > 200
                      ? "High impact"
                      : "Safe";

                  return (
                    <article
                      key={transaction.id}
                      className="interactive-card motion-row-enter group rounded-2xl border border-white/10 bg-white/[0.03] p-3 shadow-[0_10px_26px_rgba(0,0,0,0.25)] transition hover:border-red-500/35 hover:bg-red-500/[0.04]"
                      style={{ animationDelay: `${Math.min(index * 28, 220)}ms` }}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div
                            className={cn(
                              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                              transaction.type === "income" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                            )}
                          >
                            {transaction.type === "income" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-zinc-100">{displayDesc}</span>
                              <Badge variant="secondary" className="font-normal text-[10px] px-1.5 py-0.5">{categoryLabel}</Badge>
                              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] text-zinc-400">
                                {renderMerchantIcon(analysis)}
                                {analysis?.merchantName || "Recorded Merchant"}
                              </span>
                              <span className="inline-flex items-center rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] text-zinc-300">
                                {walletLabel}
                              </span>
                              <span className="inline-flex items-center rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] text-zinc-300">
                                {transaction.type === "income" ? "Income" : "Expense"}
                              </span>
                              <span className={cn(
                                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px]",
                                smartLabel === "Needs review"
                                  ? "border-red-500/40 bg-red-500/10 text-red-200"
                                  : smartLabel === "Unusual"
                                  ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                                  : smartLabel === "Recurring"
                                  ? "border-sky-500/40 bg-sky-500/10 text-sky-200"
                                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                              )}>
                                {smartLabel}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                              <span>{formatDate(transaction.date, { dateStyle: "medium" })}</span>
                              <span>AI confidence {(analysis?.categoryConfidence || 0) * 100 > 0 ? `${((analysis?.categoryConfidence || 0) * 100).toFixed(0)}%` : "N/A"}</span>
                              {analysis?.categorySuggestion ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/25 bg-sky-500/10 px-2 py-0.5 text-sky-200">
                                  <BadgeInfo className="h-3 w-3" />
                                  AI category: {getCategoryLabel(analysis.categorySuggestion)}
                                </span>
                              ) : null}
                              {analysis && analysis.riskScore > 64 ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-200">
                                  <AlertTriangle className="h-3 w-3" />
                                  Risk {analysis.riskScore.toFixed(0)}%
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={cn("text-sm font-semibold", transaction.type === "income" ? "text-emerald-300" : "text-zinc-100")}>
                            {formattedAmount}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-8 w-8", transaction.is_recurring ? "text-sky-400 hover:text-sky-300" : "text-muted-foreground hover:text-zinc-300")}
                            onClick={() => handleToggleRecurring(transaction.id)}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(transaction.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-zinc-200"
                            onClick={() => setExpandedId((prev) => (prev === transaction.id ? null : transaction.id))}
                          >
                            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      {analysis?.tags?.length ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {analysis.tags.map((tag) => (
                            <TransactionAITag key={`${transaction.id}-${tag.type}`} tag={tag} />
                          ))}
                        </div>
                      ) : null}
                      {expanded ? (
                        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
                          <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">AI Transaction Analysis</p>
                          <p className="mt-1 text-sm text-zinc-200">{analysis?.summary}</p>
                          <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                            {(analysis?.notes || []).map((note) => (
                              <li key={note}>- {note}</li>
                            ))}
                          </ul>
                          <div className="mt-3 grid gap-2 md:grid-cols-3">
                            <div className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-xs text-zinc-300">
                              Recurring likelihood: {((analysis?.recurringLikelihood || 0) * 100).toFixed(0)}%
                            </div>
                            <div className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-xs text-zinc-300">
                              Risk signal: {analysis?.riskScore.toFixed(0)}%
                            </div>
                            <div className="rounded-lg border border-white/10 bg-black/30 px-2.5 py-2 text-xs text-zinc-300">
                              Receipt scanning: Ready for future integration
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
        {filteredTransactions.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
            No transactions match current filters. Try broadening date, category, or smart search.
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-red-300" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Category Breakdown</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {categoryBreakdown.map((item) => (
            <article key={item.category} className="rounded-xl border border-white/10 bg-black/25 p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-100">{getCategoryLabel(item.category)}</p>
                <p className="text-xs text-zinc-400">{item.percentage.toFixed(1)}%</p>
              </div>
              <p className="text-sm font-semibold text-zinc-200">{formatCurrency(item.current, defaultCurrency || "USD")}</p>
              <p className={cn("text-xs", item.trendPct > 0 ? "text-red-300" : "text-emerald-300")}>
                Trend {item.trendPct > 0 ? "+" : ""}{item.trendPct.toFixed(1)}%
              </p>
              <p className="mt-1 text-xs text-zinc-400">{item.aiComment}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-red-300" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Recurring Detection</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {recurringGroups.map((item) => (
            <article key={item.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
              <p className="text-sm font-medium text-zinc-100">{item.merchant}</p>
              <p className="text-xs text-zinc-400">{item.frequency}</p>
              <p className="mt-1 text-sm text-zinc-200">{formatCurrency(item.amount, defaultCurrency || "USD")}</p>
              <p className="text-xs text-zinc-400">Next expected: {formatDate(item.nextExpectedDate, { dateStyle: "medium" })}</p>
              <p className="text-xs text-sky-200">Confidence {item.confidencePct}%</p>
              <p className="text-xs text-zinc-400">Yearly impact: {formatCurrency(item.yearlyImpact, defaultCurrency || "USD")}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-300" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Anomaly Alerts</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {anomalyAlerts.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
              No major anomaly alerts right now. Ruby AI keeps monitoring transaction behavior.
            </div>
          ) : (
            anomalyAlerts.map((alert) => (
              <article key={alert.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-100">{alert.title}</p>
                  <span className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px]",
                    alert.severity === "high"
                      ? "border-red-500/40 bg-red-500/10 text-red-200"
                      : alert.severity === "medium"
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  )}>
                    {alert.severity}
                  </span>
                </div>
                <p className="text-xs text-zinc-300">Flag reason: {alert.reason}</p>
                <p className="mt-1 text-xs text-zinc-400">Next step: {alert.nextStep}</p>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-white/10 bg-black/25 p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Spending Pattern Summary</p>
          <p className="mt-1 text-sm text-zinc-100">Where is my money going?</p>
          <p className="text-xs text-zinc-400">Top category this month: {getCategoryLabel(monthStats.topCategory)}.</p>
        </article>
        <article className="rounded-xl border border-white/10 bg-black/25 p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Behavior Signal</p>
          <p className="mt-1 text-sm text-zinc-100">Which categories are increasing?</p>
          <p className="text-xs text-zinc-400">
            Highest trend: {topGrowingCategory}.
          </p>
        </article>
        <article className="rounded-xl border border-white/10 bg-black/25 p-3">
          <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">Attention Focus</p>
          <p className="mt-1 text-sm text-zinc-100">What should I pay attention to?</p>
          <p className="text-xs text-zinc-400">
            {monthStats.unusualCount > 0
              ? `${monthStats.unusualCount} unusual transactions need review.`
              : "No critical unusual transactions this cycle."}
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/25 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Filter className="h-4 w-4 text-red-300" />
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Filters & Smart Search</h3>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              value={smartSearch}
              onChange={(e) => setSmartSearch(e.target.value)}
              placeholder="food last week, subscriptions, large expenses, Uber..."
              className="pl-8"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              {SMART_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat === "All" ? "All Categories" : getCategoryLabel(cat)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={walletFilter} onValueChange={setWalletFilter}>
            <SelectTrigger><SelectValue placeholder="Wallet" /></SelectTrigger>
            <SelectContent>
              {SMART_WALLETS.map((wallet) => (
                <SelectItem key={wallet} value={wallet}>{wallet === "All" ? "All Wallets" : wallet}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(v: "all" | "income" | "expense") => setTypeFilter(v)}>
            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Income / Expense</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <Input type="number" min={0} placeholder="Min amount" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
          <Input type="number" min={0} placeholder="Max amount" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-zinc-300">
            <Switch checked={recurringOnly} onCheckedChange={setRecurringOnly} />
            Recurring only
          </label>
          <label className="flex items-center gap-2 text-xs text-zinc-300">
            <Switch checked={unusualOnly} onCheckedChange={setUnusualOnly} />
            Unusual only
          </label>
          <label className="flex items-center gap-2 text-xs text-zinc-300">
            <Switch checked={aiFlaggedOnly} onCheckedChange={setAiFlaggedOnly} />
            AI flagged
          </label>
          <Button
            size="sm"
            variant="outline"
            className="h-7 border-white/15 bg-white/[0.03] text-zinc-200"
            onClick={() => {
              setSmartSearch("");
              setDateFrom("");
              setDateTo("");
              setCategoryFilter("All");
              setWalletFilter("All");
              setTypeFilter("all");
              setMinAmount("");
              setMaxAmount("");
              setRecurringOnly(false);
              setUnusualOnly(false);
              setAiFlaggedOnly(false);
            }}
          >
            Clear Filters
          </Button>
        </div>
      </section>
    </div>
  );
};
