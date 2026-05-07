import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useFinance, type Transaction } from "@/hooks/useFinance";
import { useSettings } from "@/hooks/useSettings";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { AddTransactionModal } from "@/components/finance/AddTransactionModal";
import { AddBudgetModal } from "@/components/finance/AddBudgetModal";
import { TransactionList } from "@/components/finance/TransactionList";
import { BudgetCard } from "@/components/finance/BudgetCard";
import { CashFlowChart } from "@/components/finance/CashFlowChart";
import { SpendingPieChart } from "@/components/finance/SpendingPieChart";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { QuickAddTransactions, type QuickAddItem } from "@/components/finance/QuickAddTransactions.tsx";
import { BudgetGoalsTracker } from "@/components/finance/BudgetGoalsTracker.tsx";
import { AIFinancialInsights } from "@/components/finance/AIFinancialInsights.tsx";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { currencies } from "@/data/subscriptionPresets";
import { convertWithDynamicRates } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/i18n/useTranslations";
import { formatMonthShortYear } from "@/i18n/date";
import { formatCurrency } from "@/i18n/currency";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plus,
  Wallet,
  TrendingUp,
  Activity,
  PiggyBank,
  Loader2,
  ArrowDownLeft,
  ArrowUpRight,
  Trophy,
  Compass,
  Bot,
  Calendar,
} from "lucide-react";

interface RecurringRule {
  id: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  currency: string;
  recurringDay: string;
}

interface MonthlyArchive {
  id: string;
  monthKey: string;
  monthYear?: string;
  title: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  transactions: Transaction[];
  aiInsight: string;
  sentiment: "success" | "warning" | "neutral";
}

const Finance = () => {
  const QUICK_ADD_STORAGE_KEY = "finance.quickAddItems";
  const RECURRING_RULES_STORAGE_KEY = "finance.recurringRules";
  const MONTHLY_ARCHIVES_STORAGE_KEY = "finance.monthlyArchives";
  const LAST_LOGIN_MONTH_STORAGE_KEY = "finance.lastLoginMonth";
  const CLEARED_TX_IDS_STORAGE_KEY = "finance.clearedTransactionIds";
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const tFinance = useTranslations("Finance");
  const { defaultCurrency } = useSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    transactions,
    budgets,
    subscriptions,
    isLoading,
    errorMessage,
    createTransaction,
    deleteTransaction,
    toggleTransactionRecurring,
    createBudget,
    deleteBudget,
    refreshTransactions,
  } = useFinance();

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<string | null>(null);
  const [quickAddItems, setQuickAddItems] = useState<QuickAddItem[]>([]);
  const [quickAddDraft, setQuickAddDraft] = useState<QuickAddItem | null>(null);
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);
  const [monthlyArchives, setMonthlyArchives] = useState<MonthlyArchive[]>([]);
  const [monthlyArchivesTableData, setMonthlyArchivesTableData] = useState<any[]>([]);
  const [clearedTransactionIds, setClearedTransactionIds] = useState<string[]>([]);
  const [resetRecurringTransactions, setResetRecurringTransactions] = useState<Transaction[]>([]);
  const [monthReviewArchive, setMonthReviewArchive] = useState<MonthlyArchive | null>(null);
  const [isMonthReviewOpen, setIsMonthReviewOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { data: exchangeRatesList } = useExchangeRates();

  useEffect(() => {
    try {
      const quickAddRaw = localStorage.getItem(QUICK_ADD_STORAGE_KEY);
      if (quickAddRaw) {
        const parsed = JSON.parse(quickAddRaw);
        if (Array.isArray(parsed)) {
          const normalized = (parsed?.map((item) => ({
            ...item,
            type: item?.type === "income" ? "income" : "expense",
          })) ?? []) as QuickAddItem[];
          setQuickAddItems(normalized);
        }
      }

      const recurringRaw = localStorage.getItem(RECURRING_RULES_STORAGE_KEY);
      if (recurringRaw) {
        const recurringParsed = JSON.parse(recurringRaw);
        if (Array.isArray(recurringParsed)) {
          setRecurringRules(recurringParsed as RecurringRule[]);
        }
      }

      const archivesRaw = localStorage.getItem(MONTHLY_ARCHIVES_STORAGE_KEY);
      if (archivesRaw) {
        const archiveParsed = JSON.parse(archivesRaw);
        if (Array.isArray(archiveParsed)) {
          const normalizedArchives = (archiveParsed?.map((item) => ({
            ...item,
            monthYear: item?.monthYear || item?.month_year || "",
            sentiment:
              item?.sentiment === "success" || item?.sentiment === "warning" || item?.sentiment === "neutral"
                ? item.sentiment
                : "neutral",
          })) ?? []) as MonthlyArchive[];
          setMonthlyArchives(normalizedArchives);
        }
      }

      const clearedIdsRaw = localStorage.getItem(CLEARED_TX_IDS_STORAGE_KEY);
      if (clearedIdsRaw) {
        const clearedParsed = JSON.parse(clearedIdsRaw);
        if (Array.isArray(clearedParsed)) {
          setClearedTransactionIds(clearedParsed as string[]);
        }
      }
    } catch {
      setQuickAddItems([]);
      setRecurringRules([]);
      setMonthlyArchives([]);
      setClearedTransactionIds([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(QUICK_ADD_STORAGE_KEY, JSON.stringify(quickAddItems));
    localStorage.setItem(RECURRING_RULES_STORAGE_KEY, JSON.stringify(recurringRules));
    localStorage.setItem(MONTHLY_ARCHIVES_STORAGE_KEY, JSON.stringify(monthlyArchives));
    localStorage.setItem(CLEARED_TX_IDS_STORAGE_KEY, JSON.stringify(clearedTransactionIds));
  }, [quickAddItems, recurringRules, monthlyArchives, clearedTransactionIds]);

  useEffect(() => {
    let isMounted = true;

    const fetchMonthlyArchives = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase.from("monthly_archives").select("*").eq("user_id", user.id);
        if (error) throw error;

        const normalized =
          (data?.map((item: any) => ({
            id: String(item?.id || globalThis.crypto?.randomUUID?.() || `archive-${Date.now()}`),
            monthKey: String(item?.month_key || item?.monthKey || item?.month_year || ""),
            monthYear: String(item?.month_year || item?.monthYear || ""),
            title: String(item?.title || item?.month_year || "Ay Özeti"),
            totalIncome: Number(item?.total_income || item?.totalIncome || 0),
            totalExpense: Number(item?.total_expense || item?.totalExpense || 0),
            netSavings: Number(item?.net_savings || item?.netSavings || 0),
            transactions: (Array.isArray(item?.transactions) ? item.transactions : []) as Transaction[],
            aiInsight: String(item?.ai_message || item?.ai_insight || item?.aiInsight || ""),
            sentiment:
              item?.ai_sentiment === "success" || item?.ai_sentiment === "warning" || item?.ai_sentiment === "neutral"
                ? item.ai_sentiment
                : item?.sentiment === "success" || item?.sentiment === "warning" || item?.sentiment === "neutral"
                ? item.sentiment
                : "neutral",
          })) as MonthlyArchive[]) ?? [];

        if (isMounted && Array.isArray(normalized) && normalized.length > 0) {
          setMonthlyArchives(normalized);
        }
      } catch (error) {
        console.error("monthly_archives fetch skipped:", error);
      }
    };

    fetchMonthlyArchives();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    let isMounted = true;

    const fetchArchivesForChart = async () => {
      const { data: archives } = await supabase.from("monthly_archives").select("*");
      if (isMounted) {
        setMonthlyArchivesTableData(Array.isArray(archives) ? archives : []);
      }
    };

    void fetchArchivesForChart();
    return () => {
      isMounted = false;
    };
  }, []);

  const exchangeRates = useMemo(() => {
    if (!exchangeRatesList) return {};
    return (
      exchangeRatesList?.reduce((acc, curr) => {
        acc[curr.currency_code] = Number(curr.rate);
        return acc;
      }, {} as Record<string, number>) ?? {}
    );
  }, [exchangeRatesList]);

  // Defensive arrays
  const safeSubscriptions = useMemo(() => Array.isArray(subscriptions) ? subscriptions : [], [subscriptions]);
  const safeTransactions = useMemo(() => Array.isArray(transactions) ? transactions : [], [transactions]);
  const safeBudgets = useMemo(() => Array.isArray(budgets) ? budgets : [], [budgets]);
  const activeTransactions = useMemo(
    () => safeTransactions.filter((tx) => !clearedTransactionIds.includes(tx.id)),
    [safeTransactions, clearedTransactionIds]
  );

  const normalizedRules = useMemo(
    () =>
      recurringRules?.map((rule) => ({
        ...rule,
        description: rule.description.trim().toLowerCase(),
      })) ?? [],
    [recurringRules]
  );

  const isRecurringTransaction = useCallback(
    (tx: Transaction) => {
      const description = (tx.description || "").trim().toLowerCase();
      return normalizedRules.some(
        (rule) =>
          rule.type === tx.type &&
          rule.category === tx.category &&
          rule.description === description
      );
    },
    [normalizedRules]
  );

  const displayedTransactions = useMemo(
    () => {
      const merged = [...resetRecurringTransactions, ...activeTransactions];
      const seen = new Set<string>();
      return merged.filter((tx) => {
        if (seen.has(tx.id)) return false;
        seen.add(tx.id);
        return true;
      });
    },
    [activeTransactions, resetRecurringTransactions]
  );

  // Determine the most used currency from subscriptions (auto-detect)
  const autoDetectedCurrency = useMemo(() => {
    try {
      const counts: Record<string, number> = {};
      safeSubscriptions.forEach((sub) => {
        if (sub?.currency) {
          counts[sub.currency] = (counts[sub.currency] || 0) + 1;
        }
      });
      const entries = Object.entries(counts);
      if (entries.length === 0) return "USD";
      return entries.sort((a, b) => b[1] - a[1])[0][0];
    } catch (e) {
      return "USD";
    }
  }, [safeSubscriptions]);

  // Use user-selected currency or auto-detected
  const autoCurrency = defaultCurrency || autoDetectedCurrency;
  const activeCurrency = displayCurrency || autoCurrency;

  const buildAiInsight = useCallback(
    (income: number, expense: number, txs: Transaction[]) => {
      if (txs.length === 0) {
        return {
          sentiment: "neutral" as const,
          message:
            "Yeni ay için harika bir başlangıç noktandasın! İşlem ekledikçe burada sana özel önerilerle daha net bir finans fotoğrafı sunacağım.",
        };
      }

      const net = income - expense;
      const topCategory =
        txs
          ?.filter((tx) => tx.type === "expense")
          ?.reduce((acc, tx) => {
            const current = acc[tx.category] || 0;
            acc[tx.category] = current + Number(tx.amount || 0);
            return acc;
          }, {} as Record<string, number>) ?? {};

      const topEntry = Object.entries(topCategory).sort((a, b) => b[1] - a[1])[0];
      if (!topEntry) {
        return net >= 0
          ? {
              sentiment: "success" as const,
              message:
                "Harika bir iş çıkardın! Bu ay bütçeni dengede tutmayı başardın. Arta kalan tutarı dilersen acil durum fonuna ayırabilir ya da kendine küçük bir ödül vererek motivasyonunu artırabilirsin. Doğru yoldasın!",
            }
          : {
              sentiment: "warning" as const,
              message:
                "Bu ay biraz zorlayıcı geçmiş olabilir, ama merak etme hepimizin böyle dönemleri olur. Önümüzdeki ay sabit giderleri küçük adımlarla dengeleyerek finansal hedeflerine birlikte daha güçlü ilerleyebiliriz.",
            };
      }

      const [category, amount] = topEntry;
      if (net >= 0) {
        return {
          sentiment: "success" as const,
          message: `Harika gidiyorsun! Bu ay en yüksek harcama kategorin ${category} olsa da, yine de net ${formatCurrency(
            net,
            activeCurrency
          )} artıda kalmayı başardın. Bu tutarı geleceğin için küçük bir yatırıma veya acil durum fonuna ayırmayı düşünebilirsin.`,
        };
      }

      return {
        sentiment: "warning" as const,
        message: `Bu ay ${category} kategorisinde ${formatCurrency(
          amount,
          activeCurrency
        )} harcama öne çıkmış görünüyor; sorun değil, böyle aylar herkesin olabilir. Önümüzdeki ay bu kategoriyi biraz dengeleyerek net durumu hızla toparlayabiliriz. Birlikte başaracağız!`,
      };
    },
    [activeCurrency]
  );

  const toActiveCurrency = useCallback(
    (amount: number, fromCurrency: string) => {
      return convertWithDynamicRates(amount, fromCurrency, activeCurrency, exchangeRates);
    },
    [activeCurrency, exchangeRates]
  );

  // Wrap all data calculations in a safe memo
  const financialData = useMemo(() => {
    try {
      const fallbackTxCurrency = defaultCurrency || "USD";

      const monthlyIncome =
        activeTransactions
          ?.filter((t) => t?.type === "income")
          ?.reduce((total, t) => {
            const raw = Number(t?.amount || 0);
            const from = t?.currency || fallbackTxCurrency;
            const converted = toActiveCurrency(raw, from);
            return total + (isFinite(converted) ? converted : 0);
          }, 0) ?? 0;

      const monthlyExpenses =
        activeTransactions
          ?.filter((t) => t?.type === "expense")
          ?.reduce((total, t) => {
            const raw = Number(t?.amount || 0);
            const from = t?.currency || fallbackTxCurrency;
            const converted = toActiveCurrency(raw, from);
            return total + (isFinite(converted) ? converted : 0);
          }, 0) ?? 0;

      const cumulativeIncome =
        safeTransactions
          ?.filter((t) => t?.type === "income")
          ?.reduce((total, t) => {
            const raw = Number(t?.amount || 0);
            const from = t?.currency || fallbackTxCurrency;
            const converted = toActiveCurrency(raw, from);
            return total + (isFinite(converted) ? converted : 0);
          }, 0) ?? 0;

      const cumulativeExpenses =
        safeTransactions
          ?.filter((t) => t?.type === "expense")
          ?.reduce((total, t) => {
            const raw = Number(t?.amount || 0);
            const from = t?.currency || fallbackTxCurrency;
            const converted = toActiveCurrency(raw, from);
            return total + (isFinite(converted) ? converted : 0);
          }, 0) ?? 0;

      const monthlySubCost =
        safeSubscriptions?.reduce((total, sub) => {
          const rawPrice = Number(sub?.price ?? 0);
          const monthlyPrice = sub?.billing_cycle === "yearly" ? rawPrice / 12 : rawPrice;
          const from = sub?.currency || activeCurrency;
          const converted = toActiveCurrency(monthlyPrice, from);
          return total + (isFinite(converted) ? converted : 0);
        }, 0) ?? 0;

      const net = cumulativeIncome - cumulativeExpenses;

      // Health Score Calculation
      let health = {
        score: 0 as number | null,
        label: "Risky",
        emoji: "🔴",
        color: "text-destructive bg-destructive/10",
        description: tFinance("health_desc", { percent: 0 }),
      };
      
      if (monthlyIncome > 0) {
        const ratio = monthlySubCost / monthlyIncome;
        let score = 0;
        let label = "";
        let emoji = "";
        let color = "";

        if (ratio < 0.05) {
          score = Math.round(90 + (0.05 - ratio) * 200); // 90-100
          label = "Excellent";
          emoji = "🟢";
          color = "text-success bg-success/10";
        } else if (ratio < 0.10) {
          score = Math.round(70 + (0.10 - ratio) * 400); // 70-89
          label = "Healthy";
          emoji = "🟢";
          color = "text-success bg-success/10";
        } else if (ratio < 0.20) {
          score = Math.round(40 + (0.20 - ratio) * 300); // 40-69
          label = "Warning";
          emoji = "🟡";
          color = "text-warning bg-warning/10";
        } else {
          score = Math.max(0, Math.round(40 - ratio * 100)); // 0-39
          label = "Risky";
          emoji = "🔴";
          color = "text-destructive bg-destructive/10";
        }

        score = Math.min(100, Math.max(0, score));
        const percentage = Math.round(ratio * 100);

        health = {
          score: isFinite(score) ? score : 0,
          label,
          emoji,
          color,
          description: tFinance("health_desc", { percent: isFinite(percentage) ? percentage : 0 }),
        };
      }

      return {
        totalIncome: isFinite(monthlyIncome) ? monthlyIncome : 0,
        totalExpenses: isFinite(monthlyExpenses) ? monthlyExpenses : 0,
        totalMonthlyCost: isFinite(monthlySubCost) ? monthlySubCost : 0,
        netWorth: isFinite(net) ? net : 0,
        financialHealth: health
      };
    } catch (error) {
      console.error("Financial calculation error:", error);
      return {
        totalIncome: 0,
        totalExpenses: 0,
        totalMonthlyCost: 0,
        netWorth: 0,
        financialHealth: {
          score: 0 as number | null,
          label: "Risky",
          emoji: "🔴",
          color: "text-destructive bg-destructive/10",
          description: tFinance("health_desc", { percent: 0 }),
        }
      };
    }
  }, [safeSubscriptions, safeTransactions, activeTransactions, activeCurrency, defaultCurrency, tFinance, toActiveCurrency]);

  const { totalIncome, totalExpenses, financialHealth } = financialData;

  const cashFlowData = useMemo(() => {
    try {
      const now = new Date();
      const monthsBack = 5;
      const initialChartData: { month: string; name: string; monthKey: string; income: number; expenses: number }[] = [];
      for (let i = monthsBack; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const shortMonth = new Intl.DateTimeFormat("en-US", { month: "short" }).format(d);
        initialChartData.push({
          month: formatMonthShortYear(d),
          name: shortMonth,
          monthKey,
          income: 0,
          expenses: 0,
        });
      }

      const fallbackTxCurrency = defaultCurrency || "USD";
      const parseLocalDate = (value: string) => new Date(`${value}T00:00:00`);
      const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      const currentMonthLive = (activeTransactions ?? []).reduce(
        (acc, tx) => {
          if (!tx?.date || !tx?.type) return acc;
          const txDate = parseLocalDate(tx.date);
          const txMonthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}`;
          if (txMonthKey !== currentMonthKey) return acc;
          const raw = Number(tx?.amount || 0);
          const from = tx?.currency || fallbackTxCurrency;
          const converted = toActiveCurrency(raw, from);
          const val = isFinite(converted) ? converted : 0;
          if (tx.type === "income") acc.income += val;
          if (tx.type === "expense") acc.expenses += val;
          return acc;
        },
        { income: 0, expenses: 0 }
      );

      const monthMap = {
        Jan: "Ocak",
        Feb: "Şubat",
        Mar: "Mart",
        Apr: "Nisan",
        May: "Mayıs",
        Jun: "Haziran",
        Jul: "Temmuz",
        Aug: "Ağustos",
        Sep: "Eylül",
        Oct: "Ekim",
        Nov: "Kasım",
        Dec: "Aralık",
      };

      const finalChartData = initialChartData.map((item) => {
        if (item.monthKey === currentMonthKey) {
          return {
            ...item,
            income: Math.max(0, currentMonthLive.income),
            expenses: Math.max(0, currentMonthLive.expenses),
          };
        }

        const matchedArchive = monthlyArchivesTableData.find((a) =>
          String(a?.month_year || "").includes(String(monthMap[item.name as keyof typeof monthMap] || ""))
        );
        if (matchedArchive) {
          return {
            ...item,
            income: Number(matchedArchive.total_income || 0),
            expenses: Number(matchedArchive.total_expense || 0),
          };
        }
        return item;
      });

      return finalChartData.map((item) => ({
        month: item.month,
        income: Math.max(0, Number(item.income || 0)),
        expenses: Math.max(0, Number(item.expenses || 0)),
      }));
    } catch {
      return [];
    }
  }, [monthlyArchivesTableData, activeTransactions, defaultCurrency, toActiveCurrency]);

  const spendingData = useMemo(() => {
    try {
      const distribution: { name: string; value: number }[] = [];
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const fallbackTxCurrency = defaultCurrency || "USD";
      const parseLocalDate = (value: string) => new Date(`${value}T00:00:00`);

      const categoryTotals: Record<string, number> = {};

      activeTransactions
        ?.filter((t) => t?.type === "expense" && t?.date && parseLocalDate(t.date) >= startOfMonth)
        .forEach((t) => {
          if (!t?.category) return;
          const raw = Number(t?.amount || 0);
          const from = t?.currency || fallbackTxCurrency;
          const converted = toActiveCurrency(raw, from);
          categoryTotals[t.category] = (categoryTotals[t.category] || 0) + (isFinite(converted) ? converted : 0);
        });

      Object.entries(categoryTotals)?.forEach(([name, value]) => {
        if (value > 0) {
          distribution.push({ name, value: isFinite(value) ? value : 0 });
        }
      });

      return distribution;
    } catch {
      return [];
    }
  }, [activeTransactions, defaultCurrency, toActiveCurrency]);

  const budgetSpentMap = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const fallbackTxCurrency = defaultCurrency || "USD";
    const result: Record<string, number> = {};
    const parseLocalDate = (value: string) => new Date(`${value}T00:00:00`);

    safeBudgets.forEach((budget) => {
      const budgetCurrency = budget.currency || activeCurrency || defaultCurrency || "USD";
      const total =
        activeTransactions
        ?.filter((t) => {
          if (!t?.date) return false;
          const tDate = parseLocalDate(t.date);
          return t.type === "expense" && t.category === budget.category && tDate >= startOfMonth;
        })
        ?.reduce((sum, t) => {
          const raw = Number(t?.amount || 0);
          const from = t?.currency || fallbackTxCurrency;
          const converted = convertWithDynamicRates(raw, from, budgetCurrency, exchangeRates);
          return sum + (isFinite(converted) ? converted : 0);
        }, 0) ?? 0;

      result[budget.id] = isFinite(total) ? total : 0;
    });

    return result;
  }, [safeBudgets, activeTransactions, activeCurrency, defaultCurrency, exchangeRates]);

  const budgetConvertedFromMap = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const fallbackTxCurrency = defaultCurrency || "USD";
    const parseLocalDate = (value: string) => new Date(`${value}T00:00:00`);

    const result: Record<string, { amount: number; currency: string } | "multiple" | null> = {};

    safeBudgets.forEach((budget) => {
      const budgetCurrency = budget.currency || activeCurrency || defaultCurrency || "USD";
      const byCurrency: Record<string, number> = {};

      activeTransactions
        ?.filter((t) => {
          if (!t?.date) return false;
          const tDate = parseLocalDate(t.date);
          return t.type === "expense" && t.category === budget.category && tDate >= startOfMonth;
        })
        .forEach((t) => {
          const txCurrency = t.currency || fallbackTxCurrency;
          if (txCurrency === budgetCurrency) return;
          const raw = Number(t.amount || 0);
          if (!Number.isFinite(raw)) return;
          byCurrency[txCurrency] = (byCurrency[txCurrency] || 0) + raw;
        });

      const currencies = Object.keys(byCurrency);
      if (currencies.length === 0) {
        result[budget.id] = null;
        return;
      }
      if (currencies.length > 1) {
        result[budget.id] = "multiple";
        return;
      }

      const onlyCurrency = currencies[0];
      result[budget.id] = { currency: onlyCurrency, amount: byCurrency[onlyCurrency] ?? 0 };
    });

    return result;
  }, [safeBudgets, activeTransactions, activeCurrency, defaultCurrency]);

  const handleSaveRecurringRule = useCallback(
    (item: {
      type: "income" | "expense";
      category: string;
      description: string;
      amount: number;
      currency: string;
      recurringDay: string;
    }) => {
      setRecurringRules((prev) => {
        const exists = prev.some(
          (rule) =>
            rule.type === item.type &&
            rule.category === item.category &&
            rule.description.trim().toLowerCase() === item.description.trim().toLowerCase()
        );
        if (exists) return prev;
        const id =
          globalThis.crypto?.randomUUID?.() ??
          `rule-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        return [...prev, { id, ...item }];
      });
    },
    []
  );

  // Gelecekte otomatik tetiklenecek (cron job / tarih kontrolü).
  const runMonthlyReset = useCallback(
    async (forced = false) => {
      if (isLoading || isResetting) return;

      setIsResetting(true);
      try {
        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const lastLoginMonth = localStorage.getItem(LAST_LOGIN_MONTH_STORAGE_KEY);

        if (!forced) {
          if (!lastLoginMonth) {
            localStorage.setItem(LAST_LOGIN_MONTH_STORAGE_KEY, currentMonthKey);
            return;
          }
          if (lastLoginMonth === currentMonthKey) return;
        }

        const resettingTransactions = activeTransactions ?? [];

        // Adım A: recurring işlemleri hafızaya al
        const recurringTransactions = resettingTransactions.filter((t: any) => t?.is_recurring === true);
        const recurringInsertPayloads = recurringTransactions.map((tx: any) => {
          const recurringDay = Number(tx?.recurring_day);
          const originalDay = new Date(`${tx.date}T00:00:00`).getDate();
          const sourceDay = Number.isFinite(recurringDay) && recurringDay > 0 ? recurringDay : originalDay;
          const maxDayInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          const targetDay = Math.max(1, Math.min(sourceDay, maxDayInMonth));
          const targetDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;

          return {
            user_id: user?.id ?? tx.user_id,
            amount: Number(tx.amount || 0),
            type: tx.type,
            category: tx.category,
            description: tx.description ?? null,
            date: targetDate,
            currency: tx.currency ?? null,
            is_recurring: true,
            recurring_day: String(targetDay),
          };
        });

        const totalIncome =
          resettingTransactions
            ?.filter((tx) => tx.type === "income")
            ?.reduce((sum, tx) => sum + Number(tx.amount || 0), 0) ?? 0;
        const totalExpense =
          resettingTransactions
            ?.filter((tx) => tx.type === "expense")
            ?.reduce((sum, tx) => sum + Number(tx.amount || 0), 0) ?? 0;
        const netSavings = totalIncome - totalExpense;

        const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const monthLabel = prevMonthDate.toLocaleDateString("tr-TR", {
          month: "long",
          year: "numeric",
        });

        const insight = buildAiInsight(totalIncome, totalExpense, resettingTransactions);
        const archive: MonthlyArchive = {
          id:
            globalThis.crypto?.randomUUID?.() ??
            `archive-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          monthKey: `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`,
          monthYear: monthLabel,
          title: `${monthLabel} Özeti`,
          totalIncome,
          totalExpense,
          netSavings,
          transactions: resettingTransactions,
          aiInsight: insight.message,
          sentiment: insight.sentiment,
        };

        const archivePayload = {
          user_id: user?.id ?? null,
          month_year: archive.monthYear,
          total_income: archive.totalIncome,
          total_expense: archive.totalExpense,
          net_savings: archive.netSavings,
          ai_message: archive.aiInsight,
          ai_sentiment: archive.sentiment,
        };

        // Adım B: archive insert (await)
        const { error: archiveInsertError } = await (supabase.from("monthly_archives") as any).insert([archivePayload]);
        if (archiveInsertError) {
          console.error("monthly_archives insert skipped:", archiveInsertError);
          return;
        }

        // Adım C: eski işlemlerin tamamını sil (await)
        const { error: deleteError } = await (supabase.from("transactions") as any)
          .delete()
          .eq("user_id", user?.id ?? "");
        if (deleteError) {
          console.error("transactions delete skipped:", deleteError);
          return;
        }

        // Adım D: recurring işlemleri yeni aya insert et (await)
        if (recurringInsertPayloads.length > 0) {
          const { error: recurringInsertError } = await (supabase.from("transactions") as any)
            .insert(recurringInsertPayloads);
          if (recurringInsertError) {
            console.error("recurring transactions insert skipped:", recurringInsertError);
            return;
          }
        }

        // UI state mutasyonu yerine taze veri çek
        await refreshTransactions();

        setMonthlyArchives((prev) => [archive, ...(prev?.filter((item) => item.monthKey !== archive.monthKey) ?? [])]);
        setMonthlyArchivesTableData((prev) => [
          {
            month_year: archive.monthYear,
            total_income: archive.totalIncome,
            total_expense: archive.totalExpense,
            month_key: archive.monthKey,
          },
          ...prev.filter((item) => item?.month_key !== archive.monthKey),
        ]);
        setClearedTransactionIds([]);
        setResetRecurringTransactions([]);
        setMonthReviewArchive(archive);
        setIsMonthReviewOpen(true);
        localStorage.setItem(LAST_LOGIN_MONTH_STORAGE_KEY, currentMonthKey);

        if (forced) {
          toast.success("DEV TEST: Yeni ay tetiklendi.");
        }
      } finally {
        setIsResetting(false);
      }
    },
    [isLoading, isResetting, activeTransactions, buildAiInsight, user?.id, refreshTransactions]
  );

  useEffect(() => {
    runMonthlyReset(false);
  }, [runMonthlyReset]);

  const handleSaveQuickAdd = useCallback(
    (item: { label: string; type: "income" | "expense"; category: string; amount: number; currency: string }) => {
      setQuickAddItems((prev) => {
        const id =
          globalThis.crypto?.randomUUID?.() ??
          `quick-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        return [...prev, { id, ...item }];
      });
    },
    []
  );

  const handleQuickAddClick = useCallback(
    (item: QuickAddItem) => {
      setQuickAddDraft(item);
      setIsTransactionModalOpen(true);
    },
    []
  );

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="relative min-h-screen pb-8">
        <main>
          <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[60vh] flex items-center justify-center">
            <div className="glass-card rounded-xl border border-gray-800/60 px-6 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                Veriler yüklenirken bir sorun oluştu, lütfen sayfayı yenileyin
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const displayedHealthLabel =
    financialHealth.label === "Risky"
      ? tFinance("risky")
      : financialHealth.label === "Healthy"
        ? tFinance("healthy")
        : financialHealth.label === "Warning"
          ? tFinance("warning")
          : financialHealth.label;
  const healthStatusBadgeClass =
    financialHealth.label === "Risky"
      ? "bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 inline-block"
      : financialHealth.label === "Warning"
        ? "bg-yellow-500/10 text-yellow-400 px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 inline-block"
        : "bg-green-500/10 text-green-400 px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 inline-block";

  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remainingDays = Math.max(1, daysInMonth - now.getDate() + 1);
  const dailySafeSpend = balance / remainingDays;

  return (
    <div className="relative min-h-screen pb-8">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 pointer-events-none w-[800px] h-[400px] bg-red-900/20 blur-[120px] rounded-full" />

      <main>
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col xl:flex-row items-start gap-6">
          <div className="flex-1 min-w-0 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-3">
                <Wallet className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                {t.finance.title}
              </h1>
              <p className="text-muted-foreground mt-1">
                {t.finance.subtitle}
              </p>
            </div>
            <div className="flex gap-2">
              {/* Currency Selector */}
              <Select 
                value={displayCurrency || "auto"} 
                onValueChange={(v) => setDisplayCurrency(v === "auto" ? null : v)}
              >
                <SelectTrigger className="w-auto gap-2 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="auto">{t.dashboard.auto} ({autoCurrency})</SelectItem>
                  {currencies?.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  )) ?? null}
                </SelectContent>
              </Select>
              <Button
                onClick={() => setIsBudgetModalOpen(true)}
                variant="outline"
                className="gap-2"
              >
                <PiggyBank className="w-4 h-4" />
                {t.finance.addBudget}
              </Button>
              <Button
                onClick={() => {
                  setQuickAddDraft(null);
                  setIsTransactionModalOpen(true);
                }}
                className="ruby-gradient border-0 shadow-ruby hover:shadow-ruby-strong gap-2"
              >
                <Plus className="w-5 h-5" />
                {t.finance.addTransaction}
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#1A1A1E] rounded-2xl border border-white/10 p-6 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.03)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <ArrowDownLeft className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-xs font-medium text-gray-400 tracking-wider uppercase">{t.finance.income}</p>
              </div>
              <p className="font-display text-3xl font-semibold text-white mt-4">
                {formatCurrency(totalIncome, activeCurrency)}
              </p>
            </div>

            <div className="bg-[#1A1A1E] rounded-2xl border border-white/10 p-6 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.03)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-4 h-4 text-red-500" />
                </div>
                <p className="text-xs font-medium text-gray-400 tracking-wider uppercase">{t.finance.expenses}</p>
              </div>
              <p className="font-display text-3xl font-semibold text-white mt-4">
                {formatCurrency(totalExpenses, activeCurrency)}
              </p>
            </div>

            <div className="bg-[#1A1A1E] rounded-2xl border border-white/10 p-6 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.03)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                <p className="text-xs font-medium text-gray-400 tracking-wider uppercase">HEALTH SCORE</p>
              </div>
              <p className="font-display text-3xl font-semibold text-white mt-4">
                {`${financialHealth.score ?? 0}/100`}
              </p>
              <span className={healthStatusBadgeClass}>{displayedHealthLabel}</span>
            </div>

            <div className="bg-[#1A1A1E] rounded-2xl border border-white/10 p-6 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.03)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-yellow-500" />
                </div>
                <p className="text-xs font-medium text-gray-400 tracking-wider uppercase">{t.finance.balance}</p>
              </div>
              <p className="font-display text-3xl font-semibold text-white mt-4">
                {formatCurrency(balance, activeCurrency)}
              </p>
            </div>

            <div className="bg-[#1A1A1E] rounded-2xl border border-white/10 p-6 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.03)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-xs font-medium text-gray-400 tracking-wider uppercase">Savings Rate</p>
              </div>
              <p
                className={cn(
                  "font-display text-3xl font-semibold mt-4",
                  savingsRate > 0 ? "text-green-500" : savingsRate < 0 ? "text-red-500" : "text-white"
                )}
              >
                {`${savingsRate.toFixed(1)}%`}
              </p>
            </div>

            <div className="bg-[#1A1A1E] rounded-2xl border border-white/10 p-6 hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.03)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4 text-primary" />
                </div>
                <p className="text-xs font-medium text-gray-400 tracking-wider uppercase">Daily Safe Spend</p>
              </div>
              <p className="font-display text-3xl font-semibold text-white mt-4">
                {formatCurrency(dailySafeSpend, activeCurrency)}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <AIFinancialInsights />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <CashFlowChart data={cashFlowData} currency={activeCurrency} />
            <SpendingPieChart data={spendingData} currency={activeCurrency} />
          </div>

          {/* Tabs for Transactions and Budgets */}
          <Tabs
            value={
              searchParams.get("tab") === "budgets"
                ? "budgets"
                : searchParams.get("tab") === "monthly-summaries"
                  ? "monthly-summaries"
                  : "transactions"
            }
            onValueChange={(value) => setSearchParams({ tab: value }, { replace: true })}
            className="space-y-4"
          >
            <TabsList className="h-auto bg-transparent p-0 rounded-none border-b border-gray-800/40 w-fit">
              <TabsTrigger
                value="transactions"
                className="rounded-none bg-transparent px-3 py-2 text-sm font-medium text-gray-400 shadow-none border-b-2 border-transparent data-[state=active]:text-gray-100 data-[state=active]:border-red-500 data-[state=active]:bg-transparent"
              >
                {t.finance.transactions}
              </TabsTrigger>
              <TabsTrigger
                value="budgets"
                className="rounded-none bg-transparent px-3 py-2 text-sm font-medium text-gray-400 shadow-none border-b-2 border-transparent data-[state=active]:text-gray-100 data-[state=active]:border-red-500 data-[state=active]:bg-transparent"
              >
                {t.finance.budgets}
              </TabsTrigger>
              <TabsTrigger
                value="monthly-summaries"
                className="rounded-none bg-transparent px-3 py-2 text-sm font-medium text-gray-400 shadow-none border-b-2 border-transparent data-[state=active]:text-gray-100 data-[state=active]:border-red-500 data-[state=active]:bg-transparent"
              >
                Monthly Summaries
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="space-y-4">
              <TransactionList
                transactions={displayedTransactions}
                budgets={safeBudgets}
                onDelete={deleteTransaction}
                onToggleRecurring={toggleTransactionRecurring}
              />
            </TabsContent>

            <TabsContent value="budgets" className="space-y-4">
              {(safeBudgets?.length ?? 0) === 0 ? (
                <div className="glass-card rounded-xl p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                    <PiggyBank className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-xl font-semibold mb-2">
                    {t.finance.noBudgets}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {t.finance.noBudgets}
                  </p>
                  <Button
                    onClick={() => setIsBudgetModalOpen(true)}
                    className="ruby-gradient border-0 shadow-ruby gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {t.finance.addBudget}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {safeBudgets?.map((budget) => (
                    <BudgetCard
                      key={budget.id}
                      budget={budget}
                      spent={budgetSpentMap[budget.id] ?? 0}
                      currency={budget.currency || activeCurrency || defaultCurrency || "USD"}
                      convertedFrom={budgetConvertedFromMap[budget.id] ?? null}
                      onDelete={deleteBudget}
                    />
                  )) ?? null}
                </div>
              )}
            </TabsContent>

            <TabsContent value="monthly-summaries" className="space-y-4">
              {(monthlyArchives?.length ?? 0) === 0 ? (
                <div className="glass-card rounded-xl p-8 text-center text-sm text-muted-foreground">
                  Henüz aylık özet bulunmuyor.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {monthlyArchives?.map((archive) => {
                    const total = archive.totalIncome + archive.totalExpense;
                    const incomeRatio = total > 0 ? (archive.totalIncome / total) * 100 : 0;
                    const expenseRatio = total > 0 ? (archive.totalExpense / total) * 100 : 0;
                    return (
                      <div key={archive.id} className="glass-card rounded-xl p-4 border border-gray-800/50">
                        <h4 className="font-display text-base font-semibold text-gray-100">{archive.title}</h4>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-gray-500">Gelir</p>
                            <p className="text-gray-100 font-semibold">{formatCurrency(archive.totalIncome, activeCurrency)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Gider</p>
                            <p className="text-gray-100 font-semibold">{formatCurrency(archive.totalExpense, activeCurrency)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Net</p>
                            <p className={cn("font-semibold", archive.netSavings >= 0 ? "text-green-400" : "text-red-400")}>
                              {formatCurrency(archive.netSavings, activeCurrency)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          <div className="h-1.5 rounded-full bg-gray-800/70 overflow-hidden">
                            <div className="h-full bg-emerald-500/80" style={{ width: `${incomeRatio}%` }} />
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-800/70 overflow-hidden">
                            <div className="h-full bg-red-500/80" style={{ width: `${expenseRatio}%` }} />
                          </div>
                        </div>
                        <div
                          className={cn(
                            "mt-4 rounded-xl px-4 py-3 border relative overflow-hidden flex items-center gap-3 transition-all duration-500 ease-out animate-in fade-in slide-in-from-bottom-4",
                            archive.sentiment === "success" &&
                              "border-green-500/20 bg-green-500/5 shadow-[0_0_15px_rgba(34,197,94,0.08)]",
                            archive.sentiment === "warning" &&
                              "border-orange-500/20 bg-orange-500/5 shadow-[0_0_15px_rgba(245,158,11,0.08)]",
                            archive.sentiment === "neutral" &&
                              "border-sky-500/20 bg-sky-500/5 shadow-[0_0_15px_rgba(56,189,248,0.08)]"
                          )}
                        >
                          <div
                            className={cn(
                              "pointer-events-none absolute inset-0 rounded-lg border animate-pulse [animation-duration:3s]",
                              archive.sentiment === "success" &&
                                "border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.08)]",
                              archive.sentiment === "warning" &&
                                "border-orange-500/20 shadow-[0_0_15px_rgba(245,158,11,0.08)]",
                              archive.sentiment === "neutral" &&
                                "border-sky-500/20 shadow-[0_0_15px_rgba(56,189,248,0.08)]"
                            )}
                          />
                          {archive.sentiment === "success" && <Trophy className="w-4 h-4 text-green-400 shrink-0 relative z-10" />}
                          {archive.sentiment === "warning" && <Compass className="w-4 h-4 text-orange-400 shrink-0 relative z-10" />}
                          {archive.sentiment === "neutral" && <Bot className="w-4 h-4 text-sky-400 shrink-0 relative z-10" />}
                          <p className="text-sm text-gray-300 leading-relaxed relative z-10">{archive.aiInsight}</p>
                        </div>
                      </div>
                    );
                  }) ?? null}
                </div>
              )}
            </TabsContent>
          </Tabs>
          </div>

          <div className="w-full xl:w-[320px] shrink-0 flex flex-col gap-6 xl:sticky xl:top-6 z-10">
            <QuickAddTransactions
              items={quickAddItems}
              onQuickAddClick={handleQuickAddClick}
            />
            <BudgetGoalsTracker budgets={safeBudgets} transactions={activeTransactions} currency={activeCurrency} />
          </div>
        </div>
      </main>

      {isMonthReviewOpen && monthReviewArchive && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-800/60 bg-[#0c0c0e]/90 backdrop-blur-xl p-6 shadow-2xl transition-all duration-500 ease-out animate-in fade-in slide-in-from-bottom-4">
            <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 shadow-[0_0_15px_rgba(220,38,38,0.2)] flex items-center justify-center">
              <Calendar className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="font-display text-xl font-semibold text-gray-100">
              Geçen Ayın Özeti ({monthReviewArchive.title.replace(" Özeti", "")})
            </h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Toplam Gelir</span>
                <span className="text-xl font-semibold text-gray-100">{formatCurrency(monthReviewArchive.totalIncome, activeCurrency)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Toplam Gider</span>
                <span className="text-xl font-semibold text-gray-100">{formatCurrency(monthReviewArchive.totalExpense, activeCurrency)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Net Tasarruf</span>
                <span className={cn("text-xl font-semibold", monthReviewArchive.netSavings >= 0 ? "text-green-400" : "text-red-400")}>
                  {formatCurrency(monthReviewArchive.netSavings, activeCurrency)}
                </span>
              </div>
            </div>
            <Button
              className="mt-6 w-full bg-red-600/90 text-white rounded-lg px-6 py-3 font-medium shadow-[0_0_15px_rgba(220,38,38,0.2)] hover:bg-red-500 transition-all"
              onClick={() => setIsMonthReviewOpen(false)}
            >
              Yeni Aya Başla
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddTransactionModal
        open={isTransactionModalOpen}
        onOpenChange={(open) => {
          setIsTransactionModalOpen(open);
          if (!open) setQuickAddDraft(null);
        }}
        onCreateTransaction={createTransaction}
        onSaveQuickAdd={handleSaveQuickAdd}
        onSaveRecurringRule={handleSaveRecurringRule}
        initialTransactionData={
          quickAddDraft
            ? {
                type: quickAddDraft.type,
                category: quickAddDraft.category,
                description: quickAddDraft.label,
                amount: quickAddDraft.amount,
                currency: quickAddDraft.currency,
              }
            : undefined
        }
      />
      <AddBudgetModal
        open={isBudgetModalOpen}
        onOpenChange={setIsBudgetModalOpen}
        existingCategories={safeBudgets?.map((b) => b.category) ?? []}
        onCreateBudget={createBudget}
      />

      {/* Feedback Button */}
      <FeedbackButton />
    </div>
  );
};

export default Finance;
