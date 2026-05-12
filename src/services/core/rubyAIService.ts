import type { RubyAIConversation, RubyAIMessage, RubyAIMessageRole } from "@/domain/financeModels";
import { createProfileForUser } from "@/lib/auth/authService";
import { isSupabaseMode } from "@/lib/config/dataMode";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Json } from "@/integrations/supabase/types";
import {
  mapDbRubyAIConversationToConversation,
  mapDbRubyAIMessageToMessage,
  mapRubyAIConversationToDbInsert,
  mapRubyAIMessageToDbInsert,
} from "@/lib/supabase/mappers";
import { asyncResolve, mockStore } from "@/services/core/baseMockStore";
import { fail, ok, toFriendlyError, type ServiceResult } from "@/services/core/serviceResult";

type RubyAIConversationRow = Database["public"]["Tables"]["ruby_ai_conversations"]["Row"];
type RubyAIConversationInsert = Database["public"]["Tables"]["ruby_ai_conversations"]["Insert"];
type RubyAIConversationUpdate = Database["public"]["Tables"]["ruby_ai_conversations"]["Update"];

type RubyAIMessageRow = Database["public"]["Tables"]["ruby_ai_messages"]["Row"];
type RubyAIMessageInsert = Database["public"]["Tables"]["ruby_ai_messages"]["Insert"];

type PostgrestErrorLike = {
  message: string;
  code?: string | null;
  details?: string | null;
  hint?: string | null;
};

const UNAVAILABLE_MESSAGE = "Ruby AI is unavailable because Supabase is not configured.";

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
  console.error(`[RubyAI] ${scope}`, {
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
    console.error("[RubyAI] userId mismatch", { passedUserId: userId, authUserId: authUser.id });
  }

  const { data: profileRow, error } = await supabase.from("profiles").select("id").eq("id", authUser.id).maybeSingle();
  if (error) {
    logDevPostgrestError("profiles select error", error, { authUserId: authUser.id });
    return fail(import.meta.env.DEV ? formatPostgrestError(error as unknown as PostgrestErrorLike) : error.message);
  }
  if (!profileRow) {
    const { error: createError } = await createProfileForUser(authUser);
    if (createError) {
      logDevPostgrestError("profiles create error", createError, { authUserId: authUser.id });
      return fail(
        import.meta.env.DEV
          ? formatPostgrestError(createError as unknown as PostgrestErrorLike)
          : "Please check authentication or permissions."
      );
    }
  }
  return ok(true);
};

const resolveRubyAICall = async <T>(
  userId: string,
  supabaseCall: () => Promise<ServiceResult<T>>,
  fallbackCall: () => Promise<ServiceResult<T>>
): Promise<ServiceResult<T>> => {
  if (!isSupabaseMode() || isDemoUser(userId)) return fallbackCall();
  return supabaseCall();
};

const toTitleFromPrompt = (prompt: string): string => {
  const text = prompt.toLowerCase();
  if (text.includes("subscription")) return "Subscription Review";
  if (text.includes("budget")) return "Budget Planning";
  if (text.includes("goal")) return "Goal Strategy";
  if (text.includes("spend") || text.includes("expense")) return "Spending Analysis";
  if (text.includes("save") || text.includes("savings")) return "Savings Plan";
  if (text.includes("health")) return "Health Score";
  return "New Ruby AI Chat";
};

const safeMetadata = (value: RubyAIMessage["metadata"] | undefined): RubyAIMessage["metadata"] => value ?? {};

const buildRuleBasedAssistantReply = (input: {
  prompt: string;
  hasMonthlyReport: boolean;
  latestMonth?: string;
  savingsRatePct?: number;
  healthScore?: number;
  openInsightsCount: number;
  goalsCount: number;
  walletsCount: number;
  subscriptionsCount: number;
}): string => {
  const text = input.prompt.toLowerCase();
  const contextParts: string[] = [];
  if (input.hasMonthlyReport && input.latestMonth) {
    const sr = typeof input.savingsRatePct === "number" ? `${input.savingsRatePct.toFixed(1)}%` : "n/a";
    const hs = typeof input.healthScore === "number" ? `${Math.round(input.healthScore)}/100` : "n/a";
    contextParts.push(`latest monthly report (${input.latestMonth}): savings rate ${sr}, health score ${hs}`);
  }
  if (input.subscriptionsCount > 0) contextParts.push(`${input.subscriptionsCount} tracked financial subscriptions`);
  if (input.goalsCount > 0) contextParts.push(`${input.goalsCount} goals`);
  if (input.walletsCount > 0) contextParts.push(`${input.walletsCount} wallets`);
  if (input.openInsightsCount > 0) contextParts.push(`${input.openInsightsCount} unresolved insights`);

  const contextLine = contextParts.length ? `Based on your available financial data (${contextParts.join(", ")}), ` : "Based on your available financial data, ";

  if (text.includes("save")) {
    return `${contextLine}here’s a rule-based savings approach: 1) reduce your top variable spending category by 5–10%, 2) cap recurring subscriptions to a fixed monthly ceiling, 3) automate a small transfer right after payday, and 4) re-check your monthly report to confirm savings rate improvement.`;
  }
  if (text.includes("subscription")) {
    return `${contextLine}Ruby AI can help with a rule-based subscription review: list your recurring payments, identify the top 2 costs, cancel or downgrade one low-value item, and set a recurring-cost ceiling (for example, 10–15% of monthly income).`;
  }
  if (text.includes("budget")) {
    return `${contextLine}a practical budget improvement is to compare your category spending to income and goals, then set 2–3 category caps for the next 30 days. Track mid-month progress and adjust only one cap at a time.`;
  }
  if (text.includes("goal")) {
    return `${contextLine}a simple goal strategy is to prioritize one goal first, redirect surplus cash flow to it consistently, and review progress monthly. If you have multiple goals, choose the highest priority and avoid splitting small contributions across too many targets.`;
  }
  return `${contextLine}Ruby AI is ready to help with spending, goals, subscriptions, and financial health using rule-based guidance. Ask about savings, budgets, subscriptions, or a monthly report review.`;
};

const fetchContextSnapshot = async (authUserId: string): Promise<{
  hasMonthlyReport: boolean;
  latestMonth?: string;
  savingsRatePct?: number;
  healthScore?: number;
  openInsightsCount: number;
  goalsCount: number;
  walletsCount: number;
  subscriptionsCount: number;
}> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      hasMonthlyReport: false,
      openInsightsCount: 0,
      goalsCount: 0,
      walletsCount: 0,
      subscriptionsCount: 0,
    };
  }

  const [
    latestReportRes,
    goalsRes,
    walletsRes,
    subsRes,
    insightsRes,
  ] = await Promise.all([
    supabase
      .from("monthly_reports")
      .select("month,savings_rate,health_score")
      .eq("user_id", authUserId)
      .order("month", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("goals").select("id", { count: "exact", head: true }).eq("user_id", authUserId),
    supabase.from("wallets").select("id", { count: "exact", head: true }).eq("user_id", authUserId),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("user_id", authUserId),
    supabase.from("ai_insights").select("id", { count: "exact", head: true }).eq("user_id", authUserId).eq("is_resolved", false),
  ]);

  const reportRow = latestReportRes.data ?? null;

  return {
    hasMonthlyReport: Boolean(reportRow?.month),
    latestMonth: reportRow?.month ?? undefined,
    savingsRatePct: reportRow?.savings_rate ?? undefined,
    healthScore: reportRow?.health_score ?? undefined,
    goalsCount: goalsRes.count ?? 0,
    walletsCount: walletsRes.count ?? 0,
    subscriptionsCount: subsRes.count ?? 0,
    openInsightsCount: insightsRes.count ?? 0,
  };
};

export const fetchRubyAIConversationsSafe = async (userId: string): Promise<ServiceResult<RubyAIConversation[]>> =>
  resolveRubyAICall(
    userId,
    async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return fail(UNAVAILABLE_MESSAGE);
      try {
        const profileResult = await ensureProfileExists(userId);
        if (profileResult.error) return fail(profileResult.error);

        const { data: authData } = await supabase.auth.getUser();
        const authUserId = authData.user?.id ?? null;
        if (!authUserId) return fail("Please sign in to view Ruby AI conversations.");

        const { data, error } = await supabase
          .from("ruby_ai_conversations")
          .select("*")
          .eq("user_id", authUserId)
          .order("updated_at", { ascending: false });

        if (error) {
          logDevPostgrestError("fetch conversations error", error, { authUserId });
          return fail(import.meta.env.DEV ? formatPostgrestError(error as unknown as PostgrestErrorLike) : error.message);
        }

        const rows = (data ?? []) as RubyAIConversationRow[];
        return ok(rows.map(mapDbRubyAIConversationToConversation));
      } catch (error) {
        return fail(toFriendlyError(error, "Failed to load Ruby AI conversations."));
      }
    },
    async () => ok(mockStore.conversations.get().filter((item) => item.userId === userId))
  );

export const fetchRubyAIConversations = async (userId: string): Promise<RubyAIConversation[]> => {
  const result = await fetchRubyAIConversationsSafe(userId);
  return result.data ?? [];
};

export const fetchRubyAIConversationSafe = async (
  userId: string,
  conversationId: string
): Promise<ServiceResult<RubyAIConversation | null>> =>
  resolveRubyAICall(
    userId,
    async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return fail(UNAVAILABLE_MESSAGE);
      try {
        const profileResult = await ensureProfileExists(userId);
        if (profileResult.error) return fail(profileResult.error);
        const { data: authData } = await supabase.auth.getUser();
        const authUserId = authData.user?.id ?? null;
        if (!authUserId) return fail("Please sign in to view Ruby AI conversations.");

        const { data, error } = await supabase
          .from("ruby_ai_conversations")
          .select("*")
          .eq("id", conversationId)
          .eq("user_id", authUserId)
          .maybeSingle();

        if (error) {
          logDevPostgrestError("fetch conversation error", error, { authUserId, conversationId });
          return fail(import.meta.env.DEV ? formatPostgrestError(error as unknown as PostgrestErrorLike) : error.message);
        }
        if (!data) return ok(null);
        return ok(mapDbRubyAIConversationToConversation(data as RubyAIConversationRow));
      } catch (error) {
        return fail(toFriendlyError(error, "Failed to load conversation."));
      }
    },
    async () => {
      const conv = mockStore.conversations.get().find((item) => item.userId === userId && item.id === conversationId) ?? null;
      return ok(conv);
    }
  );

export const createRubyAIConversationSafe = async (
  userId: string,
  input: { title: string; mode?: string | null }
): Promise<ServiceResult<RubyAIConversation>> =>
  resolveRubyAICall(
    userId,
    async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return fail(UNAVAILABLE_MESSAGE);
      try {
        const profileResult = await ensureProfileExists(userId);
        if (profileResult.error) return fail(profileResult.error);
        const { data: authData } = await supabase.auth.getUser();
        const authUserId = authData.user?.id ?? null;
        if (!authUserId) return fail("Please sign in to create a conversation.");

        const now = new Date().toISOString();
        const payload: RubyAIConversationInsert = mapRubyAIConversationToDbInsert({
          userId: authUserId,
          title: input.title,
          mode: input.mode ?? null,
          createdAt: now,
          updatedAt: now,
        });

        const { data, error } = await supabase.from("ruby_ai_conversations").insert(payload).select("*").single();
        if (error) {
          logDevPostgrestError("create conversation error", error, { authUserId, payload });
          return fail(import.meta.env.DEV ? formatPostgrestError(error as unknown as PostgrestErrorLike) : error.message);
        }
        return ok(mapDbRubyAIConversationToConversation(data as RubyAIConversationRow));
      } catch (error) {
        return fail(toFriendlyError(error, "Failed to create conversation."));
      }
    },
    async () => {
      const now = new Date().toISOString();
      const conversation: RubyAIConversation = {
        id: `conv-${userId}-${now}`,
        userId,
        title: input.title,
        contextTag: input.mode ?? "general",
        createdAt: now,
        updatedAt: now,
        messages: [],
      };
      mockStore.conversations.set([conversation, ...mockStore.conversations.get()]);
      return ok(conversation);
    }
  );

export const updateRubyAIConversationSafe = async (
  userId: string,
  conversationId: string,
  input: { title?: string; mode?: string | null }
): Promise<ServiceResult<RubyAIConversation>> =>
  resolveRubyAICall(
    userId,
    async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return fail(UNAVAILABLE_MESSAGE);
      try {
        const profileResult = await ensureProfileExists(userId);
        if (profileResult.error) return fail(profileResult.error);
        const { data: authData } = await supabase.auth.getUser();
        const authUserId = authData.user?.id ?? null;
        if (!authUserId) return fail("Please sign in to update a conversation.");

        const update: RubyAIConversationUpdate = { updated_at: new Date().toISOString() };
        if (typeof input.title === "string") update.title = input.title;
        if (input.mode !== undefined) update.mode = input.mode;

        const { data, error } = await supabase
          .from("ruby_ai_conversations")
          .update(update)
          .eq("id", conversationId)
          .eq("user_id", authUserId)
          .select("*")
          .single();

        if (error) {
          logDevPostgrestError("update conversation error", error, { authUserId, conversationId, update });
          return fail(import.meta.env.DEV ? formatPostgrestError(error as unknown as PostgrestErrorLike) : error.message);
        }
        return ok(mapDbRubyAIConversationToConversation(data as RubyAIConversationRow));
      } catch (error) {
        return fail(toFriendlyError(error, "Failed to update conversation."));
      }
    },
    async () => {
      const items = mockStore.conversations.get();
      const idx = items.findIndex((c) => c.userId === userId && c.id === conversationId);
      if (idx < 0) return fail("Conversation not found.");
      const now = new Date().toISOString();
      const next: RubyAIConversation = {
        ...items[idx],
        title: input.title ?? items[idx].title,
        contextTag: input.mode ?? items[idx].contextTag,
        updatedAt: now,
      };
      items[idx] = next;
      mockStore.conversations.set(items);
      return ok(next);
    }
  );

export const deleteRubyAIConversationSafe = async (
  userId: string,
  conversationId: string
): Promise<ServiceResult<boolean>> =>
  resolveRubyAICall(
    userId,
    async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return fail(UNAVAILABLE_MESSAGE);
      try {
        const profileResult = await ensureProfileExists(userId);
        if (profileResult.error) return fail(profileResult.error);
        const { data: authData } = await supabase.auth.getUser();
        const authUserId = authData.user?.id ?? null;
        if (!authUserId) return fail("Please sign in to delete a conversation.");

        const { error } = await supabase
          .from("ruby_ai_conversations")
          .delete()
          .eq("id", conversationId)
          .eq("user_id", authUserId);

        if (error) {
          logDevPostgrestError("delete conversation error", error, { authUserId, conversationId });
          return fail(import.meta.env.DEV ? formatPostgrestError(error as unknown as PostgrestErrorLike) : error.message);
        }
        return ok(true);
      } catch (error) {
        return fail(toFriendlyError(error, "Failed to delete conversation."));
      }
    },
    async () => {
      const items = mockStore.conversations.get().filter((c) => !(c.userId === userId && c.id === conversationId));
      mockStore.conversations.set(items);
      return ok(true);
    }
  );

export const fetchRubyAIMessagesSafe = async (
  userId: string,
  conversationId: string
): Promise<ServiceResult<RubyAIMessage[]>> =>
  resolveRubyAICall(
    userId,
    async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return fail(UNAVAILABLE_MESSAGE);
      try {
        const profileResult = await ensureProfileExists(userId);
        if (profileResult.error) return fail(profileResult.error);
        const { data: authData } = await supabase.auth.getUser();
        const authUserId = authData.user?.id ?? null;
        if (!authUserId) return fail("Please sign in to view messages.");

        const { data, error } = await supabase
          .from("ruby_ai_messages")
          .select("*")
          .eq("user_id", authUserId)
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (error) {
          logDevPostgrestError("fetch messages error", error, { authUserId, conversationId });
          return fail(import.meta.env.DEV ? formatPostgrestError(error as unknown as PostgrestErrorLike) : error.message);
        }

        const rows = (data ?? []) as RubyAIMessageRow[];
        return ok(rows.map(mapDbRubyAIMessageToMessage));
      } catch (error) {
        return fail(toFriendlyError(error, "Failed to load messages."));
      }
    },
    async () => {
      const conv = mockStore.conversations.get().find((c) => c.userId === userId && c.id === conversationId);
      return ok(conv?.messages ?? []);
    }
  );

export const createRubyAIMessageSafe = async (
  userId: string,
  conversationId: string,
  input: { role: RubyAIMessageRole; content: string; metadata?: RubyAIMessage["metadata"] }
): Promise<ServiceResult<RubyAIMessage>> =>
  resolveRubyAICall(
    userId,
    async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return fail(UNAVAILABLE_MESSAGE);
      try {
        const profileResult = await ensureProfileExists(userId);
        if (profileResult.error) return fail(profileResult.error);
        const { data: authData } = await supabase.auth.getUser();
        const authUserId = authData.user?.id ?? null;
        if (!authUserId) return fail("Please sign in to send a message.");

        const payload: RubyAIMessageInsert = mapRubyAIMessageToDbInsert({
          userId: authUserId,
          conversationId,
          role: input.role,
          content: input.content,
          metadata: safeMetadata(input.metadata),
          createdAt: new Date().toISOString(),
        });

        const { data, error } = await supabase.from("ruby_ai_messages").insert(payload).select("*").single();
        if (error) {
          logDevPostgrestError("create message error", error, { authUserId, conversationId, payload });
          return fail(import.meta.env.DEV ? formatPostgrestError(error as unknown as PostgrestErrorLike) : error.message);
        }
        return ok(mapDbRubyAIMessageToMessage(data as RubyAIMessageRow));
      } catch (error) {
        return fail(toFriendlyError(error, "Failed to send message."));
      }
    },
    async () => {
      const conversations = mockStore.conversations.get();
      const index = conversations.findIndex((c) => c.userId === userId && c.id === conversationId);
      if (index < 0) return fail("Conversation not found.");
      const createdAt = new Date().toISOString();
      const message: RubyAIMessage = {
        id: `msg-${input.role}-${createdAt}`,
        conversationId,
        role: input.role,
        content: input.content,
        createdAt,
        metadata: safeMetadata(input.metadata),
      };
      const nextConversation: RubyAIConversation = {
        ...conversations[index],
        updatedAt: createdAt,
        messages: [...conversations[index].messages, message],
      };
      conversations[index] = nextConversation;
      mockStore.conversations.set(conversations);
      return ok(message);
    }
  );

export const deleteRubyAIMessageSafe = async (
  userId: string,
  messageId: string
): Promise<ServiceResult<boolean>> =>
  resolveRubyAICall(
    userId,
    async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return fail(UNAVAILABLE_MESSAGE);
      try {
        const profileResult = await ensureProfileExists(userId);
        if (profileResult.error) return fail(profileResult.error);
        const { data: authData } = await supabase.auth.getUser();
        const authUserId = authData.user?.id ?? null;
        if (!authUserId) return fail("Please sign in to delete messages.");

        const { error } = await supabase.from("ruby_ai_messages").delete().eq("id", messageId).eq("user_id", authUserId);
        if (error) {
          logDevPostgrestError("delete message error", error, { authUserId, messageId });
          return fail(import.meta.env.DEV ? formatPostgrestError(error as unknown as PostgrestErrorLike) : error.message);
        }
        return ok(true);
      } catch (error) {
        return fail(toFriendlyError(error, "Failed to delete message."));
      }
    },
    async () => ok(true)
  );

export const sendRubyAIMessageSafe = async (
  userId: string,
  conversationId: string | null,
  content: string
): Promise<ServiceResult<{ conversation: RubyAIConversation; messages: RubyAIMessage[] }>> =>
  resolveRubyAICall(
    userId,
    async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return fail(UNAVAILABLE_MESSAGE);

      try {
        const profileResult = await ensureProfileExists(userId);
        if (profileResult.error) return fail(profileResult.error);
        const { data: authData } = await supabase.auth.getUser();
        const authUserId = authData.user?.id ?? null;
        if (!authUserId) return fail("Please sign in to chat with Ruby AI.");

        const prompt = content.trim();
        if (!prompt) return fail("Message cannot be empty.");

        let conversation: RubyAIConversation | null = null;
        if (conversationId) {
          const existingRes = await fetchRubyAIConversationSafe(userId, conversationId);
          if (existingRes.error) return fail(existingRes.error);
          conversation = existingRes.data;
        }

        if (!conversation) {
          const title = toTitleFromPrompt(prompt);
          const createdRes = await createRubyAIConversationSafe(userId, { title, mode: null });
          if (createdRes.error) return fail(createdRes.error);
          conversation = createdRes.data ?? null;
        }

        if (!conversation) return fail("Could not start a conversation.");

        const userInsertRes = await createRubyAIMessageSafe(userId, conversation.id, {
          role: "user",
          content: prompt,
          metadata: { source: "user" },
        });
        if (userInsertRes.error) return fail(userInsertRes.error);

        const snapshot = await fetchContextSnapshot(authUserId);
        const assistantContent = buildRuleBasedAssistantReply({
          prompt,
          ...snapshot,
        });

        const assistantInsertRes = await createRubyAIMessageSafe(userId, conversation.id, {
          role: "assistant",
          content: assistantContent,
          metadata: { source: "rule-based" },
        });
        if (assistantInsertRes.error) return fail(assistantInsertRes.error);

        const nowIso = new Date().toISOString();
        const update: RubyAIConversationUpdate = { updated_at: nowIso };
        const { error: touchError } = await supabase
          .from("ruby_ai_conversations")
          .update(update)
          .eq("id", conversation.id)
          .eq("user_id", authUserId);

        if (touchError) {
          logDevPostgrestError("touch conversation error", touchError, { authUserId, conversationId: conversation.id, update });
        }

        const messagesRes = await fetchRubyAIMessagesSafe(userId, conversation.id);
        if (messagesRes.error) return fail(messagesRes.error);
        const messages = messagesRes.data ?? [];
        const updatedConversation: RubyAIConversation = { ...conversation, updatedAt: nowIso };

        return ok({ conversation: updatedConversation, messages });
      } catch (error) {
        return fail(toFriendlyError(error, "Failed to send message."));
      }
    },
    async () => {
      const prompt = content.trim();
      if (!conversationId) return fail("Conversation not found.");
      if (!prompt) return fail("Message cannot be empty.");

      const conversations = mockStore.conversations.get();
      const index = conversations.findIndex((item) => item.id === conversationId);
      if (index < 0) return fail("Conversation not found.");

      const createdAt = new Date().toISOString();
      const userPayload: RubyAIMessage = {
        id: `msg-user-${createdAt}`,
        conversationId,
        role: "user",
        content: prompt,
        createdAt,
        metadata: { source: "user" },
      };
      const assistantPayload: RubyAIMessage = {
        id: `msg-assistant-${createdAt}`,
        conversationId,
        role: "assistant",
        content: "Based on your available financial data, Ruby AI can provide rule-based guidance once Supabase chat persistence is enabled.",
        createdAt,
        metadata: { source: "mock-placeholder" },
      };

      const nextConversation: RubyAIConversation = {
        ...conversations[index],
        updatedAt: createdAt,
        messages: [...conversations[index].messages, userPayload, assistantPayload],
      };
      conversations[index] = nextConversation;
      mockStore.conversations.set(conversations);
      return ok({ conversation: nextConversation, messages: nextConversation.messages });
    }
  );

export const sendRubyAIMessage = async (
  userId: string,
  conversationId: string | null,
  content: string
): Promise<ServiceResult<{ conversation: RubyAIConversation; messages: RubyAIMessage[] }>> =>
  sendRubyAIMessageSafe(userId, conversationId, content);
