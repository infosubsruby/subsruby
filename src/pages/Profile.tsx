import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Navbar } from "@/components/layout/Navbar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { AlertTriangle, Loader2, Lock, LogOut, Trash2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Profile = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [accountAvatarUrl, setAccountAvatarUrl] = useState<string | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [formEmail, setFormEmail] = useState<string>("");
  const [formFullName, setFormFullName] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState<string>("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
        setFormEmail(authUser?.email ?? user.email ?? "");

        const meta = authUser?.user_metadata ?? {};
        const metaName =
          typeof (meta as { full_name?: unknown }).full_name === "string"
            ? String((meta as { full_name?: unknown }).full_name)
            : typeof (meta as { name?: unknown }).name === "string"
              ? String((meta as { name?: unknown }).name)
              : null;
        setAccountName(metaName);
        setFormFullName(metaName ?? "");

        const metaAvatar =
          typeof (meta as { avatar_url?: unknown }).avatar_url === "string"
            ? String((meta as { avatar_url?: unknown }).avatar_url)
            : null;
        setAccountAvatarUrl(metaAvatar);
      } catch (error) {
        console.error("Supabase Çekme Hatası:", error);
        setAccountEmail(user?.email ?? null);
        setFormEmail(user?.email ?? "");
        setAccountName(null);
        setFormFullName("");
        setAccountAvatarUrl(null);
      } finally {
        setAccountLoading(false);
      }
    };

    fetchAccount();
  }, [user?.id, user?.email]);

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formFullName,
        },
      });
      if (error) {
        toast.error("Failed to update profile");
        return;
      }
      setAccountName(formFullName);
      toast.success("Profile updated");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }
    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error("Failed to update password");
        return;
      }
      setNewPassword("");
      toast.success("Password updated");
    } catch (error) {
      toast.error("Failed to update password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      navigate("/", { replace: true });
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const userId = user?.id;
      if (userId) {
        await supabase.from("subscriptions").delete().eq("user_id", userId);
        await supabase.from("transactions").delete().eq("user_id", userId);
        await supabase.from("budgets").delete().eq("user_id", userId);
        await supabase.from("feedbacks").delete().eq("user_id", userId);
        await supabase.from("profiles").delete().eq("id", userId);
      }

      await supabase.auth.signOut();
      toast.success("Account deleted successfully");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };
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
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-bold flex items-center gap-3">
                  <User className="w-8 h-8 text-primary" />
                  {t.nav.profile}
                </h1>
                <p className="text-muted-foreground mt-1">{t.nav.account}</p>
              </div>
              <Button variant="outline" className="gap-2" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>

          <div className="space-y-6">
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
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={formEmail} readOnly disabled />
                </div>
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleSave}
                    disabled={saving || accountLoading}
                    className="ruby-gradient border-0 shadow-ruby hover:shadow-ruby-strong"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-6 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <Lock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <Label className="text-base font-medium">Security</Label>
                    <p className="text-sm text-muted-foreground">Update your password</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="********"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleUpdatePassword}
                    disabled={updatingPassword || accountLoading}
                    className="ruby-gradient border-0 shadow-ruby hover:shadow-ruby-strong"
                  >
                    {updatingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Update Password
                  </Button>
                </div>
              </div>
            </div>

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
                      <AlertDialogDescription>{t.settings.deleteConfirm}</AlertDialogDescription>
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
