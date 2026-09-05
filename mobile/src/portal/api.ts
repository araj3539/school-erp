import { createApiClient } from "../api/client";
import type { ParentPortalResponse, StudentPortalResponse } from "./types";

type Request = <T>(path: string, options?: RequestInit) => Promise<T>;

export function createPortalApi(request: Request) {
  const api = createApiClient(request);

  return {
    getStudentWorkspace: () => api.get<StudentPortalResponse>("/portal/student/workspace"),
    getParentWorkspace: (childId?: string) => {
      const query = childId ? `?childId=${encodeURIComponent(childId)}` : "";
      return api.get<ParentPortalResponse>(`/portal/parent/workspace${query}`);
    },
  };
}
