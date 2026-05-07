export const ONBOARDING_FOUNDATION_STORAGE_KEY = "subsruby-onboarding-foundation-v1";

export type AccountType = "manual_wallet" | "bank_later" | "cash_wallet" | "savings_account" | "credit_card";
export type MainFinancialGoal =
  | "emergency_fund"
  | "travel_fund"
  | "new_laptop"
  | "tuition"
  | "investment_starter"
  | "custom";
export type AssistantFocus =
  | "saving_money"
  | "reducing_subscriptions"
  | "controlling_spending"
  | "reaching_goals"
  | "budgeting_better"
  | "student_finance_mode";
export type BudgetMethod = "envelope" | "50_30_20" | "zero_based" | "custom";
export type InsightFrequency = "daily" | "weekly" | "monthly";
export type RiskSensitivity = "low" | "medium" | "high";
export type SafeSpendPreference = "conservative" | "balanced" | "aggressive";
export type AppTheme = "dark" | "system";
export type AccentColor = "ruby" | "crimson" | "violet" | "emerald";

export type FoundationCategory =
  | "Food & Dining"
  | "Transportation"
  | "Shopping"
  | "Subscriptions"
  | "Housing"
  | "Entertainment"
  | "Education"
  | "Health"
  | "Savings";

export type OnboardingFoundationState = {
  preferredCurrency: string;
  countryOrRegion: string;
  monthlyIncome: number;
  mainFinancialGoal: MainFinancialGoal;
  customGoalName: string;
  accountSetup: AccountType[];
  selectedCategories: FoundationCategory[];
  monthlySpendingLimit: number;
  monthlySavingsTarget: number;
  safeToSpendPreference: SafeSpendPreference;
  rubyFocus: AssistantFocus[];
  locale: string;
  defaultBudgetMethod: BudgetMethod;
  insightFrequency: InsightFrequency;
  riskSensitivity: RiskSensitivity;
  studentMode: boolean;
  notifications: {
    push: boolean;
    email: boolean;
    weeklyDigest: boolean;
  };
  appPreferences: {
    theme: AppTheme;
    accentColor: AccentColor;
    compactMode: boolean;
    animations: boolean;
  };
  aiCategorizationAuto: boolean;
  monthlyReportPdfPreference: boolean;
  onboardingCompletedAt: string | null;
};

export const DEFAULT_CATEGORIES: FoundationCategory[] = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Subscriptions",
  "Housing",
  "Entertainment",
  "Education",
  "Health",
  "Savings",
];

export const MAIN_GOAL_OPTIONS: { value: MainFinancialGoal; label: string }[] = [
  { value: "emergency_fund", label: "Emergency Fund" },
  { value: "travel_fund", label: "Travel Fund" },
  { value: "new_laptop", label: "New Laptop" },
  { value: "tuition", label: "Tuition" },
  { value: "investment_starter", label: "Investment Starter" },
  { value: "custom", label: "Custom Goal" },
];

export const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: "manual_wallet", label: "Add wallet manually" },
  { value: "bank_later", label: "Add bank account later" },
  { value: "cash_wallet", label: "Cash wallet" },
  { value: "savings_account", label: "Savings account" },
  { value: "credit_card", label: "Credit card" },
];

export const RUBY_FOCUS_OPTIONS: { value: AssistantFocus; label: string }[] = [
  { value: "saving_money", label: "Saving money" },
  { value: "reducing_subscriptions", label: "Reducing subscriptions" },
  { value: "controlling_spending", label: "Controlling spending" },
  { value: "reaching_goals", label: "Reaching goals" },
  { value: "budgeting_better", label: "Budgeting better" },
  { value: "student_finance_mode", label: "Student finance mode" },
];

export const DEFAULT_ONBOARDING_FOUNDATION_STATE: OnboardingFoundationState = {
  preferredCurrency: "USD",
  countryOrRegion: "United States",
  monthlyIncome: 4200,
  mainFinancialGoal: "emergency_fund",
  customGoalName: "",
  accountSetup: ["manual_wallet", "cash_wallet"],
  selectedCategories: [...DEFAULT_CATEGORIES],
  monthlySpendingLimit: 2900,
  monthlySavingsTarget: 650,
  safeToSpendPreference: "balanced",
  rubyFocus: ["saving_money", "budgeting_better"],
  locale: "en-US",
  defaultBudgetMethod: "50_30_20",
  insightFrequency: "weekly",
  riskSensitivity: "medium",
  studentMode: false,
  notifications: {
    push: true,
    email: true,
    weeklyDigest: true,
  },
  appPreferences: {
    theme: "dark",
    accentColor: "ruby",
    compactMode: false,
    animations: true,
  },
  aiCategorizationAuto: true,
  monthlyReportPdfPreference: false,
  onboardingCompletedAt: null,
};

type PartialStored = Partial<OnboardingFoundationState>;

const sanitizeStringArray = <T extends string>(value: unknown, fallback: T[]): T[] => {
  if (!Array.isArray(value)) return fallback;
  const onlyStrings = value.filter((item): item is T => typeof item === "string");
  return onlyStrings.length > 0 ? onlyStrings : fallback;
};

export const readOnboardingFoundationState = (): OnboardingFoundationState => {
  const raw = localStorage.getItem(ONBOARDING_FOUNDATION_STORAGE_KEY);
  if (!raw) return DEFAULT_ONBOARDING_FOUNDATION_STATE;

  try {
    const parsed = JSON.parse(raw) as PartialStored;
    return {
      ...DEFAULT_ONBOARDING_FOUNDATION_STATE,
      ...parsed,
      monthlyIncome:
        typeof parsed.monthlyIncome === "number" && Number.isFinite(parsed.monthlyIncome)
          ? parsed.monthlyIncome
          : DEFAULT_ONBOARDING_FOUNDATION_STATE.monthlyIncome,
      monthlySpendingLimit:
        typeof parsed.monthlySpendingLimit === "number" && Number.isFinite(parsed.monthlySpendingLimit)
          ? parsed.monthlySpendingLimit
          : DEFAULT_ONBOARDING_FOUNDATION_STATE.monthlySpendingLimit,
      monthlySavingsTarget:
        typeof parsed.monthlySavingsTarget === "number" && Number.isFinite(parsed.monthlySavingsTarget)
          ? parsed.monthlySavingsTarget
          : DEFAULT_ONBOARDING_FOUNDATION_STATE.monthlySavingsTarget,
      accountSetup: sanitizeStringArray<AccountType>(
        parsed.accountSetup,
        DEFAULT_ONBOARDING_FOUNDATION_STATE.accountSetup
      ),
      selectedCategories: sanitizeStringArray<FoundationCategory>(
        parsed.selectedCategories,
        DEFAULT_ONBOARDING_FOUNDATION_STATE.selectedCategories
      ),
      rubyFocus: sanitizeStringArray<AssistantFocus>(parsed.rubyFocus, DEFAULT_ONBOARDING_FOUNDATION_STATE.rubyFocus),
      notifications: {
        ...DEFAULT_ONBOARDING_FOUNDATION_STATE.notifications,
        ...(parsed.notifications ?? {}),
      },
      appPreferences: {
        ...DEFAULT_ONBOARDING_FOUNDATION_STATE.appPreferences,
        ...(parsed.appPreferences ?? {}),
      },
      onboardingCompletedAt:
        typeof parsed.onboardingCompletedAt === "string" || parsed.onboardingCompletedAt === null
          ? parsed.onboardingCompletedAt
          : null,
    };
  } catch {
    return DEFAULT_ONBOARDING_FOUNDATION_STATE;
  }
};

export const writeOnboardingFoundationState = (state: OnboardingFoundationState): void => {
  localStorage.setItem(ONBOARDING_FOUNDATION_STORAGE_KEY, JSON.stringify(state));
};
