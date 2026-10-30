import { ApiResponse, PaginatedResponse, ListParams, buildQueryParams } from "../types.js";
import { api } from "../client.js";

export interface Student {
  _id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  classId?: string;
  sectionId?: string;
  status?: "active" | "inactive" | "graduated";
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  address?: string;
  parentName?: string;
  parentPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentInput {
  admissionNo: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  classId?: string;
  sectionId?: string;
  status?: "active" | "inactive" | "graduated";
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  address?: string;
  parentName?: string;
  parentPhone?: string;
}

export interface StudentQueryParams extends ListParams {
  classId?: string;
  sectionId?: string;
  status?: string;
  search?: string;
}

export const studentsService = {
  async list(params?: StudentQueryParams): Promise<ApiResponse<PaginatedResponse<Student>>> {
    const query = buildQueryParams({
      page: params?.page,
      limit: params?.limit,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
      search: params?.search,
      classId: params?.classId,
      sectionId: params?.sectionId,
      status: params?.status,
    });
    const response = await api.get(`/students?${query}`);
    return response.data;
  },

  async get(id: string): Promise<ApiResponse<{ student: Student }>> {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  async create(input: CreateStudentInput): Promise<ApiResponse<{ student: Student }>> {
    const response = await api.post("/students", input);
    return response.data;
  },

  async update(id: string, input: Partial<CreateStudentInput>): Promise<ApiResponse<{ student: Student }>> {
    const response = await api.put(`/students/${id}`, input);
    return response.data;
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },
};
