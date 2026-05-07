import type { AuthProfile, AuthUser, DemoAuthSnapshot } from "@/lib/auth/authTypes";
import type { PlanType } from "@/types/common";
import { supabase } from "@/integrations/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/client";
import type {
  AuthChangeEvent,
  Session,
  Subscription as SupabaseSubscription,
  User,
} from "@supabase/supabase-js";

const DEMO_AUTH_STORAGE_KEY = "ruby.auth.demo.snapshot";
const DEMO_AUTH_MODE_KEY = "ruby.auth.demo.enabled";

export const DEMO_USER_ID = "demo-user";

export const createDefaultDemoProfile = (): AuthProfile => ({
  userId: DEMO_USER_ID,
  preferredCurrency: "USD",
  country: "United States",
  monthlyIncome: 6200,
  savingsTarget: 1200,
  rubyAIFocus: "saving_money",
  onboardingCompleted: true,
});

export const createDefaultDemoUser = (): AuthUser => ({
  id: DEMO_USER_ID,
  email: "demo@subsruby.com",
  fullName: "Demo User",
  avatarUrl: null,
});

export const getStoredDemoSnapshot = (): DemoAuthSnapshot | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(DEMO_AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<DemoAuthSnapshot>;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.user || !parsed.profile) return null;
    const plan: PlanType = parsed.currentPlan === "pro" ? "pro" : "free";
    return {
      user: {
        id: typeof parsed.user.id === "string" ? parsed.user.id : DEMO_USER_ID,
        email: typeof parsed.user.email === "string" ? parsed.user.email : "demo@subsruby.com",
        fullName: typeof parsed.user.fullName === "string" ? parsed.user.fullName : "Demo User",
        avatarUrl: typeof parsed.user.avatarUrl === "string" ? parsed.user.avatarUrl : null,
      },
      profile: {
        userId: typeof parsed.profile.userId === "string" ? parsed.profile.userId : DEMO_USER_ID,
        preferredCurrency:
          typeof parsed.profile.preferredCurrency === "string" ? parsed.profile.preferredCurrency : "USD",
        country: typeof parsed.profile.country === "string" ? parsed.profile.country : null,
        monthlyIncome: Number(parsed.profile.monthlyIncome ?? 0) || 0,
        savingsTarget: Number(parsed.profile.savingsTarget ?? 0) || 0,
        rubyAIFocus: typeof parsed.profile.rubyAIFocus === "string" ? parsed.profile.rubyAIFocus : null,
        onboardingCompleted: Boolean(parsed.profile.onboardingCompleted),
      },
      currentPlan: plan,
    };
  } catch {
    return null;
  }
};

export const persistDemoSnapshot = (snapshot: DemoAuthSnapshot) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_AUTH_STORAGE_KEY, JSON.stringify(snapshot));
  window.localStorage.setItem(DEMO_AUTH_MODE_KEY, "true");
};

export const clearDemoSnapshot = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
  window.localStorage.removeItem(DEMO_AUTH_MODE_KEY);
};

export const isDemoModeEnabled = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DEMO_AUTH_MODE_KEY) === "true";
};

export const signInWithEmail = async (email: string, password: string) => {
  if (!hasSupabaseEnv) {
    return { data: null, error: new Error("Supabase auth is not configured in this environment.") };
  }
  return supabase.auth.signInWithPassword({ email, password });
};

export const signUpWithEmail = async (email: string, password: string, metadata?: Record<string, string>) => {
  if (!hasSupabaseEnv) {
    return { data: null, error: new Error("Supabase auth is not configured in this environment.") };
  }
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
      data: metadata,
    },
  });
};

export const signOutAuth = async () => {
  if (!hasSupabaseEnv) {
    return { error: null };
  }
  return supabase.auth.signOut();
};

export const signOut = signOutAuth;

export const getCurrentUser = async () => {
  if (!hasSupabaseEnv) return { data: { user: null }, error: null };
  return supabase.auth.getUser();
};

export const getSession = async () => {
  if (!hasSupabaseEnv) {
    return { data: { session: null as Session | null }, error: null };
  }
  return supabase.auth.getSession();
};

export const onAuthStateChange = (
  callback: (event: AuthChangeEvent, session: Session | null) => void
): { data: { subscription: SupabaseSubscription } } => {
  if (!hasSupabaseEnv) {
    return {
      data: {
        subscription: {
          id: "mock-auth-subscription",
          callback,
          unsubscribe: () => undefined,
        } as unknown as SupabaseSubscription,
      },
    };
  }
  return supabase.auth.onAuthStateChange(callback);
};

export const getCurrentProfile = async (userId: string) => {
  if (!hasSupabaseEnv) return { data: null, error: null };
  return supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
};

export const createProfileForUser = async (user: User, fullName?: string | null) => {
  if (!hasSupabaseEnv) {
    return { data: null, error: null };
  }
  const normalizedName = fullName ?? user.user_metadata?.full_name ?? null;
  const [firstName, ...lastNameParts] = (normalizedName ?? "").trim().split(" ").filter(Boolean);
  const lastName = lastNameParts.join(" ");

  return supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? null,
        first_name: firstName || null,
        last_name: lastName || null,
        avatar_url: typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null,
        default_currency: "USD",
        has_completed_onboarding: false,
      },
      { onConflict: "id" }
    )
    .select("*")
    .maybeSingle();
};

export const updateProfileRow = async (
  userId: string,
  updates: Record<string, string | boolean | number | null | undefined>
) => {
  if (!hasSupabaseEnv) return { data: null, error: null };
  return supabase.from("profiles").update(updates).eq("id", userId);
};

export const completeOnboardingRow = async (userId: string) => {
  if (!hasSupabaseEnv) return { data: null, error: null };
  return supabase.from("profiles").update({ has_completed_onboarding: true }).eq("id", userId);
};
