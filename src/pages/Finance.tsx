import { useCallback, useMemo, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useFinance } from "@/hooks/useFinance";
import { useSettings } from "@/hooks/useSettings";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { Navbar } from "@/components/layout/Navbar";
import { AddTransactionModal } from "@/components/finance/AddTransactionModal";
import { AddBudgetModal } from "@/components/finance/AddBudgetModal";
import { TransactionList } from "@/components/finance/TransactionList";
import { BudgetCard } from "@/components/finance/BudgetCard";
import { CashFlowChart } from "@/components/finance/CashFlowChart";
import { SpendingPieChart } from "@/components/finance/SpendingPieChart";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { currencies } from "@/data/subscriptionPresets";
import { convertWithDynamicRates } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/i18n/useTranslations";
import { formatMonthShortYear } from "@/i18n/date";
import { formatCurrency } from "@/i18n/currency";
import {
  Plus,
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Loader2,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";

const Finance = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const tFinance = useTranslations("Finance");
  const tDashboard = useTranslations("Dashboard");
  const tCategories = useTranslations("Categories");
  const { defaultCurrency } = useSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    transactions,
    budgets,
    subscriptions,
    isLoading,
    createTransaction,
    deleteTransaction,
    createBudget,
    deleteBudget,
    getSpentByCategory,
  } = useFinance();

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<string | null>(null);
  const { data: exchangeRatesList } = useExchangeRates();

  const exchangeRates = useMemo(() => {
    if (!exchangeRatesList) return {};
    return exchangeRatesList.reduce((acc, curr) => {
      acc[curr.currency_code] = Number(curr.rate);
      return acc;
    }, {} as Record<string, number>);
  }, [exchangeRatesList]);

  // Defensive arrays
  const safeSubscriptions = useMemo(() => Array.isArray(subscriptions) ? subscriptions : [], [subscriptions]);
  const safeTransactions = useMemo(() => Array.isArray(transactions) ? transactions : [], [transactions]);

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

      const income = safeTransactions
        .filter((t) => t?.type === "income")
        .reduce((total, t) => {
          const raw = Number(t?.amount || 0);
          const from = t?.currency || fallbackTxCurrency;
          const converted = toActiveCurrency(raw, from);
          return total + (isFinite(converted) ? converted : 0);
        }, 0);

      const expenses = safeTransactions
        .filter((t) => t?.type === "expense")
        .reduce((total, t) => {
          const raw = Number(t?.amount || 0);
          const from = t?.currency || fallbackTxCurrency;
          const converted = toActiveCurrency(raw, from);
          return total + (isFinite(converted) ? converted : 0);
        }, 0);

      const monthlySubCost = safeSubscriptions.reduce((total, sub) => {
        const rawPrice = Number(sub?.price ?? 0);
        const monthlyPrice = sub?.billing_cycle === "yearly" ? rawPrice / 12 : rawPrice;
        const from = sub?.currency || activeCurrency;
        const converted = toActiveCurrency(monthlyPrice, from);
        return total + (isFinite(converted) ? converted : 0);
      }, 0);

      const net = income - (expenses + monthlySubCost);

      // Health Score Calculation
      let health = { score: null as number | null, label: "", emoji: "", color: "", description: tFinance("health_desc", { percent: 0 }) };
      
      if (income > 0) {
        const ratio = monthlySubCost / income;
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
        totalIncome: isFinite(income) ? income : 0,
        totalExpenses: isFinite(expenses) ? expenses : 0,
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
        financialHealth: { score: null as number | null, label: "", emoji: "", color: "", description: tFinance("health_desc", { percent: 0 }) }
      };
    }
  }, [safeSubscriptions, safeTransactions, activeCurrency, defaultCurrency, tFinance, toActiveCurrency]);

  const { totalIncome, totalExpenses, totalMonthlyCost, netWorth, financialHealth } = financialData;

  const cashFlowData = useMemo(() => {
    try {
      const months: { month: string; income: number; expenses: number }[] = [];
      const now = new Date();
      const fallbackTxCurrency = defaultCurrency || "USD";
      const parseLocalDate = (value: string) => new Date(`${value}T00:00:00`);

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = formatMonthShortYear(date);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const monthlyIncome = safeTransactions
          .filter((t) => {
            if (!t?.date) return false;
            const tDate = parseLocalDate(t.date);
            return t.type === "income" && tDate >= startOfMonth && tDate <= endOfMonth;
          })
          .reduce((sum, t) => {
            const raw = Number(t?.amount || 0);
            const from = t?.currency || fallbackTxCurrency;
            const converted = toActiveCurrency(raw, from);
            return sum + (isFinite(converted) ? converted : 0);
          }, 0);

        const monthlyExpenses = safeTransactions
          .filter((t) => {
            if (!t?.date) return false;
            const tDate = parseLocalDate(t.date);
            return t.type === "expense" && tDate >= startOfMonth && tDate <= endOfMonth;
          })
          .reduce((sum, t) => {
            const raw = Number(t?.amount || 0);
            const from = t?.currency || fallbackTxCurrency;
            const converted = toActiveCurrency(raw, from);
            return sum + (isFinite(converted) ? converted : 0);
          }, 0);

        months.push({
          month: monthStr,
          income: isFinite(monthlyIncome) ? monthlyIncome : 0,
          expenses: isFinite(monthlyExpenses + totalMonthlyCost) ? monthlyExpenses + totalMonthlyCost : 0,
        });
      }

      return months;
    } catch {
      return [];
    }
  }, [safeTransactions, totalMonthlyCost, defaultCurrency, toActiveCurrency]);

  const spendingData = useMemo(() => {
    try {
      const distribution: { name: string; value: number }[] = [];
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const fallbackTxCurrency = defaultCurrency || "USD";
      const parseLocalDate = (value: string) => new Date(`${value}T00:00:00`);

      const categoryTotals: Record<string, number> = {};

      safeTransactions
        .filter((t) => t?.type === "expense" && t?.date && parseLocalDate(t.date) >= startOfMonth)
        .forEach((t) => {
          if (!t?.category) return;
          const raw = Number(t?.amount || 0);
          const from = t?.currency || fallbackTxCurrency;
          const converted = toActiveCurrency(raw, from);
          categoryTotals[t.category] = (categoryTotals[t.category] || 0) + (isFinite(converted) ? converted : 0);
        });

      if (totalMonthlyCost > 0) {
        categoryTotals["Subscriptions"] = (categoryTotals["Subscriptions"] || 0) + totalMonthlyCost;
      }

      Object.entries(categoryTotals).forEach(([name, value]) => {
        if (value > 0) {
          distribution.push({ name, value: isFinite(value) ? value : 0 });
        }
      });

      return distribution;
    } catch {
      return [];
    }
  }, [safeTransactions, totalMonthlyCost, defaultCurrency, toActiveCurrency]);

  const budgetSpentMap = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const fallbackTxCurrency = defaultCurrency || "USD";
    const result: Record<string, number> = {};
    const parseLocalDate = (value: string) => new Date(`${value}T00:00:00`);

    budgets.forEach((budget) => {
      const budgetCurrency = budget.currency || activeCurrency || defaultCurrency || "USD";
      const total = safeTransactions
        .filter((t) => {
          if (!t?.date) return false;
          const tDate = parseLocalDate(t.date);
          return t.type === "expense" && t.category === budget.category && tDate >= startOfMonth;
        })
        .reduce((sum, t) => {
          const raw = Number(t?.amount || 0);
          const from = t?.currency || fallbackTxCurrency;
          const converted = convertWithDynamicRates(raw, from, budgetCurrency, exchangeRates);
          return sum + (isFinite(converted) ? converted : 0);
        }, 0);

      result[budget.id] = isFinite(total) ? total : 0;
    });

    return result;
  }, [budgets, safeTransactions, activeCurrency, defaultCurrency, exchangeRates]);

  const budgetConvertedFromMap = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const fallbackTxCurrency = defaultCurrency || "USD";
    const parseLocalDate = (value: string) => new Date(`${value}T00:00:00`);

    const result: Record<string, { amount: number; currency: string } | "multiple" | null> = {};

    budgets.forEach((budget) => {
      const budgetCurrency = budget.currency || activeCurrency || defaultCurrency || "USD";
      const byCurrency: Record<string, number> = {};

      safeTransactions
        .filter((t) => {
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
  }, [budgets, safeTransactions, activeCurrency, defaultCurrency]);

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

  const displayedHealthLabel =
    financialHealth.label === "Risky"
      ? tFinance("risky")
      : financialHealth.label === "Healthy"
        ? tFinance("healthy")
        : financialHealth.label === "Warning"
          ? tFinance("warning")
          : financialHealth.label;

  return (
    <div className="min-h-screen pb-28 md:pb-20">
      <Navbar />

      <main className="pt-20 sm:pt-24 px-3 sm:px-4">
        <div className="container mx-auto max-w-6xl">
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
                  {currencies.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
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
                onClick={() => setIsTransactionModalOpen(true)}
                className="ruby-gradient border-0 shadow-ruby hover:shadow-ruby-strong gap-2"
              >
                <Plus className="w-5 h-5" />
                {t.finance.addTransaction}
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="sm:hidden flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 scrollbar-hide mb-4">
            <div className="glass-card rounded-2xl p-3 flex flex-col justify-center min-h-[120px] shadow-sm min-w-[85%] snap-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-success/20 flex items-center justify-center shadow-inner shrink-0">
                  <ArrowDownLeft className="w-4 h-4 text-success" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">{t.finance.income}</p>
                  <p className="font-display text-xl font-bold text-success mt-0.5 truncate">
                    {formatCurrency(totalIncome, activeCurrency)}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-3 flex flex-col justify-center min-h-[120px] shadow-sm min-w-[85%] snap-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-destructive/20 flex items-center justify-center shadow-inner shrink-0">
                  <ArrowUpRight className="w-4 h-4 text-destructive" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">{t.finance.expenses}</p>
                  <p className="font-display text-xl font-bold mt-0.5 truncate">
                    {formatCurrency(totalExpenses, activeCurrency)}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-3 flex flex-col justify-center min-h-[120px] shadow-sm min-w-[85%] snap-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shadow-inner shrink-0">
                  <TrendingDown className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">{t.finance.subscriptions}</p>
                  <p className="font-display text-xl font-bold mt-0.5 truncate">
                    {formatCurrency(totalMonthlyCost, activeCurrency)}
                    <span className="text-xs font-normal text-muted-foreground ml-1">{tDashboard("per_month")}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-3 flex flex-col justify-center min-h-[120px] shadow-sm min-w-[85%] snap-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-warning/20 flex items-center justify-center shadow-inner shrink-0">
                  <TrendingUp className="w-4 h-4 text-warning" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">{t.finance.balance}</p>
                  <p className={cn("font-display text-xl font-bold mt-0.5 truncate", netWorth >= 0 ? "text-success" : "text-destructive")}>
                    {formatCurrency(netWorth, activeCurrency)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="glass-card rounded-2xl p-4 md:p-6 flex flex-col justify-center h-full min-h-[160px] md:min-h-[180px] shadow-sm">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-success/20 flex items-center justify-center shadow-inner shrink-0">
                  <ArrowDownLeft className="w-5 h-5 md:w-6 md:h-6 text-success" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground font-medium">{t.finance.income}</p>
                  <p className="font-display text-2xl md:text-3xl font-bold text-success mt-1 truncate">
                    {formatCurrency(totalIncome, activeCurrency)}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 md:p-6 flex flex-col justify-center h-full min-h-[160px] md:min-h-[180px] shadow-sm">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-destructive/20 flex items-center justify-center shadow-inner shrink-0">
                  <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6 text-destructive" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground font-medium">{t.finance.expenses}</p>
                  <p className="font-display text-2xl md:text-3xl font-bold mt-1 truncate">
                    {formatCurrency(totalExpenses, activeCurrency)}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 md:p-6 flex flex-col justify-center h-full min-h-[160px] md:min-h-[180px] shadow-sm">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/20 flex items-center justify-center shadow-inner shrink-0">
                  <TrendingDown className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground font-medium">{t.finance.subscriptions}</p>
                  <p className="font-display text-2xl md:text-3xl font-bold mt-1 truncate">
                    {formatCurrency(totalMonthlyCost, activeCurrency)}
                    <span className="text-sm font-normal text-muted-foreground ml-1">{tDashboard("per_month")}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 md:p-6 flex flex-col justify-center h-full min-h-[160px] md:min-h-[180px] shadow-sm">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-warning/20 flex items-center justify-center shadow-inner shrink-0">
                  <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-warning" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground font-medium">{t.finance.balance}</p>
                  <p className={cn("font-display text-2xl md:text-3xl font-bold mt-1 truncate", netWorth >= 0 ? "text-success" : "text-destructive")}>
                    {formatCurrency(netWorth, activeCurrency)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-3 md:p-6 mb-8">
            <p className="text-xs md:text-sm text-muted-foreground font-medium mb-3 text-center">{tFinance("health_score")}</p>

            {financialHealth.score !== null ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl md:text-5xl font-bold tracking-tight">{financialHealth.score}</span>
                  <span className="text-sm text-muted-foreground ml-1">/100</span>
                </div>

                <div className={cn("px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1.5", financialHealth.color)}>
                  <span>{financialHealth.emoji}</span>
                  <span>{displayedHealthLabel}</span>
                </div>

                <div className="w-full max-w-[220px] bg-secondary rounded-full h-2 mt-1 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      financialHealth.label === "Excellent" || financialHealth.label === "Healthy"
                        ? "bg-success"
                        : financialHealth.label === "Warning"
                          ? "bg-warning"
                          : "bg-destructive"
                    )}
                    style={{ width: `${financialHealth.score}%` }}
                  />
                </div>

                <p className="text-sm text-muted-foreground leading-tight mt-1 text-center max-w-[360px]">
                  {financialHealth.description}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground leading-tight text-center">
                  {financialHealth.description}
                </p>
              </div>
            )}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8">
            <CashFlowChart data={cashFlowData} currency={activeCurrency} />
            <SpendingPieChart data={spendingData} currency={activeCurrency} />
          </div>

          {/* Tabs for Transactions and Budgets */}
          <Tabs
            value={searchParams.get("tab") === "budgets" ? "budgets" : "transactions"}
            onValueChange={(value) => setSearchParams({ tab: value }, { replace: true })}
            className="space-y-4"
          >
            <TabsList className="bg-secondary">
              <TabsTrigger value="transactions">{t.finance.transactions}</TabsTrigger>
              <TabsTrigger value="budgets">{t.finance.budgets}</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="space-y-4">
              <TransactionList
                transactions={transactions}
                onDelete={deleteTransaction}
              />
            </TabsContent>

            <TabsContent value="budgets" className="space-y-4">
              {budgets.length === 0 ? (
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
                  {budgets.map((budget) => (
                    <BudgetCard
                      key={budget.id}
                      budget={budget}
                      spent={budgetSpentMap[budget.id] ?? 0}
                      currency={budget.currency || activeCurrency || defaultCurrency || "USD"}
                      convertedFrom={budgetConvertedFromMap[budget.id] ?? null}
                      onDelete={deleteBudget}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Modals */}
      <AddTransactionModal
        open={isTransactionModalOpen}
        onOpenChange={setIsTransactionModalOpen}
        onCreateTransaction={createTransaction}
      />
      <AddBudgetModal
        open={isBudgetModalOpen}
        onOpenChange={setIsBudgetModalOpen}
        existingCategories={budgets.map((b) => b.category)}
        onCreateBudget={createBudget}
      />

      {/* Feedback Button */}
      <FeedbackButton />
    </div>
  );
};

export default Finance;
