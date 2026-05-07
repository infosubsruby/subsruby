import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  Compass,
  CreditCard,
  Goal,
  PiggyBank,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { OnboardingChoiceChip } from "@/components/onboarding/OnboardingChoiceChip";
import { useOnboardingFoundation } from "@/hooks/useOnboardingFoundation";
import {
  ACCOUNT_TYPE_OPTIONS,
  DEFAULT_CATEGORIES,
  MAIN_GOAL_OPTIONS,
  RUBY_FOCUS_OPTIONS,
  type AccountType,
  type AssistantFocus,
  type FoundationCategory,
  type MainFinancialGoal,
} from "@/lib/onboardingSettingsFoundation";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type OnboardingStep =
  | "welcome"
  | "personal_finance"
  | "account_setup"
  | "spending_categories"
  | "budget_setup"
  | "goals_setup"
  | "ruby_ai_personalization"
  | "completion";

const ONBOARDING_STEPS: { key: OnboardingStep; title: string }[] = [
  { key: "welcome", title: "Welcome to Ruby" },
  { key: "personal_finance", title: "Personal Finance Setup" },
  { key: "account_setup", title: "Account Setup" },
  { key: "spending_categories", title: "Spending Categories" },
  { key: "budget_setup", title: "Budget Setup" },
  { key: "goals_setup", title: "Goals Setup" },
  { key: "ruby_ai_personalization", title: "Ruby AI Personalization" },
  { key: "completion", title: "Setup Complete" },
];

const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "TRY", "CAD", "AUD", "JPY"];
const REGION_OPTIONS = [
  "United States",
  "United Kingdom",
  "Turkey",
  "Germany",
  "France",
  "Canada",
  "Australia",
  "Japan",
];
const LOCALE_OPTIONS = ["en-US", "en-GB", "tr-TR", "de-DE", "fr-FR"];
const BUDGET_METHOD_OPTIONS = [
  { value: "50_30_20", label: "50/30/20 Method" },
  { value: "zero_based", label: "Zero-Based Budgeting" },
  { value: "envelope", label: "Envelope Method" },
  { value: "custom", label: "Custom Method" },
];
const SAFE_SPEND_OPTIONS = [
  { value: "conservative", label: "Conservative" },
  { value: "balanced", label: "Balanced" },
  { value: "aggressive", label: "Aggressive" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { setDefaultCurrency } = useSettings();
  const { state, patch } = useOnboardingFoundation();
  const [stepIndex, setStepIndex] = useState(0);

  const currentStep = ONBOARDING_STEPS[stepIndex];

  useEffect(() => {
    if (profile?.has_completed_onboarding === true) {
      navigate("/overview", { replace: true });
    }
  }, [navigate, profile?.has_completed_onboarding]);

  const toggleItem = <T extends string>(value: T, list: T[]): T[] => {
    if (list.includes(value)) return list.filter((item) => item !== value);
    return [...list, value];
  };

  const recommendedAction = useMemo(() => {
    if (state.mainFinancialGoal === "emergency_fund") {
      return `Set an automatic weekly transfer of ${Math.max(15, Math.round(state.monthlySavingsTarget / 4))} ${state.preferredCurrency} to your emergency fund.`;
    }
    if (state.rubyFocus.includes("reducing_subscriptions")) {
      return "Review recurring charges in Subscriptions and cancel one low-value service this week.";
    }
    return "Open Budget Planner and confirm category limits for this month to stay on track.";
  }, [state.mainFinancialGoal, state.monthlySavingsTarget, state.preferredCurrency, state.rubyFocus]);

  const finishOnboarding = async () => {
    patch({ onboardingCompletedAt: new Date().toISOString() });
    setDefaultCurrency(state.preferredCurrency);
    if (user?.id) {
      localStorage.setItem(`hasCompletedOnboarding:${user.id}`, "true");
      await supabase
        .from("profiles")
        .update({
          has_completed_onboarding: true,
          default_currency: state.preferredCurrency,
          first_name: profile?.first_name ?? "Ruby User",
        })
        .eq("id", user.id);
    }
    toast.success("Onboarding completed. Ruby AI is ready.");
    navigate("/overview");
  };

  const goNext = () => setStepIndex((prev) => Math.min(ONBOARDING_STEPS.length - 1, prev + 1));
  const goBack = () => setStepIndex((prev) => Math.max(0, prev - 1));
  const goSkip = () => goNext();

  return (
    <div className="min-h-screen bg-[#07090d] px-4 py-8 text-zinc-100">
      <div className="mx-auto w-full max-w-5xl">
        <div className="grid gap-4 lg:grid-cols-12">
          <aside className="lg:col-span-4">
            <div className="sticky top-8 space-y-3">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-red-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Ruby Onboarding
                </div>
                <h1 className="text-xl font-semibold tracking-tight">Your AI financial operating system</h1>
                <p className="mt-2 text-sm text-zinc-400">
                  Simple setup now, intelligent guidance across Overview, Financial Health, Budget Planner, Goals, Ruby AI, and Insights.
                </p>
              </div>
              <OnboardingProgress
                currentStep={stepIndex + 1}
                totalSteps={ONBOARDING_STEPS.length}
                stepTitle={currentStep.title}
              />
            </div>
          </aside>

          <section className="lg:col-span-8">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-6">
              <div className="pointer-events-none absolute -right-20 top-[-20px] h-40 w-40 rounded-full bg-red-600/12 blur-3xl" />

              {currentStep.key === "welcome" ? (
                <div className="space-y-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/20 text-red-300">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold">Welcome to Ruby</h2>
                    <p className="mt-2 text-sm text-zinc-400">
                      Ruby helps you understand money clearly, improve habits, and plan smarter with AI insights tailored to your goals.
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
                    You will complete a quick setup to power your Overview, Financial Health Score, Budget Planner, Predictions, and Ruby AI recommendations.
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={goNext} className="gap-2">
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : null}

              {currentStep.key === "personal_finance" ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Personal Finance Setup</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Preferred Currency</Label>
                      <Select value={state.preferredCurrency} onValueChange={(value) => patch({ preferredCurrency: value })}>
                        <SelectTrigger className="border-white/12 bg-black/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CURRENCY_OPTIONS.map((currency) => (
                            <SelectItem key={currency} value={currency}>
                              {currency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Country / Region</Label>
                      <Select value={state.countryOrRegion} onValueChange={(value) => patch({ countryOrRegion: value })}>
                        <SelectTrigger className="border-white/12 bg-black/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {REGION_OPTIONS.map((region) => (
                            <SelectItem key={region} value={region}>
                              {region}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Monthly Income</Label>
                      <Input
                        type="number"
                        min={0}
                        value={state.monthlyIncome}
                        onChange={(event) => patch({ monthlyIncome: Number(event.target.value) || 0 })}
                        className="border-white/12 bg-black/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Main Financial Goal</Label>
                      <Select
                        value={state.mainFinancialGoal}
                        onValueChange={(value) => patch({ mainFinancialGoal: value as MainFinancialGoal })}
                      >
                        <SelectTrigger className="border-white/12 bg-black/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MAIN_GOAL_OPTIONS.map((goal) => (
                            <SelectItem key={goal.value} value={goal.value}>
                              {goal.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {state.mainFinancialGoal === "custom" ? (
                    <div className="space-y-2">
                      <Label>Custom Goal Name</Label>
                      <Input
                        value={state.customGoalName}
                        onChange={(event) => patch({ customGoalName: event.target.value })}
                        placeholder="Example: Build a 3-month runway"
                        className="border-white/12 bg-black/20"
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}

              {currentStep.key === "account_setup" ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Account Setup</h2>
                  <p className="text-sm text-zinc-400">Choose account types to start. You can add real bank sync later.</p>
                  <div className="flex flex-wrap gap-2">
                    {ACCOUNT_TYPE_OPTIONS.map((option) => (
                      <OnboardingChoiceChip
                        key={option.value}
                        label={option.label}
                        selected={state.accountSetup.includes(option.value as AccountType)}
                        onClick={() => patch({ accountSetup: toggleItem(option.value as AccountType, state.accountSetup) })}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {currentStep.key === "spending_categories" ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Spending Categories</h2>
                  <p className="text-sm text-zinc-400">Select categories Ruby should prioritize in planning and insights.</p>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_CATEGORIES.map((category) => (
                      <OnboardingChoiceChip
                        key={category}
                        label={category}
                        selected={state.selectedCategories.includes(category)}
                        onClick={() =>
                          patch({
                            selectedCategories: toggleItem(category as FoundationCategory, state.selectedCategories),
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {currentStep.key === "budget_setup" ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Budget Setup</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Monthly Spending Limit</Label>
                      <Input
                        type="number"
                        min={0}
                        value={state.monthlySpendingLimit}
                        onChange={(event) => patch({ monthlySpendingLimit: Number(event.target.value) || 0 })}
                        className="border-white/12 bg-black/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Savings Target</Label>
                      <Input
                        type="number"
                        min={0}
                        value={state.monthlySavingsTarget}
                        onChange={(event) => patch({ monthlySavingsTarget: Number(event.target.value) || 0 })}
                        className="border-white/12 bg-black/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Safe-to-spend Preference</Label>
                    <Select
                      value={state.safeToSpendPreference}
                      onValueChange={(value) =>
                        patch({ safeToSpendPreference: value as "conservative" | "balanced" | "aggressive" })
                      }
                    >
                      <SelectTrigger className="border-white/12 bg-black/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SAFE_SPEND_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : null}

              {currentStep.key === "goals_setup" ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Goals Setup</h2>
                  <p className="text-sm text-zinc-400">Create your first goal focus and write a short target note if needed.</p>
                  <div className="flex flex-wrap gap-2">
                    {MAIN_GOAL_OPTIONS.map((goal) => (
                      <OnboardingChoiceChip
                        key={goal.value}
                        label={goal.label}
                        selected={state.mainFinancialGoal === goal.value}
                        onClick={() => patch({ mainFinancialGoal: goal.value as MainFinancialGoal })}
                      />
                    ))}
                  </div>
                  {state.mainFinancialGoal === "custom" ? (
                    <div className="space-y-2">
                      <Label>Custom Goal</Label>
                      <Textarea
                        value={state.customGoalName}
                        onChange={(event) => patch({ customGoalName: event.target.value })}
                        placeholder="Describe your custom goal..."
                        className="border-white/12 bg-black/20"
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}

              {currentStep.key === "ruby_ai_personalization" ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Ruby AI Personalization</h2>
                  <p className="text-sm text-zinc-400">Choose what Ruby AI should focus on first.</p>
                  <div className="flex flex-wrap gap-2">
                    {RUBY_FOCUS_OPTIONS.map((focus) => (
                      <OnboardingChoiceChip
                        key={focus.value}
                        label={focus.label}
                        selected={state.rubyFocus.includes(focus.value as AssistantFocus)}
                        onClick={() =>
                          patch({
                            rubyFocus: toggleItem(focus.value as AssistantFocus, state.rubyFocus),
                          })
                        }
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {currentStep.key === "completion" ? (
                <div className="space-y-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold">Setup Complete</h2>
                    <p className="mt-1 text-sm text-zinc-400">
                      Ruby understands your profile and is ready with a guided plan across budget, goals, and financial health.
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <article className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <p className="text-xs text-zinc-500">Preferred Currency</p>
                      <p className="mt-1 text-sm font-medium text-zinc-100">{state.preferredCurrency}</p>
                    </article>
                    <article className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <p className="text-xs text-zinc-500">Monthly Income</p>
                      <p className="mt-1 text-sm font-medium text-zinc-100">
                        {state.monthlyIncome.toLocaleString()} {state.preferredCurrency}
                      </p>
                    </article>
                  </div>
                  <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                    First recommended action: {recommendedAction}
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => void finishOnboarding()} className="gap-2">
                      Go To Overview
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : null}

              {currentStep.key !== "welcome" && currentStep.key !== "completion" ? (
                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                  <Button variant="ghost" onClick={goBack} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <div className="flex gap-2">
                    {currentStep.key === "account_setup" || currentStep.key === "spending_categories" ? (
                      <Button variant="outline" onClick={goSkip}>
                        Skip
                      </Button>
                    ) : null}
                    <Button onClick={goNext} className="gap-2">
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <section className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center gap-2 text-red-200">
              <CircleDollarSign className="h-4 w-4" />
              <p className="text-xs uppercase tracking-[0.14em]">Budget Ready</p>
            </div>
            <p className="text-sm text-zinc-300">Setup data feeds Budget Planner and Safe-to-Spend recommendations.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center gap-2 text-red-200">
              <Goal className="h-4 w-4" />
              <p className="text-xs uppercase tracking-[0.14em]">Goals Guided</p>
            </div>
            <p className="text-sm text-zinc-300">Ruby AI uses goal context to suggest high-impact monthly actions.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-2 flex items-center gap-2 text-red-200">
              <Compass className="h-4 w-4" />
              <p className="text-xs uppercase tracking-[0.14em]">Insights Primed</p>
            </div>
            <p className="text-sm text-zinc-300">Predictions and AI Insights start from your selected habits and preferences.</p>
          </article>
        </section>
      </div>
    </div>
  );
};

export default Onboarding;
