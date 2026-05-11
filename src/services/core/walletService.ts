import type { WalletAccount } from "@/domain/financeModels";
import { isSupabaseMode } from "@/lib/config/dataMode";
import type { ServiceResult } from "@/services/core/serviceResult";
import {
  createWalletMock,
  deleteWalletMock,
  fetchWalletsMock,
  updateWalletMock,
  type WalletCreateInput,
  type WalletUpdateInput,
} from "@/services/core/walletMockService";
import {
  createWalletSupabase,
  deleteWalletSupabase,
  fetchWalletsSupabase,
  updateWalletSupabase,
} from "@/services/core/walletSupabaseService";

const isDemoUser = (userId: string): boolean => userId === "demo-user" || userId.startsWith("demo-");

const resolveWalletCall = async <T>(
  userId: string,
  supabaseCall: () => Promise<ServiceResult<T>>,
  mockCall: () => Promise<ServiceResult<T>>
): Promise<ServiceResult<T>> => {
  if (!isSupabaseMode() || isDemoUser(userId)) return mockCall();
  return supabaseCall();
};

export const fetchWalletsSafe = async (userId: string): Promise<ServiceResult<WalletAccount[]>> =>
  resolveWalletCall(userId, () => fetchWalletsSupabase(userId), () => fetchWalletsMock(userId));

export const fetchWallets = async (userId: string): Promise<WalletAccount[]> => {
  const result = await fetchWalletsSafe(userId);
  return result.data ?? [];
};

export const createWallet = async (
  userId: string,
  input: WalletCreateInput
): Promise<ServiceResult<WalletAccount>> =>
  resolveWalletCall(userId, () => createWalletSupabase(userId, input), () => createWalletMock(userId, input));

export const updateWallet = async (
  userId: string,
  walletId: string,
  input: WalletUpdateInput
): Promise<ServiceResult<WalletAccount | null>> =>
  resolveWalletCall(
    userId,
    () => updateWalletSupabase(userId, walletId, input),
    () => updateWalletMock(userId, walletId, input)
  );

export const deleteWallet = async (
  userId: string,
  walletId: string
): Promise<ServiceResult<boolean>> =>
  resolveWalletCall(userId, () => deleteWalletSupabase(userId, walletId), () => deleteWalletMock(userId, walletId));
