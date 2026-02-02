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

  // Determine the most used currency from subscriptions (auto-detect)
  const autoDetectedCurrency = useMemo(() => {
    const counts: Record<string, number> = {};
    subscriptions.forEach((sub) => {
      counts[sub.currency] = (counts[sub.currency] || 0) + 1;
    });
    const entries = Object.entries(counts);
    if (entries.length === 0) return "USD";
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  }, [subscriptions]);

  // Use user-selected currency or auto-detected
  const activeCurrency = displayCurrency || autoDetectedCurrency;
  const currencySymbol = getCurrencySymbol(activeCurrency);

  // Calculate totals with currency conversion
  const totalIncome = useMemo(() => {
    // Transactions don't have currency, so we assume they're in the active currency
    return transactions
      .filter((t) => t.type === "income")
      .reduce((total, t) => total + Number(t.amount), 0);
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions
      .filter((t) => t.type === "expense")
      .reduce((total, t) => total + Number(t.amount), 0);
  }, [transactions]);

  // Calculate subscription cost with proper currency conversion
  const totalMonthlyCost = useMemo(() => {
    return subscriptions.reduce((total, sub) => {
      const rawPrice = Number(sub.price ?? 0);
      const monthlyPrice = sub.billing_cycle === "yearly" ? rawPrice / 12 : rawPrice;
      // Convert from subscription's currency to display currency
      const convertedPrice = convertCurrency(monthlyPrice, sub.currency, activeCurrency);
      return total + convertedPrice;
    }, 0);
  }, [subscriptions, activeCurrency]);

  const netWorth = totalIncome - (totalExpenses + totalMonthlyCost);

  // Monthly cash flow data for charts
  const getMonthlyCashFlow = () => {
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

      const monthlyIncome = transactions
        .filter((t) => {
          const tDate = new Date(t.date);
          return (
            t.type === "income" && tDate >= startOfMonth && tDate <= endOfMonth
          );
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const monthlyExpenses = transactions
        .filter((t) => {
          const tDate = new Date(t.date);
          return (
            t.type === "expense" && tDate >= startOfMonth && tDate <= endOfMonth
          );
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Add subscription costs to expenses (converted)
      const monthlySubCost = totalMonthlyCost;

      months.push({
        month: monthStr,
        income: monthlyIncome,
        expenses: monthlyExpenses + monthlySubCost,
      });
    }

    return months;
  };

  // Spending distribution for pie chart
  const getSpendingDistribution = () => {
    const distribution: { name: string; value: number }[] = [];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Group transactions by category
    const categoryTotals: Record<string, number> = {};

    transactions
      .filter((t) => t.type === "expense" && new Date(t.date) >= startOfMonth)
      .forEach((t) => {
        categoryTotals[t.category] =
          (categoryTotals[t.category] || 0) + Number(t.amount);
      });

    // Add subscriptions as "Subscriptions" category (converted)
    if (totalMonthlyCost > 0) {
      categoryTotals[t.finance.subscriptions] =
        (categoryTotals[t.finance.subscriptions] || 0) + totalMonthlyCost;
    }

    Object.entries(categoryTotals).forEach(([name, value]) => {
      if (value > 0) {
        distribution.push({ name, value });
      }
    });

    return distribution;
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-card rounded-xl p-5 flex items-center gap-4">
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

            <div className="glass-card rounded-xl p-5 flex items-center gap-4">
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

            <div className="glass-card rounded-xl p-5 flex items-center gap-4">
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

            <div className="glass-card rounded-xl p-5 flex items-center gap-4">
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
