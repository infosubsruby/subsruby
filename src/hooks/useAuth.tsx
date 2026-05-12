import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { PlanType } from "@/types/common";
import type { AuthProfile, AuthUser } from "@/lib/auth/authTypes";
import type { Database } from "@/integrations/supabase/types";
import {
  clearDemoSnapshot,
  createProfileForUser,
  createDefaultDemoProfile,
  createDefaultDemoUser,
  getStoredDemoSnapshot,
  isDemoModeEnabled,
  persistDemoSnapshot,
} from "@/lib/auth/authService";
import { hasSupabaseEnv } from "@/lib/supabase/client";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  profile: Profile | null;
  authProfile: AuthProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  isMockMode: boolean;
  error: string | null;
  onboardingCompleted: boolean;
  currentPlan: PlanType;
  signUp: (
    email: string,
    password: string,
    metadata: { first_name: string; last_name: string; phone?: string }
  ) => Promise<{ error: Error | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: Error | null; hasCompletedOnboarding?: boolean | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInAsDemo: (plan?: PlanType) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<AuthProfile> & { fullName?: string; avatarUrl?: string | null }) => Promise<void>;
  completeOnboarding: (updates?: Partial<AuthProfile>) => Promise<void>;
  setCurrentPlan: (plan: PlanType) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authProfile, setAuthProfile] = useState<AuthProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMockMode, setIsMockMode] = useState(false);
  const [currentPlan, setCurrentPlanState] = useState<PlanType>("free");

  const getStoredOnboardingCompletion = (userId: string): boolean | null => {
    if (typeof window === "undefined") return null;
    const value = window.localStorage.getItem(`hasCompletedOnboarding:${userId}`);
    if (value === "true") return true;
    if (value === "false") return false;
    return null;
  };

  const setStoredOnboardingCompletion = (userId: string, completed: boolean) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(`hasCompletedOnboarding:${userId}`, completed ? "true" : "false");
  };

  const normalizeAuthProfile = (
    profileRow: Profile | null,
    fallbackUser: AuthUser | null,
    previousProfile: AuthProfile | null
  ): AuthProfile | null => {
    if (!profileRow && !fallbackUser) return null;
    const resolvedUserId = profileRow?.id ?? fallbackUser?.id ?? "demo-user";
    const persistedOnboarding = getStoredOnboardingCompletion(resolvedUserId);
    const onboardingCompleted =
      persistedOnboarding ?? previousProfile?.onboardingCompleted ?? false;

    return {
      userId: resolvedUserId,
      preferredCurrency: profileRow?.default_currency ?? previousProfile?.preferredCurrency ?? "USD",
      country: previousProfile?.country ?? null,
      monthlyIncome: previousProfile?.monthlyIncome ?? 0,
      savingsTarget: previousProfile?.savingsTarget ?? 0,
      rubyAIFocus: previousProfile?.rubyAIFocus ?? null,
      onboardingCompleted,
    };
  };

  const createDisplayUser = (input: {
    id: string;
    email?: string | null;
    fullName?: string | null;
    avatarUrl?: string | null;
  }): AuthUser => ({
    id: input.id,
    email: input.email ?? "",
    fullName: input.fullName ?? "Ruby User",
    avatarUrl: input.avatarUrl ?? null,
  });

  const setCurrentPlan = (plan: PlanType) => {
    setCurrentPlanState(plan);
    if (!isMockMode || !user || !authProfile) return;
    persistDemoSnapshot({
      user,
      profile: authProfile,
      currentPlan: plan,
    });
  };

  const enableDemoState = (plan: PlanType = "free", partial?: Partial<AuthProfile> & { fullName?: string; email?: string }) => {
    const baseUser = createDefaultDemoUser();
    const baseProfile = createDefaultDemoProfile();
    const nextProfile: AuthProfile = {
      ...baseProfile,
      ...partial,
      userId: baseProfile.userId,
    };
    const nextUser = createDisplayUser({
      id: baseUser.id,
      email: partial?.email ?? baseUser.email,
      fullName: partial?.fullName ?? baseUser.fullName,
      avatarUrl: baseUser.avatarUrl,
    });

    const legacyProfile: Profile = {
      id: nextUser.id,
      first_name: nextUser.fullName.split(" ").slice(0, -1).join(" ") || nextUser.fullName,
      last_name: nextUser.fullName.split(" ").slice(-1)[0] ?? "",
      email: nextUser.email,
      avatar_url: nextUser.avatarUrl,
      created_at: new Date().toISOString(),
      status: plan === "pro" ? "active" : "free",
      subscription_status: plan === "pro" ? "active" : "free",
      lifetime_access: null,
      updated_at: null,
      language: "en",
      default_currency: nextProfile.preferredCurrency,
    };

    setIsMockMode(true);
    setSession(null);
    setUser(nextUser);
    setProfile(legacyProfile);
    setAuthProfile(nextProfile);
    setCurrentPlanState(plan);
    setIsAdmin(false);
    setError(null);
    setIsLoading(false);
    persistDemoSnapshot({
      user: nextUser,
      profile: nextProfile,
      currentPlan: plan,
    });
  };

  // Fetch profile data and sync OAuth info if needed
  const fetchProfile = async (userId: string, currentSession?: Session | null) => {
    const sessionToUse = currentSession || session;
    
    // First check if profile exists
    let { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!profileData && sessionToUse?.user) {
      const { data: createdProfile, error: createError } = await createProfileForUser(sessionToUse.user);
      if (createError && import.meta.env.DEV) {
        console.error("[Auth][profiles] Failed to create missing profile", {
          userId,
          message: createError.message,
        });
      }
      if (createdProfile) {
        profileData = createdProfile;
      }
    }
    
    // If user signed in with Google and we have user metadata, sync it
    if (sessionToUse?.user) {
      const userMeta = sessionToUse.user.user_metadata;
      const userEmail = sessionToUse.user.email;
      
      // Update profile with OAuth data if available
      if (profileData && (userMeta?.avatar_url || userMeta?.full_name || userEmail)) {
        const updates: Partial<Profile> = {};
        
        if (userEmail && !profileData.email) {
          updates.email = userEmail;
        }
        if (userMeta?.avatar_url && !profileData.avatar_url) {
          updates.avatar_url = userMeta.avatar_url;
        }
        if (userMeta?.full_name && !profileData.first_name) {
          updates.first_name = userMeta.full_name;
        }
        
        if (Object.keys(updates).length > 0) {
          const { data: updatedProfile } = await supabase
            .from("profiles")
            .update(updates)
            .eq("id", userId)
            .select()
            .maybeSingle();
          
          if (updatedProfile) {
            profileData = updatedProfile;
          }
        }
      }
    }
    
    const authUser = createDisplayUser({
      id: userId,
      email: sessionToUse?.user.email ?? profileData?.email ?? "",
      fullName:
        profileData?.first_name && profileData?.last_name
          ? `${profileData.first_name} ${profileData.last_name}`.trim()
          : profileData?.first_name ?? sessionToUse?.user.user_metadata?.full_name ?? "Ruby User",
      avatarUrl: profileData?.avatar_url ?? sessionToUse?.user.user_metadata?.avatar_url ?? null,
    });

    setUser(authUser);
    if (profileData) {
      setProfile(profileData);
    }
    setAuthProfile((prev) => normalizeAuthProfile(profileData ?? null, authUser, prev));
    const profilePlanStatus = profileData?.subscription_status ?? profileData?.status;
    setCurrentPlanState(profilePlanStatus === "active" || profilePlanStatus === "trialing" ? "pro" : "free");

    // Check admin status
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    
    setIsAdmin(!!roleData);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, session);
    }
  };

  useEffect(() => {
    let cancelled = false;
    let authSubscription: { unsubscribe: () => void } | null = null;

    const startSupabaseListener = () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setIsMockMode(false);
        setSession(session);
        setUser(
          session?.user
            ? createDisplayUser({
                id: session.user.id,
                email: session.user.email,
                fullName: session.user.user_metadata?.full_name,
                avatarUrl: session.user.user_metadata?.avatar_url,
              })
            : null
        );

        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id, session), 0);
        } else {
          setProfile(null);
          setAuthProfile(null);
          setIsAdmin(false);
        }
        setIsLoading(false);
      });
      authSubscription = subscription;
    };

    const enableDemoFromSnapshot = (snapshot: ReturnType<typeof getStoredDemoSnapshot>) => {
      if (!snapshot) return;
      setIsMockMode(true);
      setSession(null);
      setUser(snapshot.user);
      setProfile({
        id: snapshot.user.id,
        first_name: snapshot.user.fullName.split(" ").slice(0, -1).join(" ") || snapshot.user.fullName,
        last_name: snapshot.user.fullName.split(" ").slice(-1)[0] ?? "",
        email: snapshot.user.email,
        avatar_url: snapshot.user.avatarUrl,
        created_at: new Date().toISOString(),
        status: snapshot.currentPlan === "pro" ? "active" : "free",
        subscription_status: snapshot.currentPlan === "pro" ? "active" : "free",
        lifetime_access: null,
        updated_at: null,
        language: "en",
        default_currency: snapshot.profile.preferredCurrency,
      });
      setAuthProfile(snapshot.profile);
      setStoredOnboardingCompletion(snapshot.user.id, snapshot.profile.onboardingCompleted);
      setCurrentPlanState(snapshot.currentPlan);
      setIsLoading(false);
    };

    const init = async () => {
      const snapshot = getStoredDemoSnapshot();

      if (hasSupabaseEnv) {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;

        if (session?.user) {
          clearDemoSnapshot();
          setIsMockMode(false);
          setSession(session);
          setUser(
            createDisplayUser({
              id: session.user.id,
              email: session.user.email,
              fullName: session.user.user_metadata?.full_name,
              avatarUrl: session.user.user_metadata?.avatar_url,
            })
          );
          fetchProfile(session.user.id, session);
          setIsLoading(false);
          startSupabaseListener();
          return;
        }
      }

      if (isDemoModeEnabled() && snapshot) {
        enableDemoFromSnapshot(snapshot);
        return;
      }

      if (!hasSupabaseEnv) {
        setIsLoading(false);
        return;
      }

      setIsMockMode(false);
      startSupabaseListener();
      setIsLoading(false);
    };

    void init();

    return () => {
      cancelled = true;
      authSubscription?.unsubscribe();
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    metadata: { first_name: string; last_name: string; phone?: string }
  ) => {
    if (!hasSupabaseEnv) {
      enableDemoState("free", {
        fullName: `${metadata.first_name} ${metadata.last_name}`.trim(),
        email,
        onboardingCompleted: false,
      });
      return { error: null };
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: metadata,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    if (!hasSupabaseEnv) {
      enableDemoState("free", { email, fullName: "Demo User" });
      return { error: null, hasCompletedOnboarding: true };
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error };

    const userId = data.user?.id ?? data.session?.user?.id ?? null;
    if (!userId) return { error: null, hasCompletedOnboarding: null };

    const hasCompletedOnboarding = getStoredOnboardingCompletion(userId);

    return { error: null, hasCompletedOnboarding };
  };

  const signInWithGoogle = async () => {
    if (!hasSupabaseEnv) {
      return { error: new Error("Google auth is not configured in this environment.") };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/overview`,
        scopes: 'https://www.googleapis.com/auth/gmail.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    return { error };
  };

  const signInAsDemo = async (plan: PlanType = "free") => {
    enableDemoState(plan);
    return { error: null };
  };

  const signOut = async () => {
    if (!isMockMode && hasSupabaseEnv) {
      await supabase.auth.signOut();
    }
    clearDemoSnapshot();
    setUser(null);
    setSession(null);
    setProfile(null);
    setAuthProfile(null);
    setIsAdmin(false);
    setIsMockMode(false);
    setCurrentPlanState("free");
    setError(null);
  };

  const updateProfile = async (updates: Partial<AuthProfile> & { fullName?: string; avatarUrl?: string | null }) => {
    if (!user) return;

    const fullName = updates.fullName ?? user.fullName;
    const [firstName, ...lastParts] = fullName.split(" ");
    const lastName = lastParts.join(" ");

    const nextOnboarding =
      typeof updates.onboardingCompleted === "boolean"
        ? updates.onboardingCompleted
        : authProfile?.onboardingCompleted ?? false;

    setUser((prev) =>
      prev
        ? {
            ...prev,
            fullName,
            avatarUrl: updates.avatarUrl ?? prev.avatarUrl,
          }
        : prev
    );
    setAuthProfile((prev) =>
      prev
        ? {
            ...prev,
            ...updates,
            userId: user.id,
            preferredCurrency: updates.preferredCurrency ?? prev.preferredCurrency,
            onboardingCompleted: nextOnboarding,
          }
        : {
            userId: user.id,
            preferredCurrency: updates.preferredCurrency ?? profile?.default_currency ?? "USD",
            country: null,
            monthlyIncome: 0,
            savingsTarget: 0,
            rubyAIFocus: null,
            onboardingCompleted: nextOnboarding,
          }
    );
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            first_name: firstName || prev.first_name,
            last_name: lastName || prev.last_name,
            avatar_url: updates.avatarUrl ?? prev.avatar_url,
            default_currency: updates.preferredCurrency ?? prev.default_currency,
          }
        : prev
    );
    setStoredOnboardingCompletion(user.id, nextOnboarding);

    if (isMockMode) {
      const nextAuthProfile: AuthProfile = {
        ...(authProfile ?? createDefaultDemoProfile()),
        ...updates,
        userId: user.id,
        onboardingCompleted: nextOnboarding,
      };
      const nextUser = {
        ...user,
        fullName,
        avatarUrl: updates.avatarUrl ?? user.avatarUrl,
      };
      setAuthProfile(nextAuthProfile);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              first_name: firstName || prev.first_name,
              last_name: lastName || prev.last_name,
              avatar_url: updates.avatarUrl ?? prev.avatar_url,
              default_currency: updates.preferredCurrency ?? prev.default_currency,
            }
          : prev
      );
      persistDemoSnapshot({ user: nextUser, profile: nextAuthProfile, currentPlan });
      return;
    }

    if (!hasSupabaseEnv) return;

    const profileUpdate: ProfileUpdate = {
      first_name: firstName || "Ruby",
      last_name: lastName || "User",
      default_currency: updates.preferredCurrency,
      avatar_url: updates.avatarUrl,
    };

    await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", user.id);
    await refreshProfile();
  };

  const completeOnboarding = async (updates?: Partial<AuthProfile>) => {
    if (user?.id) {
      setStoredOnboardingCompletion(user.id, true);
    }
    await updateProfile({
      ...updates,
      onboardingCompleted: true,
    });
  };

  const onboardingCompleted =
    authProfile?.onboardingCompleted ?? false;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        authProfile,
        isAdmin,
        isLoading,
        isAuthenticated: Boolean(user),
        isMockMode,
        error,
        onboardingCompleted,
        currentPlan,
        signUp,
        signIn,
        signInWithGoogle,
        signInAsDemo,
        signOut,
        refreshProfile,
        updateProfile,
        completeOnboarding,
        setCurrentPlan,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
