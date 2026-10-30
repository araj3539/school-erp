import { PaginatedResponse, ListParams, buildQueryParams } from "../types.js";
import { api } from "../client.js";

export interface Teacher {
  _id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  status?: "active" | "inactive";
  subjects?: string[];
  classTeacherOf?: string[];
  academicYear?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeacherInput {
  employeeId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  status?: "active" | "inactive";
  subjects?: string[];
  classTeacherOf?: string[];
}

export type UpdateTeacherInput = Partial<CreateTeacherInput>;

export interface TeacherQueryParams extends ListParams {
  classId?: string;
  status?: string;
  search?: string;
}

export const teachersService = {
  async list(params?: TeacherQueryParams): Promise<PaginatedResponse<Teacher>> {
    const query = buildQueryParams({
      page: params?.page,
      limit: params?.limit,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
      classId: params?.classId,
      status: params?.status,
      search: params?.search,
    });
    const response = await api.get<PaginatedResponse<Teacher>>(`/teachers?${query}`);
    return response.data;
  },

  async get(id: string): Promise<{ teacher: Teacher }> {
    const response = await api.get<{ teacher: Teacher }>(`/teachers/${id}`);
    return response.data;
  },

  async create(input: CreateTeacherInput): Promise<{ teacher: Teacher }> {
    const response = await api.post<{ teacher: Teacher }>("/teachers", input);
    return response.data;
  },

  async update(id: string, input: UpdateTeacherInput): Promise<{ teacher: Teacher }> {
    const response = await api.put<{ teacher: Teacher }>(`/teachers/${id}`, input);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    const response = await api.delete<void>(`/teachers/${id}`);
    return response.data;
  },
};
