import { ApiResponse } from "../types.js";
import { api } from "../client.js";

export interface User {
  _id: string;
  email: string;
  name: string;
  role: "super_admin" | "principal" | "teacher" | "student" | "parent";
  schoolId: string;
}

export interface School {
  _id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  school: School;
  token: string;
}

export const authService = {
  async login(input: { email: string; password: string }): Promise<ApiResponse<AuthResponse>> {
    const response = await api.post("/auth/login", input);
    return response.data;
  },

  async logout(): Promise<ApiResponse<void>> {
    const response = await api.post("/auth/logout");
    return response.data;
  },

  async me(): Promise<ApiResponse<{ user: User; school: School }>> {
    const response = await api.get("/auth/me");
    return response.data;
  },

  async refresh(): Promise<ApiResponse<{ token: string }>> {
    const response = await api.post("/auth/refresh");
    return response.data;
  },
};
