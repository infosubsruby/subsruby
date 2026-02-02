import { format, addMonths, addYears, setDate, setMonth } from "date-fns";

/**
 * Calculate the next payment date based on billing day/month and cycle
 */
export const calculateNextPaymentDate = (
  billingDay: number,
  billingMonth: number,
  billingCycle: "monthly" | "yearly"
): string => {
  const now = new Date();
  let nextPayment: Date;

  if (billingCycle === "monthly") {
    // Set to the billing day this month
    nextPayment = setDate(now, billingDay);
    
    // If we've already passed that day this month, move to next month
    if (nextPayment <= now) {
      nextPayment = addMonths(nextPayment, 1);
    }
  } else {
    // Yearly: set to the billing month and day
    nextPayment = setMonth(setDate(now, billingDay), billingMonth - 1);
    
    // If we've already passed that date this year, move to next year
    if (nextPayment <= now) {
      nextPayment = addYears(nextPayment, 1);
    }
  }

  // Handle edge case where day doesn't exist in month (e.g., Feb 31)
  // setDate will roll over to next month, so we clamp to last day
  const targetMonth = nextPayment.getMonth();
  if (nextPayment.getMonth() !== targetMonth) {
    // Day rolled over, go back to last day of intended month
    nextPayment = new Date(nextPayment.getFullYear(), targetMonth + 1, 0);
  }

  return format(nextPayment, "yyyy-MM-dd");
};

/**
 * Calculate the start date (same as next payment for new subscriptions)
 */
export const calculateStartDate = (
  billingDay: number,
  billingMonth: number,
  billingCycle: "monthly" | "yearly"
): string => {
  return calculateNextPaymentDate(billingDay, billingMonth, billingCycle);
};

/**
 * Extract billing day from an existing date string
 */
export const extractBillingDay = (dateString: string | null): number => {
  if (!dateString) return new Date().getDate();
  const date = new Date(dateString);
  return date.getDate();
};

/**
 * Extract billing month (1-12) from an existing date string
 */
export const extractBillingMonth = (dateString: string | null): number => {
  if (!dateString) return new Date().getMonth() + 1;
  const date = new Date(dateString);
  return date.getMonth() + 1;
};
