import type { WalletAccount, WalletType } from "@/domain/financeModels";
import { asyncResolve, mockStore } from "@/services/core/baseMockStore";
import { ok, type ServiceResult } from "@/services/core/serviceResult";

export type WalletCreateInput = Omit<WalletAccount, "id" | "userId" | "createdAt" | "updatedAt"> & {
  id?: string;
};
export type WalletUpdateInput = Partial<WalletCreateInput>;

const createId = () =>
  globalThis.crypto?.randomUUID?.() ?? `mock-wallet-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const normalizeWalletType = (type: WalletType): WalletType => {
  if (
    type === "checking" ||
    type === "savings" ||
    type === "credit" ||
    type === "cash" ||
    type === "crypto" ||
    type === "investment" ||
    type === "custom"
  ) {
    return type;
  }
  return "checking";
};

export const fetchWalletsMock = async (userId: string): Promise<ServiceResult<WalletAccount[]>> => {
  const items = mockStore.wallets.get().filter((item) => item.userId === userId);
  return ok(await asyncResolve(items));
};

export const createWalletMock = async (
  userId: string,
  input: WalletCreateInput
): Promise<ServiceResult<WalletAccount>> => {
  const now = new Date().toISOString();
  const payload: WalletAccount = {
    id: input.id ?? createId(),
    userId,
    name: input.name,
    type: normalizeWalletType(input.type),
    balance: input.balance,
    currency: input.currency,
    provider: input.provider,
    isManual: input.isManual,
    lastSyncedAt: input.lastSyncedAt,
    createdAt: now,
    updatedAt: now,
  };
  mockStore.wallets.set([...mockStore.wallets.get(), payload]);
  return ok(await asyncResolve(payload));
};

export const updateWalletMock = async (
  userId: string,
  walletId: string,
  input: WalletUpdateInput
): Promise<ServiceResult<WalletAccount | null>> => {
  const wallets = mockStore.wallets.get();
  const index = wallets.findIndex((item) => item.id === walletId && item.userId === userId);
  if (index < 0) return ok(await asyncResolve(null));

  const updated: WalletAccount = {
    ...wallets[index],
    ...input,
    userId,
    type: normalizeWalletType(input.type ?? wallets[index].type),
    updatedAt: new Date().toISOString(),
  };
  wallets[index] = updated;
  mockStore.wallets.set(wallets);
  return ok(await asyncResolve(updated));
};

export const deleteWalletMock = async (userId: string, walletId: string): Promise<ServiceResult<boolean>> => {
  const current = mockStore.wallets.get();
  const next = current.filter((item) => !(item.id === walletId && item.userId === userId));
  mockStore.wallets.set(next);
  return ok(await asyncResolve(next.length !== current.length));
};
