import type { AppSettings, UserProfile } from "@/domain/financeModels";
import { asyncResolve, mockStore } from "@/services/core/baseMockStore";

export const fetchUserSettings = async (userId: string): Promise<AppSettings | null> => {
  const settings = mockStore.settings.get();
  if (settings.userId !== userId) return asyncResolve(null);
  return asyncResolve(settings);
};

export const updateUserSettings = async (
  userId: string,
  payload: Partial<AppSettings>
): Promise<AppSettings | null> => {
  const settings = mockStore.settings.get();
  if (settings.userId !== userId) return asyncResolve(null);
  const updated: AppSettings = { ...settings, ...payload, updatedAt: new Date().toISOString() };
  mockStore.settings.set(updated);
  return asyncResolve(updated);
};

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const profile = mockStore.profile.get();
  if (profile.userId !== userId) return asyncResolve(null);
  return asyncResolve(profile);
};
