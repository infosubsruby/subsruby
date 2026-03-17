import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useFinance } from "@/hooks/useFinance";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { convertWithDynamicRates } from "@/lib/currency";
import { calculatePotentialSavings } from "@/lib/subscriptionInsights";
import { Sparkles, Wallet, CreditCard, ArrowRight, CheckCircle2, PiggyBank, TrendingUp } from "lucide-react";
import { AddTransactionModal } from "@/components/finance/AddTransactionModal";
import { AddSubscriptionModal } from "@/components/subscription/AddSubscriptionModal";
import { toast } from "sonner";

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const { createTransaction, transactions, currentMonthlyIncome } = useFinance();
  const { subscriptions, isLoading: subsLoading } = useSubscriptions();
  const { data: exchangeRatesList } = useExchangeRates();

  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);

  // Convert rates array to Record<string, number>
  const exchangeRates = useMemo(() => {
    if (!exchangeRatesList) return {};
    return exchangeRatesList.reduce((acc, curr) => {
      acc[curr.currency_code] = Number(curr.rate);
      return acc;
    }, {} as Record<string, number>);
  }, [exchangeRatesList]);

  const handleCompleteStep1 = () => setStep(2);

  const handleOpenIncomeModal = () => setIsIncomeModalOpen(true);
  const handleOpenSubModal = () => setIsSubModalOpen(true);

  // Automatically advance to next step when data is added
  useEffect(() => {
    if (step === 2 && currentMonthlyIncome > 0) {
      setStep(3);
    }
  }, [currentMonthlyIncome, step]);

  useEffect(() => {
    if (step === 3 && subscriptions.length > 0) {
      setStep(4);
    }
  }, [subscriptions.length, step]);

  const finishOnboarding = () => {
    localStorage.setItem("hasCompletedOnboarding", "true");
    navigate("/control");
  };

  // WOW Screen Calculations using REAL data from hooks
  const wowData = useMemo(() => {
    const safeSubscriptions = subscriptions || [];
    
    // Calculate monthly total in USD (or base currency)
    const monthlyTotal = safeSubscriptions.reduce((total, sub) => {
      const rawPrice = Number(sub.price ?? 0);
      const monthlyPrice = sub.billing_cycle === "yearly" ? rawPrice / 12 : rawPrice;
      const convertedPrice = convertWithDynamicRates(monthlyPrice, sub.currency, "USD", exchangeRates);
      return total + (isFinite(convertedPrice) ? convertedPrice : 0);
    }, 0);

    const yearlyTotal = monthlyTotal * 12;
    
    // Calculate real potential savings
    const convertedInputs = safeSubscriptions.map(sub => ({
      price: convertWithDynamicRates(Number(sub.price), sub.currency, "USD", exchangeRates),
      billing_cycle: sub.billing_cycle,
      is_marked_unused: sub.is_marked_unused
    }));
    
    const potentialSavings = calculatePotentialSavings(convertedInputs);
    
    return {
      monthlyTotal: monthlyTotal.toFixed(2),
      yearlyTotal: yearlyTotal.toFixed(2),
      potentialSavings: potentialSavings.toFixed(2),
      yearlySavings: (potentialSavings * 12).toFixed(2)
    };
  }, [subscriptions, exchangeRates]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full flex justify-center">
        {step === 1 && (
          <div className="max-w-md w-full text-center animate-fade-in">
            <div className="mb-8 flex justify-center">
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 tracking-tight">
              Track your subscriptions. <br />
              <span className="ruby-text-gradient text-5xl">Save money effortlessly.</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-10">
              Stop losing money on forgotten renewals. Let's set up your personal dashboard in 30 seconds.
            </p>
            <Button 
              size="lg" 
              onClick={handleCompleteStep1}
              className="w-full ruby-gradient h-14 text-lg font-semibold rounded-2xl shadow-ruby hover:shadow-ruby-strong transition-all"
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-md w-full text-center animate-fade-in">
            <div className="mb-8 flex justify-center">
              <div className="w-20 h-20 bg-green-500/10 rounded-3xl flex items-center justify-center">
                <Wallet className="w-10 h-10 text-green-500" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4">Step 1: Your Income</h2>
            <p className="text-muted-foreground text-lg mb-10">
              Enter your monthly net income to calculate your financial health score.
            </p>
            <Button 
              size="lg" 
              onClick={handleOpenIncomeModal}
              className="w-full h-14 text-lg font-semibold rounded-2xl transition-all"
            >
              Add Monthly Income
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-md w-full text-center animate-fade-in">
            <div className="mb-8 flex justify-center">
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center">
                <CreditCard className="w-10 h-10 text-primary" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4">Step 2: A Subscription</h2>
            <p className="text-muted-foreground text-lg mb-10">
              Add at least one subscription (Netflix, Spotify, etc.) to see your first insight.
            </p>
            <Button 
              size="lg" 
              onClick={handleOpenSubModal}
              className="w-full h-14 text-lg font-semibold rounded-2xl transition-all"
            >
              Add First Subscription
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="max-w-lg w-full text-center animate-fade-in">
            <div className="mb-8 flex justify-center">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold mb-8">Setup Complete! 🎉</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              <div className="p-6 bg-card border rounded-2xl shadow-sm">
                <TrendingUp className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Monthly Spending</p>
                <p className="text-3xl font-bold">${wowData.monthlyTotal}</p>
              </div>
              <div className="p-6 bg-card border rounded-2xl shadow-sm">
                <PiggyBank className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Yearly Projection</p>
                <p className="text-3xl font-bold">${wowData.yearlyTotal}</p>
              </div>
            </div>

            <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl mb-10">
              {Number(wowData.potentialSavings) > 0 ? (
                <>
                  <p className="text-lg font-medium text-primary mb-1">
                    Potential Savings Found! 💰
                  </p>
                  <p className="text-muted-foreground text-sm px-4">
                    You could save up to <span className="font-bold text-foreground">${wowData.potentialSavings}/month</span> (${wowData.yearlySavings}/year) by optimizing your plans.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium text-green-600 mb-1">
                    Excellent Management! 🏆
                  </p>
                  <p className="text-muted-foreground text-sm px-4">
                    You're managing your subscriptions well. We'll alert you if any costs increase.
                  </p>
                </>
              )}
            </div>

            <Button 
              size="lg" 
              onClick={finishOnboarding}
              className="w-full ruby-gradient h-14 text-lg font-semibold rounded-2xl shadow-ruby hover:shadow-ruby-strong transition-all"
            >
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>

      <AddTransactionModal
        open={isIncomeModalOpen}
        onOpenChange={setIsIncomeModalOpen}
        onCreateTransaction={async (data) => {
          try {
            await createTransaction(data);
            toast.success("Income added successfully!");
            return { success: true };
          } catch (e) {
            toast.error("Failed to add income");
            return { success: false };
          }
        }}
      />

      <AddSubscriptionModal
        open={isSubModalOpen}
        onOpenChange={setIsSubModalOpen}
      />
    </div>
  );
};

export default Onboarding;
