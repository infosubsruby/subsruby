import { useEffect, useState, useMemo } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useSubscription } from "@/hooks/useSubscription";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { Navbar } from "@/components/layout/Navbar";
import { TrialBanner } from "@/components/layout/TrialBanner";
import { FlipCard } from "@/components/subscription/FlipCard";
import { UpcomingTimeline } from "@/components/dashboard/UpcomingTimeline";
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
import { useTranslations } from "@/i18n/useTranslations";
import { formatCurrency } from "@/i18n/currency";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const { isPro, status: proStatus, loading: subStatusLoading } = useSubscription();
  const { t } = useLanguage();
  const tt = useTranslations("Dashboard");
  const { defaultCurrency } = useSettings();
  
  useEffect(() => {
    if (!location.hash) return;
    const el = document.querySelector(location.hash);
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash]);
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

  const convertedCurrentMonthlyIncome = useMemo(() => {
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    const now = new Date();
    const fallback = defaultCurrency || "USD";
    return safeTransactions
      .filter((t) => {
        if (!t?.date) return false;
        const d = new Date(t.date);
        return t.type === "income" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, t) => {
        const raw = Number(t.amount || 0);
        const from = t.currency || fallback;
        const converted = convertWithDynamicRates(raw, from, activeCurrency, exchangeRates);
        return sum + (isFinite(converted) ? converted : 0);
      }, 0);
  }, [transactions, activeCurrency, exchangeRates, defaultCurrency]);

  // Calculate subscription vs income percentage
  const subscriptionPercentage = useMemo(() => {
    try {
      // Strictly use current monthly income as requested
      const income = Number(convertedCurrentMonthlyIncome) || 0;
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
  }, [monthlySpend, convertedCurrentMonthlyIncome]);

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
      .reduce((sum, t) => {
        const raw = Number(t.amount || 0);
        const from = t.currency || (defaultCurrency || "USD");
        const converted = convertWithDynamicRates(raw, from, activeCurrency, exchangeRates);
        return sum + (isFinite(converted) ? converted : 0);
      }, 0);

    // 2. Monthly Subscriptions
    const monthlySubscriptions = Number(monthlySpend) || 0;

    // 3. Ratio Calculation
    let ratio = 0;
    if (monthlyIncome > 0) {
      ratio = monthlySubscriptions / monthlyIncome;
    }

    // Insight logic
    if (monthlyIncome === 0) {
      return {
        severity: "info",
        icon: <Info className="w-6 h-6 text-sky-300" />,
        title: tt("spending_moderate"),
        message: tt("spending_moderate_desc"),
        containerClass: "bg-sky-500/10 border-sky-500/20",
        titleClass: "text-sky-300",
        messageClass: "text-zinc-400",
        ctaClass: "bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border-sky-500/30",
        cta: tt("review_subs")
      };
    }

    if (ratio > 0.5) {
      return {
        severity: "danger",
        icon: <AlertCircle className="w-6 h-6 text-red-300" />,
        title: tt("spending_moderate"),
        message: tt("spending_moderate_desc"),
        containerClass: "bg-red-500/10 border-red-500/20",
        titleClass: "text-red-300",
        messageClass: "text-zinc-400",
        ctaClass: "bg-red-500/10 hover:bg-red-500/20 text-red-300 border-red-500/30",
        cta: tt("review_subs")
      };
    } else if (ratio >= 0.2) {
      return {
        severity: "warning",
        icon: <AlertTriangle className="w-6 h-6 text-amber-300" />,
        title: tt("spending_moderate"),
        message: tt("spending_moderate_desc"),
        containerClass: "bg-amber-500/10 border-amber-500/20",
        titleClass: "text-amber-300",
        messageClass: "text-zinc-400",
        ctaClass: "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30",
        cta: tt("review_subs")
      };
    } else {
      return {
        severity: "good",
        icon: <CheckCircle2 className="w-6 h-6 text-emerald-300" />,
        title: tt("managing_well"),
        message: tt("find_hidden_savings"),
        containerClass: "bg-emerald-500/10 border-emerald-500/20",
        titleClass: "text-emerald-300",
        messageClass: "text-zinc-400"
      };
    }
  }, [subscriptions, transactions, tt, activeCurrency, exchangeRates, defaultCurrency, monthlySpend]);

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 2. Render Dashboard (Show content for everyone)
  return (
    <div className="min-h-screen pb-28 md:pb-20">
      <Navbar />
      
      <main className="pt-20 sm:pt-24 px-3 sm:px-4">
        <div className="flex flex-col xl:flex-row items-start gap-8 w-full max-w-[1400px] mx-auto">
          {!isPro && <TrialBanner />}

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold">{t.dashboard.title}</h1>
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
                    <SelectValue placeholder={t.dashboard.auto} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">{t.dashboard.auto} ({autoCurrency})</SelectItem>
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
                    {tt("subs_used", { used: Math.min(subscriptions.length, FREE_PLAN_LIMIT), limit: FREE_PLAN_LIMIT })}
                  </span>
                  {subscriptions.length === FREE_PLAN_LIMIT - 1 && (
                    <span className="text-[10px] font-medium text-amber-600 dark:text-amber-500">
                      {tt("limit_warning", { limit: FREE_PLAN_LIMIT })}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-8">
            <div className="flex-1 w-full min-w-0 flex flex-col gap-8">
          {/* Smart Financial Insight Card */}
          <div
            className={cn(
              "mb-8 p-3 md:p-4 rounded-2xl border backdrop-blur-sm flex flex-col md:flex-row items-center justify-between gap-4",
              financialInsight.containerClass
            )}
          >
            <div className="flex items-center gap-4">
              <div className="shrink-0">
                {financialInsight.icon}
              </div>
              <div className="flex flex-col">
                <h4 className={cn("text-base font-semibold", financialInsight.titleClass)}>
                  {financialInsight.title}
                </h4>
                <p className={cn("text-sm", financialInsight.messageClass)}>
                  {financialInsight.message}
                </p>
              </div>
            </div>
            {financialInsight.cta && (
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "whitespace-nowrap border transition-all px-4 py-2 rounded-lg font-medium",
                  financialInsight.ctaClass
                )}
                onClick={() => {
                  window.scrollTo({ top: 600, behavior: "smooth" });
                }}
              >
                {financialInsight.cta}
              </Button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            <div className="bg-card p-3 md:p-6 rounded-2xl border shadow-sm flex flex-col justify-center h-full w-full">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground">{t.dashboard.monthlyCost}</p>
                  <h3 className="text-xl md:text-2xl font-bold break-words">
                    {formatCurrency(monthlySpend, activeCurrency)}
                  </h3>
                </div>
              </div>
            </div>

            <div className="bg-card p-3 md:p-6 rounded-2xl border shadow-sm flex flex-col justify-center h-full w-full">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground">{t.dashboard.yearlyCost}</p>
                  <h3 className="text-xl md:text-2xl font-bold break-words">
                    {formatCurrency(yearlySpend, activeCurrency)}
                  </h3>
                </div>
              </div>
            </div>

            <div className="bg-card p-3 md:p-6 rounded-2xl border shadow-sm flex flex-col justify-center h-full w-full">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground">{t.dashboard.totalSubscriptions}</p>
                  <h3 className="text-xl md:text-2xl font-bold break-words">{subscriptions.length}</h3>
                </div>
              </div>
            </div>

            <div className="bg-card p-3 md:p-6 rounded-2xl border shadow-sm flex flex-col justify-center h-full w-full">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4 md:w-6 md:h-6 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground">{tt("subs_vs_income")}</p>
                  {(() => {
                    try {
                      if (financeLoading) {
                        return <p className="text-[10px] text-muted-foreground mt-1 animate-pulse">{tt("spending_change_desc")}</p>;
                      }

                      const totalIncome = Number(convertedCurrentMonthlyIncome) || 0;
                      const totalSubs = Number(monthlySpend) || 0;
                      const safeIncome = Number.isFinite(totalIncome) ? totalIncome : 0;
                      const safeSubs = Number.isFinite(totalSubs) ? totalSubs : 0;

                      const subsVsIncomePercent =
                        safeIncome > 0 ? ((safeSubs / safeIncome) * 100).toFixed(1) : null;

                      return (
                        <>
                          <h3 className="text-sm sm:text-base md:text-xl font-bold mt-0.5 break-words">
                            {formatCurrency(safeSubs, activeCurrency, { maximumFractionDigits: 0 })} /{" "}
                            {safeIncome > 0
                              ? formatCurrency(safeIncome, activeCurrency, { maximumFractionDigits: 0 })
                              : "N/A"}
                          </h3>
                          <p className={cn("text-[10px] font-medium mt-0.5", status?.color || "text-muted-foreground")}>
                            {safeIncome > 0 && subsVsIncomePercent !== null
                              ? tt("income_percent", { percent: subsVsIncomePercent })
                              : "No income data"}
                          </p>
                        </>
                      );
                    } catch (e) {
                      console.error("Error rendering Subscriptions vs Income card:", e);
                      return <h3 className="text-sm font-bold mt-1 text-muted-foreground">{tt("spending_change_desc")}</h3>;
                    }
                  })()}
                </div>
              </div>
            </div>

            <div className="bg-card p-3 md:p-6 rounded-2xl border shadow-sm flex flex-col justify-center h-full">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                  {(() => {
                    const previousSpending = Number(spendingChange?.previousTotal) || 0;
                    const currentSpending = Number(spendingChange?.currentTotal) || 0;
                    if (previousSpending <= 0) {
                      return <Info className="w-4 h-4 md:w-6 md:h-6 text-muted-foreground" />;
                    }
                    const rawChange = ((currentSpending - previousSpending) / previousSpending) * 100;
                    const changeNumber = Number.isFinite(rawChange) ? rawChange : 0;
                    return changeNumber > 0 ? (
                      <ArrowUp className="w-4 h-4 md:w-6 md:h-6 text-destructive" />
                    ) : (
                      <ArrowDown className="w-4 h-4 md:w-6 md:h-6 text-green-500" />
                    );
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground">{tt("spending_change")}</p>
                  {(() => {
                    try {
                      const currentSpending = Number(spendingChange?.currentTotal) || 0;
                      const previousSpending = Number(spendingChange?.previousTotal) || 0;
                      const safeCurrent = Number.isFinite(currentSpending) ? currentSpending : 0;
                      const safePrevious = Number.isFinite(previousSpending) ? previousSpending : 0;

                      const spendingChangeValue =
                        safePrevious > 0
                          ? (((safeCurrent - safePrevious) / safePrevious) * 100).toFixed(1)
                          : null;

                      const changeNumber = spendingChangeValue !== null ? Number(spendingChangeValue) || 0 : 0;
                      const isIncrease = changeNumber > 0;
                      const sparklineColor = isIncrease ? "hsl(358, 82%, 55%)" : "hsl(142, 70%, 45%)";
                      const sparklinePoints =
                        spendingChangeValue !== null
                          ? (() => {
                              const a = safePrevious;
                              const b = safeCurrent;
                              const min = Math.min(a, b);
                              const max = Math.max(a, b);
                              const span = max - min || 1;
                              const x1 = 0;
                              const x2 = 60;
                              const y1 = 16 - ((a - min) / span) * 16;
                              const y2 = 16 - ((b - min) / span) * 16;
                              return `${x1},${y1} ${x2},${y2}`;
                            })()
                          : "0,12 60,12";
                      
                      return (
                        <>
                          {spendingChangeValue !== null ? (
                            <>
                              <div className="flex items-center justify-between gap-3">
                                <h3 className="text-xl md:text-2xl font-bold">
                                  {isIncrease ? "+" : ""}{spendingChangeValue}%
                                </h3>
                                <svg width="60" height="18" viewBox="0 0 60 18" className="shrink-0">
                                  <polyline
                                    fill="none"
                                    stroke={sparklineColor}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    points={sparklinePoints}
                                  />
                                </svg>
                              </div>
                              <p className={cn("text-[10px] font-medium mt-0.5", isIncrease ? "text-destructive" : "text-green-500")}>
                                {tt("spending_change_desc")}
                              </p>
                            </>
                          ) : (
                            <>
                              <h3 className="text-base font-semibold mt-1 text-muted-foreground">{tt("no_previous_data")}</h3>
                              <svg width="60" height="18" viewBox="0 0 60 18" className="mt-1">
                                <polyline
                                  fill="none"
                                  stroke="hsl(220, 10%, 55%)"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  points="0,12 60,12"
                                />
                              </svg>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{tt("spending_change_desc")}</p>
                            </>
                          )}
                        </>
                      );
                    } catch (e) {
                      return <p className="text-[10px] text-muted-foreground mt-1">{tt("spending_change_desc")}</p>;
                    }
                  })()}
                </div>
              </div>
            </div>

            <div className="bg-card p-4 md:p-6 rounded-2xl border shadow-sm flex flex-col h-full group">
              {/* Top row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center">
                    <PiggyBank className="w-4.5 h-4.5 text-green-500" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">{tt("potential_savings")}</p>
                </div>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSavingsModalOpen(true)}
                  className="h-6 px-0 text-[10px] text-muted-foreground hover:text-red-500 hover:bg-transparent transition-colors flex items-center gap-1"
                >
                  {tt("view_details")}
                  <span className="text-xs">→</span>
                </Button>
              </div>

              {/* Middle row */}
              <div className="mb-2">
                <h3 className="text-2xl font-bold">
                  {formatCurrency(potentialSavings, activeCurrency)}
                  {potentialSavings > 0 && <span className="text-sm font-normal text-muted-foreground ml-1">{tt("per_month")}</span>}
                </h3>
              </div>

              {/* Bottom row */}
              <div>
                {potentialSavings > 0 ? (
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {tt("find_hidden_savings")}
                  </p>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[11px] font-medium text-muted-foreground leading-tight">
                      {tt("managing_well")}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 leading-tight">
                      {tt("find_hidden_savings")}
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

          <div id="subscriptions">
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {subscriptions.map((subscription) => (
                  <div key={subscription.id} className="w-full h-full">
                    <FlipCard
                      subscription={subscription}
                      onUpdate={updateSubscription}
                      onDelete={deleteSubscription}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
            </div>

            <div className="w-full xl:w-[380px] shrink-0 xl:sticky xl:top-6 flex flex-col gap-6">
              <UpcomingTimeline subscriptions={subscriptions} />
            </div>
          </div>
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
