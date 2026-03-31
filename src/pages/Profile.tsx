import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Navbar } from "@/components/layout/Navbar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const { user, isLoading: authLoading, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [accountAvatarUrl, setAccountAvatarUrl] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [formEmail, setFormEmail] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState<string>("");
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
        setAccountId(authUser?.id ?? user.id);

        const createdAt = authUser?.created_at ?? null;
        if (createdAt) {
          const d = new Date(createdAt);
          const monthYear = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(d);
          setMemberSince(`Member since ${monthYear}`);
        } else {
          setMemberSince(null);
        }

        const { data: profileRow, error: profileError } = await supabase
          .from("profiles")
          .select("first_name, last_name, email, avatar_url")
          .eq("id", user.id)
          .maybeSingle();
        if (profileError) {
          console.error("Supabase Çekme Hatası:", profileError);
        }

        const profileEmail =
          profileRow && typeof profileRow === "object" && "email" in profileRow
            ? (profileRow as { email?: unknown }).email
            : null;
        const resolvedEmail =
          typeof profileEmail === "string" ? profileEmail : authUser?.email ?? user.email ?? null;
        setAccountEmail(resolvedEmail);
        setFormEmail(resolvedEmail ?? "");

        const profileFirstName =
          profileRow && typeof profileRow === "object" && "first_name" in profileRow
            ? (profileRow as { first_name?: unknown }).first_name
            : null;
        const profileLastName =
          profileRow && typeof profileRow === "object" && "last_name" in profileRow
            ? (profileRow as { last_name?: unknown }).last_name
            : null;

        const resolvedFirstName = typeof profileFirstName === "string" ? profileFirstName : "";
        const resolvedLastName = typeof profileLastName === "string" ? profileLastName : "";
        setFirstName(resolvedFirstName);
        setLastName(resolvedLastName);

        const displayName = `${resolvedFirstName} ${resolvedLastName}`.trim();
        setAccountName(displayName || null);

        const meta = authUser?.user_metadata ?? {};
        const metaAvatar =
          typeof (meta as { avatar_url?: unknown }).avatar_url === "string"
            ? String((meta as { avatar_url?: unknown }).avatar_url)
            : null;
        const profileAvatarUrl =
          profileRow && typeof profileRow === "object" && "avatar_url" in profileRow
            ? (profileRow as { avatar_url?: unknown }).avatar_url
            : null;
        setAccountAvatarUrl(
          metaAvatar ?? (typeof profileAvatarUrl === "string" ? profileAvatarUrl : null)
        );
      } catch (error) {
        console.error("Supabase Çekme Hatası:", error);
        setAccountEmail(user?.email ?? null);
        setFormEmail(user?.email ?? "");
        setAccountId(user?.id ?? null);
        setMemberSince(null);
        setAccountName(null);
        setFirstName("");
        setLastName("");
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
      const nextFirstName = firstName.trim();
      const nextLastName = lastName.trim();
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, first_name: nextFirstName, last_name: nextLastName }, { onConflict: "id" });
      if (error) {
        console.error("Supabase Güncelleme Hatası:", error);
        toast.error("Hata oluştu");
        return;
      }

      const displayName = `${nextFirstName} ${nextLastName}`.trim();
      setAccountName(displayName || null);
      setFirstName(nextFirstName);
      setLastName(nextLastName);
      await refreshProfile();
      toast.success("Profil güncellendi");
    } catch (error) {
      console.error("Supabase Güncelleme Hatası:", error);
      toast.error("Hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    const email = formEmail || accountEmail || "";
    if (!email) {
      toast.error("Email not found");
      return;
    }
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }
    setUpdatingPassword(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (signInError) {
        toast.error("Current password is incorrect");
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        console.error("Supabase Güncelleme Hatası:", error);
        toast.error("Failed to update password");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password updated");
    } catch (error) {
      console.error("Supabase Güncelleme Hatası:", error);
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
                <Tabs defaultValue="account" className="mt-3">
                  <TabsList className="bg-secondary">
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger
                      value="billing"
                      disabled
                      className="text-muted-foreground data-[state=inactive]:text-muted-foreground"
                    >
                      Billing
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
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
                  <p className="text-sm text-muted-foreground">{accountName ? accountName : "İsim belirtilmedi"}</p>
                  {accountEmail ? <p className="text-xs text-muted-foreground mt-1">{accountEmail}</p> : null}
                  {memberSince ? <p className="text-xs text-muted-foreground mt-1">{memberSince}</p> : null}
                  {accountId ? <p className="text-xs text-muted-foreground mt-1">Account ID: {accountId}</p> : null}
                  </div>
                </div>

                {accountLoading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : null}
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={formEmail} readOnly disabled className="bg-muted text-muted-foreground" />
                </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className="focus-visible:ring-blue-500 focus-visible:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="focus-visible:ring-blue-500 focus-visible:border-blue-500"
                  />
                </div>
              </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleSave}
                    disabled={saving || accountLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {saving ? "Kaydediliyor..." : "Save Changes"}
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
                  <Label>Current Password</Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="********"
                  />
                </div>
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
                    className="bg-blue-600 hover:bg-blue-700 text-white"
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
