import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { PlanType } from "@/types/common";
import type { AuthProfile, AuthUser } from "@/lib/auth/authTypes";
import {
  clearDemoSnapshot,
  createDefaultDemoProfile,
  createDefaultDemoUser,
  getStoredDemoSnapshot,
  isDemoModeEnabled,
  persistDemoSnapshot,
} from "@/lib/auth/authService";
import { hasSupabaseEnv } from "@/lib/supabase/client";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  lemon_squeezy_customer_id: string | null;
  subscription_id: string | null;
  variant_id: string | null;
  status: string | null;
  current_period_end: string | null;
  has_completed_onboarding: boolean | null;
  language?: string | null;
  default_currency?: string | null;
}

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

  const normalizeAuthProfile = (profileRow: Profile | null, fallbackUser: AuthUser | null): AuthProfile | null => {
    if (!profileRow && !fallbackUser) return null;
    return {
      userId: profileRow?.id ?? fallbackUser?.id ?? "demo-user",
      preferredCurrency: profileRow?.default_currency ?? "USD",
      country: null,
      monthlyIncome: 0,
      savingsTarget: 0,
      rubyAIFocus: null,
      onboardingCompleted: profileRow?.has_completed_onboarding === true,
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
      phone: null,
      email: nextUser.email,
      avatar_url: nextUser.avatarUrl,
      created_at: new Date().toISOString(),
      lemon_squeezy_customer_id: null,
      subscription_id: null,
      variant_id: null,
      status: plan === "pro" ? "active" : "free",
      current_period_end: null,
      has_completed_onboarding: nextProfile.onboardingCompleted,
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
    setAuthProfile(normalizeAuthProfile(profileData ?? null, authUser));
    setCurrentPlanState(profileData?.status === "active" || profileData?.status === "trialing" ? "pro" : "free");

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
    const snapshot = getStoredDemoSnapshot();
    if (isDemoModeEnabled() && snapshot) {
      setIsMockMode(true);
      setUser(snapshot.user);
      setProfile({
        id: snapshot.user.id,
        first_name: snapshot.user.fullName.split(" ").slice(0, -1).join(" ") || snapshot.user.fullName,
        last_name: snapshot.user.fullName.split(" ").slice(-1)[0] ?? "",
        phone: null,
        email: snapshot.user.email,
        avatar_url: snapshot.user.avatarUrl,
        created_at: new Date().toISOString(),
        lemon_squeezy_customer_id: null,
        subscription_id: null,
        variant_id: null,
        status: snapshot.currentPlan === "pro" ? "active" : "free",
        current_period_end: null,
        has_completed_onboarding: snapshot.profile.onboardingCompleted,
        language: "en",
        default_currency: snapshot.profile.preferredCurrency,
      });
      setAuthProfile(snapshot.profile);
      setCurrentPlanState(snapshot.currentPlan);
      setIsLoading(false);
      return;
    }

    if (!hasSupabaseEnv) {
      setIsLoading(false);
      return;
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
          // Use setTimeout to avoid Supabase deadlock
          setTimeout(() => fetchProfile(session.user.id, session), 0);
        } else {
          setProfile(null);
          setAuthProfile(null);
          setIsAdmin(false);
        }
        setIsLoading(false);
      }
    );

    // Then get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
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
        fetchProfile(session.user.id, session);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
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

    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("has_completed_onboarding")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) return { error: null, hasCompletedOnboarding: null };

    const hasCompletedOnboarding =
      typeof profileRow?.has_completed_onboarding === "boolean"
        ? profileRow.has_completed_onboarding
        : null;

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

    if (isMockMode) {
      const nextAuthProfile: AuthProfile = {
        ...(authProfile ?? createDefaultDemoProfile()),
        ...updates,
        userId: user.id,
      };
      const nextUser = {
        ...user,
        fullName: updates.fullName ?? user.fullName,
        avatarUrl: updates.avatarUrl ?? user.avatarUrl,
      };
      setUser(nextUser);
      setAuthProfile(nextAuthProfile);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              first_name: updates.fullName ? updates.fullName.split(" ").slice(0, -1).join(" ") || updates.fullName : prev.first_name,
              last_name: updates.fullName ? updates.fullName.split(" ").slice(-1)[0] ?? "" : prev.last_name,
              avatar_url: updates.avatarUrl ?? prev.avatar_url,
              default_currency: updates.preferredCurrency ?? prev.default_currency,
              has_completed_onboarding: updates.onboardingCompleted ?? prev.has_completed_onboarding,
            }
          : prev
      );
      persistDemoSnapshot({ user: nextUser, profile: nextAuthProfile, currentPlan });
      return;
    }

    if (!hasSupabaseEnv) return;

    const fullName = updates.fullName ?? user.fullName;
    const [firstName, ...lastParts] = fullName.split(" ");
    const lastName = lastParts.join(" ");

    await supabase
      .from("profiles")
      .update({
        first_name: firstName || "Ruby",
        last_name: lastName || "User",
        default_currency: updates.preferredCurrency,
        has_completed_onboarding: updates.onboardingCompleted,
        avatar_url: updates.avatarUrl,
      })
      .eq("id", user.id);
    await refreshProfile();
  };

  const completeOnboarding = async (updates?: Partial<AuthProfile>) => {
    await updateProfile({
      ...updates,
      onboardingCompleted: true,
    });
  };

  const onboardingCompleted =
    authProfile?.onboardingCompleted ??
    profile?.has_completed_onboarding === true;

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
