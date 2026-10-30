import { ApiResponse, PaginatedResponse, ListParams, buildQueryParams } from "../types.js";
import { api } from "../client.js";

export interface ResultTemplate {
  _id: string;
  name: string;
  academicYear: string;
  classId: string;
  sectionId?: string;
  subjects: string[];
  gradingScale: string[];
  isDefault: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResultTemplateInput {
  name: string;
  academicYear: string;
  classId: string;
  sectionId?: string;
  subjects: string[];
  gradingScale: string[];
  isDefault?: boolean;
}

export type UpdateResultTemplateInput = Partial<CreateResultTemplateInput>;

export interface ResultTemplateQueryParams extends ListParams {
  classId?: string;
  sectionId?: string;
  academicYear?: string;
}

export const resultTemplatesService = {
  async list(params?: ResultTemplateQueryParams): Promise<ApiResponse<PaginatedResponse<ResultTemplate>>> {
    const query = buildQueryParams({
      page: params?.page,
      limit: params?.limit,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
      classId: params?.classId,
      sectionId: params?.sectionId,
      academicYear: params?.academicYear,
    });
    const response = await api.get(`/result-templates?${query}`);
    return response.data;
  },

  async get(id: string): Promise<ApiResponse<ResultTemplate>> {
    const response = await api.get(`/result-templates/${id}`);
    return response.data;
  },

  async create(input: CreateResultTemplateInput): Promise<ApiResponse<ResultTemplate>> {
    const response = await api.post("/result-templates", input);
    return response.data;
  },

  async update(id: string, input: UpdateResultTemplateInput): Promise<ApiResponse<ResultTemplate>> {
    const response = await api.put(`/result-templates/${id}`, input);
    return response.data;
  },

  async archive(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/result-templates/${id}`);
    return response.data;
  },

  async setDefault(id: string): Promise<ApiResponse<ResultTemplate>> {
    const response = await api.post(`/result-templates/${id}/set-default`);
    return response.data;
  },
};
