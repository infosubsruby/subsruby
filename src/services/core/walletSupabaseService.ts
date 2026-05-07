import type { WalletAccount } from "@/domain/financeModels";
import { fail, type ServiceResult } from "@/services/core/serviceResult";
import type { WalletCreateInput, WalletUpdateInput } from "@/services/core/walletMockService";

const UNAVAILABLE_MESSAGE = "Wallets table is not available in the current Supabase schema.";

export const fetchWalletsSupabase = async (userId: string): Promise<ServiceResult<WalletAccount[]>> => {
  void userId;
  return fail(UNAVAILABLE_MESSAGE);
};

export const createWalletSupabase = async (
  userId: string,
  input: WalletCreateInput
): Promise<ServiceResult<WalletAccount>> => {
  void userId;
  void input;
  return fail(UNAVAILABLE_MESSAGE);
};

export const updateWalletSupabase = async (
  userId: string,
  walletId: string,
  input: WalletUpdateInput
): Promise<ServiceResult<WalletAccount | null>> => {
  void userId;
  void walletId;
  void input;
  return fail(UNAVAILABLE_MESSAGE);
};

export const deleteWalletSupabase = async (userId: string, walletId: string): Promise<ServiceResult<boolean>> => {
  void userId;
  void walletId;
  return fail(UNAVAILABLE_MESSAGE);
};
