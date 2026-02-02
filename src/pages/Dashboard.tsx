import { useState, useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useSubscription } from "@/hooks/useSubscription";
import { Navbar } from "@/components/layout/Navbar";
import { TrialBanner } from "@/components/layout/TrialBanner";
import { FlipCard } from "@/components/subscription/FlipCard";
import { AddSubscriptionModal } from "@/components/subscription/AddSubscriptionModal";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Wallet, CreditCard, TrendingUp, Loader2 } from "lucide-react";
import { currencies } from "@/data/subscriptionPresets";
import { convertCurrency, getCurrencySymbol } from "@/lib/currency";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { isPro, loading: subStatusLoading } = useSubscription();
  const { t: rawT } = useLanguage();
  const t = rawT as any;
  const { 
    subscriptions, 
    isLoading: subsLoading, 
    canAddSubscription,
    updateSubscription,
    deleteSubscription,
  } = useSubscriptions();

  console.log("Dashboard Rendered. isPro:", isPro, "Loading:", subStatusLoading);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<string | null>(null);

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
      // Convert to display currency
      const convertedPrice = convertCurrency(monthlyPrice, sub.currency, activeCurrency);
      return total + convertedPrice;
    }, 0);
  }, [subscriptions, activeCurrency]);

  const yearlySpend = monthlySpend * 12;

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  // 1. Loading Check
  if (authLoading || subsLoading || subStatusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 3. Original Dashboard Content (Only for Pro users)
  return (
    <div className="min-h-screen pb-20">
      <Navbar />
      
      <main className="pt-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <TrialBanner />

          <div className={`p-4 mb-4 rounded-lg text-white font-bold text-center ${isPro ? 'bg-green-600' : 'bg-red-500'}`}> 
            ABONELİK DURUMU: {subStatusLoading ? "YÜKLENİYOR..." : (isPro ? "✅ PRO PLAN (Aktif)" : "❌ ÜCRETSİZ PLAN")} 
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold">{t.dashboard.title}</h1>
              <p className="text-muted-foreground mt-1">
                {t.dashboard.subtitle}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="ruby-gradient border-0 shadow-ruby hover:shadow-ruby-strong transition-all gap-2"
                disabled={!canAddSubscription()}
              >
                <Plus className="w-5 h-5" />
                {t.dashboard.addSubscription}
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
          </div>

          <div className="flex justify-end mb-6">
            <Select
              value={displayCurrency || "auto"}
              onValueChange={(value) => setDisplayCurrency(value === "auto" ? null : value)}
            >
              <SelectTrigger className="w-[180px]">
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
          </div>

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
                onClick={() => setIsModalOpen(true)}
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
