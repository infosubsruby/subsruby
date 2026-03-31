import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useSettings } from "@/hooks/useSettings";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { currencies } from "@/data/subscriptionPresets";
import { 
  Settings as SettingsIcon, 
  Globe, 
  Wallet, 
  Palette, 
  Bell, 
  Mail, 
  FileText, 
  Clock,
  Loader2,
  CreditCard,
  Sun,
  Moon,
  Monitor
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language, setLanguage, t, languages } = useLanguage();
  const { 
    defaultCurrency, 
    setDefaultCurrency, 
    theme, 
    setTheme,
    notifications,
    setNotificationSetting 
  } = useSettings();
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  useEffect(() => {
    const fetchAccount = async () => {
      if (!user?.id) return;
      setAccountLoading(true);
      try {
        const { data: subRow, error: subError } = await supabase
          .from("user_subscriptions")
          .select("status, current_period_end")
          .eq("user_id", user.id)
          .maybeSingle();

        if (subError) {
          console.error("Supabase Çekme Hatası:", subError);
          setSubscriptionStatus(null);
          setCurrentPeriodEnd(null);
        } else {
          const statusRaw = subRow && typeof subRow === "object" && "status" in subRow ? (subRow as { status?: unknown }).status : null;
          setSubscriptionStatus(statusRaw != null ? String(statusRaw) : null);

          const endRaw =
            subRow && typeof subRow === "object" && "current_period_end" in subRow
              ? (subRow as { current_period_end?: unknown }).current_period_end
              : null;
          setCurrentPeriodEnd(typeof endRaw === "string" ? endRaw : null);
        }
      } catch (error) {
        console.error("Supabase Çekme Hatası:", error);
        setSubscriptionStatus(null);
        setCurrentPeriodEnd(null);
      } finally {
        setAccountLoading(false);
      }
    };

    fetchAccount();
  }, [user?.id]);

  const isActive = subscriptionStatus === "active";

  const formatRenewsAt = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
  };

  const handleManageSubscription = async () => {
    if (isPortalLoading) return;
    setIsPortalLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (sessionData.session?.access_token) {
        headers.Authorization = `Bearer ${sessionData.session.access_token}`;
      }

      const response = await fetch("/api/billing/customer-portal", {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        let backendMessage: string | null = null;
        try {
          const errorData = (await response.json()) as { error?: unknown };
          backendMessage = typeof errorData?.error === "string" ? errorData.error : null;
        } catch {
          backendMessage = null;
        }
        toast.error(backendMessage || "Bilinmeyen bir hata oluştu");
        return;
      }
      const data = (await response.json()) as { url?: unknown };
      const url = typeof data?.url === "string" ? data.url : null;
      if (!url) {
        toast.error("Bilinmeyen bir hata oluştu");
        return;
      }
      window.location.href = url;
    } catch (error) {
      console.error("Customer portal error:", error);
      toast.error("Bilinmeyen bir hata oluştu");
    } finally {
      setIsPortalLoading(false);
    }
  };

  const handleStartCheckout = async () => {
    if (isCheckoutLoading) return;
    setIsCheckoutLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (sessionData.session?.access_token) {
        headers.Authorization = `Bearer ${sessionData.session.access_token}`;
      }
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers,
        body: JSON.stringify({ plan: "monthly", redirect: false }),
      });
      const data = (await response.json()) as { checkoutUrl?: unknown };
      const checkoutUrl = typeof data?.checkoutUrl === "string" ? data.checkoutUrl : null;
      if (!checkoutUrl) {
        throw new Error("Checkout URL not returned");
      }
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error(error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  // Redirect to login if not authenticated
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

  return (
    <div className="min-h-screen pb-20">
      <Navbar />
      
      <main className="pt-24 px-4">
        <div className="container mx-auto max-w-3xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold flex items-center gap-3">
              <SettingsIcon className="w-8 h-8 text-primary" />
              {t.settings.title}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t.settings.subtitle}
            </p>
          </div>

          {/* Settings Tabs */}
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-secondary">
              <TabsTrigger value="general" className="gap-2">
                <SettingsIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{t.settings.general}</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">{t.settings.notifications}</span>
              </TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general" className="space-y-6">
              <div className="glass-card rounded-xl p-6 space-y-6">
                {/* Language */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <Label className="text-base font-medium">{t.settings.language}</Label>
                      <p className="text-sm text-muted-foreground">{t.settings.languageDesc}</p>
                    </div>
                  </div>
                  <Select value={language} onValueChange={(v) => setLanguage(v as typeof language)}>
                    <SelectTrigger className="w-[180px] bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          <span className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span>{lang.nativeName}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t border-border" />

                {/* Default Currency */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center shrink-0">
                      <Wallet className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <Label className="text-base font-medium">{t.settings.currency}</Label>
                      <p className="text-sm text-muted-foreground">{t.settings.currencyDesc}</p>
                    </div>
                  </div>
                  <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
                    <SelectTrigger className="w-[180px] bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {currencies.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t border-border" />

                {/* Theme */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center shrink-0">
                      <Palette className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <Label className="text-base font-medium">{t.settings.theme}</Label>
                      <p className="text-sm text-muted-foreground">{t.settings.themeDesc}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("light")}
                      className="gap-1"
                    >
                      <Sun className="w-4 h-4" />
                      <span className="hidden sm:inline">{t.settings.lightMode}</span>
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("dark")}
                      className="gap-1"
                    >
                      <Moon className="w-4 h-4" />
                      <span className="hidden sm:inline">{t.settings.darkMode}</span>
                    </Button>
                    <Button
                      variant={theme === "system" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("system")}
                      className="gap-1"
                    >
                      <Monitor className="w-4 h-4" />
                      <span className="hidden sm:inline">{t.settings.systemMode}</span>
                    </Button>
                  </div>
                </div>

                <div className="border-t border-border" />

                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <Label className="text-base font-medium">Subscription</Label>
                      <p className="text-sm text-muted-foreground">Manage your Pro plan</p>
                    </div>
                  </div>
                  {accountLoading ? (
                    <Button disabled size="sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </Button>
                  ) : isActive ? (
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Current Plan: Pro</p>
                        {currentPeriodEnd ? (
                          <p className="text-xs text-muted-foreground mt-1">
                            Renews: {formatRenewsAt(currentPeriodEnd) ?? "—"}
                          </p>
                        ) : null}
                      </div>
                      <Button
                        size="sm"
                        className="ruby-gradient border-0 shadow-ruby hover:shadow-ruby-strong"
                        onClick={() => void handleManageSubscription()}
                        disabled={isPortalLoading}
                      >
                        {isPortalLoading ? "Yönlendiriliyor..." : "Manage Subscription"}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="ruby-gradient border-0 shadow-ruby hover:shadow-ruby-strong"
                      onClick={() => void handleStartCheckout()}
                      disabled={isCheckoutLoading}
                    >
                      {isCheckoutLoading ? "Yönlendiriliyor..." : "Upgrade to Pro"}
                    </Button>
                  )}
                </div>

                {isActive ? (
                  <>
                    <div className="border-t border-border" />
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                          <CreditCard className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <Label className="text-base font-medium">Payment Method</Label>
                          <p className="text-sm text-muted-foreground">Visa ending in 4242</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleManageSubscription()}
                        disabled={isPortalLoading}
                      >
                        {isPortalLoading ? "Yönlendiriliyor..." : "Update"}
                      </Button>
                    </div>
                  </>
                ) : null}
              </div>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications" className="space-y-6">
              <div className="glass-card rounded-xl p-6 space-y-6">
                {/* Email Alerts */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <Label className="text-base font-medium">{t.settings.emailAlerts}</Label>
                      <p className="text-sm text-muted-foreground">{t.settings.emailAlertsDesc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.emailAlerts}
                    onCheckedChange={(v) => setNotificationSetting("emailAlerts", v)}
                  />
                </div>

                <div className="border-t border-border" />

                {/* Monthly Report */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <Label className="text-base font-medium">{t.settings.monthlyReport}</Label>
                      <p className="text-sm text-muted-foreground">{t.settings.monthlyReportDesc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.monthlyReport}
                    onCheckedChange={(v) => setNotificationSetting("monthlyReport", v)}
                  />
                </div>

                <div className="border-t border-border" />

                {/* Bill Reminders */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <Label className="text-base font-medium">{t.settings.billReminders}</Label>
                      <p className="text-sm text-muted-foreground">{t.settings.billRemindersDesc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.billReminders}
                    onCheckedChange={(v) => setNotificationSetting("billReminders", v)}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Settings;
