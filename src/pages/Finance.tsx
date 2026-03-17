import { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useFinance } from "@/hooks/useFinance";
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
import { convertCurrency, getCurrencySymbol } from "@/lib/currency";
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
  const activeCurrency = displayCurrency || autoDetectedCurrency;
  const currencySymbol = getCurrencySymbol(activeCurrency);

  // Wrap all data calculations in a safe memo
  const financialData = useMemo(() => {
    try {
      // Calculate totals with currency conversion
      const income = safeTransactions
        .filter((t) => t?.type === "income")
        .reduce((total, t) => total + Number(t?.amount || 0), 0);

      const expenses = safeTransactions
        .filter((t) => t?.type === "expense")
        .reduce((total, t) => total + Number(t?.amount || 0), 0);

      // Calculate subscription cost with proper currency conversion
      const monthlySubCost = safeSubscriptions.reduce((total, sub) => {
        const rawPrice = Number(sub?.price ?? 0);
        const monthlyPrice = sub?.billing_cycle === "yearly" ? rawPrice / 12 : rawPrice;
        // Convert from subscription's currency to display currency
        const convertedPrice = convertCurrency(monthlyPrice, sub?.currency || activeCurrency, activeCurrency);
        return total + (isFinite(convertedPrice) ? convertedPrice : 0);
      }, 0);

      const net = income - (expenses + monthlySubCost);

      // Health Score Calculation
      let health = { score: null as number | null, label: "", emoji: "", color: "", description: "Add income to calculate financial health" };
      
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
          description: `Your subscriptions use ${isFinite(percentage) ? percentage : 0}% of your income.`,
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
        financialHealth: { score: null as number | null, label: "", emoji: "", color: "", description: "Data unavailable" }
      };
    }
  }, [safeSubscriptions, safeTransactions, activeCurrency]);

  const { totalIncome, totalExpenses, totalMonthlyCost, netWorth, financialHealth } = financialData;

  // Monthly cash flow data for charts
  const getMonthlyCashFlow = () => {
    try {
      const months: { month: string; income: number; expenses: number }[] = [];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = date.toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        });
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const monthlyIncome = safeTransactions
          .filter((t) => {
            if (!t?.date) return false;
            const tDate = new Date(t.date);
            return (
              t.type === "income" && tDate >= startOfMonth && tDate <= endOfMonth
            );
          })
          .reduce((sum, t) => sum + Number(t?.amount || 0), 0);

        const monthlyExpenses = safeTransactions
          .filter((t) => {
            if (!t?.date) return false;
            const tDate = new Date(t.date);
            return (
              t.type === "expense" && tDate >= startOfMonth && tDate <= endOfMonth
            );
          })
          .reduce((sum, t) => sum + Number(t?.amount || 0), 0);

        // Add subscription costs to expenses (converted)
        const monthlySubCost = totalMonthlyCost;

        months.push({
          month: monthStr,
          income: isFinite(monthlyIncome) ? monthlyIncome : 0,
          expenses: isFinite(monthlyExpenses + monthlySubCost) ? monthlyExpenses + monthlySubCost : 0,
        });
      }

      return months;
    } catch (e) {
      return [];
    }
  };

  // Spending distribution for pie chart
  const getSpendingDistribution = () => {
    try {
      const distribution: { name: string; value: number }[] = [];
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Group transactions by category
      const categoryTotals: Record<string, number> = {};

      safeTransactions
        .filter((t) => t?.type === "expense" && t?.date && new Date(t.date) >= startOfMonth)
        .forEach((t) => {
          if (t?.category) {
            categoryTotals[t.category] =
              (categoryTotals[t.category] || 0) + Number(t?.amount || 0);
          }
        });

      // Add subscriptions as "Subscriptions" category (converted)
      if (totalMonthlyCost > 0) {
        const subLabel = t?.finance?.subscriptions || "Subscriptions";
        categoryTotals[subLabel] =
          (categoryTotals[subLabel] || 0) + totalMonthlyCost;
      }

      Object.entries(categoryTotals).forEach(([name, value]) => {
        if (value > 0) {
          distribution.push({ name, value: isFinite(value) ? value : 0 });
        }
      });

      return distribution;
    } catch (e) {
      return [];
    }
  };

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

  const cashFlowData = getMonthlyCashFlow();
  const spendingData = getSpendingDistribution();

  return (
    <div className="min-h-screen pb-20">
      <Navbar />

      <main className="pt-24 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold flex items-center gap-3">
                <Wallet className="w-8 h-8 text-primary" />
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
                  <SelectItem value="auto">{t.dashboard.auto} ({autoDetectedCurrency})</SelectItem>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="glass-card rounded-xl p-5 flex flex-col justify-center h-full min-h-[110px]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center">
                  <ArrowDownLeft className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.finance.income}</p>
                  <p className="font-display text-2xl font-bold text-success">
                    {currencySymbol}{totalIncome.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 flex flex-col justify-center h-full min-h-[110px]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-destructive/20 flex items-center justify-center">
                  <ArrowUpRight className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.finance.expenses}</p>
                  <p className="font-display text-2xl font-bold">
                    {currencySymbol}{totalExpenses.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 flex flex-col justify-center h-full min-h-[110px]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.finance.subscriptions}</p>
                  <p className="font-display text-2xl font-bold">
                    {currencySymbol}{totalMonthlyCost.toFixed(2)}
                    <span className="text-sm font-normal text-muted-foreground">
                      /mo
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 flex flex-col justify-center h-full min-h-[110px]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-warning/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.finance.balance}</p>
                  <p
                    className={`font-display text-2xl font-bold ${
                      netWorth >= 0 ? "text-success" : "text-destructive"
                    }`}
                  >
                    {currencySymbol}{netWorth.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 flex flex-col justify-center h-full min-h-[110px]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground font-medium">Financial Health Score</p>
                  {financialHealth.score !== null ? (
                    <div className="mt-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">{financialHealth.score} / 100</span>
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", financialHealth.color)}>
                          {financialHealth.emoji} {financialHealth.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">
                        {financialHealth.description}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                      {financialHealth.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <CashFlowChart data={cashFlowData} />
            <SpendingPieChart data={spendingData} />
          </div>

          {/* Tabs for Transactions and Budgets */}
          <Tabs defaultValue="transactions" className="space-y-4">
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
                      spent={getSpentByCategory(budget.category)}
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
