import type { RubyAIConversation, RubyAIMessage } from "@/domain/financeModels";
import { asyncResolve, mockStore } from "@/services/core/baseMockStore";

export const fetchRubyAIConversations = async (userId: string): Promise<RubyAIConversation[]> => {
  const items = mockStore.conversations.get().filter((item) => item.userId === userId);
  return asyncResolve(items);
};

export const sendRubyAIMessage = async (
  conversationId: string,
  userMessage: string
): Promise<{ user: RubyAIMessage; assistant: RubyAIMessage } | null> => {
  const conversations = mockStore.conversations.get();
  const index = conversations.findIndex((item) => item.id === conversationId);
  if (index < 0) return asyncResolve(null);

  const createdAt = new Date().toISOString();
  const userPayload: RubyAIMessage = {
    id: `msg-user-${createdAt}`,
    conversationId,
    role: "user",
    content: userMessage,
    createdAt,
    metadata: {},
  };
  const assistantPayload: RubyAIMessage = {
    id: `msg-assistant-${createdAt}`,
    conversationId,
    role: "assistant",
    content: "Mock Ruby AI response: backend connector is not enabled yet.",
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
  return asyncResolve({ user: userPayload, assistant: assistantPayload });
};
