import { ApiResponse, PaginatedResponse, ListParams, buildQueryParams } from "../types.js";
import { api } from "../client.js";

export interface Fee {
  _id: string;
  studentId: string;
  feeStructureId?: string;
  amount: number;
  paidAmount: number;
  balance: number;
  status: "paid" | "partial" | "pending" | "overdue" | "waived";
  dueDate: string;
  academicYear: string;
}

export interface FeeQueryParams extends ListParams {
  status?: string;
  classId?: string;
  sectionId?: string;
}

export const feesService = {
  async list(params?: FeeQueryParams) {
    const queryString = buildQueryParams(params as Record<string, string | number | boolean | undefined> ?? {});
    const response = await api.get<PaginatedResponse<Fee>>(`/fees?${queryString}`);
    return response.data;
  },

  async get(id: string) {
    const response = await api.get<ApiResponse<Fee>>(`/fees/${id}`);
    return response.data;
  },
};
