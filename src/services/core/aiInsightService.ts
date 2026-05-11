import type { AIInsight } from "@/domain/financeModels";
import { isSupabaseMode } from "@/lib/config/dataMode";
import type { ServiceResult } from "@/services/core/serviceResult";
import {
  createAIInsightMock,
  deleteAIInsightMock,
  fetchAIInsightsMock,
  resolveAIInsightMock,
  updateAIInsightMock,
  type AIInsightCreateInput,
  type AIInsightUpdateInput,
} from "@/services/core/aiInsightMockService";
import {
  createAIInsightSupabase,
  deleteAIInsightSupabase,
  fetchAIInsightsSupabase,
  resolveAIInsightSupabase,
  updateAIInsightSupabase,
} from "@/services/core/aiInsightSupabaseService";

const isDemoUser = (userId: string): boolean => userId === "demo-user" || userId.startsWith("demo-");

const resolveInsightCall = async <T>(
  userId: string,
  supabaseCall: () => Promise<ServiceResult<T>>,
  mockCall: () => Promise<ServiceResult<T>>
): Promise<ServiceResult<T>> => {
  if (!isSupabaseMode() || isDemoUser(userId)) return mockCall();
  return supabaseCall();
};

export const fetchAIInsightsSafe = async (userId: string): Promise<ServiceResult<AIInsight[]>> =>
  resolveInsightCall(userId, () => fetchAIInsightsSupabase(userId), () => fetchAIInsightsMock(userId));

export const fetchAIInsights = async (userId: string): Promise<AIInsight[]> => {
  const result = await fetchAIInsightsSafe(userId);
  return result.data ?? [];
};

export const createAIInsight = async (
  userId: string,
  input: AIInsightCreateInput
): Promise<ServiceResult<AIInsight>> =>
  resolveInsightCall(userId, () => createAIInsightSupabase(userId, input), () => createAIInsightMock(userId, input));

export const updateAIInsight = async (
  userId: string,
  insightId: string,
  input: AIInsightUpdateInput
): Promise<ServiceResult<AIInsight | null>> =>
  resolveInsightCall(
    userId,
    () => updateAIInsightSupabase(userId, insightId, input),
    () => updateAIInsightMock(userId, insightId, input)
  );

export const resolveAIInsight = async (userId: string, insightId: string): Promise<ServiceResult<AIInsight | null>> =>
  resolveInsightCall(userId, () => resolveAIInsightSupabase(userId, insightId), () => resolveAIInsightMock(userId, insightId));

export const deleteAIInsight = async (userId: string, insightId: string): Promise<ServiceResult<boolean>> =>
  resolveInsightCall(userId, () => deleteAIInsightSupabase(userId, insightId), () => deleteAIInsightMock(userId, insightId));
