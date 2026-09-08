import { createApiClient } from "../api/client";
import type { TeacherWorkspaceResponse } from "./types";

type Request = <T>(path: string, options?: RequestInit) => Promise<T>;
export type TeacherAttendanceRecord = { studentId: string; status: "present" | "absent" | "late" | "half_day" | "on_leave"; remark?: string };
export type MarkTeacherAttendanceInput = { date: string; classId: string; sectionId: string; records: TeacherAttendanceRecord[] };

export function createTeacherApi(request: Request) {
  const api = createApiClient(request);
  return {
    getWorkspace: (date?: string) => api.get<TeacherWorkspaceResponse>(`/portal/teacher/workspace${date ? `?date=${encodeURIComponent(date)}` : ""}`),
    markAttendance: (input: MarkTeacherAttendanceInput) => api.post<{ attendance: Record<string, unknown>; corrected: boolean }>("/attendance", input),
  };
}
