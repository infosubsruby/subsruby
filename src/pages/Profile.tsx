import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Navbar } from "@/components/layout/Navbar";
import { Label } from "@/components/ui/label";
import { Loader2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Profile = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [accountAvatarUrl, setAccountAvatarUrl] = useState<string | null>(null);
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
      } catch (error) {
        console.error("Supabase Çekme Hatası:", error);
        setAccountEmail(user?.email ?? null);
        setAccountName(null);
        setAccountAvatarUrl(null);
      } finally {
        setAccountLoading(false);
      }
    };

    fetchAccount();
  }, [user?.id, user?.email]);

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
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold flex items-center gap-3">
              <User className="w-8 h-8 text-primary" />
              {t.nav.profile}
            </h1>
            <p className="text-muted-foreground mt-1">{t.nav.account}</p>
          </div>

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

              {accountLoading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;

