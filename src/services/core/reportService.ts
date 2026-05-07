import type { MonthlyReport } from "@/domain/financeModels";
import { calculateNetCashFlow, calculateSavingsRate, calculateTotalExpenses, calculateTotalIncome, calculateCategorySpendingTotals } from "@/lib/financeCalculations";
import { asyncResolve, mockStore } from "@/services/core/baseMockStore";
import { fetchTransactions } from "@/services/core/transactionService";

export const fetchReports = async (userId: string): Promise<MonthlyReport[]> => {
  const items = mockStore.reports.get().filter((item) => item.userId === userId);
  return asyncResolve(items);
};

export const generateMonthlyReport = async (userId: string, monthKey: string): Promise<MonthlyReport> => {
  const transactions = await fetchTransactions(userId);
  const report: MonthlyReport = {
    id: `report-${userId}-${monthKey}`,
    userId,
    monthKey,
    income: calculateTotalIncome(transactions),
    expenses: calculateTotalExpenses(transactions),
    netCashFlow: calculateNetCashFlow(transactions),
    savingsRate: calculateSavingsRate(transactions),
    topCategories: calculateCategorySpendingTotals(transactions).slice(0, 5),
    summary: `Auto-generated mock report for ${monthKey}.`,
    generatedAt: new Date().toISOString(),
  };

  const next = [report, ...mockStore.reports.get().filter((item) => item.id !== report.id)];
  mockStore.reports.set(next);
  return asyncResolve(report);
};
