// Types and utility functions for subscription insights calculations
// These helpers work with both local models and Supabase rows by supporting
// camelCase and snake_case field names.
export type BillingCycle = "monthly" | "yearly";

export interface SubscriptionInput {
  price: number;
  billingCycle?: BillingCycle | null;
  billing_cycle?: BillingCycle | string | null;
  startDate?: string | Date | null;
  start_date?: string | null;
}

/**
 * Safely parse the billing cycle from a subscription record.
 * Defaults to "monthly" if the value is missing or invalid.
 */
const getBillingCycle = (sub: SubscriptionInput): BillingCycle => {
  const raw =
    (sub.billingCycle ?? sub.billing_cycle ?? "monthly")?.toString().toLowerCase();
  return raw === "yearly" ? "yearly" : "monthly";
};

/**
 * Safely parse the start date from a subscription record.
 * If missing, uses a very early date so the subscription counts as active.
 */
const getStartDate = (sub: SubscriptionInput): Date => {
  const raw = sub.startDate ?? sub.start_date;
  if (!raw) return new Date(0); // treat as always active
  return raw instanceof Date ? raw : new Date(raw);
};

/**
 * Convert a subscription price to a monthly comparable value.
 * Yearly prices are normalized by dividing by 12.
 */
const toMonthlyPrice = (sub: SubscriptionInput): number => {
  const price = Number(sub.price ?? 0);
  if (!isFinite(price) || price < 0) return 0;
  return getBillingCycle(sub) === "yearly" ? price / 12 : price;
};

/**
 * Check if a subscription is active within the given month.
 * A subscription is active if its startDate is on or before the month end.
 */
const isActiveInMonth = (sub: SubscriptionInput, monthRef: Date): boolean => {
  const start = getStartDate(sub);
  const monthEnd = new Date(monthRef.getFullYear(), monthRef.getMonth() + 1, 0);
  return start <= monthEnd;
};

/**
 * Calculate the total monthly-equivalent subscription cost for the current month.
 * - Normalizes yearly subscriptions to monthly by dividing by 12.
 * - Includes only subscriptions active in the current month (based on startDate).
 */
export const currentMonthSubscriptionTotal = (
  subscriptions: SubscriptionInput[],
  referenceDate: Date = new Date()
): number => {
  return subscriptions.reduce((sum, sub) => {
    if (!isActiveInMonth(sub, referenceDate)) return sum;
    return sum + toMonthlyPrice(sub);
  }, 0);
};

/**
 * Calculate the total monthly-equivalent subscription cost for the previous month.
 * - Normalizes yearly subscriptions to monthly by dividing by 12.
 * - Includes only subscriptions active by the end of the previous month.
 */
export const previousMonthSubscriptionTotal = (
  subscriptions: SubscriptionInput[],
  referenceDate: Date = new Date()
): number => {
  const prevMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1);
  return subscriptions.reduce((sum, sub) => {
    if (!isActiveInMonth(sub, prevMonth)) return sum;
    return sum + toMonthlyPrice(sub);
  }, 0);
};

/**
 * Calculate what percentage of income is spent on subscriptions.
 * - Handles division by zero: returns 0 if income is <= 0.
 */
export const subscriptionPercentageOfIncome = (
  monthlySubscriptionTotal: number,
  monthlyIncome: number
): number => {
  const income = Number(monthlyIncome);
  const total = Number(monthlySubscriptionTotal);
  if (!isFinite(income) || income <= 0) return 0;
  if (!isFinite(total) || total < 0) return 0;
  return (total / income) * 100;
};

/**
 * Calculate month-over-month percentage change for subscriptions.
 * - (current - previous) / previous * 100
 * - Handles division by zero: returns 0 if previous is <= 0.
 */
export const monthOverMonthChangePercentage = (
  currentTotal: number,
  previousTotal: number
): number => {
  const current = Number(currentTotal);
  const previous = Number(previousTotal);
  if (!isFinite(previous) || previous <= 0) return 0;
  if (!isFinite(current) || current < 0) return 0;
  return ((current - previous) / previous) * 100;
};

export type InsightSeverity = "good" | "warning" | "danger";

export interface SubscriptionInsightInput {
  currentTotal: number;
  previousTotal: number;
  monthlyIncome: number;
}

export interface SubscriptionInsightResult {
  severity: InsightSeverity;
  title: string;
  message: string;
}

export const generateSubscriptionInsight = (
  input: SubscriptionInsightInput
): SubscriptionInsightResult => {
  const pctIncome = subscriptionPercentageOfIncome(
    input.currentTotal,
    input.monthlyIncome
  );
  const changePct = monthOverMonthChangePercentage(
    input.currentTotal,
    input.previousTotal
  );

  let severity: InsightSeverity;
  if (pctIncome > 40) {
    severity = "danger";
  } else if (pctIncome >= 25) {
    severity = "warning";
  } else {
    severity = "good";
  }

  const pctStr = `${pctIncome.toFixed(1)}%`;
  const changeStr = `${Math.abs(changePct).toFixed(1)}%`;

  let title: string;
  let baseMsg: string;
  if (severity === "danger") {
    title = "Subscription spending is too high";
    baseMsg = `Subscriptions consume ${pctStr} of your income. Consider trimming recurring costs.`;
  } else if (severity === "warning") {
    title = "Subscription spending needs attention";
    baseMsg = `Subscriptions take ${pctStr} of your income. Monitor and optimize where possible.`;
  } else {
    title = "Subscription spending is healthy";
    baseMsg = `Subscriptions are at ${pctStr} of your income. This is within a healthy range.`;
  }

  let changeMsg: string;
  if (changePct > 15) {
    changeMsg = ` Spending increased by ${changeStr} vs last month.`;
  } else if (changePct > 0) {
    changeMsg = ` Slight increase of ${changeStr} vs last month.`;
  } else if (changePct < 0) {
    changeMsg = ` Down ${changeStr} from last month — nice progress.`;
  } else {
    changeMsg = ` No change from last month.`;
  }

  return {
    severity,
    title,
    message: `${baseMsg}${changeMsg}`,
  };
};
