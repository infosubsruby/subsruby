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

const withFallback = async <T>(
  supabaseCall: () => Promise<ServiceResult<T>>,
  mockCall: () => Promise<ServiceResult<T>>
): Promise<ServiceResult<T>> => {
  if (!isSupabaseMode()) return mockCall();
  const result = await supabaseCall();
  if (result.error) return mockCall();
  return result;
};

export const fetchWalletsSafe = async (userId: string): Promise<ServiceResult<WalletAccount[]>> =>
  withFallback(() => fetchWalletsSupabase(userId), () => fetchWalletsMock(userId));

export const fetchWallets = async (userId: string): Promise<WalletAccount[]> => {
  const result = await fetchWalletsSafe(userId);
  return result.data ?? [];
};

export const createWallet = async (
  userId: string,
  input: WalletCreateInput
): Promise<ServiceResult<WalletAccount>> =>
  withFallback(() => createWalletSupabase(userId, input), () => createWalletMock(userId, input));

export const updateWallet = async (
  userId: string,
  walletId: string,
  input: WalletUpdateInput
): Promise<ServiceResult<WalletAccount | null>> =>
  withFallback(() => updateWalletSupabase(userId, walletId, input), () => updateWalletMock(userId, walletId, input));

export const deleteWallet = async (
  userId: string,
  walletId: string
): Promise<ServiceResult<boolean>> =>
  withFallback(() => deleteWalletSupabase(userId, walletId), () => deleteWalletMock(userId, walletId));
