import { useState, useMemo } from "react";
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
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Wallet, CreditCard, TrendingUp, Loader2, PiggyBank, MoreHorizontal } from "lucide-react";
import { currencies } from "@/data/subscriptionPresets";
import { convertWithDynamicRates, getCurrencySymbol } from "@/lib/currency";
import { calculatePotentialSavings } from "@/lib/subscriptionInsights";
import { SavingsDetailsModal } from "@/components/subscription/SavingsDetailsModal";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isPro, loading: subStatusLoading } = useSubscription();
  const { t: rawT } = useLanguage();
  const t = rawT as any;
  const { 
    subscriptions, 
    isLoading: subsLoading, 
    updateSubscription,
    deleteSubscription,
  } = useSubscriptions();

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
  const [displayCurrency, setDisplayCurrency] = useState<string | null>("TRY");

  const FREE_PLAN_LIMIT = 3;
  const canAddSubscription = isPro || subscriptions.length < FREE_PLAN_LIMIT;

  const handleAddSubscription = () => {
    if (!canAddSubscription) {
      alert(`Ücretsiz planda maksimum ${FREE_PLAN_LIMIT} abonelik ekleyebilirsiniz. Sınırsız erişim için Pro'ya geçin.`);
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
  const activeCurrency = displayCurrency || autoDetectedCurrency;
  const currencySymbol = getCurrencySymbol(activeCurrency);

  // Calculate total monthly cost with currency conversion
  const monthlySpend = useMemo(() => {
    return subscriptions.reduce((total, sub) => {
      const rawPrice = Number(sub.price ?? 0);
      // Normalize yearly to monthly
      const monthlyPrice = sub.billing_cycle === "yearly" ? rawPrice / 12 : rawPrice;
      
      // Convert to display currency using dynamic rates
      const convertedPrice = convertWithDynamicRates(
        monthlyPrice, 
        sub.currency, 
        activeCurrency, 
        exchangeRates
      );
      
      return total + convertedPrice;
    }, 0);
  }, [subscriptions, activeCurrency, exchangeRates]);

  const yearlySpend = monthlySpend * 12;

  // Calculate potential savings from unused subscriptions
  const { potentialSavings, unusedSubscriptions } = useMemo(() => {
    // Map subscriptions to display currency so calculatePotentialSavings returns correct value
    const convertedSubscriptions = subscriptions.map(sub => ({
      ...sub,
      price: convertWithDynamicRates(Number(sub.price ?? 0), sub.currency, activeCurrency, exchangeRates)
    }));
    
    const savings = calculatePotentialSavings(convertedSubscriptions as any);
    const unused = subscriptions.filter(sub => sub.is_marked_unused);
    
    return { potentialSavings: savings, unusedSubscriptions: unused };
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
            <div className="flex items-center gap-3">
              <Select
                value={displayCurrency || "auto"}
                onValueChange={(value) => setDisplayCurrency(value === "auto" ? null : value)}
              >
                <SelectTrigger className="w-[140px] bg-background border-input hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto ({autoDetectedCurrency})</SelectItem>
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
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-card p-6 rounded-2xl border shadow-sm">
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

            <div className="bg-card p-6 rounded-2xl border shadow-sm">
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

            <div className="bg-card p-6 rounded-2xl border shadow-sm">
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

            <div className="bg-card p-6 rounded-2xl border shadow-sm flex flex-col h-full group">
              {/* Top row */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <PiggyBank className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Potential Savings</p>
                </div>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSavingsModalOpen(true)}
                  className="h-7 px-2 text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  View Details
                  <span className="text-xs">→</span>
                </Button>
              </div>

              {/* Middle row */}
              <div className="mb-3">
                <h3 className="text-2xl font-bold">
                  {currencySymbol}{potentialSavings.toFixed(2)}
                  {potentialSavings > 0 && <span className="text-sm font-normal text-muted-foreground ml-1">/ month</span>}
                </h3>
              </div>

              {/* Bottom row */}
              <div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {potentialSavings > 0 
                    ? "You could save this by cancelling unused subscriptions" 
                    : "No unused subscriptions detected"}
                </p>
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
      
      <FeedbackButton />
    </div>
  );
};

export default Dashboard;
