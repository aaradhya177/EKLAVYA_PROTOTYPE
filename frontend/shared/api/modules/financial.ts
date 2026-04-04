import { getClient } from "../client";
import type { CashflowForecast, GrantRecord, IncomeRecord } from "../../types";
import type { ExpenseRecord, FinancialSummary, GrantEligibility } from "../types";

export const getSummary = async (athleteId: string, fiscalYear: string): Promise<FinancialSummary> =>
  (await getClient().get<FinancialSummary>(`/financial/athletes/${athleteId}/summary`, { params: { fiscalYear } })).data;
export const getForecast = async (athleteId: string): Promise<CashflowForecast[]> =>
  (await getClient().get<CashflowForecast[]>(`/financial/athletes/${athleteId}/forecast`)).data;
export const getGrants = async (athleteId: string): Promise<GrantRecord[]> =>
  (await getClient().get<GrantRecord[]>(`/financial/athletes/${athleteId}/grants`)).data;
export const getEligibleGrants = async (athleteId: string): Promise<GrantEligibility[]> =>
  (await getClient().get<GrantEligibility[]>(`/financial/athletes/${athleteId}/eligible-grants`)).data;
export const logIncome = async (data: Omit<IncomeRecord, "id">): Promise<IncomeRecord> =>
  (await getClient().post<IncomeRecord>("/financial/income", data)).data;
export const logExpense = async (data: Omit<ExpenseRecord, "id">): Promise<ExpenseRecord> =>
  (await getClient().post<ExpenseRecord>("/financial/expense", data)).data;
