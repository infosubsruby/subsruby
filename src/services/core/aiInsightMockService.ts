import type { AIInsight } from "@/domain/financeModels";
import { asyncResolve, mockStore } from "@/services/core/baseMockStore";
import { ok, type ServiceResult } from "@/services/core/serviceResult";

export type AIInsightCreateInput = Omit<AIInsight, "id" | "userId" | "createdAt" | "updatedAt"> & {
  id?: string;
};
export type AIInsightUpdateInput = Partial<AIInsightCreateInput>;

const createId = () =>
  globalThis.crypto?.randomUUID?.() ?? `mock-insight-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const fetchAIInsightsMock = async (userId: string): Promise<ServiceResult<AIInsight[]>> => {
  const items = mockStore.aiInsights.get().filter((item) => item.userId === userId);
  return ok(await asyncResolve(items));
};

export const createAIInsightMock = async (
  userId: string,
  input: AIInsightCreateInput
): Promise<ServiceResult<AIInsight>> => {
  const now = new Date().toISOString();
  const payload: AIInsight = {
    id: input.id ?? createId(),
    userId,
    type: input.type,
    title: input.title,
    description: input.description,
    severity: input.severity,
    confidence: input.confidence,
    financialImpact: input.financialImpact,
    suggestedAction: input.suggestedAction,
    relatedEntityType: input.relatedEntityType,
    relatedEntityId: input.relatedEntityId,
    isResolved: input.isResolved ?? false,
    createdAt: now,
    resolvedAt: input.resolvedAt ?? null,
    updatedAt: now,
  };
  mockStore.aiInsights.set([...mockStore.aiInsights.get(), payload]);
  return ok(await asyncResolve(payload));
};

export const updateAIInsightMock = async (
  userId: string,
  insightId: string,
  input: AIInsightUpdateInput
): Promise<ServiceResult<AIInsight | null>> => {
  const items = mockStore.aiInsights.get();
  const index = items.findIndex((item) => item.id === insightId && item.userId === userId);
  if (index < 0) return ok(await asyncResolve(null));

  const updated: AIInsight = {
    ...items[index],
    ...input,
    userId,
    id: items[index].id,
    updatedAt: new Date().toISOString(),
  };

  items[index] = updated;
  mockStore.aiInsights.set(items);
  return ok(await asyncResolve(updated));
};

export const resolveAIInsightMock = async (
  userId: string,
  insightId: string
): Promise<ServiceResult<AIInsight | null>> => {
  const items = mockStore.aiInsights.get();
  const index = items.findIndex((item) => item.id === insightId && item.userId === userId);
  if (index < 0) return ok(await asyncResolve(null));

  const now = new Date().toISOString();
  const updated: AIInsight = {
    ...items[index],
    isResolved: true,
    resolvedAt: now,
    updatedAt: now,
  };

  items[index] = updated;
  mockStore.aiInsights.set(items);
  return ok(await asyncResolve(updated));
};

export const deleteAIInsightMock = async (
  userId: string,
  insightId: string
): Promise<ServiceResult<boolean>> => {
  const current = mockStore.aiInsights.get();
  const next = current.filter((item) => !(item.id === insightId && item.userId === userId));
  mockStore.aiInsights.set(next);
  return ok(await asyncResolve(next.length !== current.length));
};
