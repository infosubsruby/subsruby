import type { PlanType } from "@/types/common";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface AuthProfile {
  userId: string;
  preferredCurrency: string;
  country: string | null;
  monthlyIncome: number;
  savingsTarget: number;
  rubyAIFocus: string | null;
  onboardingCompleted: boolean;
}

export type AuthMode = "none" | "supabase" | "demo";

export interface AuthState {
  user: AuthUser | null;
  profile: AuthProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  onboardingCompleted: boolean;
  currentPlan: PlanType;
  mode: AuthMode;
}

export interface DemoAuthSnapshot {
  user: AuthUser;
  profile: AuthProfile;
  currentPlan: PlanType;
}
