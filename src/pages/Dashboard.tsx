import { useEffect, useState, useMemo } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useSubscription } from "@/hooks/useSubscription";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { TrialBanner } from "@/components/layout/TrialBanner";
import { FlipCard } from "@/components/subscription/FlipCard";
import { UpcomingTimeline } from "@/components/dashboard/UpcomingTimeline";
import { SubscriptionBreakdownChart } from "@/components/dashboard/SubscriptionBreakdownChart";
import { TopSpenders } from "@/components/dashboard/TopSpenders";
import { SmartInsights } from "@/components/dashboard/SmartInsights.tsx";
import { RecentActivity } from "@/components/dashboard/RecentActivity.tsx";
import { AddSubscriptionModal } from "@/components/subscription/AddSubscriptionModal";
import { SubscriptionLimitModal } from "@/components/subscription/SubscriptionLimitModal";
import {
  SubscriptionOptimizationInsightCard,
  type SubscriptionOptimizationInsight,
} from "@/components/subscription/SubscriptionOptimizationInsightCard";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plus,
  Wallet,
  CreditCard,
  TrendingUp,
  BarChart3,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  PiggyBank,
  ArrowUp,
  ArrowDown,
  X,
  BrainCircuit,
  CalendarClock,
  BadgeDollarSign,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { currencies } from "@/data/subscriptionPresets";
import { convertWithDynamicRates } from "@/lib/currency";
import { calculatePotentialSavings, currentMonthSubscriptionTotal, previousMonthSubscriptionTotal, monthOverMonthChangePercentage, type SubscriptionInput } from "@/lib/subscriptionInsights";
import { useFinance } from "@/hooks/useFinance";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/useSettings";
import { useTranslations } from "@/i18n/useTranslations";
import { formatCurrency } from "@/i18n/currency";
import { formatDate } from "@/i18n/date";
import { PremiumEmptyState } from "@/components/shared/PremiumEmptyState";
import { DEMO_TRANSACTIONS } from "@/data/demoFinanceData";
import { subscriptionPresets } from "@/data/subscriptionPresets";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { ProValueCallout } from "@/components/monetization/ProValueCallout";
import { FeatureGate } from "@/components/monetization/FeatureGate";
import { UpgradeModal } from "@/components/monetization/UpgradeModal";

const parseAmount = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const cleaned = value.trim().replace(/[^0-9,.-]/g, "");
  if (!cleaned) return 0;
  const normalized =
    cleaned.includes(",") && cleaned.includes(".")
      ? cleaned.replace(/,/g, "")
      : cleaned.replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const OPTIMIZER_CATEGORIES = [
  "Entertainment",
  "Productivity",
  "Music",
  "Cloud Storage",
  "Education",
  "Fitness",
  "AI Tools",
  "Other",
] as const;

const normalizeOptimizerCategory = (rawCategory?: string): (typeof OPTIMIZER_CATEGORIES)[number] => {
  if (!rawCategory) return "Other";
  const normalized = rawCategory.trim().toLowerCase();
  if (normalized.includes("entertainment") || normalized.includes("gaming") || normalized.includes("shopping") || normalized.includes("social")) {
    return "Entertainment";
  }
  if (normalized.includes("productivity")) return "Productivity";
  if (normalized.includes("music")) return "Music";
  if (normalized.includes("cloud")) return "Cloud Storage";
  if (normalized.includes("education")) return "Education";
  if (normalized.includes("fitness") || normalized.includes("health")) return "Fitness";
  if (normalized.includes("ai")) return "AI Tools";
  return "Other";
};

const computeNextPaymentDate = (nextPaymentDate: string | null, startDate: string, billingCycle: "monthly" | "yearly" | null) => {
  const baseRaw = nextPaymentDate ?? startDate ?? new Date().toISOString();
  let base = new Date(baseRaw);
  if (Number.isNaN(base.getTime())) base = new Date();
  const today = new Date();
  const next = new Date(base);
  let guard = 0;
  while (next < today && guard < 120) {
    if (billingCycle === "yearly") {
      next.setFullYear(next.getFullYear() + 1);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
    guard += 1;
  }
  return next;
};

const SubsVsIncomeValue = ({
  income,
  totalSubscriptions,
  currency,
  tt,
}: {
  income: number;
  totalSubscriptions: number;
  currency: string;
  tt: (key: string, params?: Record<string, unknown>) => string;
}) => {
  const safeIncome = Number.isFinite(income) ? income : 0;
  const safeSubscriptions = Number.isFinite(totalSubscriptions) ? totalSubscriptions : 0;
  const percentage = safeIncome > 0 ? ((safeSubscriptions / safeIncome) * 100).toFixed(1) : "0.0";
  const toneClass = Number(percentage) < 15 ? "text-green-500" : Number(percentage) <= 30 ? "text-amber-500" : "text-red-500";

  return (
    <>
      <h3 className="text-2xl font-bold text-gray-100 mt-0.5">
        {formatCurrency(safeSubscriptions, currency, { maximumFractionDigits: 0 })} /{" "}
        {formatCurrency(safeIncome, currency, { maximumFractionDigits: 0 })}
      </h3>
      <p className={cn("text-[10px] font-medium mt-0.5", toneClass)}>
        {tt("income_percent", { percent: percentage })}
      </p>
    </>
  );
};

const Dashboard = () => {
  const location = useLocation();
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const { isPro, status: proStatus, loading: subStatusLoading } = useSubscription();
  const { t } = useLanguage();
  const tt = useTranslations("Dashboard");
  const { defaultCurrency } = useSettings();
  const { canAccessFeature } = usePlanAccess();
  
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
  const { transactions, isLoading: financeLoading } = useFinance();

  // Fetch dynamic exchange rates
  const { data: exchangeRatesList } = useExchangeRates();

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
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<string | null>(null);
  const [isTransactionsOpen, setIsTransactionsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [clearedTransactionIds, setClearedTransactionIds] = useState<string[]>([]);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("finance.clearedTransactionIds");
      if (!raw) {
        setClearedTransactionIds([]);
        return;
      }
      const parsed = JSON.parse(raw);
      setClearedTransactionIds(Array.isArray(parsed) ? parsed : []);
    } catch {
      setClearedTransactionIds([]);
    }
  }, [transactions]);

  const FREE_PLAN_LIMIT = 5;
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

  // Calculate total monthly cost with currency conversion
  const monthlySpend = useMemo(() => {
    const safeSubscriptions = subscriptions ?? [];
    return safeSubscriptions.reduce((total, sub) => {
      if (!sub) return total;
      const rawPrice = parseAmount(sub.price);
      if (!Number.isFinite(rawPrice)) return total;
      
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
  const totalSubscriptions = Number(monthlySpend) || 0;

  const insightSubscriptions = useMemo<SubscriptionInput[]>(() => {
    const safeSubscriptions = subscriptions ?? [];
    return safeSubscriptions.map((sub) => {
      const raw = parseAmount(sub.price);
      const converted = convertWithDynamicRates(raw, sub.currency, activeCurrency, exchangeRates);
      const price = Number.isFinite(converted) ? converted : raw;
      return {
        price,
        billing_cycle: sub.billing_cycle,
        start_date: sub.start_date,
        is_marked_unused: sub.is_marked_unused,
      };
    });
  }, [subscriptions, activeCurrency, exchangeRates]);

  const spendingChange = useMemo(() => {
    const now = new Date();
    const currentTotal = currentMonthSubscriptionTotal(insightSubscriptions, now);
    const previousTotal = previousMonthSubscriptionTotal(insightSubscriptions, now);
    const percentageChange = monthOverMonthChangePercentage(currentTotal, previousTotal);
    return {
      currentTotal,
      previousTotal,
      percentageChange,
      hasPreviousData: previousTotal > 0,
    };
  }, [insightSubscriptions]);

  const potentialSavings = useMemo(() => calculatePotentialSavings(insightSubscriptions), [insightSubscriptions]);
  const unusedCount = useMemo(
    () => insightSubscriptions.filter((s) => s.is_marked_unused).length,
    [insightSubscriptions]
  );
  const safeTransactions = useMemo(
    () => (Array.isArray(transactions) ? transactions : []),
    [transactions]
  );
  const activeTransactions = useMemo(
    () => safeTransactions.filter((tx) => !clearedTransactionIds.includes(tx.id)),
    [safeTransactions, clearedTransactionIds]
  );

  const totalIncome = useMemo(() => {
    const now = new Date();
    const fallback = defaultCurrency || "USD";
    return activeTransactions
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
  }, [activeTransactions, activeCurrency, exchangeRates, defaultCurrency]);

  const totalExpenses = useMemo(() => {
    const now = new Date();
    const fallback = defaultCurrency || "USD";
    return activeTransactions
      .filter((t) => {
        if (!t?.date) return false;
        const d = new Date(t.date);
        return t.type === "expense" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, t) => {
        const raw = Number(t.amount || 0);
        const from = t.currency || fallback;
        const converted = convertWithDynamicRates(raw, from, activeCurrency, exchangeRates);
        return sum + (Number.isFinite(converted) ? converted : 0);
      }, 0);
  }, [activeTransactions, activeCurrency, exchangeRates, defaultCurrency]);

  const enrichedSubscriptions = useMemo(() => {
    return subscriptions.map((sub) => {
      const preset = subscriptionPresets.find((p) => p.slug === sub.slug || p.name.toLowerCase() === sub.name.toLowerCase());
      const raw = parseAmount(sub.price);
      const normalizedMonthly = sub.billing_cycle === "yearly" ? raw / 12 : raw;
      const monthlyCost = convertWithDynamicRates(normalizedMonthly, sub.currency, activeCurrency, exchangeRates);
      const monthly = Number.isFinite(monthlyCost) ? monthlyCost : normalizedMonthly;
      const yearly = monthly * 12;
      const nextPayment = computeNextPaymentDate(sub.next_payment_date, sub.start_date, sub.billing_cycle);
      const daysUntil = Math.max(0, Math.ceil((nextPayment.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
      const category = normalizeOptimizerCategory(preset?.category);
      const usageStatus: "active" | "low_usage" = sub.is_marked_unused ? "low_usage" : "active";
      const optimizationLabel =
        sub.is_marked_unused
          ? "Potential waste"
          : yearly > 220
          ? "High yearly impact"
          : sub.billing_cycle === "monthly" && ["spotify", "amazon-prime", "netflix", "disney-plus", "canva"].includes(sub.slug)
          ? "Optimize billing"
          : yearly <= 120
          ? "Good value"
          : "Review";
      const aiRecommendation =
        optimizationLabel === "Potential waste"
          ? "Usage appears low. Consider cancelling or pausing this plan."
          : optimizationLabel === "High yearly impact"
          ? "This subscription has a meaningful annual impact. Validate utility monthly."
          : optimizationLabel === "Optimize billing"
          ? "A yearly billing cycle may reduce effective monthly cost."
          : optimizationLabel === "Review"
          ? "Review this plan against current goals and budget limits."
          : "Current value looks healthy relative to cost.";
      return {
        ...sub,
        monthly,
        yearly,
        category,
        usageStatus,
        nextPayment,
        daysUntil,
        optimizationLabel,
        aiRecommendation,
      };
    });
  }, [subscriptions, activeCurrency, exchangeRates]);

  const subscriptionBurdenPct = totalIncome > 0 ? (monthlySpend / totalIncome) * 100 : 0;
  const potentialYearlySavings = potentialSavings * 12;
  const nextUpcomingPayment = useMemo(
    () => [...enrichedSubscriptions].sort((a, b) => a.daysUntil - b.daysUntil)[0] ?? null,
    [enrichedSubscriptions]
  );
  const upcomingRenewals = useMemo(
    () => [...enrichedSubscriptions].sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 6),
    [enrichedSubscriptions]
  );

  const remainingDays = Math.max(1, new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate());
  const baseSafeToSpendDaily = (totalIncome - totalExpenses - monthlySpend) / remainingDays;

  const optimizerInsights = useMemo<SubscriptionOptimizationInsight[]>(() => {
    const insights: SubscriptionOptimizationInsight[] = [];
    const activeList = enrichedSubscriptions.filter((sub) => sub.usageStatus === "active");
    const entertainment = activeList.filter((sub) => sub.category === "Entertainment");
    if (entertainment.length >= 2) {
      insights.push({
        id: "overlap-entertainment",
        title: `${entertainment[0]?.name ?? "Streaming plans"} and ${entertainment[1]?.name ?? "another service"} overlap in Entertainment`,
        explanation: "Ruby AI detected multiple subscriptions serving similar entertainment needs.",
        severity: "medium",
        categoryTag: "Category Overlap",
        confidencePct: 86,
        potentialSavings: Math.min(entertainment[0]?.yearly ?? 0, entertainment[1]?.yearly ?? 0),
        suggestedAction: "Compare weekly usage and cancel the lowest-value plan.",
        actionLabel: "Review overlap",
      });
    }

    const annualizable = activeList.find((sub) =>
      ["spotify", "amazon-prime", "netflix", "disney-plus", "canva"].includes(sub.slug) && sub.billing_cycle === "monthly"
    );
    if (annualizable) {
      insights.push({
        id: "optimize-billing",
        title: `${annualizable.name} yearly billing may save money`,
        explanation: "Switching to annual billing often lowers effective monthly cost for this service.",
        severity: "low",
        categoryTag: "Billing Optimization",
        confidencePct: 88,
        potentialSavings: annualizable.yearly * 0.1,
        suggestedAction: "Check annual plans and lock in lower effective pricing.",
        actionLabel: "Optimize billing",
      });
    }

    const renewalsInWeek = enrichedSubscriptions.filter((sub) => sub.daysUntil <= 7).length;
    if (renewalsInWeek > 0) {
      insights.push({
        id: "renewal-cluster",
        title: `You have ${renewalsInWeek} subscriptions renewing in the next 7 days`,
        explanation: "A renewal cluster can increase short-term pressure on safe-to-spend limits.",
        severity: renewalsInWeek >= 3 ? "high" : "medium",
        categoryTag: "Renewals",
        confidencePct: 92,
        potentialSavings: 0,
        suggestedAction: "Set reminders and review low-usage services before due dates.",
        actionLabel: "Open renewals",
      });
    }

    insights.push({
      id: "income-burden",
      title: `Subscriptions are ${subscriptionBurdenPct.toFixed(1)}% of your monthly income`,
      explanation: "Ruby AI compares subscription load against your current month income trend.",
      severity: subscriptionBurdenPct >= 15 ? "high" : subscriptionBurdenPct >= 10 ? "medium" : "low",
      categoryTag: "Budget Health",
      confidencePct: 90,
      potentialSavings: potentialYearlySavings * 0.35,
      suggestedAction: "Keep subscription load below 10% of income for stronger savings velocity.",
      actionLabel: "Review budget fit",
    });

    const wasteCandidate = enrichedSubscriptions
      .filter((sub) => sub.usageStatus === "low_usage")
      .sort((a, b) => b.yearly - a.yearly)[0];
    if (wasteCandidate) {
      insights.push({
        id: "unused-subscription",
        title: `One unused subscription may be costing you ${formatCurrency(wasteCandidate.yearly, activeCurrency)}/year`,
        explanation: "This plan is flagged with low usage and likely has limited monthly value.",
        severity: "high",
        categoryTag: "Waste Detection",
        confidencePct: 94,
        potentialSavings: wasteCandidate.yearly,
        suggestedAction: "Cancel or pause this plan, then redirect savings into goals.",
        actionLabel: "Mark for cancellation",
      });
    }

    return insights.slice(0, 5);
  }, [enrichedSubscriptions, subscriptionBurdenPct, potentialYearlySavings, activeCurrency]);

  const cancellationOpportunities = useMemo(
    () =>
      enrichedSubscriptions
        .filter((sub) => sub.usageStatus === "low_usage" || sub.optimizationLabel === "Potential waste" || sub.optimizationLabel === "High yearly impact")
        .sort((a, b) => b.yearly - a.yearly)
        .slice(0, 4),
    [enrichedSubscriptions]
  );

  const categoryBreakdown = useMemo(() => {
    const totals = OPTIMIZER_CATEGORIES.reduce<Record<string, { monthly: number; yearly: number }>>((acc, category) => {
      acc[category] = { monthly: 0, yearly: 0 };
      return acc;
    }, {});
    enrichedSubscriptions.forEach((sub) => {
      totals[sub.category].monthly += sub.monthly;
      totals[sub.category].yearly += sub.yearly;
    });
    return OPTIMIZER_CATEGORIES.map((category) => {
      const monthly = totals[category].monthly;
      const yearly = totals[category].yearly;
      const share = monthlySpend > 0 ? (monthly / monthlySpend) * 100 : 0;
      return { category, monthly, yearly, share };
    });
  }, [enrichedSubscriptions, monthlySpend]);

  const optimizerForecast = {
    projectedYearlyCost: yearlySpend,
    currentMonthlyPace: monthlySpend,
    optimizedYearlyCost: Math.max(0, yearlySpend - potentialYearlySavings),
    savingsGap: potentialYearlySavings,
  };

  // Smart Financial Insight Logic (Updated with safe calculations)
  const financialInsight = useMemo(() => {
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
        icon: <Info className="w-4 h-4 text-sky-300" />,
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
        icon: <AlertCircle className="w-4 h-4 text-red-300" />,
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
        icon: <AlertTriangle className="w-4 h-4 text-amber-300" />,
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
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-300" />,
        title: tt("managing_well"),
        message: tt("find_hidden_savings"),
        containerClass: "bg-emerald-500/10 border-emerald-500/20",
        titleClass: "text-emerald-300",
        messageClass: "text-zinc-400"
      };
    }
  }, [transactions, tt, activeCurrency, exchangeRates, defaultCurrency, monthlySpend]);

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
    <div className="relative min-h-screen pb-8 premium-page">
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 pointer-events-none w-[800px] h-[400px] bg-red-900/20 blur-[120px] rounded-full" />
      
      <main>
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6">
          <div className="flex flex-col gap-6">
            {!isPro && <TrialBanner />}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold">AI Subscription Optimizer</h1>
                <p className="text-muted-foreground mt-1">
                  Intelligent recurring-payment control center with proactive savings recommendations.
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
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors border border-red-500/50 gap-2"
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
                  </div>
                )}
              </div>
            </div>
            <ProValueCallout message="Unlock yearly savings optimizer with Ruby AI Pro." />

            {subscriptions.length === 0 ? (
              <PremiumEmptyState
                icon={<CreditCard className="h-5 w-5" />}
                headline="Track your recurring payments"
                description="Add subscriptions to discover yearly costs, renewal pressure, and AI-powered savings opportunities."
                primaryAction={{ label: "Add Subscription", onClick: handleAddSubscription }}
                secondaryAction={{ label: "Open Finance", to: "/finance" }}
                badges={DEMO_TRANSACTIONS.filter((tx) => tx.category === "Subscriptions").map((tx) => tx.merchant)}
                className="border border-white/15 border-dashed"
              />
            ) : (
              <>
                <section className="premium-section rounded-[28px] p-6 sm:p-7">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Subscription Summary Hero</p>
                      <h2 className="mt-1 text-2xl font-semibold text-zinc-100">Ruby AI found {formatCurrency(potentialYearlySavings, activeCurrency)}/year in possible subscription savings.</h2>
                    </div>
                    <div className="premium-chip border-red-500/35 bg-red-500/10 text-red-200">
                      Burden {subscriptionBurdenPct.toFixed(1)}% of income
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <article className="rounded-xl border border-white/10 bg-black/25 p-4">
                      <p className="text-xs text-zinc-500">Total Monthly Subscription Cost</p>
                      <p className="mt-1 text-2xl font-semibold text-zinc-100">{formatCurrency(monthlySpend, activeCurrency)}</p>
                    </article>
                    <article className="rounded-xl border border-white/10 bg-black/25 p-4">
                      <p className="text-xs text-zinc-500">Total Yearly Subscription Cost</p>
                      <p className="mt-1 text-2xl font-semibold text-zinc-100">{formatCurrency(yearlySpend, activeCurrency)}</p>
                    </article>
                    <article className="rounded-xl border border-white/10 bg-black/25 p-4">
                      <p className="text-xs text-zinc-500">Active Subscriptions</p>
                      <p className="mt-1 text-2xl font-semibold text-zinc-100">{subscriptions.length}</p>
                    </article>
                    <article className="rounded-xl border border-white/10 bg-black/25 p-4">
                      <p className="text-xs text-zinc-500">Subscription Burden</p>
                      <p className="mt-1 text-2xl font-semibold text-zinc-100">{subscriptionBurdenPct.toFixed(1)}%</p>
                    </article>
                    <article className="rounded-xl border border-white/10 bg-black/25 p-4">
                      <p className="text-xs text-zinc-500">Next Upcoming Payment</p>
                      <p className="mt-1 text-lg font-semibold text-zinc-100">
                        {nextUpcomingPayment
                          ? `${nextUpcomingPayment.name} • ${formatCurrency(nextUpcomingPayment.monthly, activeCurrency)}`
                          : "No upcoming payment"}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {nextUpcomingPayment ? formatDate(nextUpcomingPayment.nextPayment, { dateStyle: "medium" }) : "—"}
                      </p>
                    </article>
                    <article className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                      <p className="text-xs text-emerald-200">Potential Yearly Savings</p>
                      <p className="mt-1 text-2xl font-semibold text-zinc-100">{formatCurrency(potentialYearlySavings, activeCurrency)}</p>
                      <p className="text-xs text-zinc-300">Optimization opportunities detected by Ruby AI</p>
                    </article>
                  </div>
                </section>

                <FeatureGate
                  enabled={canAccessFeature("subscription_optimizer")}
                  title="Unlock Ruby AI Pro"
                  description="Detailed subscription optimizer insights and yearly savings intelligence are in Pro."
                  onUpgradeClick={() => setUpgradeOpen(true)}
                >
                  <section className="space-y-3">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="h-4 w-4 text-red-300" />
                      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">AI Optimization Insights</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {optimizerInsights.map((insight) => (
                        <SubscriptionOptimizationInsightCard
                          key={insight.id}
                          insight={insight}
                          savingsLabel={
                            insight.potentialSavings > 0
                              ? `Potential savings ${formatCurrency(insight.potentialSavings, activeCurrency)} / year`
                              : "No direct savings estimate"
                          }
                          onAction={() => {
                            if (insight.id === "renewal-cluster") {
                              setActiveTab("upcoming");
                              setIsTransactionsOpen(true);
                            }
                          }}
                        />
                      ))}
                    </div>
                  </section>
                </FeatureGate>

                <section id="subscriptions" className="space-y-3">
                  <div className="flex items-center gap-2">
                    <BadgeDollarSign className="h-4 w-4 text-red-300" />
                    <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Active Subscriptions</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {enrichedSubscriptions.map((sub) => (
                      <article key={sub.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-base font-semibold text-zinc-100">{sub.name}</h3>
                            <p className="text-xs text-zinc-400">{sub.category} • {sub.billing_cycle ?? "monthly"} billing</p>
                          </div>
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[10px]",
                              sub.optimizationLabel === "Potential waste"
                                ? "border-red-500/40 bg-red-500/10 text-red-200"
                                : sub.optimizationLabel === "Optimize billing"
                                ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                            )}
                          >
                            {sub.optimizationLabel}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                          <p>Amount: <span className="text-zinc-100">{formatCurrency(sub.monthly, activeCurrency)}</span></p>
                          <p>Yearly Cost: <span className="text-zinc-100">{formatCurrency(sub.yearly, activeCurrency)}</span></p>
                          <p>Next Payment: <span className="text-zinc-100">{formatDate(sub.nextPayment, { dateStyle: "medium" })}</span></p>
                          <p>Usage Status: <span className="text-zinc-100">{sub.usageStatus === "low_usage" ? "Low usage" : "Active"}</span></p>
                        </div>
                        <div className="mt-2 rounded-lg border border-white/10 bg-black/20 p-2.5">
                          <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-500">AI Recommendation</p>
                          <p className="mt-1 text-xs text-zinc-300">{sub.aiRecommendation}</p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/15 bg-white/[0.03] text-zinc-200"
                            onClick={() => updateSubscription(sub.id, { is_marked_unused: !sub.is_marked_unused })}
                          >
                            {sub.is_marked_unused ? "Mark Active" : "Mark for Review"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/15 bg-white/[0.03] text-zinc-200"
                            onClick={() => {
                              setActiveTab("upcoming");
                              setIsTransactionsOpen(true);
                            }}
                          >
                            Renewal Reminder
                          </Button>
                        </div>
                        <details className="mt-3">
                          <summary className="cursor-pointer text-xs text-zinc-400 hover:text-zinc-200">Open full controls (edit/manage/cancel)</summary>
                          <div className="mt-3">
                            <FlipCard subscription={sub} onUpdate={updateSubscription} onDelete={deleteSubscription} />
                          </div>
                        </details>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-red-300" />
                    <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Upcoming Renewals</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {upcomingRenewals.map((renewal) => {
                      const impactPct = baseSafeToSpendDaily > 0 ? (renewal.monthly / baseSafeToSpendDaily) * 100 : 0;
                      const urgency = renewal.daysUntil <= 2 ? "High" : renewal.daysUntil <= 7 ? "Medium" : "Low";
                      return (
                        <article key={renewal.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-sm font-medium text-zinc-100">{renewal.name}</p>
                            <span className={cn(
                              "rounded-full border px-2 py-0.5 text-[10px]",
                              urgency === "High"
                                ? "border-red-500/40 bg-red-500/10 text-red-200"
                                : urgency === "Medium"
                                ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                            )}>{urgency}</span>
                          </div>
                          <p className="text-lg font-semibold text-zinc-100">{formatCurrency(renewal.monthly, activeCurrency)}</p>
                          <p className="text-xs text-zinc-400">Due {formatDate(renewal.nextPayment, { dateStyle: "medium" })}</p>
                          <p className="text-xs text-zinc-400">Impact on safe-to-spend: {impactPct > 0 ? `${impactPct.toFixed(0)}%` : "N/A"}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 h-7 border-white/15 bg-white/[0.03] text-zinc-200"
                            onClick={() => {
                              setActiveTab("upcoming");
                              setIsTransactionsOpen(true);
                            }}
                          >
                            Set Reminder
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </article>
                      );
                    })}
                  </div>
                </section>

                <section className="premium-section rounded-[24px] p-5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-red-300" />
                    <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Yearly Cost Forecast</h2>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <article className="rounded-xl border border-white/10 bg-black/25 p-3">
                      <p className="text-xs text-zinc-500">Projected Yearly Cost</p>
                      <p className="mt-1 text-lg font-semibold text-zinc-100">{formatCurrency(optimizerForecast.projectedYearlyCost, activeCurrency)}</p>
                    </article>
                    <article className="rounded-xl border border-white/10 bg-black/25 p-3">
                      <p className="text-xs text-zinc-500">Current Monthly Pace</p>
                      <p className="mt-1 text-lg font-semibold text-zinc-100">{formatCurrency(optimizerForecast.currentMonthlyPace, activeCurrency)}</p>
                    </article>
                    <article className="rounded-xl border border-white/10 bg-black/25 p-3">
                      <p className="text-xs text-zinc-500">Optimized Yearly Cost</p>
                      <p className="mt-1 text-lg font-semibold text-zinc-100">{formatCurrency(optimizerForecast.optimizedYearlyCost, activeCurrency)}</p>
                    </article>
                    <article className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                      <p className="text-xs text-emerald-200">Potential Savings Gap</p>
                      <p className="mt-1 text-lg font-semibold text-zinc-100">{formatCurrency(optimizerForecast.savingsGap, activeCurrency)}</p>
                    </article>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-zinc-800/80">
                    <div
                      className="h-2 rounded-full bg-emerald-400"
                      style={{
                        width: `${optimizerForecast.projectedYearlyCost > 0 ? Math.min(100, (optimizerForecast.savingsGap / optimizerForecast.projectedYearlyCost) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-red-300" />
                    <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Cancellation Opportunities</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {cancellationOpportunities.length === 0 ? (
                      <div className="rounded-xl border border-white/10 bg-black/25 p-4 text-sm text-zinc-400">
                        No immediate cancellation candidates detected by current usage signals.
                      </div>
                    ) : (
                      cancellationOpportunities.map((item) => (
                        <article key={item.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
                          <p className="text-sm font-medium text-zinc-100">{item.name}</p>
                          <p className="text-xs text-zinc-400">{item.category} • {item.optimizationLabel}</p>
                          <p className="mt-1 text-sm text-zinc-300">Estimated yearly impact: {formatCurrency(item.yearly, activeCurrency)}</p>
                          <p className="text-xs text-zinc-400">{item.aiRecommendation}</p>
                        </article>
                      ))
                    )}
                  </div>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-red-300" />
                    <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Category Breakdown</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                    <div className="xl:col-span-5">
                      <SubscriptionBreakdownChart subscriptions={subscriptions} currency={activeCurrency} exchangeRates={exchangeRates} />
                    </div>
                    <div className="xl:col-span-7 rounded-xl border border-white/10 bg-black/25 p-3">
                      <div className="space-y-2">
                        {categoryBreakdown.map((category) => (
                          <div key={category.category} className="rounded-lg border border-white/10 bg-black/20 p-2.5">
                            <div className="mb-1 flex items-center justify-between text-xs text-zinc-300">
                              <span>{category.category}</span>
                              <span>{category.share.toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-zinc-400">
                              <span>Monthly {formatCurrency(category.monthly, activeCurrency)}</span>
                              <span>Yearly {formatCurrency(category.yearly, activeCurrency)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-red-300" />
                    <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-300">Subscription Calendar Preview</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                    <div className="rounded-xl border border-white/10 bg-black/25 p-4 xl:col-span-7">
                      <UpcomingTimeline
                        subscriptions={subscriptions}
                        limit={6}
                        onViewAll={() => {
                          setActiveTab("upcoming");
                          setIsTransactionsOpen(true);
                        }}
                      />
                    </div>
                    <div className="rounded-xl border border-white/10 bg-black/25 p-4 xl:col-span-5">
                      <RecentActivity
                        subscriptions={subscriptions}
                        currency={activeCurrency}
                        exchangeRates={exchangeRates}
                        onViewAll={() => {
                          setActiveTab("recent");
                          setIsTransactionsOpen(true);
                        }}
                      />
                    </div>
                  </div>
                </section>

                <div className="hidden">
                  <SmartInsights
                    subscriptions={subscriptions}
                    currency={activeCurrency}
                    exchangeRates={exchangeRates}
                    monthlyIncome={totalIncome}
                  />
                  <TopSpenders subscriptions={subscriptions} currency={activeCurrency} exchangeRates={exchangeRates} />
                  <SubsVsIncomeValue income={Number(totalIncome) || 0} totalSubscriptions={totalSubscriptions} currency={activeCurrency} tt={tt} />
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity",
          isTransactionsOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsTransactionsOpen(false)}
      >
        <div
          className={cn(
            "fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#0c0c0e] border-l border-gray-800 shadow-2xl transform transition-transform duration-300 flex flex-col",
            isTransactionsOpen ? "translate-x-0" : "translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <h3 className="text-lg font-semibold text-gray-100">{tt("transactionHistory")}</h3>
            <button
              type="button"
              className="text-gray-400 hover:text-white transition-colors"
              onClick={() => setIsTransactionsOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 pt-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={cn(
                  "px-3 py-2 text-sm font-medium border-b-2 transition-colors",
                  activeTab === "upcoming"
                    ? "border-red-500 text-white"
                    : "border-transparent text-gray-400 hover:text-gray-200"
                )}
                onClick={() => setActiveTab("upcoming")}
              >
                {tt("upcomingPayments")}
              </button>
              <button
                type="button"
                className={cn(
                  "px-3 py-2 text-sm font-medium border-b-2 transition-colors",
                  activeTab === "recent"
                    ? "border-red-500 text-white"
                    : "border-transparent text-gray-400 hover:text-gray-200"
                )}
                onClick={() => setActiveTab("recent")}
              >
                {tt("recentActivity")}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "upcoming" ? (
              <UpcomingTimeline subscriptions={subscriptions} limit={subscriptions.length} showHeader={false} />
            ) : (
              <RecentActivity
                subscriptions={subscriptions}
                currency={activeCurrency}
                exchangeRates={exchangeRates}
                limit={subscriptions.length}
                showHeader={false}
              />
            )}
          </div>
        </div>
      </div>

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
