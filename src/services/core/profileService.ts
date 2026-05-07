import type { AuthProfile } from "@/lib/auth/authTypes";
import { createDefaultDemoProfile, getCurrentProfile, updateProfileRow } from "@/lib/auth/authService";
import { isSupabaseMode } from "@/lib/config/dataMode";
import { fail, ok, type ServiceResult } from "@/services/core/serviceResult";

export const fetchProfile = async (userId: string): Promise<ServiceResult<AuthProfile>> => {
  if (!isSupabaseMode()) {
    return ok({ ...createDefaultDemoProfile(), userId });
  }

  const { data, error } = await getCurrentProfile(userId);
  if (error || !data) {
    return fail(error?.message ?? "Unable to fetch profile.");
  }

  return ok({
    userId: data.id,
    preferredCurrency: data.default_currency ?? "USD",
    country: null,
    monthlyIncome: 0,
    savingsTarget: 0,
    rubyAIFocus: null,
    onboardingCompleted: data.has_completed_onboarding === true,
  });
};

export const updateProfile = async (
  userId: string,
  updates: Partial<AuthProfile>
): Promise<ServiceResult<boolean>> => {
  if (!isSupabaseMode()) {
    return ok(true);
  }
  const { error } = await updateProfileRow(userId, {
    default_currency: updates.preferredCurrency,
    has_completed_onboarding: updates.onboardingCompleted,
  });
  if (error) return fail(error.message);
  return ok(true);
};

