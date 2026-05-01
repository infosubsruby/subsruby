"use client";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings, Shield, LayoutDashboard, List, PiggyBank, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  const { user, profile, isAdmin: globalIsAdmin, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const { t, language, setLanguage, languages } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      setIsAdmin(!!data);
    };

    checkAdminRole();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const activeTab = new URLSearchParams(location.search).get("tab");
  const isActive = (path: string) => location.pathname === path || (path === "/dashboard" && location.pathname === "/control");
  const showBottomNav = !!user && !location.pathname.startsWith("/onboarding") && !location.pathname.startsWith("/admin");

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[#0c0c0e]/80 backdrop-blur-md border-b border-gray-800/60">
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 group">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center overflow-hidden">
              <img
                src="/logo.png"
                alt="Site Logosu"
                className="h-full w-auto max-h-8 sm:max-h-10 object-contain"
              />
            </div>
            <span className="hidden sm:inline font-display text-xl font-bold text-foreground">
              Subs<span className="ruby-text-gradient">Ruby</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-3">
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm">
                      {t.nav.dashboard}
                    </Button>
                  </Link>
                  <Link to="/finance">
                    <Button variant="ghost" size="sm" className="gap-1">
                      <List className="w-4 h-4" />
                      <span className="hidden sm:inline">{t.nav.finance}</span>
                    </Button>
                  </Link>

                  {isAdmin && (
                    <Link to="/admin">
                      <Button variant="ghost" size="sm" className="gap-1 text-primary font-medium">
                        <Shield className="w-4 h-4" />
                        <span className="hidden sm:inline">{t.nav.adminPanel}</span>
                      </Button>
                    </Link>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="p-0 rounded-full hover:bg-transparent hover:opacity-90 hover:ring-2 hover:ring-muted-foreground/20 hover:ring-offset-2 hover:ring-offset-background"
                    >
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full object-cover object-center"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                          <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-popover border-border">
                    <DropdownMenuItem className="gap-2" onClick={() => navigate("/profile")}>
                      <User className="w-4 h-4" />
                      {t.nav.profile}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2" onClick={() => navigate("/settings")}>
                      <Settings className="w-4 h-4" />
                      {t.nav.settings}
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 text-primary" onClick={() => navigate("/admin")}>
                          <Shield className="w-4 h-4" />
                          {t.nav.adminPanel}
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 text-destructive focus:text-destructive"
                      onClick={handleSignOut}
                    >
                      <LogOut className="w-4 h-4" />
                      {t.nav.signOut}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Select value={language} onValueChange={(v) => setLanguage(v as typeof language)}>
                  <SelectTrigger className="w-[140px] bg-background border-border h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {languages.map((l) => (
                      <SelectItem key={l.code} value={l.code}>
                        {l.nativeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    {t.nav.signIn}
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="ruby-gradient border-0 shadow-ruby hover:shadow-ruby-strong transition-shadow">
                    {t.nav.getStarted}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {showBottomNav ? (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-4">
            <div className="glass border border-border/50 rounded-2xl backdrop-blur-md bg-background/40">
              <div className="grid grid-cols-4">
                <Link
                  to="/dashboard"
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium",
                    isActive("/dashboard") ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span>{t.nav.dashboard}</span>
                </Link>
                <Link
                  to="/finance?tab=transactions"
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium",
                    location.pathname === "/finance" && (activeTab === "transactions" || !activeTab)
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <List className="w-5 h-5" />
                  <span>{t.nav.transactions}</span>
                </Link>
                <Link
                  to="/finance?tab=budgets"
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium",
                    location.pathname === "/finance" && activeTab === "budgets"
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <PiggyBank className="w-5 h-5" />
                  <span>{t.nav.budgets}</span>
                </Link>
                <Link
                  to="/dashboard#subscriptions"
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium",
                    isActive("/dashboard") && location.hash === "#subscriptions"
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>{t.nav.subscriptions}</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>
      ) : null}
    </>
  );
};
