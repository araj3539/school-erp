import { ApiResponse, ListParams, buildQueryParams } from "../types.js";
import { api } from "../client.js";

export type AttendanceQueryParams = ListParams & { classId?: string; sectionId?: string; date?: string };

export interface AttendanceRecord {
  studentId: string;
  status: "present" | "absent" | "late" | "half_day" | "on_leave";
  remark?: string;
}

export interface AttendanceListData {
  date: string;
  classId: string;
  sectionId: string;
  records: AttendanceRecord[];
  markedBy: string;
  _id: string;
}

export const attendanceService = {
  async list(params?: AttendanceQueryParams) {
    const queryString = buildQueryParams(params as Record<string, string | number | boolean | undefined> ?? {});
    const response = await api.get<ApiResponse<AttendanceListData[]>>(`/attendance?${queryString}`);
    return response.data;
  },

  async mark(input: { classId: string; sectionId: string; date: string; records: AttendanceRecord[] }) {
    const response = await api.post<ApiResponse<AttendanceListData>>("/attendance", input);
    return response.data;
  },
};
