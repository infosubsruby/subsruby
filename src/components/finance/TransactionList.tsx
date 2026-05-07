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
} from "lucide-react";
import { Budget, Transaction } from "@/hooks/useFinance";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  const grouped = useMemo(() => {
    const buckets: Record<string, Transaction[]> = { Today: [], "This Week": [], Earlier: [] };
    transactions.forEach((tx) => {
      buckets[getDateBucket(tx.date)] = [...buckets[getDateBucket(tx.date)], tx];
    });
    return buckets;
  }, [transactions]);

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
    <div className="space-y-4">
      <TransactionIntelligenceOverview insights={intelligence.globalInsights} />

      {(["Today", "This Week", "Earlier"] as const).map((bucket) => {
        const bucketTransactions = grouped[bucket] || [];
        if (!bucketTransactions.length) return null;

        return (
          <section key={bucket}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500">
              {bucket}
            </h3>
            <div className="space-y-2">
              {bucketTransactions.map((transaction, index) => {
                const analysis = intelligence.byId[transaction.id];
                const rawDesc = (transaction.description ?? "").trim();
                const categoryLabel = getCategoryLabel(transaction.category);
                const isFallback = !rawDesc || rawDesc === transaction.category;
                const isEnglishCategoryDesc = rawDesc in CATEGORY_KEY_MAP;
                const displayDesc = isFallback
                  ? categoryLabel
                  : isEnglishCategoryDesc
                    ? getCategoryLabel(rawDesc)
                    : rawDesc;

                const absAmount = Math.abs(Number(transaction.amount) || 0);
                const currency = transaction.currency || defaultCurrency || "USD";
                const formattedAmount =
                  transaction.type === "income"
                    ? `+${formatCurrency(absAmount, currency)}`
                    : formatCurrency(-absAmount, currency);

                const expanded = expandedId === transaction.id;

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
                            transaction.type === "income"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-red-500/20 text-red-300"
                          )}
                        >
                          {transaction.type === "income" ? (
                            <ArrowDownLeft className="h-4 w-4" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-zinc-100">{displayDesc}</span>
                            <Badge variant="secondary" className="font-normal text-[10px] px-1.5 py-0.5">
                              {categoryLabel}
                            </Badge>
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] text-zinc-400">
                              {renderMerchantIcon(analysis)}
                              {analysis?.merchantName || "Recorded Merchant"}
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                            <span>{formatDate(transaction.date, { dateStyle: "medium" })}</span>
                            {analysis?.categorySuggestion ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/25 bg-sky-500/10 px-2 py-0.5 text-sky-200">
                                <BadgeInfo className="h-3 w-3" />
                                AI category: {getCategoryLabel(analysis.categorySuggestion)} (
                                {(analysis.categoryConfidence * 100).toFixed(0)}%)
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
                        <div
                          className={cn(
                            "text-sm font-semibold",
                            transaction.type === "income" ? "text-emerald-300" : "text-zinc-100"
                          )}
                        >
                          {formattedAmount}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-8 w-8",
                            transaction.is_recurring
                              ? "text-sky-400 hover:text-sky-300"
                              : "text-muted-foreground hover:text-zinc-300"
                          )}
                          onClick={() => handleToggleRecurring(transaction.id)}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(transaction.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-zinc-200"
                          onClick={() =>
                            setExpandedId((prev) => (prev === transaction.id ? null : transaction.id))
                          }
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
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
                          AI Transaction Analysis
                        </p>
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
    </div>
  );
};
