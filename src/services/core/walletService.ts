import type { WalletAccount } from "@/domain/financeModels";
import { asyncResolve, mockStore } from "@/services/core/baseMockStore";

export const fetchWallets = async (userId: string): Promise<WalletAccount[]> => {
  const items = mockStore.wallets.get().filter((item) => item.userId === userId);
  return asyncResolve(items);
};

export const createWallet = async (payload: WalletAccount): Promise<WalletAccount> => {
  const next = [...mockStore.wallets.get(), payload];
  mockStore.wallets.set(next);
  return asyncResolve(payload);
};

export const updateWallet = async (id: string, payload: Partial<WalletAccount>): Promise<WalletAccount | null> => {
  const items = mockStore.wallets.get();
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) return asyncResolve(null);
  const updated = { ...items[index], ...payload, updatedAt: new Date().toISOString() };
  items[index] = updated;
  mockStore.wallets.set(items);
  return asyncResolve(updated);
};

export const deleteWallet = async (id: string): Promise<boolean> => {
  const current = mockStore.wallets.get();
  const next = current.filter((item) => item.id !== id);
  mockStore.wallets.set(next);
  return asyncResolve(next.length !== current.length);
};
