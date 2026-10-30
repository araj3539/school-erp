import { ApiResponse } from "../types.js";
import { api } from "../client.js";

export interface ModuleEntitlement {
  _id: string;
  moduleId: string;
  name: string;
  description: string;
  isEnabled: boolean;
  roles: string[];
}

export const modulesService = {
  async list(): Promise<ApiResponse<ModuleEntitlement[]>> {
    const response = await api.get("/modules");
    return response.data;
  },
};
