export const subscriptionsKeys = {
  all: ["subscriptions"] as const,
  list: (userId?: string) => [...subscriptionsKeys.all, "list", userId] as const,
};
