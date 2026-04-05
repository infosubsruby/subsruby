"use client";

import { Link, useNavigate } from "react-router-dom";
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
import { User, LogOut, Settings, Shield, Wallet } from "lucide-react";

export const Navbar = () => {
  const { user, profile, isAdmin: globalIsAdmin, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const { t, language, setLanguage, languages } = useLanguage();
  const navigate = useNavigate();

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

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 group">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center overflow-hidden">
            <img
              src="/logo.png"
              alt="Site Logosu"
              className="h-full w-auto max-h-8 sm:max-h-10 object-contain"
            />
          </div>
          <span className="font-display text-xl font-bold text-foreground">
            Subs<span className="ruby-text-gradient">Ruby</span>
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  {t.nav.dashboard}
                </Button>
              </Link>
              <Link to="/finance">
                <Button variant="ghost" size="sm" className="gap-1">
                  <Wallet className="w-4 h-4" />
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
                  <DropdownMenuItem 
                    className="gap-2"
                    onClick={() => navigate("/settings")}
                  >
                    <Settings className="w-4 h-4" />
                    {t.nav.settings}
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="gap-2 text-primary"
                        onClick={() => navigate("/admin")}
                      >
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
  );
};
