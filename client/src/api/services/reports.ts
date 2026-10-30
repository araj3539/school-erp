import { ApiResponse, buildQueryParams } from "../types.js";
import { api } from "../client.js";

export interface ReportExportParams {
  reportType: "students" | "fees" | "attendance" | "results";
  format: "pdf" | "csv" | "excel";
  filters?: Record<string, string | number | boolean>;
}

export interface ReportExportResult {
  url: string;
  filename: string;
}

export const reportsService = {
  async export(params: ReportExportParams): Promise<ApiResponse<ReportExportResult>> {
    const query = buildQueryParams(params.filters as Record<string, string | number | boolean | undefined>);
    const response = await api.post(`/reports/export?${query}`, { reportType: params.reportType, format: params.format });
    return response.data;
  },

  async download(filename: string): Promise<Blob> {
    const response = await api.get(`/reports/download/${filename}`, { responseType: "blob" });
    return response.data;
  },
};
