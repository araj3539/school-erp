import { createApiClient } from "../api/client";
import type { TeacherWorkspaceResponse } from "./types";

type Request = <T>(path: string, options?: RequestInit) => Promise<T>;

export function createTeacherApi(request: Request) {
  const api = createApiClient(request);
  return {
    getWorkspace: (date?: string) => api.get<TeacherWorkspaceResponse>(`/portal/teacher/workspace${date ? `?date=${encodeURIComponent(date)}` : ""}`),
  };
}
