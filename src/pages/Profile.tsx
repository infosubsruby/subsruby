import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Navbar } from "@/components/layout/Navbar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { AlertTriangle, Camera, CreditCard, Loader2, Lock, LogOut, Trash2, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Profile = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [accountAvatarUrl, setAccountAvatarUrl] = useState<string | null>(null);
  const [dbAvatarUrl, setDbAvatarUrl] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [memberSince, setMemberSince] = useState<string | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarDeleting, setAvatarDeleting] = useState(false);
  const [formEmail, setFormEmail] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>("");
  const [passwordMismatch, setPasswordMismatch] = useState<string | null>(null);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [subscriptionDebugRow, setSubscriptionDebugRow] = useState<unknown>(null);
  const [subscriptionDebugError, setSubscriptionDebugError] = useState<string | null>(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const refreshSubscription = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data: subRow, error: subError } = await supabase
        .from("user_subscriptions")
        .select("status, current_period_end")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setSubscriptionDebugRow(subRow);
      setSubscriptionDebugError(typeof (subError as unknown as { message?: unknown })?.message === "string" ? String((subError as unknown as { message?: unknown }).message) : subError ? String(subError) : null);
      if (subError) {
        console.error("Supabase Çekme Hatası:", subError);
        setSubscriptionStatus(null);
        setCurrentPeriodEnd(null);
        return;
      }
      if (import.meta.env.DEV) {
        console.log("Supabase Abonelik Verisi:", subRow, "Hata:", subError);
      }
      const statusRaw =
        subRow && typeof subRow === "object" && "status" in subRow ? (subRow as { status?: unknown }).status : null;
      setSubscriptionStatus(typeof statusRaw === "string" ? statusRaw : null);
      const endRaw =
        subRow && typeof subRow === "object" && "current_period_end" in subRow
          ? (subRow as { current_period_end?: unknown }).current_period_end
          : null;
      setCurrentPeriodEnd(typeof endRaw === "string" ? endRaw : null);
    } catch (error) {
      console.error("Supabase Çekme Hatası:", error);
      setSubscriptionDebugRow(null);
      setSubscriptionDebugError(error instanceof Error ? error.message : String(error));
      setSubscriptionStatus(null);
      setCurrentPeriodEnd(null);
    }
  }, [user?.id]);

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
          .select("first_name, last_name, avatar_url")
          .eq("id", user.id)
          .single();
        if (profileError) {
          const status = (profileError as unknown as { status?: number }).status;
          const code = (profileError as unknown as { code?: string }).code;
          if (status !== 406 && code !== "PGRST116") {
            console.error("Supabase Çekme Hatası:", profileError);
          }
        }

        const resolvedEmail = authUser?.email ?? user.email ?? null;
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

        const profileAvatarUrl =
          profileRow && typeof profileRow === "object" && "avatar_url" in profileRow
            ? (profileRow as { avatar_url?: unknown }).avatar_url
            : null;
        const resolvedDbAvatarUrl = typeof profileAvatarUrl === "string" ? profileAvatarUrl : null;
        setDbAvatarUrl(resolvedDbAvatarUrl);
        setAccountAvatarUrl(resolvedDbAvatarUrl);

        await refreshSubscription();
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
        setDbAvatarUrl(null);
        setSubscriptionStatus(null);
        setCurrentPeriodEnd(null);
      } finally {
        setAccountLoading(false);
      }
    };

    fetchAccount();
  }, [user?.id, user?.email, refreshSubscription]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("user-subscriptions-profile")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_subscriptions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = (payload as unknown as { new?: Record<string, unknown> }).new ?? null;
          const status = row?.status != null ? String(row.status) : null;
          setSubscriptionStatus(status);
          const end = row?.current_period_end;
          setCurrentPeriodEnd(typeof end === "string" ? end : null);
        }
      )
      .subscribe();

    const onFocus = () => {
      void refreshSubscription();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refreshSubscription();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [user?.id, refreshSubscription]);

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

  const handleAvatarPick = () => {
    if (avatarUploading) return;
    fileInputRef.current?.click();
  };

  const extractAvatarFilePath = (publicUrl: string) => {
    const marker = "/storage/v1/object/public/avatars/";
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) return null;
    const remainder = publicUrl.slice(idx + marker.length);
    return remainder.split("?")[0].split("#")[0] || null;
  };

  const handleAvatarChange = async (file: File | null) => {
    if (!user?.id) return;
    if (!file) return;

    setAvatarUploading(true);
    try {
      const filePath = `${user.id}/${Math.random()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Supabase Upload Hatası:", uploadError.message, uploadError);
        toast.error(`Fotoğraf yüklenemedi: ${uploadError.message}`);
        return;
      }

      const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const publicUrl = publicData?.publicUrl ?? null;
      if (!publicUrl) {
        toast.error("Fotoğraf linki alınamadı");
        return;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);
      if (profileError) {
        console.error("Supabase Güncelleme Hatası:", profileError);
        toast.error("Profil güncellenemedi");
        return;
      }

      setDbAvatarUrl(publicUrl);
      setAccountAvatarUrl(publicUrl);
      await refreshProfile();
      toast.success("Profil fotoğrafı güncellendi");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Supabase Upload Hatası:", message, error);
      toast.error(`Fotoğraf yüklenemedi: ${message}`);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!user?.id) return;
    if (!dbAvatarUrl) return;
    if (avatarDeleting) return;

    setAvatarDeleting(true);
    const currentUrl = dbAvatarUrl;
    try {
      const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
      if (error) {
        console.error("Supabase Güncelleme Hatası:", error);
        toast.error("Hata oluştu");
        return;
      }

      const filePath = extractAvatarFilePath(currentUrl);
      if (filePath) {
        const { error: removeError } = await supabase.storage.from("avatars").remove([filePath]);
        if (removeError) {
          console.error("Supabase Remove Hatası:", removeError);
        }
      }

      setDbAvatarUrl(null);
      setAccountAvatarUrl(null);
      await refreshProfile();
      toast.success("Fotoğraf başarıyla kaldırıldı");
    } catch (err) {
      console.error("Supabase Güncelleme Hatası:", err);
      toast.error("Hata oluştu");
    } finally {
      setAvatarDeleting(false);
    }
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
        throw new Error("Missing url");
      }
      window.location.href = url;
    } catch (error) {
      console.error("Customer portal error:", error);
      const message = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu";
      toast.error(message);
    } finally {
      setIsPortalLoading(false);
    }
  };

  const handleStartCheckout = async () => {
    if (isCheckoutLoading) return;
    setIsCheckoutLoading(true);
    try {
      if (!user?.id) {
        toast.error("Please sign in first.");
        return;
      }
      const { data: sessionData } = await supabase.auth.getSession();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (sessionData.session?.access_token) {
        headers.Authorization = `Bearer ${sessionData.session.access_token}`;
      }
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers,
        body: JSON.stringify({ user_id: user.id, plan: "monthly", redirect: false }),
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

  const isPro = ["active", "trialing"].includes(subscriptionStatus ?? "");
  const formattedRenews =
    currentPeriodEnd && !Number.isNaN(new Date(currentPeriodEnd).getTime())
      ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
          new Date(currentPeriodEnd)
        )
      : null;

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
    if (newPassword !== confirmNewPassword) {
      setPasswordMismatch("Şifreler eşleşmiyor");
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
      setConfirmNewPassword("");
      setPasswordMismatch(null);
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
          <Tabs defaultValue="account" className="space-y-6">
            <div className="mb-8">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="font-display text-3xl font-bold flex items-center gap-3">
                    <User className="w-8 h-8 text-primary" />
                    {t.nav.profile}
                  </h1>
                  <TabsList className="mt-3 bg-transparent p-0 gap-4">
                    <TabsTrigger
                      value="account"
                      className="rounded-none px-0 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600"
                    >
                      Account
                    </TabsTrigger>
                    <TabsTrigger
                      value="billing"
                      className="rounded-none px-0 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600"
                    >
                      Billing
                    </TabsTrigger>
                    <TabsTrigger
                      value="security"
                      className="rounded-none px-0 border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600"
                    >
                      Security
                    </TabsTrigger>
                  </TabsList>
                </div>
                <Button variant="outline" className="gap-2" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            </div>

            <TabsContent value="account" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-8">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative shrink-0">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      style={{ display: "none" }}
                      aria-hidden="true"
                      tabIndex={-1}
                      onChange={async (e) => {
                        const file = e.target.files?.[0] ?? null;
                        e.target.value = "";
                        await handleAvatarChange(file);
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAvatarPick}
                      className="group relative w-28 h-28 rounded-full overflow-hidden"
                      aria-label="Change avatar"
                    >
                      {accountAvatarUrl ? (
                        <img
                          src={accountAvatarUrl}
                          alt="Avatar"
                          className="w-28 h-28 object-cover object-top"
                        />
                      ) : (
                        <div className="w-28 h-28 rounded-full bg-secondary flex items-center justify-center">
                          <span className="text-3xl font-medium">
                            {(accountEmail?.[0] ?? "U").toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        {avatarUploading ? (
                          <Loader2 className="w-7 h-7 animate-spin text-white" />
                        ) : (
                          <Camera className="w-7 h-7 text-white" />
                        )}
                      </div>
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9"
                      onClick={handleAvatarPick}
                      disabled={avatarUploading || avatarDeleting}
                    >
                      Değiştir
                    </Button>
                    {dbAvatarUrl ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 px-0 text-red-500 hover:text-red-400 hover:bg-transparent font-medium text-sm"
                        onClick={handleDeletePhoto}
                        disabled={avatarUploading || avatarDeleting}
                      >
                        Sil
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="text-lg font-medium leading-tight">
                    {accountName ? accountName : "İsim belirtilmedi"}
                  </p>
                  {accountEmail ? <p className="text-sm text-muted-foreground mt-1">{accountEmail}</p> : null}
                  {memberSince ? <p className="text-xs text-muted-foreground mt-3">{memberSince}</p> : null}
                  {accountId ? <p className="text-xs text-muted-foreground mt-1">Account ID: {accountId}</p> : null}
                </div>
              </div>

              <div className="rounded-xl border border-border/40 bg-transparent p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Account Details</Label>
                  {accountLoading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : null}
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={formEmail} readOnly disabled className="bg-muted text-muted-foreground h-9" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                        className="h-9 border-border/40 focus-visible:ring-1 focus-visible:ring-indigo-500/40 focus-visible:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name"
                        className="h-9 border-border/40 focus-visible:ring-1 focus-visible:ring-indigo-500/40 focus-visible:border-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSave}
                      disabled={saving || accountLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {saving ? "Kaydediliyor..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-destructive/30 bg-transparent p-6">
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
                      <Button variant="destructive" size="sm" className="bg-destructive/80 hover:bg-destructive">
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
                        className="bg-destructive/80 text-destructive-foreground hover:bg-destructive"
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

            <TabsContent value="billing" className="space-y-6">
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-300 break-words">
                Debug -&gt; UserID: {user?.id} | Sub Verisi: {JSON.stringify(subscriptionDebugRow)} | Hata:{" "}
                {subscriptionDebugError}
              </div>
              {isPro ? (
                <>
                  <div className="rounded-xl border border-border/40 bg-transparent p-6 space-y-6">
                    <div className="flex items-start justify-between gap-6">
                      <div className="min-w-0">
                        <Label className="text-base font-medium">Current Plan</Label>
                        <p className="mt-2 text-2xl font-semibold leading-none">Pro Plan</p>
                        {formattedRenews ? (
                          <p className="mt-4 text-sm text-muted-foreground">Next payment: {formattedRenews}</p>
                        ) : null}
                      </div>
                      <Button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                        onClick={() => void handleManageSubscription()}
                        disabled={isPortalLoading}
                      >
                        {isPortalLoading ? "Yönlendiriliyor..." : "Manage Subscription"}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/40 bg-transparent p-6 space-y-6">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                          <CreditCard className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <Label className="text-base font-medium">Payment Method</Label>
                          <p className="mt-2 text-sm text-muted-foreground">Visa ending in 4242</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => void handleManageSubscription()} disabled={isPortalLoading}>
                        {isPortalLoading ? "Yönlendiriliyor..." : "Update"}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-border/40 bg-transparent p-6 space-y-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <Label className="text-base font-medium">Current Plan</Label>
                      <p className="mt-2 text-2xl font-semibold leading-none">Free Plan</p>
                      <p className="mt-2 text-sm text-muted-foreground">$0/month</p>
                    </div>
                    <Button
                      className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                      onClick={() => void handleStartCheckout()}
                      disabled={isCheckoutLoading}
                    >
                      {isCheckoutLoading ? "Yönlendiriliyor..." : "Upgrade to Pro"}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <div className="rounded-xl border border-border/40 bg-transparent p-6 space-y-6">
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
                    <div className="flex items-center justify-between">
                      <Label>Current Password</Label>
                      <a href="#" className="text-xs text-muted-foreground hover:text-foreground">
                        Forgot password?
                      </a>
                    </div>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="********"
                      className="h-9 border-border/40 focus-visible:ring-1 focus-visible:ring-indigo-500/40 focus-visible:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordMismatch(null);
                      }}
                      placeholder="********"
                      className="h-9 border-border/40 focus-visible:ring-1 focus-visible:ring-indigo-500/40 focus-visible:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm New Password</Label>
                    <Input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => {
                        setConfirmNewPassword(e.target.value);
                        setPasswordMismatch(null);
                      }}
                      placeholder="********"
                      className="h-9 border-border/40 focus-visible:ring-1 focus-visible:ring-indigo-500/40 focus-visible:border-indigo-500"
                    />
                    {passwordMismatch ? <p className="text-sm text-red-500">{passwordMismatch}</p> : null}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      onClick={handleUpdatePassword}
                      disabled={updatingPassword || accountLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    >
                      {updatingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Update Password
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Profile;
