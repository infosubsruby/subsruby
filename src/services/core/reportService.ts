import type { MonthlyReportRecord } from "@/domain/financeModels";
import { isSupabaseMode } from "@/lib/config/dataMode";
import type { ServiceResult } from "@/services/core/serviceResult";
import { fail, ok } from "@/services/core/serviceResult";
import {
  deleteMonthlyReportSupabase,
  fetchMonthlyReportByMonthSupabase,
  fetchMonthlyReportsSupabase,
  generateMonthlyReportSupabase,
  upsertMonthlyReportSupabase,
} from "@/services/core/monthlyReportSupabaseService";

const isDemoUser = (userId: string): boolean => userId === "demo-user" || userId.startsWith("demo-");

const resolveMonthlyReportCall = async <T>(
  userId: string,
  supabaseCall: () => Promise<ServiceResult<T>>,
  fallbackCall: () => Promise<ServiceResult<T>>
): Promise<ServiceResult<T>> => {
  if (!isSupabaseMode() || isDemoUser(userId)) return fallbackCall();
  return supabaseCall();
};

export const fetchMonthlyReportsSafe = async (userId: string): Promise<ServiceResult<MonthlyReportRecord[]>> =>
  resolveMonthlyReportCall(userId, () => fetchMonthlyReportsSupabase(userId), async () => ok([]));

export const fetchMonthlyReports = async (userId: string): Promise<MonthlyReportRecord[]> => {
  const result = await fetchMonthlyReportsSafe(userId);
  return result.data ?? [];
};

export const fetchMonthlyReportByMonth = async (
  userId: string,
  month: string
): Promise<ServiceResult<MonthlyReportRecord | null>> =>
  resolveMonthlyReportCall(userId, () => fetchMonthlyReportByMonthSupabase(userId, month), async () => ok(null));

export const generateMonthlyReport = async (
  userId: string,
  month: string
): Promise<ServiceResult<MonthlyReportRecord>> =>
  resolveMonthlyReportCall(
    userId,
    () => generateMonthlyReportSupabase(userId, month),
    async () => fail("Monthly reports are not available in demo mode.")
  );

export const upsertMonthlyReport = async (
  userId: string,
  report: MonthlyReportRecord
): Promise<ServiceResult<MonthlyReportRecord>> =>
  resolveMonthlyReportCall(
    userId,
    () => upsertMonthlyReportSupabase(userId, report),
    async () => fail("Monthly reports are not available in demo mode.")
  );

export const deleteMonthlyReport = async (userId: string, reportId: string): Promise<ServiceResult<boolean>> =>
  resolveMonthlyReportCall(
    userId,
    () => deleteMonthlyReportSupabase(userId, reportId),
    async () => fail("Monthly reports are not available in demo mode.")
  );

export const fetchReports = fetchMonthlyReports;
