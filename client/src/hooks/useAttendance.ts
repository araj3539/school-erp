import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { attendanceService, type AttendanceQueryParams, type AttendanceListData } from "../api/services/index.js";
import { useUIStore } from "../store/uiStore.js";

export function useAttendance(params?: AttendanceQueryParams) {
  const { addToast } = useUIStore();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["attendance", "list", params],
    queryFn: async () => {
      const response = await attendanceService.list(params);
      return response.data;
    },
  });

  const markMutation = useMutation({
    mutationFn: (input: { classId: string; sectionId: string; date: string; records: { studentId: string; status: "present" | "absent" | "late" | "half_day" | "on_leave"; remark?: string }[] }) =>
      attendanceService.mark(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      addToast("Attendance marked successfully", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to mark attendance", "error");
    },
  });

  const data = query.data as AttendanceListData[];

  return {
    attendance: data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    markAttendance: markMutation.mutate,
    isMarking: markMutation.isPending,
  };
}
