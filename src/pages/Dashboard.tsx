import { useState, useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useSubscriptions } from "@/hooks/useSubscriptions";
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
  const { user, isLoading: authLoading, isUnlimited } = useAuth();
  const { t } = useLanguage();
  const { 
    subscriptions, 
    isLoading: subsLoading, 
    canAddSubscription,
    maxTrialSubscriptions,
    updateSubscription,
    deleteSubscription,
  } = useSubscriptions();
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
  const totalMonthlyCost = useMemo(() => {
    return subscriptions.reduce((total, sub) => {
      const rawPrice = Number(sub.price ?? 0);
      // Normalize yearly to monthly
      const monthlyPrice = sub.billing_cycle === "yearly" ? rawPrice / 12 : rawPrice;
      // Convert to display currency
      const convertedPrice = convertCurrency(monthlyPrice, sub.currency, activeCurrency);
      return total + convertedPrice;
    }, 0);
  }, [subscriptions, activeCurrency]);

  const totalYearlyCost = totalMonthlyCost * 12;

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (authLoading || subsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Navbar />
      
      <main className="pt-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <TrialBanner />

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
            <div className="glass-card rounded-xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.dashboard.totalSubscriptions}</p>
                <p className="font-display text-2xl font-bold">{subscriptions.length}</p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-success" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t.dashboard.monthlyCost}</p>
                  {/* Currency Selector */}
                  <Select 
                    value={displayCurrency || "auto"} 
                    onValueChange={(v) => setDisplayCurrency(v === "auto" ? null : v)}
                  >
                    <SelectTrigger className="h-6 w-auto gap-1 border-0 bg-transparent p-0 text-xs text-muted-foreground hover:text-foreground focus:ring-0">
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
                </div>
                <p className="font-display text-2xl font-bold">
                  {currencySymbol}{totalMonthlyCost.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-warning/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.dashboard.yearlyCost}</p>
                <p className="font-display text-2xl font-bold">
                  {currencySymbol}{totalYearlyCost.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Subscriptions Grid with Flip Cards */}
          {subscriptions.length === 0 ? (
            <div className="glass-card rounded-xl p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">{t.dashboard.noSubscriptions}</h3>
              <p className="text-muted-foreground mb-6">
                {t.dashboard.noSubscriptionsDesc}
              </p>
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="ruby-gradient border-0 shadow-ruby gap-2"
              >
                <Plus className="w-4 h-4" />
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

          {/* Trial limit notice - only show for non-unlimited users */}
          {!isUnlimited && !canAddSubscription() && (
            <div className="mt-8 p-4 rounded-lg bg-warning/10 border border-warning/30 text-center">
              <p className="text-warning font-medium">
                {t.dashboard.trialLimit} ({maxTrialSubscriptions}). 
                <Button 
                  variant="link" 
                  className="text-primary p-0 ml-1 h-auto"
                  onClick={() => navigate("/upgrade")}
                >
                  {t.dashboard.getLifetime}
                </Button>
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Add Subscription Modal */}
      <AddSubscriptionModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
      />

      {/* Feedback Button */}
      <FeedbackButton />
    </div>
  );
};

export default Dashboard;
