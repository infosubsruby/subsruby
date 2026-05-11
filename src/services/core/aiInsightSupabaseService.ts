import type { AIInsight } from "@/domain/financeModels";
import { createProfileForUser } from "@/lib/auth/authService";
import { mapDbAIInsightToAIInsight } from "@/lib/supabase/mappers";
import { getSupabaseClient } from "@/lib/supabase/client";
import { fail, ok, toFriendlyError, type ServiceResult } from "@/services/core/serviceResult";
import type { AIInsightCreateInput, AIInsightUpdateInput } from "@/services/core/aiInsightMockService";
import type { Database } from "@/integrations/supabase/types";
import type { User } from "@supabase/supabase-js";

type AIInsightRow = Database["public"]["Tables"]["ai_insights"]["Row"];
type AIInsightInsert = Database["public"]["Tables"]["ai_insights"]["Insert"];
type AIInsightUpdate = Database["public"]["Tables"]["ai_insights"]["Update"];

const UNAVAILABLE_MESSAGE = "AI Insights are unavailable because Supabase is not configured.";

const getClientOrFail = (): ReturnType<typeof getSupabaseClient> => getSupabaseClient();

type PostgrestErrorLike = {
  message: string;
  code?: string | null;
  details?: string | null;
  hint?: string | null;
};

const formatPostgrestError = (error: PostgrestErrorLike): string => {
  const parts: string[] = [error.message];
  if (error.code) parts.push(`code=${error.code}`);
  if (error.details) parts.push(`details=${error.details}`);
  if (error.hint) parts.push(`hint=${error.hint}`);
  return parts.join(" | ");
};

const isValidSeverity = (value: string): value is AIInsight["severity"] =>
  value === "info" || value === "success" || value === "warning" || value === "critical";

const normalizeSeverity = (value: string | null | undefined): AIInsight["severity"] => {
  if (typeof value === "string" && isValidSeverity(value)) return value;
  return "info";
};

const ensureProfileExists = async (
  supabase: NonNullable<ReturnType<typeof getSupabaseClient>>,
  authUser: User
) => {
  const { data: existingProfile, error: selectError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", authUser.id)
    .maybeSingle();

  if (selectError) {
    return { error: formatPostgrestError(selectError as unknown as PostgrestErrorLike) };
  }

  if (existingProfile) return { error: null };

  const { error: createError } = await createProfileForUser(authUser);
  if (createError) {
    return { error: formatPostgrestError(createError as unknown as PostgrestErrorLike) };
  }

  return { error: null };
};

const mapAIInsightInputToDbUpdate = (input: AIInsightUpdateInput): AIInsightUpdate => {
  const update: AIInsightUpdate = {};
  if (typeof input.type === "string") update.type = input.type;
  if (typeof input.title === "string") update.title = input.title;
  if (typeof input.description === "string") update.description = input.description;
  if (typeof input.severity === "string") update.severity = normalizeSeverity(input.severity);
  if (typeof input.confidence === "number") update.confidence = input.confidence;
  if (typeof input.financialImpact === "number") update.financial_impact = input.financialImpact;
  if (input.suggestedAction !== undefined) update.suggested_action = input.suggestedAction || null;
  if (input.relatedEntityType !== undefined) update.related_entity_type = input.relatedEntityType;
  if (input.relatedEntityId !== undefined) update.related_entity_id = input.relatedEntityId;
  if (typeof input.isResolved === "boolean") update.is_resolved = input.isResolved;
  if (input.resolvedAt !== undefined) update.resolved_at = input.resolvedAt;
  update.updated_at = new Date().toISOString();
  return update;
};

const createId = () =>
  globalThis.crypto?.randomUUID?.() ?? `insight-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const fetchAIInsightsSupabase = async (userId: string): Promise<ServiceResult<AIInsight[]>> => {
  const supabase = getClientOrFail();
  if (!supabase) return fail(UNAVAILABLE_MESSAGE);
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const authUserId = authData.user?.id ?? null;
    if (!authUserId) {
      if (import.meta.env.DEV) {
        console.error("[AIInsights][fetch] No authenticated user", {
          passedUserId: userId,
          authError: authError?.message ?? null,
        });
      }
      return fail(import.meta.env.DEV ? "Not authenticated (no current user)." : "Please sign in to load insights.");
    }

    if (authUserId !== userId && import.meta.env.DEV) {
      console.error("[AIInsights][fetch] Passed userId does not match auth user id", {
        passedUserId: userId,
        authUserId,
      });
    }

    const { data, error } = await supabase
      .from("ai_insights")
      .select("*")
      .eq("user_id", authUserId)
      .order("created_at", { ascending: false });

    if (error) {
      if (import.meta.env.DEV) {
        console.error("[AIInsights][fetch] Supabase error", {
          authUserId,
          passedUserId: userId,
          error: {
            message: error.message,
            code: (error as unknown as PostgrestErrorLike).code,
            details: (error as unknown as PostgrestErrorLike).details,
            hint: (error as unknown as PostgrestErrorLike).hint,
          },
        });
      }
      return fail(import.meta.env.DEV ? formatPostgrestError(error as unknown as PostgrestErrorLike) : error.message);
    }

    const rows = (data ?? []) as AIInsightRow[];
    return ok(rows.map((row) => mapDbAIInsightToAIInsight(row)));
  } catch (error) {
    if (import.meta.env.DEV) console.error("[AIInsights][fetch] Unexpected error", { userId, error });
    return fail(toFriendlyError(error, "Failed to fetch AI insights."));
  }
};

export const createAIInsightSupabase = async (
  userId: string,
  input: AIInsightCreateInput
): Promise<ServiceResult<AIInsight>> => {
  const supabase = getClientOrFail();
  if (!supabase) return fail(UNAVAILABLE_MESSAGE);
  const now = new Date().toISOString();
  const resolvedId = input.id ?? createId();
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const authUserId = authData.user?.id ?? null;
    if (!authUserId) {
      if (import.meta.env.DEV) {
        console.error("[AIInsights][create] No authenticated user", {
          passedUserId: userId,
          authError: authError?.message ?? null,
        });
      }
      return fail(import.meta.env.DEV ? "Not authenticated (no current user)." : "Please sign in to save this data.");
    }

    const profileEnsure = await ensureProfileExists(supabase, authData.user);
    if (profileEnsure.error) {
      if (import.meta.env.DEV) {
        console.error("[AIInsights][create] Failed to ensure profile exists", {
          authUserId,
          passedUserId: userId,
          error: profileEnsure.error,
        });
      }
      return fail(
        import.meta.env.DEV
          ? `Could not ensure profile exists: ${profileEnsure.error}`
          : "Could not save insight. Please check authentication or permissions."
      );
    }

    const payload: AIInsightInsert = {
      id: resolvedId,
      user_id: authUserId,
      type: input.type,
      title: input.title,
      description: input.description,
      severity: normalizeSeverity(input.severity),
      confidence: input.confidence,
      financial_impact: input.financialImpact,
      suggested_action: input.suggestedAction || null,
      related_entity_type: input.relatedEntityType,
      related_entity_id: input.relatedEntityId,
      is_resolved: input.isResolved ?? false,
      resolved_at: input.resolvedAt ?? null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase.from("ai_insights").insert(payload).select("*").single();
    if (error || !data) {
      if (import.meta.env.DEV && error) {
        console.error("[AIInsights][create] Supabase insert failed", {
          passedUserId: userId,
          authUserId,
          payload,
          error: {
            message: error.message,
            code: (error as unknown as PostgrestErrorLike).code,
            details: (error as unknown as PostgrestErrorLike).details,
            hint: (error as unknown as PostgrestErrorLike).hint,
          },
        });
      }
      if (error) {
        return fail(
          import.meta.env.DEV
            ? formatPostgrestError(error as unknown as PostgrestErrorLike)
            : "Could not save insight. Please check authentication or permissions."
        );
      }
      return fail("Could not save insight. Please check authentication or permissions.");
    }

    return ok(mapDbAIInsightToAIInsight(data as AIInsightRow));
  } catch (error) {
    if (import.meta.env.DEV) console.error("[AIInsights][create] Unexpected error", { userId, input, error });
    return fail(
      import.meta.env.DEV
        ? toFriendlyError(error, "Could not save insight.")
        : "Could not save insight. Please check authentication or permissions."
    );
  }
};

export const updateAIInsightSupabase = async (
  userId: string,
  insightId: string,
  input: AIInsightUpdateInput
): Promise<ServiceResult<AIInsight | null>> => {
  const supabase = getClientOrFail();
  if (!supabase) return fail(UNAVAILABLE_MESSAGE);
  const payload = mapAIInsightInputToDbUpdate(input);

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const authUserId = authData.user?.id ?? null;
    if (!authUserId) {
      if (import.meta.env.DEV) {
        console.error("[AIInsights][update] No authenticated user", {
          passedUserId: userId,
          authError: authError?.message ?? null,
        });
      }
      return fail(import.meta.env.DEV ? "Not authenticated (no current user)." : "Please sign in to update this data.");
    }

    const { data, error } = await supabase
      .from("ai_insights")
      .update(payload)
      .eq("id", insightId)
      .eq("user_id", authUserId)
      .select("*")
      .maybeSingle();

    if (error) {
      if (import.meta.env.DEV) {
        console.error("[AIInsights][update] Supabase error", {
          authUserId,
          passedUserId: userId,
          insightId,
          payload,
          error: {
            message: error.message,
            code: (error as unknown as PostgrestErrorLike).code,
            details: (error as unknown as PostgrestErrorLike).details,
            hint: (error as unknown as PostgrestErrorLike).hint,
          },
        });
      }
      return fail(import.meta.env.DEV ? formatPostgrestError(error as unknown as PostgrestErrorLike) : error.message);
    }

    if (!data) return ok(null);
    return ok(mapDbAIInsightToAIInsight(data as AIInsightRow));
  } catch (error) {
    if (import.meta.env.DEV) console.error("[AIInsights][update] Unexpected error", { userId, insightId, payload, error });
    return fail(toFriendlyError(error, "Failed to update insight."));
  }
};

export const resolveAIInsightSupabase = async (
  userId: string,
  insightId: string
): Promise<ServiceResult<AIInsight | null>> => {
  return updateAIInsightSupabase(userId, insightId, { isResolved: true, resolvedAt: new Date().toISOString() });
};

export const deleteAIInsightSupabase = async (
  userId: string,
  insightId: string
): Promise<ServiceResult<boolean>> => {
  const supabase = getClientOrFail();
  if (!supabase) return fail(UNAVAILABLE_MESSAGE);

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const authUserId = authData.user?.id ?? null;
    if (!authUserId) {
      if (import.meta.env.DEV) {
        console.error("[AIInsights][delete] No authenticated user", {
          passedUserId: userId,
          authError: authError?.message ?? null,
        });
      }
      return fail(import.meta.env.DEV ? "Not authenticated (no current user)." : "Please sign in to delete this data.");
    }

    const { data, error } = await supabase
      .from("ai_insights")
      .delete()
      .eq("id", insightId)
      .eq("user_id", authUserId)
      .select("id");

    if (error) {
      if (import.meta.env.DEV) {
        console.error("[AIInsights][delete] Supabase error", {
          authUserId,
          passedUserId: userId,
          insightId,
          error: {
            message: error.message,
            code: (error as unknown as PostgrestErrorLike).code,
            details: (error as unknown as PostgrestErrorLike).details,
            hint: (error as unknown as PostgrestErrorLike).hint,
          },
        });
      }
      return fail(import.meta.env.DEV ? formatPostgrestError(error as unknown as PostgrestErrorLike) : error.message);
    }

    return ok((data?.length ?? 0) > 0);
  } catch (error) {
    if (import.meta.env.DEV) console.error("[AIInsights][delete] Unexpected error", { userId, insightId, error });
    return fail(toFriendlyError(error, "Failed to delete insight."));
  }
};
