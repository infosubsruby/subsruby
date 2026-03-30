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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  Trash2,
  AlertTriangle,
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
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { language, setLanguage, t, languages } = useLanguage();
  const { 
    defaultCurrency, 
    setDefaultCurrency, 
    theme, 
    setTheme,
    notifications,
    setNotificationSetting 
  } = useSettings();
  const [isDeleting, setIsDeleting] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [accountAvatarUrl, setAccountAvatarUrl] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [customerPortalUrl, setCustomerPortalUrl] = useState<string | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);

  useEffect(() => {
    const fetchAccount = async () => {
      if (!user?.id) return;
      setAccountLoading(true);
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error("Supabase Çekme Hatası:", userError);
        }

        const authUser = userData?.user ?? null;
        setAccountEmail(authUser?.email ?? user.email ?? null);

        const meta = authUser?.user_metadata ?? {};
        const metaName =
          typeof (meta as { full_name?: unknown }).full_name === "string"
            ? String((meta as { full_name?: unknown }).full_name)
            : typeof (meta as { name?: unknown }).name === "string"
              ? String((meta as { name?: unknown }).name)
              : null;
        setAccountName(metaName);

        const metaAvatar =
          typeof (meta as { avatar_url?: unknown }).avatar_url === "string"
            ? String((meta as { avatar_url?: unknown }).avatar_url)
            : null;
        setAccountAvatarUrl(metaAvatar);

        const { data: subRow, error: subError } = await supabase
          .from("user_subscriptions")
          .select("status, customer_portal_url")
          .eq("user_id", user.id)
          .maybeSingle();

        if (subError) {
          console.error("Supabase Çekme Hatası:", subError);
          setSubscriptionStatus(null);
          setCustomerPortalUrl(null);
        } else {
          const statusRaw = subRow && typeof subRow === "object" && "status" in subRow ? (subRow as { status?: unknown }).status : null;
          setSubscriptionStatus(statusRaw != null ? String(statusRaw) : null);

          const portalRaw =
            subRow && typeof subRow === "object" && "customer_portal_url" in subRow
              ? (subRow as { customer_portal_url?: unknown }).customer_portal_url
              : null;
          setCustomerPortalUrl(typeof portalRaw === "string" ? portalRaw : null);
        }
      } catch (error) {
        console.error("Supabase Çekme Hatası:", error);
        setSubscriptionStatus(null);
        setCustomerPortalUrl(null);
      } finally {
        setAccountLoading(false);
      }
    };

    fetchAccount();
  }, [user?.id, user?.email]);

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

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // Delete user data (subscriptions, transactions, budgets, feedbacks)
      // Note: In production, this should be an edge function with proper cleanup
      const userId = user?.id;
      if (userId) {
        await supabase.from("subscriptions").delete().eq("user_id", userId);
        await supabase.from("transactions").delete().eq("user_id", userId);
        await supabase.from("budgets").delete().eq("user_id", userId);
        await supabase.from("feedbacks").delete().eq("user_id", userId);
        await supabase.from("profiles").delete().eq("id", userId);
      }
      
      // Sign out
      await signOut();
      toast.success("Account deleted successfully");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

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
            <TabsList className="grid w-full grid-cols-3 bg-secondary">
              <TabsTrigger value="general" className="gap-2">
                <SettingsIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{t.settings.general}</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">{t.settings.notifications}</span>
              </TabsTrigger>
              <TabsTrigger value="danger" className="gap-2 data-[state=active]:text-destructive">
                <AlertTriangle className="w-4 h-4" />
                <span className="hidden sm:inline">{t.settings.dangerZone}</span>
              </TabsTrigger>
            </TabsList>

            {/* General Settings */}
            <TabsContent value="general" className="space-y-6">
              <div className="glass-card rounded-xl p-6 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {accountAvatarUrl ? (
                      <img
                        src={accountAvatarUrl}
                        alt="Avatar"
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <span className="text-sm font-medium">
                          {(accountEmail?.[0] ?? "U").toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <Label className="text-base font-medium">Account Details</Label>
                      <p className="text-sm text-muted-foreground">{accountName ?? accountEmail ?? ""}</p>
                      {accountName && accountEmail ? (
                        <p className="text-xs text-muted-foreground mt-1">{accountEmail}</p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="border-t border-border" />

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
                      <p className="text-sm text-muted-foreground">
                        Current Plan: {subscriptionStatus === "active" || subscriptionStatus === "trialing" ? "Pro" : "Free"}
                      </p>
                    </div>
                  </div>
                  {accountLoading ? (
                    <Button disabled size="sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </Button>
                  ) : subscriptionStatus === "active" || subscriptionStatus === "trialing" ? (
                    <Button
                      size="sm"
                      className="ruby-gradient border-0 shadow-ruby hover:shadow-ruby-strong"
                      onClick={() => {
                        if (!customerPortalUrl) {
                          toast.error("Customer portal link not found.");
                          return;
                        }
                        window.open(customerPortalUrl, "_blank", "noopener,noreferrer");
                      }}
                    >
                      Manage Subscription
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="ruby-gradient border-0 shadow-ruby hover:shadow-ruby-strong"
                      onClick={() => navigate("/upgrade")}
                    >
                      Upgrade to Pro
                    </Button>
                  )}
                </div>
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

            {/* Danger Zone */}
            <TabsContent value="danger" className="space-y-6">
              <div className="glass-card rounded-xl p-6 border-destructive/30">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center shrink-0">
                      <Trash2 className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <Label className="text-base font-medium text-destructive">{t.settings.deleteAccount}</Label>
                      <p className="text-sm text-muted-foreground">{t.settings.deleteAccountDesc}</p>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        {t.settings.delete}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-destructive" />
                          {t.settings.deleteAccount}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t.settings.deleteConfirm}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t.settings.cancel}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          disabled={isDeleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              {t.common.loading}
                            </>
                          ) : (
                            t.settings.delete
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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
