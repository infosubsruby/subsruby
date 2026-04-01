import { useState } from "react";
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
  Sun,
  Moon,
  Monitor
} from "lucide-react";

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
