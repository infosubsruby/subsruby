import { useMemo, useState } from "react";
import type {
  AIInsight,
  AppSettings,
  Budget,
  FeatureAccessEntry,
  Goal,
  MonthlyReport,
  OnboardingState,
  Subscription,
  Transaction,
  User,
  WalletAccount,
} from "@/domain/financeModels";
import { createAsyncState, type AsyncResourceState } from "@/domain/asyncState";
import { financeMockDataBundle } from "@/data/mock/financeMockData";

export interface FinancialDataState {
  currentUser: User | null;
  selectedWalletId: string | null;
  transactions: AsyncResourceState<Transaction[]>;
  subscriptions: AsyncResourceState<Subscription[]>;
  goals: AsyncResourceState<Goal[]>;
  budgets: AsyncResourceState<Budget[]>;
  reports: AsyncResourceState<MonthlyReport[]>;
  aiInsights: AsyncResourceState<AIInsight[]>;
  wallets: AsyncResourceState<WalletAccount[]>;
  featureAccess: AsyncResourceState<FeatureAccessEntry[]>;
  appSettings: AsyncResourceState<AppSettings | null>;
  onboarding: AsyncResourceState<OnboardingState | null>;
}

export const useFinancialDataState = () => {
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(
    financeMockDataBundle.wallets[0]?.id ?? null
  );

  const state = useMemo<FinancialDataState>(
    () => ({
      currentUser: financeMockDataBundle.user,
      selectedWalletId,
      transactions: createAsyncState(financeMockDataBundle.transactions, "success"),
      subscriptions: createAsyncState(financeMockDataBundle.subscriptions, "success"),
      goals: createAsyncState(financeMockDataBundle.goals, "success"),
      budgets: createAsyncState(financeMockDataBundle.budgets, "success"),
      reports: createAsyncState(financeMockDataBundle.reports, "success"),
      aiInsights: createAsyncState(financeMockDataBundle.aiInsights, "success"),
      wallets: createAsyncState(financeMockDataBundle.wallets, "success"),
      featureAccess: createAsyncState(financeMockDataBundle.featureAccess, "success"),
      appSettings: createAsyncState(financeMockDataBundle.appSettings, "success"),
      onboarding: createAsyncState(financeMockDataBundle.onboarding, "success"),
    }),
    [selectedWalletId]
  );

  return {
    state,
    setSelectedWalletId,
  };
};
