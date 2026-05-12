import { createProfileForUser } from "@/lib/auth/authService";
import { isSupabaseMode } from "@/lib/config/dataMode";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  mapAppSettingsToDbInsert,
  mapAppSettingsToDbUpdate,
  mapDbAppSettingsToAppSettings,
} from "@/lib/supabase/mappers";
import { fail, ok, type ServiceResult } from "@/services/core/serviceResult";
import type { AppSettingsAccentColor, AppSettingsRecord, AppSettingsTheme } from "@/domain/financeModels";
import type { Database } from "@/integrations/supabase/types";

type AppSettingsRow = Database["public"]["Tables"]["app_settings"]["Row"];
type AppSettingsInsert = Database["public"]["Tables"]["app_settings"]["Insert"];
type PostgrestErrorLike = { message: string; code?: string | null; details?: string | null; hint?: string | null };

const UNAVAILABLE_MESSAGE = "App settings are unavailable because Supabase is not configured.";

const isDemoUser = (userId: string): boolean => userId === "demo-user" || userId.startsWith("demo-");

const formatPostgrestError = (error: PostgrestErrorLike): string => {
  const parts = [error.message];
  if (error.code) parts.push(`code=${error.code}`);
  if (error.details) parts.push(`details=${error.details}`);
  if (error.hint) parts.push(`hint=${error.hint}`);
  return parts.join(" | ");
};

const logDevPostgrestError = (scope: string, error: unknown, context: Record<string, unknown>): void => {
  if (!import.meta.env.DEV) return;
  const e = error as PostgrestErrorLike | null | undefined;
  console.error(`[AppSettings] ${scope}`, {
    ...context,
    error: e ? { message: e.message, code: e.code ?? null, details: e.details ?? null, hint: e.hint ?? null } : error,
  });
};

const ensureProfileExists = async (userId: string): Promise<ServiceResult<true>> => {
  const supabase = getSupabaseClient();
  if (!supabase) return fail(UNAVAILABLE_MESSAGE);
  const { data } = await supabase.auth.getUser();
  const authUser = data.user ?? null;
  if (!authUser) return fail(import.meta.env.DEV ? "Not authenticated (no current user)." : "Please sign in.");

  if (authUser.id !== userId && import.meta.env.DEV) {
    console.error("[AppSettings] userId mismatch", { passedUserId: userId, authUserId: authUser.id });
  }

  const { data: profileRow, error } = await supabase.from("profiles").select("id").eq("id", authUser.id).maybeSingle();
  if (error) {
    logDevPostgrestError("profiles select error", error, { authUserId: authUser.id });
    return fail(import.meta.env.DEV ? formatPostgrestError(error as PostgrestErrorLike) : error.message);
  }
  if (!profileRow) {
    const { error: createError } = await createProfileForUser(authUser);
    if (createError) {
      logDevPostgrestError("profiles create error", createError, { authUserId: authUser.id });
      return fail(
        import.meta.env.DEV ? formatPostgrestError(createError as unknown as PostgrestErrorLike) : "Please check authentication or permissions."
      );
    }
  }
  return ok(true);
};

const DEFAULT_SETTINGS: Omit<AppSettingsRecord, "id" | "userId" | "createdAt" | "updatedAt"> = {
  theme: "dark",
  accentColor: "ruby",
  compactMode: false,
  animationsEnabled: true,
  insightFrequency: "weekly",
  riskSensitivity: "medium",
  studentMode: false,
};

export const fetchAppSettings = async (userId: string): Promise<ServiceResult<AppSettingsRecord | null>> => {
  if (!isSupabaseMode() || isDemoUser(userId)) return ok(null);
  const supabase = getSupabaseClient();
  if (!supabase) return fail(UNAVAILABLE_MESSAGE);

  const authGuard = await ensureProfileExists(userId);
  if (authGuard.error) return fail(authGuard.error);

  const { data, error } = await supabase.from("app_settings").select("*").eq("user_id", userId).maybeSingle();
  if (error) {
    logDevPostgrestError("select error", error, { userId });
    return fail(import.meta.env.DEV ? formatPostgrestError(error as PostgrestErrorLike) : "Could not load app settings.");
  }
  if (!data) return ok(null);
  return ok(mapDbAppSettingsToAppSettings(data as AppSettingsRow));
};

export const createDefaultAppSettings = async (userId: string): Promise<ServiceResult<AppSettingsRecord>> => {
  if (!isSupabaseMode() || isDemoUser(userId)) return ok({
    id: `demo-settings-${userId}`,
    userId,
    ...DEFAULT_SETTINGS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const supabase = getSupabaseClient();
  if (!supabase) return fail(UNAVAILABLE_MESSAGE);

  const authGuard = await ensureProfileExists(userId);
  if (authGuard.error) return fail(authGuard.error);

  const payload: AppSettingsInsert = mapAppSettingsToDbInsert({
    userId,
    ...DEFAULT_SETTINGS,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const { data, error } = await supabase.from("app_settings").insert(payload).select("*").single();
  if (error) {
    const postgrestError = error as PostgrestErrorLike;
    if (postgrestError.code === "23505") {
      const existing = await fetchAppSettings(userId);
      if (existing.data) return ok(existing.data);
    }
    logDevPostgrestError("insert error", error, { userId, payload });
    return fail(import.meta.env.DEV ? formatPostgrestError(postgrestError) : "Could not create app settings.");
  }
  return ok(mapDbAppSettingsToAppSettings(data as AppSettingsRow));
};

export const updateAppSettings = async (
  userId: string,
  updates: Partial<Pick<AppSettingsRecord, "theme" | "accentColor" | "compactMode" | "animationsEnabled" | "insightFrequency" | "riskSensitivity" | "studentMode">>
): Promise<ServiceResult<AppSettingsRecord>> => {
  if (!isSupabaseMode() || isDemoUser(userId)) {
    const now = new Date().toISOString();
    return ok({
      id: `demo-settings-${userId}`,
      userId,
      ...DEFAULT_SETTINGS,
      ...updates,
      createdAt: now,
      updatedAt: now,
    });
  }
  const supabase = getSupabaseClient();
  if (!supabase) return fail(UNAVAILABLE_MESSAGE);

  const authGuard = await ensureProfileExists(userId);
  if (authGuard.error) return fail(authGuard.error);

  const updatePayload = mapAppSettingsToDbUpdate(updates);
  const { data, error } = await supabase
    .from("app_settings")
    .update(updatePayload)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    logDevPostgrestError("update error", error, { userId, updatePayload });
    return fail(import.meta.env.DEV ? formatPostgrestError(error as PostgrestErrorLike) : "Could not save app settings.");
  }
  return ok(mapDbAppSettingsToAppSettings(data as AppSettingsRow));
};

export const upsertAppSettings = async (userId: string, settings: Omit<AppSettingsRecord, "id" | "createdAt" | "updatedAt">): Promise<ServiceResult<AppSettingsRecord>> => {
  if (!isSupabaseMode() || isDemoUser(userId)) {
    const now = new Date().toISOString();
    return ok({
      id: `demo-settings-${userId}`,
      userId,
      ...DEFAULT_SETTINGS,
      ...settings,
      createdAt: now,
      updatedAt: now,
    });
  }
  const supabase = getSupabaseClient();
  if (!supabase) return fail(UNAVAILABLE_MESSAGE);

  const authGuard = await ensureProfileExists(userId);
  if (authGuard.error) return fail(authGuard.error);

  const payload: AppSettingsInsert = mapAppSettingsToDbInsert({
    userId,
    theme: settings.theme,
    accentColor: settings.accentColor,
    compactMode: settings.compactMode,
    animationsEnabled: settings.animationsEnabled,
    insightFrequency: settings.insightFrequency,
    riskSensitivity: settings.riskSensitivity,
    studentMode: settings.studentMode,
    updatedAt: new Date().toISOString(),
  });

  const { data, error } = await supabase
    .from("app_settings")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    logDevPostgrestError("upsert error", error, { userId, payload });
    return fail(import.meta.env.DEV ? formatPostgrestError(error as PostgrestErrorLike) : "Could not save app settings.");
  }
  return ok(mapDbAppSettingsToAppSettings(data as AppSettingsRow));
};

export const getOrCreateAppSettings = async (userId: string): Promise<ServiceResult<AppSettingsRecord>> => {
  const existing = await fetchAppSettings(userId);
  if (existing.error) return fail(existing.error);
  if (existing.data) return ok(existing.data);
  return createDefaultAppSettings(userId);
};

export const normalizeSettingsForFoundation = (input: AppSettingsRecord): {
  theme: AppSettingsTheme;
  accentColor: AppSettingsAccentColor;
  compactMode: boolean;
  animations: boolean;
  insightFrequency: AppSettingsRecord["insightFrequency"];
  riskSensitivity: AppSettingsRecord["riskSensitivity"];
  studentMode: boolean;
} => ({
  theme: input.theme,
  accentColor: input.accentColor,
  compactMode: input.compactMode,
  animations: input.animationsEnabled,
  insightFrequency: input.insightFrequency,
  riskSensitivity: input.riskSensitivity,
  studentMode: input.studentMode,
});
