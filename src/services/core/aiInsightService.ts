import type { AIInsight } from "@/domain/financeModels";
import { asyncResolve, mockStore } from "@/services/core/baseMockStore";

export const fetchAIInsights = async (userId: string): Promise<AIInsight[]> => {
  const items = mockStore.aiInsights.get().filter((item) => item.userId === userId);
  return asyncResolve(items);
};

export const resolveAIInsight = async (id: string): Promise<AIInsight | null> => {
  const items = mockStore.aiInsights.get();
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return asyncResolve(null);
  const updated: AIInsight = {
    ...items[index],
    resolvedAt: new Date().toISOString(),
  };
  items[index] = updated;
  mockStore.aiInsights.set(items);
  return asyncResolve(updated);
};
