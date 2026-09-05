export interface ApiListQuery {
  page?: number;
  limit?: number;
  search?: string;
  from?: string;
  to?: string;
}

export interface ApiListResponse<T> {
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface ApiMessageResponse {
  message: string;
}

/**
 * Mobile only consumes the server's authorization decisions. These are
 * capability hints for selecting UI, never an authorization mechanism.
 */
export const MOBILE_API_CONTRACTS = {
  me: { method: "GET", path: "/auth/me" },
  dashboard: { method: "GET", path: "/dashboard" },
  students: { method: "GET", path: "/students" },
  attendance: { method: "GET", path: "/attendance" },
  homework: { method: "GET", path: "/homework" },
  notices: { method: "GET", path: "/notices" },
  timetable: { method: "GET", path: "/timetable" },
  exams: { method: "GET", path: "/exams" },
  examResults: { method: "GET", path: "/exams/results/list" },
  fees: { method: "GET", path: "/fees" },
  teacherPortal: { method: "GET", path: "/portal/teacher/workspace" },
  studentPortal: { method: "GET", path: "/portal/student/workspace" },
  parentPortal: { method: "GET", path: "/portal/parent/workspace" },
} as const;

export type MobileApiContractName = keyof typeof MOBILE_API_CONTRACTS;
