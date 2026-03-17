import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useFinance } from "@/hooks/useFinance";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { Sparkles, Wallet, CreditCard, ArrowRight, CheckCircle2, PiggyBank, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const { createTransaction } = useFinance();
  const { createSubscription } = useSubscriptions();

  // Step 2 State: Income
  const [income, setIncome] = useState("");
  
  // Step 3 State: Subscription
  const [subName, setSubName] = useState("");
  const [subPrice, setSubPrice] = useState("");
  const [subCycle, setSubCycle] = useState<"monthly" | "yearly">("monthly");

  const handleCompleteStep1 = () => setStep(2);

  const handleCompleteStep2 = async () => {
    const amount = Number(income);
    if (!income || isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid monthly income");
      return;
    }

    try {
      await createTransaction({
        amount,
        type: "income",
        category: "Salary",
        date: new Date().toISOString().split('T')[0],
        description: "Initial income from onboarding"
      });
      setStep(3);
    } catch (error) {
      console.error("Error saving income:", error);
      toast.error("Failed to save income");
    }
  };

  const handleCompleteStep3 = async () => {
    const price = Number(subPrice);
    if (!subName || !subPrice || isNaN(price) || price <= 0) {
      toast.error("Please enter valid subscription details");
      return;
    }

    try {
      await createSubscription({
        name: subName,
        price,
        billing_cycle: subCycle,
        currency: "USD", // Default to USD for onboarding simplicity
        category: "Subscriptions",
        start_date: new Date().toISOString().split('T')[0],
        color: "#E11D48" // Default Ruby color
      });
      setStep(4);
    } catch (error) {
      console.error("Error saving subscription:", error);
      toast.error("Failed to save subscription");
    }
  };

  const finishOnboarding = () => {
    localStorage.setItem("hasCompletedOnboarding", "true");
    navigate("/control");
  };

  // WOW Screen Calculations
  const wowData = useMemo(() => {
    const price = Number(subPrice) || 0;
    const monthlyTotal = subCycle === "yearly" ? price / 12 : price;
    const yearlyTotal = monthlyTotal * 12;
    
    // Simple logic for onboarding: if price > 50, suggest some savings
    const potentialSavings = monthlyTotal > 50 ? monthlyTotal * 0.2 : 0;
    
    return {
      monthlyTotal: monthlyTotal.toFixed(2),
      yearlyTotal: yearlyTotal.toFixed(2),
      potentialSavings: potentialSavings.toFixed(2),
      yearlySavings: (potentialSavings * 12).toFixed(2)
    };
  }, [subPrice, subCycle]);

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
          <div className="max-w-md w-full animate-fade-in">
            <Card className="p-8 rounded-3xl border-2 shadow-xl">
              <div className="mb-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center shrink-0">
                  <Wallet className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Step 1: Your Income</h2>
                  <p className="text-sm text-muted-foreground text-left">We'll use this to calculate your health score.</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2 text-left">
                  <Label htmlFor="income">Monthly Net Income ($)</Label>
                  <Input
                    id="income"
                    type="number"
                    placeholder="e.g. 5000"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    className="h-12 rounded-xl text-lg"
                  />
                </div>
                <Button 
                  onClick={handleCompleteStep2}
                  className="w-full h-12 rounded-xl text-lg font-medium"
                >
                  Continue
                </Button>
              </div>
            </Card>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-md w-full animate-fade-in">
            <Card className="p-8 rounded-3xl border-2 shadow-xl">
              <div className="mb-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Step 2: A Subscription</h2>
                  <p className="text-sm text-muted-foreground text-left">Add one to see your first insight.</p>
                </div>
              </div>
              <div className="space-y-5 text-left">
                <div className="space-y-2">
                  <Label htmlFor="name">Service Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Netflix"
                    value={subName}
                    onChange={(e) => setSubName(e.target.value)}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="15.99"
                      value={subPrice}
                      onChange={(e) => setSubPrice(e.target.value)}
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cycle">Billing</Label>
                    <Select value={subCycle} onValueChange={(v: any) => setSubCycle(v)}>
                      <SelectTrigger className="h-12 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button 
                  onClick={handleCompleteStep3}
                  className="w-full h-12 rounded-xl text-lg font-medium mt-4"
                >
                  Show My Savings
                </Button>
              </div>
            </Card>
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
                  <p className="text-muted-foreground">
                    You could save up to <span className="font-bold text-foreground">${wowData.potentialSavings}/month</span> (${wowData.yearlySavings}/year) by optimizing your plans.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium text-green-600 mb-1">
                    Excellent Management! 🏆
                  </p>
                  <p className="text-muted-foreground">
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
    </div>
  );
};

export default Onboarding;
