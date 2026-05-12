import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { useOnboardingFoundation } from "@/hooks/useOnboardingFoundation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { currencies } from "@/data/subscriptionPresets";
import {
  Bell,
  BrainCircuit,
  Clock,
  Database,
  FileText,
  Globe,
  Loader2,
  LogOut,
  Palette,
  Shield,
  Sparkles,
  Trash2,
  User,
  Wallet,
} from "lucide-react";
import { SettingsSectionCard } from "@/components/settings/SettingsSectionCard";
import { SettingsToggleRow } from "@/components/settings/SettingsToggleRow";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { PRICING_PLANS } from "@/lib/monetization/plans";
import { useFinance } from "@/hooks/useFinance";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { toast } from "sonner";
import { getDataMode } from "@/lib/config/dataMode";
import { getOrCreateAppSettings, updateAppSettings } from "@/services/core/appSettingsService";

const Settings = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading, signOut, updateProfile, authProfile, isMockMode } = useAuth();
  const { defaultCurrency, setDefaultCurrency, notifications, setNotificationSetting } = useSettings();
  const { state, patch } = useOnboardingFoundation();
  const { activePlan, getUsageStatus, hasUnlimitedAccess, accessTier } = usePlanAccess();
  const { transactions, budgets } = useFinance();
  const { subscriptions } = useSubscriptions();
  const [activeSection, setActiveSection] = useState<
    "plan" | "profile" | "financial" | "ruby" | "accounts" | "categories" | "reports" | "app" | "privacy"
  >("profile");
  const dataMode = getDataMode();
  const appSettingsEnabled = dataMode === "supabase" && !isMockMode;
  const fullName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || user?.fullName || "Ruby User";
  const [editableFullName, setEditableFullName] = useState(fullName);
  const [appSettingsLoading, setAppSettingsLoading] = useState(false);
  const [appSettingsSaving, setAppSettingsSaving] = useState(false);
  const [appSettingsError, setAppSettingsError] = useState<string | null>(null);

  useEffect(() => {
    setEditableFullName(fullName);
  }, [fullName]);

  useEffect(() => {
    const currentUserId = user?.id ?? null;
    if (!currentUserId) return;
    if (isMockMode) return;
    if (dataMode !== "supabase") return;

    let cancelled = false;
    setAppSettingsLoading(true);
    setAppSettingsError(null);

    void getOrCreateAppSettings(currentUserId).then((result) => {
      if (cancelled) return;
      if (result.error) {
        setAppSettingsError(result.error);
        setAppSettingsLoading(false);
        return;
      }
      const settings = result.data;
      patch({
        insightFrequency: settings.insightFrequency,
        riskSensitivity: settings.riskSensitivity,
        studentMode: settings.studentMode,
        appPreferences: {
          theme: settings.theme,
          accentColor: settings.accentColor,
          compactMode: settings.compactMode,
          animations: settings.animationsEnabled,
        },
      });
      setAppSettingsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id, dataMode, isMockMode, patch]);

  if (!authLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = fullName
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sectionItems = [
    { id: "plan", label: "Plan & Billing", icon: Sparkles },
    { id: "profile", label: "Profile", icon: User },
    { id: "financial", label: "Financial Preferences", icon: Wallet },
    { id: "ruby", label: "Ruby AI Settings", icon: BrainCircuit },
    { id: "accounts", label: "Accounts & Wallets", icon: Globe },
    { id: "categories", label: "Categories", icon: Sparkles },
    { id: "reports", label: "Data & Reports", icon: Database },
    { id: "app", label: "App Preferences", icon: Palette },
    { id: "privacy", label: "Privacy & Security", icon: Shield },
  ] as const;

  const riskySensitivity =
    state.riskSensitivity === "high" ? "High" : state.riskSensitivity === "low" ? "Low" : "Medium";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const handleSaveProfile = async () => {
    await updateProfile({
      fullName: editableFullName.trim() || "Ruby User",
      preferredCurrency: defaultCurrency,
      monthlyIncome: state.monthlyIncome,
      savingsTarget: state.monthlySavingsTarget,
      rubyAIFocus: state.rubyFocus[0] ?? null,
    });
    toast.success("Profile preferences saved.");
  };

  const persistAppSetting = async (
    updates: Partial<{
      theme: "dark" | "system";
      accentColor: "ruby" | "crimson" | "violet" | "emerald";
      compactMode: boolean;
      animationsEnabled: boolean;
      insightFrequency: "daily" | "weekly" | "monthly";
      riskSensitivity: "low" | "medium" | "high";
      studentMode: boolean;
    }>
  ) => {
    const currentUserId = user?.id ?? null;
    if (!currentUserId) return;
    if (isMockMode) return;
    if (dataMode !== "supabase") return;

    setAppSettingsSaving(true);
    setAppSettingsError(null);
    const result = await updateAppSettings(currentUserId, updates);
    setAppSettingsSaving(false);

    if (result.error) {
      setAppSettingsError(result.error);
      toast.error("Could not save app settings.");
      return;
    }
  };

  const planDefinition = PRICING_PLANS.find((plan) => plan.id === activePlan);
  const transactionUsage = getUsageStatus("transactions_per_month", transactions.length);
  const subscriptionUsage = getUsageStatus("subscriptions", subscriptions.length);
  const goalsUsage = getUsageStatus("goals", budgets.length);
  const rubyPromptUsage = getUsageStatus("ruby_ai_prompts_per_month", 8);
  const accessLabel = accessTier === "admin" ? "Admin" : accessTier === "lifetime" ? "Lifetime" : activePlan === "pro" ? "Pro" : "Free";

  const isSection = (id: (typeof sectionItems)[number]["id"]) => activeSection === id;

  return (
    <div className="premium-page">
      <section className="premium-section rounded-[30px] p-6 sm:p-7">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">Settings Foundation</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Configure your profile, financial defaults, Ruby AI behavior, app preferences, and reporting controls.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-zinc-400">
            Data Mode: {dataMode === "supabase" ? "Supabase Connected" : "Demo Mode"}
          </p>
          {appSettingsEnabled ? (
            <p className="inline-flex rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-zinc-400">
              App Settings: {appSettingsLoading ? "Loading" : appSettingsError ? "Error" : appSettingsSaving ? "Saving" : "Synced"}
            </p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-12">
        <aside className="lg:col-span-4 xl:col-span-3">
          <div className="space-y-1 rounded-2xl border border-white/10 bg-white/[0.03] p-2 lg:sticky lg:top-20">
            {sectionItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition sm:text-sm ${
                    isActive
                      ? "border-red-500/45 bg-red-500/12 text-red-100"
                      : "border-transparent text-zinc-300 hover:border-white/10 hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </aside>

        <div className="space-y-4 lg:col-span-8 xl:col-span-9">
          {isSection("plan") ? (
            <SettingsSectionCard
              title="Plan & Billing"
              description="Current plan status, usage visibility, and billing placeholders."
              icon={<Sparkles className="h-5 w-5" />}
            >
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs text-zinc-500">Current Plan</p>
                <p className="mt-1 text-lg font-semibold text-zinc-100">{planDefinition?.name ?? "Free"}</p>
                <p className="mt-1 text-xs text-zinc-400">{planDefinition?.description}</p>
                <p className="mt-2 text-xs text-zinc-400">Account type: {accessLabel}{hasUnlimitedAccess ? " (Unlimited)" : ""}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <article className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-xs text-zinc-500">Transactions</p>
                  <p className="mt-1 text-sm text-zinc-100">{transactionUsage.label}</p>
                </article>
                <article className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-xs text-zinc-500">Subscriptions</p>
                  <p className="mt-1 text-sm text-zinc-100">{subscriptionUsage.label}</p>
                </article>
                <article className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-xs text-zinc-500">Goals</p>
                  <p className="mt-1 text-sm text-zinc-100">{goalsUsage.label}</p>
                </article>
                <article className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-xs text-zinc-500">Ruby AI Prompts</p>
                  <p className="mt-1 text-sm text-zinc-100">{rubyPromptUsage.label}</p>
                </article>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {!hasUnlimitedAccess ? (
                  <Button onClick={() => navigate("/upgrade")} className="justify-start">
                    Upgrade to Pro
                  </Button>
                ) : (
                  <Button variant="outline" className="justify-start" disabled>
                    Unlimited access enabled
                  </Button>
                )}
                {!hasUnlimitedAccess ? (
                  <Button variant="outline" className="justify-start">
                    Manage Subscription (Placeholder)
                  </Button>
                ) : null}
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs text-zinc-500">Billing</p>
                <p className="mt-1 text-sm text-zinc-300">
                  Billing and payment details are placeholder-safe for now and prepared for future provider integration.
                </p>
              </div>
            </SettingsSectionCard>
          ) : null}

          {isSection("profile") ? (
            <SettingsSectionCard
              title="Profile"
              description="Identity and account context used by Ruby AI and reports."
              icon={<User className="h-5 w-5" />}
            >
              <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-black/20 p-3">
                <Avatar className="h-16 w-16 border border-white/10">
                  <AvatarImage src={profile?.avatar_url ?? undefined} alt={fullName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-[220px] flex-1">
                  <Label>Name</Label>
                  <Input
                    value={editableFullName}
                    onChange={(event) => setEditableFullName(event.target.value)}
                    className="mt-1 border-white/12 bg-black/20"
                  />
                </div>
                <div className="min-w-[220px] flex-1">
                  <Label>Email</Label>
                  <Input value={user?.email ?? ""} readOnly className="mt-1 border-white/12 bg-black/20" />
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-zinc-400">
                Your financial data stays private to your account.
              </div>
              <Button variant="outline" onClick={() => void handleSaveProfile()}>
                Save Profile Changes
              </Button>
            </SettingsSectionCard>
          ) : null}

          {isSection("financial") ? (
            <SettingsSectionCard
              title="Financial Preferences"
              description="Defaults for currency, locale, and planning baseline."
              icon={<Wallet className="h-5 w-5" />}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={defaultCurrency}
                    onValueChange={(value) => {
                      setDefaultCurrency(value);
                      patch({ preferredCurrency: value });
                    }}
                  >
                    <SelectTrigger className="border-white/12 bg-black/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Locale</Label>
                  <Select value={state.locale} onValueChange={(value) => patch({ locale: value })}>
                    <SelectTrigger className="border-white/12 bg-black/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["en-US", "en-GB", "tr-TR", "de-DE", "fr-FR"].map((locale) => (
                        <SelectItem key={locale} value={locale}>
                          {locale}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Monthly Income</Label>
                  <Input
                    type="number"
                    min={0}
                    value={authProfile?.monthlyIncome ?? state.monthlyIncome}
                    onChange={(event) => patch({ monthlyIncome: Number(event.target.value) || 0 })}
                    className="border-white/12 bg-black/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Savings Target</Label>
                  <Input
                    type="number"
                    min={0}
                    value={authProfile?.savingsTarget ?? state.monthlySavingsTarget}
                    onChange={(event) => patch({ monthlySavingsTarget: Number(event.target.value) || 0 })}
                    className="border-white/12 bg-black/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Default Budget Method</Label>
                <Select
                  value={state.defaultBudgetMethod}
                  onValueChange={(value) =>
                    patch({ defaultBudgetMethod: value as "envelope" | "50_30_20" | "zero_based" | "custom" })
                  }
                >
                  <SelectTrigger className="border-white/12 bg-black/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50_30_20">50/30/20 Method</SelectItem>
                    <SelectItem value="zero_based">Zero-Based Budgeting</SelectItem>
                    <SelectItem value="envelope">Envelope Method</SelectItem>
                    <SelectItem value="custom">Custom Method</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </SettingsSectionCard>
          ) : null}

          {isSection("ruby") ? (
            <SettingsSectionCard
              title="Ruby AI Settings"
              description="Personalize focus, frequency, and recommendation sensitivity."
              icon={<BrainCircuit className="h-5 w-5" />}
            >
              {appSettingsEnabled && appSettingsError ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-100">
                  {appSettingsError}
                </div>
              ) : null}
              <div className="space-y-2">
                <Label>Assistant Focus</Label>
                <Select
                  value={state.rubyFocus[0] ?? "saving_money"}
                  onValueChange={(value) =>
                    patch({
                      rubyFocus: [value as (typeof state.rubyFocus)[number], ...state.rubyFocus.filter((item) => item !== value)],
                    })
                  }
                >
                  <SelectTrigger className="border-white/12 bg-black/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saving_money">Saving money</SelectItem>
                    <SelectItem value="reducing_subscriptions">Reducing subscriptions</SelectItem>
                    <SelectItem value="controlling_spending">Controlling spending</SelectItem>
                    <SelectItem value="reaching_goals">Reaching goals</SelectItem>
                    <SelectItem value="budgeting_better">Budgeting better</SelectItem>
                    <SelectItem value="student_finance_mode">Student finance mode</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Insight Frequency</Label>
                  <Select
                    value={state.insightFrequency}
                    onValueChange={(value) => {
                      const next = value as "daily" | "weekly" | "monthly";
                      patch({ insightFrequency: next });
                      void persistAppSetting({ insightFrequency: next });
                    }}
                  >
                    <SelectTrigger className="border-white/12 bg-black/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Risk Sensitivity</Label>
                  <Select
                    value={state.riskSensitivity}
                    onValueChange={(value) => {
                      const next = value as "low" | "medium" | "high";
                      patch({ riskSensitivity: next });
                      void persistAppSetting({ riskSensitivity: next });
                    }}
                  >
                    <SelectTrigger className="border-white/12 bg-black/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <SettingsToggleRow
                label="Student Mode"
                description="Prioritize educational and low-volatility financial recommendations."
                checked={state.studentMode}
                disabled={appSettingsEnabled && (appSettingsLoading || appSettingsSaving)}
                onCheckedChange={(value) => {
                  patch({ studentMode: value });
                  void persistAppSetting({ studentMode: value });
                }}
                icon={<Bell className="h-4 w-4" />}
              />
              <SettingsToggleRow
                label="Push Notifications"
                description="Receive proactive budget and risk alerts."
                checked={state.notifications.push}
                onCheckedChange={(value) =>
                  patch({
                    notifications: { ...state.notifications, push: value },
                  })
                }
              />
              <SettingsToggleRow
                label="Email Alerts"
                description="Monthly digest and planning updates."
                checked={notifications.emailAlerts}
                onCheckedChange={(value) => {
                  setNotificationSetting("emailAlerts", value);
                  patch({
                    notifications: { ...state.notifications, email: value },
                  });
                }}
              />
            </SettingsSectionCard>
          ) : null}

          {isSection("accounts") ? (
            <SettingsSectionCard
              title="Accounts & Wallets"
              description="Manage connected account placeholders and manual wallet baseline."
              icon={<Globe className="h-5 w-5" />}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <article className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-sm font-medium text-zinc-100">Connected Accounts</p>
                  <p className="mt-1 text-xs text-zinc-400">Bank sync is coming soon. Your architecture is ready for secure provider integration.</p>
                </article>
                <article className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-sm font-medium text-zinc-100">Manual Wallets</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Active setup: {state.accountSetup.length} selected account types ({state.accountSetup.join(", ")}).
                  </p>
                </article>
              </div>
              <Button variant="outline" className="w-full justify-start">
                <Clock className="mr-2 h-4 w-4" />
                Bank sync placeholder
              </Button>
            </SettingsSectionCard>
          ) : null}

          {isSection("categories") ? (
            <SettingsSectionCard
              title="Categories"
              description="Control spending categories and AI categorization behavior."
              icon={<Sparkles className="h-5 w-5" />}
            >
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs text-zinc-500">Selected categories</p>
                <p className="mt-1 text-sm text-zinc-200">{state.selectedCategories.join(", ")}</p>
              </div>
              <Textarea
                value={`Default category rules:
- Prioritize recurring payments as Subscriptions
- Food delivery -> Food & Dining
- Fuel and transit -> Transportation`}
                readOnly
                className="min-h-[110px] border-white/12 bg-black/20 text-zinc-300"
              />
              <SettingsToggleRow
                label="AI Categorization Preference"
                description="Allow Ruby AI to suggest category improvements from behavior patterns."
                checked={state.aiCategorizationAuto}
                onCheckedChange={(value) => patch({ aiCategorizationAuto: value })}
              />
            </SettingsSectionCard>
          ) : null}

          {isSection("reports") ? (
            <SettingsSectionCard
              title="Data & Reports"
              description="Export controls and monthly report preferences."
              icon={<FileText className="h-5 w-5" />}
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <Button variant="outline" className="justify-start">
                  Export Data (UI)
                </Button>
                <Button variant="outline" className="justify-start">
                  PDF Report (Coming Soon)
                </Button>
              </div>
              <SettingsToggleRow
                label="Monthly Report Email"
                description="Receive monthly financial report summaries by email."
                checked={notifications.monthlyReport}
                onCheckedChange={(value) => setNotificationSetting("monthlyReport", value)}
              />
              <SettingsToggleRow
                label="PDF Report Preference"
                description="Enable PDF-ready format once export backend is connected."
                checked={state.monthlyReportPdfPreference}
                onCheckedChange={(value) => patch({ monthlyReportPdfPreference: value })}
              />
            </SettingsSectionCard>
          ) : null}

          {isSection("app") ? (
            <SettingsSectionCard
              title="App Preferences"
              description="Visual and interaction defaults for your workspace."
              icon={<Palette className="h-5 w-5" />}
            >
              {appSettingsEnabled && appSettingsError ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-100">
                  {appSettingsError}
                </div>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select
                    value={state.appPreferences.theme}
                    disabled={appSettingsEnabled && (appSettingsLoading || appSettingsSaving)}
                    onValueChange={(value) => {
                      const next = value as "dark" | "system";
                      patch({ appPreferences: { ...state.appPreferences, theme: next } });
                      void persistAppSetting({ theme: next });
                    }}
                  >
                    <SelectTrigger className="border-white/12 bg-black/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <Select
                    value={state.appPreferences.accentColor}
                    disabled={appSettingsEnabled && (appSettingsLoading || appSettingsSaving)}
                    onValueChange={(value) => {
                      const next = value as "ruby" | "crimson" | "violet" | "emerald";
                      patch({
                        appPreferences: {
                          ...state.appPreferences,
                          accentColor: next,
                        },
                      });
                      void persistAppSetting({ accentColor: next });
                    }}
                  >
                    <SelectTrigger className="border-white/12 bg-black/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ruby">Ruby</SelectItem>
                      <SelectItem value="crimson">Crimson</SelectItem>
                      <SelectItem value="violet">Violet</SelectItem>
                      <SelectItem value="emerald">Emerald</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <SettingsToggleRow
                label="Compact Mode"
                description="Use denser spacing for data-heavy workflows."
                checked={state.appPreferences.compactMode}
                disabled={appSettingsEnabled && (appSettingsLoading || appSettingsSaving)}
                onCheckedChange={(value) => {
                  patch({ appPreferences: { ...state.appPreferences, compactMode: value } });
                  void persistAppSetting({ compactMode: value });
                }}
              />
              <SettingsToggleRow
                label="Animations"
                description="Enable smooth transitions and interaction effects."
                checked={state.appPreferences.animations}
                disabled={appSettingsEnabled && (appSettingsLoading || appSettingsSaving)}
                onCheckedChange={(value) => {
                  patch({ appPreferences: { ...state.appPreferences, animations: value } });
                  void persistAppSetting({ animationsEnabled: value });
                }}
              />
            </SettingsSectionCard>
          ) : null}

          {isSection("privacy") ? (
            <SettingsSectionCard
              title="Privacy & Security"
              description="Control account privacy, safeguards, and sign-out actions."
              icon={<Shield className="h-5 w-5" />}
            >
              <article className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-sm font-medium text-zinc-100">Data privacy</p>
                <p className="mt-1 text-xs text-zinc-400">
                  Your current setup is stored locally and profile preferences sync where supported. Bank sync and destructive account deletion remain placeholder-safe until backend security workflows are connected.
                </p>
              </article>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button variant="outline" className="justify-start">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account (Placeholder)
                </Button>
                <Button onClick={() => void handleSignOut()} className="justify-start">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
              <p className="text-xs text-zinc-500">Risk sensitivity currently set to {riskySensitivity}.</p>
            </SettingsSectionCard>
          ) : null}
        </div>
      </section>
    </div>
  );
};

export default Settings;
