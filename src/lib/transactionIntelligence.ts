import type { Budget, Transaction } from "@/hooks/useFinance";

export type TransactionTagType =
  | "recurring_suspected"
  | "duplicate_possible"
  | "anomaly_large"
  | "category_spike"
  | "risky_behavior"
  | "budget_deviation"
  | "unusual_time"
  | "confidence_low";

export type TransactionTag = {
  type: TransactionTagType;
  label: string;
  tone: "info" | "warning" | "critical" | "positive";
};

export type TransactionAnalysis = {
  transactionId: string;
  merchantName: string;
  merchantIcon: string;
  categorySuggestion: string | null;
  categoryConfidence: number;
  recurringLikelihood: number;
  riskScore: number;
  tags: TransactionTag[];
  summary: string;
  notes: string[];
};

export type TransactionGlobalInsight = {
  id: string;
  title: string;
  detail: string;
  tone: "info" | "warning" | "positive";
};

export type TransactionIntelligenceResult = {
  byId: Record<string, TransactionAnalysis>;
  globalInsights: TransactionGlobalInsight[];
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : 0));
const safeNumber = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const normalizeText = (value: string | null | undefined) =>
  (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const merchantKeywordMap: Array<{
  keywords: string[];
  merchant: string;
  icon: string;
  category: string;
  confidence: number;
}> = [
  { keywords: ["netflix"], merchant: "Netflix", icon: "film", category: "Entertainment", confidence: 0.98 },
  { keywords: ["spotify"], merchant: "Spotify", icon: "music", category: "Entertainment", confidence: 0.98 },
  { keywords: ["amazon", "prime"], merchant: "Amazon", icon: "package", category: "Shopping", confidence: 0.9 },
  { keywords: ["uber", "lyft", "taxi"], merchant: "Transport", icon: "car", category: "Transportation", confidence: 0.86 },
  { keywords: ["mcdonald", "burger", "restaurant", "cafe", "coffee"], merchant: "Dining", icon: "utensils", category: "Food & Dining", confidence: 0.84 },
  { keywords: ["shell", "bp", "petrol", "gas"], merchant: "Fuel", icon: "fuel", category: "Transportation", confidence: 0.85 },
  { keywords: ["apple", "icloud"], merchant: "Apple", icon: "smartphone", category: "Utilities", confidence: 0.82 },
  { keywords: ["adobe"], merchant: "Adobe", icon: "monitor", category: "Education", confidence: 0.86 },
  { keywords: ["steam", "playstation", "xbox"], merchant: "Gaming", icon: "gamepad", category: "Entertainment", confidence: 0.9 },
  { keywords: ["salary", "payroll"], merchant: "Employer", icon: "briefcase", category: "Salary", confidence: 0.9 },
];

const getMerchantProfile = (transaction: Transaction) => {
  const source = normalizeText(transaction.description || transaction.category);
  for (const item of merchantKeywordMap) {
    if (item.keywords.some((word) => source.includes(word))) {
      return {
        merchantName: item.merchant,
        merchantIcon: item.icon,
        categorySuggestion: item.category,
        categoryConfidence: item.confidence,
      };
    }
  }

  return {
    merchantName: (transaction.description || transaction.category || "Merchant").slice(0, 32),
    merchantIcon: transaction.type === "income" ? "banknote" : "receipt",
    categorySuggestion: null,
    categoryConfidence: 0.55,
  };
};

const avg = (values: number[]) =>
  values.length ? values.reduce((acc, curr) => acc + curr, 0) / values.length : 0;
const stdDev = (values: number[]) => {
  if (!values.length) return 0;
  const mean = avg(values);
  const variance = avg(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
};

const dateDiffDays = (a: Date, b: Date) =>
  Math.abs(Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24)));

const isNightPurchase = (tx: Transaction) => {
  const created = new Date(tx.created_at || `${tx.date}T12:00:00`);
  if (Number.isNaN(created.getTime())) return false;
  const hour = created.getHours();
  return hour >= 22 || hour <= 5;
};

export const getAutoCategorySuggestion = (
  description: string,
  fallbackType: "income" | "expense"
): { category: string | null; confidence: number; merchant: string } => {
  const normalized = normalizeText(description);
  for (const item of merchantKeywordMap) {
    if (item.keywords.some((word) => normalized.includes(word))) {
      return {
        category: item.category,
        confidence: item.confidence,
        merchant: item.merchant,
      };
    }
  }

  return {
    category: fallbackType === "income" ? "Salary" : null,
    confidence: fallbackType === "income" ? 0.62 : 0.4,
    merchant: "Unknown",
  };
};

export const buildTransactionIntelligence = (
  transactions: Transaction[],
  budgets: Budget[]
): TransactionIntelligenceResult => {
  const safeTransactions = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const expenses = safeTransactions.filter((tx) => tx.type === "expense");
  const categoryHistory: Record<string, number[]> = {};
  for (const tx of expenses) {
    const amount = Math.abs(safeNumber(tx.amount));
    categoryHistory[tx.category] = [...(categoryHistory[tx.category] || []), amount];
  }

  const monthlyBudgetByCategory: Record<string, number> = {};
  for (const budget of budgets) {
    monthlyBudgetByCategory[budget.category] =
      safeNumber(monthlyBudgetByCategory[budget.category]) + safeNumber(budget.limit_amount);
  }

  const monthlySpentByCategory: Record<string, number> = {};
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  for (const tx of expenses) {
    const txDate = new Date(tx.date);
    if (Number.isNaN(txDate.getTime()) || txDate < monthStart) continue;
    monthlySpentByCategory[tx.category] =
      safeNumber(monthlySpentByCategory[tx.category]) + Math.abs(safeNumber(tx.amount));
  }

  // Candidate recurring series by merchant/category/amount neighborhood.
  const recurringKeyMap: Record<string, Transaction[]> = {};
  for (const tx of expenses) {
    const profile = getMerchantProfile(tx);
    const rounded = Math.round(Math.abs(safeNumber(tx.amount)));
    const key = `${normalizeText(profile.merchantName)}|${tx.category}|${rounded}`;
    recurringKeyMap[key] = [...(recurringKeyMap[key] || []), tx];
  }

  const recurringLikelihoodByTxId: Record<string, number> = {};
  Object.values(recurringKeyMap).forEach((series) => {
    if (series.length < 2) return;
    const ordered = [...series].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const intervals: number[] = [];
    for (let i = 1; i < ordered.length; i += 1) {
      const prev = new Date(ordered[i - 1].date);
      const curr = new Date(ordered[i].date);
      if (Number.isNaN(prev.getTime()) || Number.isNaN(curr.getTime())) continue;
      intervals.push(dateDiffDays(curr, prev));
    }
    const intervalAvg = avg(intervals);
    const monthlyPattern = intervalAvg >= 24 && intervalAvg <= 35;
    const weeklyPattern = intervalAvg >= 6 && intervalAvg <= 8;
    const base = monthlyPattern || weeklyPattern ? 0.85 : 0.58;
    const confidence = clamp(base + (series.length - 2) * 0.06, 0.5, 0.97);
    series.forEach((tx) => {
      recurringLikelihoodByTxId[tx.id] = Math.max(recurringLikelihoodByTxId[tx.id] || 0, confidence);
    });
  });

  const duplicateIds = new Set<string>();
  for (let i = 0; i < expenses.length; i += 1) {
    const a = expenses[i];
    const amountA = Math.abs(safeNumber(a.amount));
    const descA = normalizeText(a.description || a.category);
    const dateA = new Date(a.date);
    for (let j = i + 1; j < expenses.length; j += 1) {
      const b = expenses[j];
      const dateB = new Date(b.date);
      const amountB = Math.abs(safeNumber(b.amount));
      if (Math.abs(amountA - amountB) > 0.5) continue;
      if (dateDiffDays(dateA, dateB) > 3) continue;
      const descB = normalizeText(b.description || b.category);
      if (descA && descB && descA === descB) {
        duplicateIds.add(a.id);
        duplicateIds.add(b.id);
      }
    }
  }

  const byId: Record<string, TransactionAnalysis> = {};
  const globalInsights: TransactionGlobalInsight[] = [];

  let largeAnomalyCount = 0;
  let recurringDetectedCount = 0;
  let riskyBehaviorCount = 0;

  for (const tx of safeTransactions) {
    const amount = Math.abs(safeNumber(tx.amount));
    const profile = getMerchantProfile(tx);
    const tags: TransactionTag[] = [];
    const notes: string[] = [];

    const categorySeries = categoryHistory[tx.category] || [];
    const categoryMean = avg(categorySeries);
    const categorySigma = stdDev(categorySeries);
    const zScore =
      tx.type === "expense" && categorySigma > 0
        ? (amount - categoryMean) / categorySigma
        : 0;

    if (tx.type === "expense" && zScore >= 1.9) {
      tags.push({ type: "anomaly_large", label: "Unusual Large Purchase", tone: "warning" });
      notes.push("This purchase exceeds your normal amount pattern for this category.");
      largeAnomalyCount += 1;
    }

    const recurringLikelihood = Math.max(
      tx.is_recurring ? 0.99 : 0,
      recurringLikelihoodByTxId[tx.id] || 0
    );
    if (recurringLikelihood >= 0.72 && tx.type === "expense") {
      tags.push({ type: "recurring_suspected", label: "Recurring Candidate", tone: "info" });
      notes.push("This transaction appears to be recurring based on amount and timing frequency.");
      recurringDetectedCount += 1;
    }

    if (duplicateIds.has(tx.id)) {
      tags.push({ type: "duplicate_possible", label: "Possible Duplicate", tone: "critical" });
      notes.push("A similar transaction with close date and identical amount was detected.");
    }

    const budgetLimit = safeNumber(monthlyBudgetByCategory[tx.category]);
    const categorySpend = safeNumber(monthlySpentByCategory[tx.category]);
    if (budgetLimit > 0 && categorySpend > budgetLimit * 0.9 && tx.type === "expense") {
      tags.push({ type: "budget_deviation", label: "Budget Deviation", tone: "warning" });
      notes.push("Category spending is close to or above the planned monthly budget.");
    }

    if (isNightPurchase(tx) && tx.type === "expense") {
      tags.push({ type: "unusual_time", label: "Night Activity", tone: "info" });
      notes.push("Late-night spending often correlates with impulse behavior.");
    }

    const riskySignal = clamp(
      (tx.type === "expense" ? amount / Math.max(categoryMean || amount, 1) : 0) * 24 +
        (duplicateIds.has(tx.id) ? 18 : 0) +
        (isNightPurchase(tx) ? 8 : 0),
      4,
      98
    );
    if (riskySignal > 64 && tx.type === "expense") {
      tags.push({ type: "risky_behavior", label: "Risk Signal", tone: "warning" });
      riskyBehaviorCount += 1;
    }

    const categorySuggestion =
      profile.categorySuggestion && profile.categorySuggestion !== tx.category
        ? profile.categorySuggestion
        : null;
    if (categorySuggestion && profile.categoryConfidence < 0.68) {
      tags.push({ type: "confidence_low", label: "Low Category Confidence", tone: "info" });
    }

    if (tx.type === "expense" && amount > categoryMean * 1.6 && categorySeries.length > 4) {
      tags.push({ type: "category_spike", label: "Category Spike", tone: "warning" });
    }

    const summaryParts = [
      recurringLikelihood >= 0.72 ? "Recurring-like behavior detected." : null,
      duplicateIds.has(tx.id) ? "Possible duplicate charge." : null,
      zScore >= 1.9 ? "Amount exceeds personal spending baseline." : null,
      budgetLimit > 0 && categorySpend > budgetLimit * 0.9
        ? "Category budget pressure is elevated."
        : null,
    ].filter(Boolean);

    byId[tx.id] = {
      transactionId: tx.id,
      merchantName: profile.merchantName,
      merchantIcon: profile.merchantIcon,
      categorySuggestion,
      categoryConfidence: profile.categoryConfidence,
      recurringLikelihood,
      riskScore: riskySignal,
      tags,
      summary:
        summaryParts[0] ||
        "Transaction matches expected spending behavior with no critical anomaly.",
      notes:
        notes.length > 0
          ? notes
          : ["No severe anomaly was detected for this transaction."],
    };
  }

  if (recurringDetectedCount > 0) {
    globalInsights.push({
      id: "recurring",
      title: "Recurring Detection",
      detail: `${recurringDetectedCount} transactions appear to be recurring.`,
      tone: "info",
    });
  }
  if (largeAnomalyCount > 0) {
    globalInsights.push({
      id: "anomaly",
      title: "Anomaly Alert",
      detail: `${largeAnomalyCount} transactions exceed your normal spending pattern.`,
      tone: "warning",
    });
  }
  if (riskyBehaviorCount > 0) {
    globalInsights.push({
      id: "risk",
      title: "Risky Spending Behavior",
      detail: `${riskyBehaviorCount} transactions carry elevated risk signals.`,
      tone: "warning",
    });
  }
  if (!globalInsights.length) {
    globalInsights.push({
      id: "stable",
      title: "Behavior Stable",
      detail: "No critical transaction anomaly detected in recent activity.",
      tone: "positive",
    });
  }

  return { byId, globalInsights };
};

