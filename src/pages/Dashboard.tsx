import { useEffect, useState, useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useSubscription } from "@/hooks/useSubscription";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { Navbar } from "@/components/layout/Navbar";
import { TrialBanner } from "@/components/layout/TrialBanner";
import { FlipCard } from "@/components/subscription/FlipCard";
import { AddSubscriptionModal } from "@/components/subscription/AddSubscriptionModal";
import { SubscriptionLimitModal } from "@/components/subscription/SubscriptionLimitModal";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Wallet, CreditCard, TrendingUp, Loader2, PiggyBank, MoreHorizontal, BarChart3, ArrowUp, ArrowDown, Info, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { currencies } from "@/data/subscriptionPresets";
import { convertWithDynamicRates, getCurrencySymbol } from "@/lib/currency";
import { 
  calculatePotentialSavings, 
  subscriptionPercentageOfIncome, 
  SubscriptionInput,
  currentMonthSubscriptionTotal,
  previousMonthSubscriptionTotal,
  monthOverMonthChangePercentage
} from "@/lib/subscriptionInsights";
import { SavingsDetailsModal } from "@/components/subscription/SavingsDetailsModal";
import { useFinance } from "@/hooks/useFinance";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const { isPro, status: proStatus, loading: subStatusLoading } = useSubscription();
  const { t } = useLanguage();
  const { defaultCurrency } = useSettings();
  const { 
    subscriptions, 
    isLoading: subsLoading, 
    updateSubscription,
    deleteSubscription,
  } = useSubscriptions();
  const { transactions, totalIncome, currentMonthlyIncome, isLoading: financeLoading } = useFinance();

  // Fetch dynamic exchange rates
  const { data: exchangeRatesList, isLoading: ratesLoading } = useExchangeRates();

  // Convert rates array to Record<string, number> for easier lookup
  const exchangeRates = useMemo(() => {
    if (!exchangeRatesList) return {};
    return exchangeRatesList.reduce((acc, curr) => {
      acc[curr.currency_code] = Number(curr.rate);
      return acc;
    }, {} as Record<string, number>);
  }, [exchangeRatesList]);

  // Debug: Check rates in console
  console.log("Active Exchange Rates:", exchangeRates);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSavingsModalOpen, setIsSavingsModalOpen] = useState(false);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<string | null>(null);

  const FREE_PLAN_LIMIT = 3;
  const isFreeLimited = !isPro && !isAdmin;
  const canAddSubscription = !isFreeLimited || subscriptions.length < FREE_PLAN_LIMIT;

  useEffect(() => {
    if (!user) return;
    if (subStatusLoading) return;
    if (proStatus !== "cancelled" && proStatus !== "expired") return;

    const key = `subsruby.pro_cleanup_notice.${user.id}`;
    const lastShownFor = localStorage.getItem(key);
    if (lastShownFor === proStatus) return;

    toast.error("Pro üyeliğiniz sona erdiği için 3 limitini aşan abonelik kayıtlarınız sistemden silinmiştir.");
    localStorage.setItem(key, proStatus);
  }, [user, proStatus, subStatusLoading]);

  const handleAddSubscription = () => {
    if (!canAddSubscription) {
      setIsLimitModalOpen(true);
      return;
    }
    setIsModalOpen(true);
  };

  // Determine the most used currency (auto-detect)
  const currencyCounts = useMemo(() => {
    return subscriptions.reduce((acc, sub) => {
      acc[sub.currency] = (acc[sub.currency] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [subscriptions]);
  
  const autoDetectedCurrency = useMemo(() => {
    const entries = Object.entries(currencyCounts);
    if (entries.length === 0) return "USD";
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  }, [currencyCounts]);

  // Use user-selected currency or auto-detected
  const autoCurrency = defaultCurrency || autoDetectedCurrency;
  const activeCurrency = displayCurrency || autoCurrency;
  const currencySymbol = getCurrencySymbol(activeCurrency);

  // Calculate total monthly cost with currency conversion
  const monthlySpend = useMemo(() => {
    const safeSubscriptions = subscriptions ?? [];
    return safeSubscriptions.reduce((total, sub) => {
      if (!sub) return total;
      const rawPrice = Number(sub.price ?? 0);
      if (isNaN(rawPrice) || !isFinite(rawPrice)) return total;
      
      // Normalize yearly to monthly
      const monthlyPrice = sub.billing_cycle === "yearly" ? rawPrice / 12 : rawPrice;
      
      // Convert to display currency using dynamic rates
      const convertedPrice = convertWithDynamicRates(
        monthlyPrice, 
        sub.currency, 
        activeCurrency, 
        exchangeRates
      );
      
      if (isNaN(convertedPrice) || !isFinite(convertedPrice)) return total;
      
      return total + convertedPrice;
    }, 0);
  }, [subscriptions, activeCurrency, exchangeRates]);

  const yearlySpend = isFinite(monthlySpend * 12) ? monthlySpend * 12 : 0;

  // Calculate potential savings from unused subscriptions
  const { potentialSavings, unusedSubscriptions } = useMemo(() => {
    const safeSubscriptions = subscriptions ?? [];
    const convertedSubscriptions: SubscriptionInput[] = safeSubscriptions.map(sub => {
      const price = convertWithDynamicRates(Number(sub?.price ?? 0), sub?.currency, activeCurrency, exchangeRates);
      return {
        price: isFinite(price) ? price : 0,
        billing_cycle: sub?.billing_cycle,
        is_marked_unused: sub?.is_marked_unused
      };
    });
    
    const savings = calculatePotentialSavings(convertedSubscriptions);
    const unused = safeSubscriptions.filter(sub => sub?.is_marked_unused);
    
    return { 
      potentialSavings: isFinite(savings) ? savings : 0, 
      unusedSubscriptions: unused 
    };
  }, [subscriptions, activeCurrency, exchangeRates]);

  // Calculate subscription vs income percentage
  const subscriptionPercentage = useMemo(() => {
    try {
      // Strictly use current monthly income as requested
      const income = Number(currentMonthlyIncome) || 0;
      const safeMonthlySpend = Number(monthlySpend) || 0;
      
      // Sanity check: income too low
      if (income < 100) return null;
      
      if (!isFinite(income) || safeMonthlySpend <= 0 || !isFinite(safeMonthlySpend)) return 0;
      
      const percentage = (safeMonthlySpend / income) * 100;
      
      if (isNaN(percentage) || !isFinite(percentage)) return 0;
      
      // Cap at 200 for calculation (display will show 200%+)
      return Math.min(Math.round(percentage), 201);
    } catch (error) {
      console.error("Error calculating subscription percentage:", error);
      return 0;
    }
  }, [monthlySpend, currentMonthlyIncome]);

  const getStatusLabel = (percentage: number | null) => {
    if (percentage === null) return { label: "N/A", color: "text-muted-foreground" };
    const safePercentage = Number(percentage) || 0;
    if (safePercentage < 15) return { label: "Healthy", color: "text-green-500" };
    if (safePercentage <= 30) return { label: "Moderate", color: "text-amber-500" };
    return { label: "Risky", color: "text-red-500" };
  };

  const status = getStatusLabel(subscriptionPercentage);

  // Smart Financial Insight Logic (Updated with safe calculations)
  const financialInsight = useMemo(() => {
    const safeSubscriptions = Array.isArray(subscriptions) ? subscriptions : [];
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    const now = new Date();

    // 1. Monthly Income (current month only)
    const monthlyIncome = safeTransactions
      .filter(t => {
        if (!t?.date) return false;
        const d = new Date(t.date);
        return (
          t.type === "income" &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // 2. Monthly Subscriptions
    const monthlySubscriptions = safeSubscriptions.reduce((sum, sub) => {
      const price = Number(sub?.price) || 0;
      if (sub?.billing_cycle === "yearly") {
        return sum + price / 12;
      }
      return sum + price;
    }, 0);

    // 3. Ratio Calculation
    let ratio = 0;
    if (monthlyIncome > 0) {
      ratio = monthlySubscriptions / monthlyIncome;
    }

    // Insight logic
    if (monthlyIncome === 0) {
      return {
        severity: "info",
        icon: "🔵",
        title: "Personalized Insight",
        message: "Add income to get financial insights about your subscription health.",
        color: "bg-blue-50 border-blue-200",
        textColor: "text-blue-700",
        cta: "Add Income"
      };
    }

    if (ratio > 0.5) {
      return {
        severity: "danger",
        icon: "⚠",
        title: "You are spending too much on subscriptions",
        message: "Your subscriptions take a large portion of your income. Consider reviewing your active plans.",
        color: "bg-red-50 border-red-200",
        textColor: "text-red-700",
        cta: "Review subscriptions"
      };
    } else if (ratio >= 0.2) {
      return {
        severity: "warning",
        icon: "🟡",
        title: "Your subscription spending is moderate",
        message: "Consider reviewing your subscriptions to optimize your budget.",
        color: "bg-amber-50 border-amber-200",
        textColor: "text-amber-700",
        cta: "Review subscriptions"
      };
    } else {
      return {
        severity: "good",
        icon: "✅",
        title: "Your subscription spending is healthy",
        message: "You are managing your subscriptions well and staying within a safe range.",
        color: "bg-green-50 border-green-200",
        textColor: "text-green-700"
      };
    }
  }, [subscriptions, transactions]);

  // Calculate month-over-month spending change
  const spendingChange = useMemo(() => {
    try {
      const safeSubscriptions = subscriptions ?? [];
      
      // Convert all subscriptions to display currency first for consistent totals
      const convertedSubscriptions: SubscriptionInput[] = safeSubscriptions.map(sub => {
        const price = convertWithDynamicRates(Number(sub?.price ?? 0), sub?.currency, activeCurrency, exchangeRates);
        return {
          price: isFinite(price) ? price : 0,
          billing_cycle: sub?.billing_cycle,
          start_date: sub?.start_date
        };
      });

      const currentTotal = currentMonthSubscriptionTotal(convertedSubscriptions);
      const previousTotal = previousMonthSubscriptionTotal(convertedSubscriptions);
      
      const percentageChange = monthOverMonthChangePercentage(currentTotal, previousTotal);
      
      return {
        currentTotal,
        previousTotal,
        percentageChange: isFinite(percentageChange) ? percentageChange : 0,
        hasPreviousData: previousTotal > 0
      };
    } catch (error) {
      console.error("Error calculating spending change:", error);
      return null;
    }
  }, [subscriptions, activeCurrency, exchangeRates]);

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  // 1. Loading Check (Wait for everything to load)
  if (authLoading || subsLoading || subStatusLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // 2. Render Dashboard (Show content for everyone)
  return (
    <div className="min-h-screen pb-20">
      <Navbar />
      
      <main className="pt-24 px-4">
        <div className="container mx-auto max-w-6xl">
          {!isPro && <TrialBanner />}

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold">{t.dashboard.title}</h1>
              <p className="text-muted-foreground mt-1">
                {t.dashboard.subtitle}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-3">
                <Select
                  value={displayCurrency || "auto"}
                  onValueChange={(value) => setDisplayCurrency(value === "auto" ? null : value)}
                >
                  <SelectTrigger className="w-[140px] bg-background border-input hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto ({autoCurrency})</SelectItem>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.value} ({currency.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleAddSubscription}
                  className="ruby-gradient border-0 shadow-ruby hover:shadow-ruby-strong transition-all gap-2"
                >
                  <Plus className="w-5 h-5" />
                  {t.dashboard.addSubscription}
                </Button>
              </div>

              {isFreeLimited && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-muted-foreground">
                    {Math.min(subscriptions.length, FREE_PLAN_LIMIT)}/{FREE_PLAN_LIMIT} Free used
                  </span>
                  {subscriptions.length === FREE_PLAN_LIMIT - 1 && (
                    <span className="text-[10px] font-medium text-amber-600 dark:text-amber-500">
                      You're almost at your free limit (3 subscriptions)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Smart Financial Insight Card */}
          <div className={cn("mb-8 p-5 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm", financialInsight.color)}>
            <div className="flex items-center gap-4">
              <div className="text-2xl shrink-0">
                {financialInsight.icon}
              </div>
              <div className="flex flex-col">
                <h4 className={cn("text-base font-bold", financialInsight.textColor)}>
                  {financialInsight.title}
                </h4>
                <p className={cn("text-sm opacity-80", financialInsight.textColor)}>
                  {financialInsight.message}
                </p>
              </div>
            </div>
            {financialInsight.cta && (
              <Button 
                variant="outline" 
                size="sm" 
                className={cn("whitespace-nowrap bg-white/50 hover:bg-white border-current/20 font-medium", financialInsight.textColor)}
                onClick={() => {
                  if (financialInsight.cta === "Add Income") {
                    navigate("/finance");
                  } else {
                    // Scroll to subscriptions
                    window.scrollTo({ top: 600, behavior: 'smooth' });
                  }
                }}
              >
                {financialInsight.cta}
              </Button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="bg-card p-5 rounded-2xl border shadow-sm flex flex-col justify-center h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.dashboard.monthlyCost}</p>
                  <h3 className="text-2xl font-bold">
                    {currencySymbol}{monthlySpend.toFixed(2)}
                  </h3>
                </div>
              </div>
            </div>

            <div className="bg-card p-5 rounded-2xl border shadow-sm flex flex-col justify-center h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.dashboard.yearlyCost}</p>
                  <h3 className="text-2xl font-bold">
                    {currencySymbol}{yearlySpend.toFixed(2)}
                  </h3>
                </div>
              </div>
            </div>

            <div className="bg-card p-5 rounded-2xl border shadow-sm flex flex-col justify-center h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.dashboard.totalSubscriptions}</p>
                  <h3 className="text-2xl font-bold">{subscriptions.length}</h3>
                </div>
              </div>
            </div>

            <div className="bg-card p-5 rounded-2xl border shadow-sm flex flex-col justify-center h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Subs vs Income</p>
                  {(() => {
                    try {
                      if (financeLoading) {
                        return <p className="text-[10px] text-muted-foreground mt-1 animate-pulse">Loading income data...</p>;
                      }

                      const income = Number(currentMonthlyIncome) || 0;
                      const safeMonthlySpend = Number(monthlySpend) || 0;

                      if (income <= 0) {
                        return (
                          <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                            Add income to see subscription ratio
                          </p>
                        );
                      }

                      if (income < 100) {
                        return (
                          <p className="text-[10px] text-muted-foreground mt-1 leading-tight">
                            Income data is too low to calculate accurately
                          </p>
                        );
                      }
                      
                      const safePercentage = subscriptionPercentage;
                      if (safePercentage === null) return null;

                      const displayPercentage = safePercentage > 200 ? "200%+" : `${safePercentage}%`;

                      return (
                        <>
                          <h3 className="text-xl font-bold mt-0.5 truncate">
                            {currencySymbol}{safeMonthlySpend.toFixed(0)} / {currencySymbol}{income.toFixed(0)}
                          </h3>
                          <p className={cn("text-[10px] font-medium mt-0.5", status?.color || "text-muted-foreground")}>
                            {displayPercentage} of your income
                          </p>
                        </>
                      );
                    } catch (e) {
                      console.error("Error rendering Subscriptions vs Income card:", e);
                      return <h3 className="text-sm font-bold mt-1 text-muted-foreground">Data unavailable</h3>;
                    }
                  })()}
                </div>
              </div>
            </div>

            <div className="bg-card p-5 rounded-2xl border shadow-sm flex flex-col justify-center h-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  {spendingChange?.percentageChange && spendingChange.percentageChange > 0 ? (
                    <ArrowUp className="w-6 h-6 text-orange-500" />
                  ) : (
                    <ArrowDown className="w-6 h-6 text-green-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">Spending Change</p>
                  {(() => {
                    try {
                      if (!spendingChange) return <p className="text-[10px] text-muted-foreground mt-1">Unable to calculate spending change</p>;
                      if (!spendingChange.hasPreviousData) {
                        return (
                          <div className="flex items-start gap-1.5 mt-1">
                            <Info className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                            <p className="text-[10px] text-muted-foreground leading-tight">
                              Track your subscriptions over time to see spending trends
                            </p>
                          </div>
                        );
                      }
                      
                      const change = spendingChange.percentageChange;
                      const isIncrease = change > 0;
                      const isDecrease = change < 0;
                      
                      return (
                        <>
                          <h3 className="text-2xl font-bold">
                            {isIncrease ? "+" : ""}{change.toFixed(1)}%
                          </h3>
                          <p className={cn("text-[10px] font-medium mt-0.5", isIncrease ? "text-orange-500" : "text-green-500")}>
                            {isIncrease ? "⚠ Increased" : isDecrease ? "✅ Decreased" : "No change"} this month
                          </p>
                        </>
                      );
                    } catch (e) {
                      return <p className="text-[10px] text-muted-foreground mt-1">Unable to calculate spending change</p>;
                    }
                  })()}
                </div>
              </div>
            </div>

            <div className="bg-card p-5 rounded-2xl border shadow-sm flex flex-col h-full group">
              {/* Top row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center">
                    <PiggyBank className="w-4.5 h-4.5 text-green-500" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Potential Savings</p>
                </div>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSavingsModalOpen(true)}
                  className="h-6 px-0 text-[10px] text-muted-foreground hover:text-red-500 hover:bg-transparent transition-colors flex items-center gap-1"
                >
                  View Details
                  <span className="text-xs">→</span>
                </Button>
              </div>

              {/* Middle row */}
              <div className="mb-2">
                <h3 className="text-2xl font-bold">
                  {currencySymbol}{potentialSavings.toFixed(2)}
                  {potentialSavings > 0 && <span className="text-sm font-normal text-muted-foreground ml-1">/ month</span>}
                </h3>
              </div>

              {/* Bottom row */}
              <div>
                {potentialSavings > 0 ? (
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    You could save this by cancelling unused subscriptions
                  </p>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[11px] font-medium text-muted-foreground leading-tight">
                      You're managing your subscriptions well 🎉
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 leading-tight">
                      Review your subscriptions to find hidden savings
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <SavingsDetailsModal
            isOpen={isSavingsModalOpen}
            onClose={() => setIsSavingsModalOpen(false)}
            unusedSubscriptions={unusedSubscriptions}
            monthlySavings={potentialSavings}
            yearlySavings={potentialSavings * 12}
            currencySymbol={currencySymbol}
          />

          {/* Selector moved to header */}

          {subscriptions.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-3xl border border-dashed">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t.dashboard.noSubscriptions}</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                {t.dashboard.noSubscriptionsDesc}
              </p>
              <Button 
                onClick={handleAddSubscription}
                className="ruby-gradient border-0 shadow-ruby hover:shadow-ruby-strong"
              >
                {t.dashboard.addFirstSubscription}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subscriptions.map((subscription) => (
                <FlipCard
                  key={subscription.id}
                  subscription={subscription}
                  onUpdate={updateSubscription}
                  onDelete={deleteSubscription}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <AddSubscriptionModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />

      <SubscriptionLimitModal
        open={isLimitModalOpen}
        onOpenChange={setIsLimitModalOpen}
      />
      
      <FeedbackButton />
    </div>
  );
};

export default Dashboard;
