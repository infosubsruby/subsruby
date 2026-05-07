import { financeMockDataBundle } from "@/data/mock/financeMockData";
import type {
  AIInsight,
  AppSettings,
  Budget,
  FeatureAccessEntry,
  Goal,
  MonthlyReport,
  RubyAIConversation,
  Subscription,
  Transaction,
  UserProfile,
  WalletAccount,
} from "@/domain/financeModels";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const state = {
  transactions: clone(financeMockDataBundle.transactions),
  subscriptions: clone(financeMockDataBundle.subscriptions),
  wallets: clone(financeMockDataBundle.wallets),
  goals: clone(financeMockDataBundle.goals),
  budgets: clone(financeMockDataBundle.budgets),
  aiInsights: clone(financeMockDataBundle.aiInsights),
  reports: clone(financeMockDataBundle.reports),
  conversations: clone(financeMockDataBundle.rubyAIConversations),
  featureAccess: clone(financeMockDataBundle.featureAccess),
  settings: clone(financeMockDataBundle.appSettings),
  profile: clone(financeMockDataBundle.profile),
};

export const mockStore = {
  transactions: {
    get: () => clone(state.transactions) as Transaction[],
    set: (value: Transaction[]) => {
      state.transactions = clone(value);
    },
  },
  subscriptions: {
    get: () => clone(state.subscriptions) as Subscription[],
    set: (value: Subscription[]) => {
      state.subscriptions = clone(value);
    },
  },
  wallets: {
    get: () => clone(state.wallets) as WalletAccount[],
    set: (value: WalletAccount[]) => {
      state.wallets = clone(value);
    },
  },
  goals: {
    get: () => clone(state.goals) as Goal[],
    set: (value: Goal[]) => {
      state.goals = clone(value);
    },
  },
  budgets: {
    get: () => clone(state.budgets) as Budget[],
    set: (value: Budget[]) => {
      state.budgets = clone(value);
    },
  },
  aiInsights: {
    get: () => clone(state.aiInsights) as AIInsight[],
    set: (value: AIInsight[]) => {
      state.aiInsights = clone(value);
    },
  },
  reports: {
    get: () => clone(state.reports) as MonthlyReport[],
    set: (value: MonthlyReport[]) => {
      state.reports = clone(value);
    },
  },
  conversations: {
    get: () => clone(state.conversations) as RubyAIConversation[],
    set: (value: RubyAIConversation[]) => {
      state.conversations = clone(value);
    },
  },
  featureAccess: {
    get: () => clone(state.featureAccess) as FeatureAccessEntry[],
    set: (value: FeatureAccessEntry[]) => {
      state.featureAccess = clone(value);
    },
  },
  settings: {
    get: () => clone(state.settings) as AppSettings,
    set: (value: AppSettings) => {
      state.settings = clone(value);
    },
  },
  profile: {
    get: () => clone(state.profile) as UserProfile,
    set: (value: UserProfile) => {
      state.profile = clone(value);
    },
  },
};

export const asyncResolve = async <T>(data: T, delayMs = 80): Promise<T> =>
  new Promise((resolve) => {
    window.setTimeout(() => resolve(clone(data)), delayMs);
  });
