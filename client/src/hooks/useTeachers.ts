import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  teachersService,
  type Teacher,
  type TeacherQueryParams,
  type CreateTeacherInput,
} from "../api/services/index.js";
import { useUIStore } from "../store/uiStore.js";

export function useTeachers(params?: TeacherQueryParams) {
  const { addToast } = useUIStore();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["teachers", "list", params],
    queryFn: async () => {
      const response = await teachersService.list(params);
      return response;
    },
  });

  const data = (query.data as { data: Teacher[]; pagination: { page: number; limit: number; total: number; totalPages: number } } | undefined)?.data ?? [];
  const pagination = (query.data as { data: Teacher[]; pagination: { page: number; limit: number; total: number; totalPages: number } } | undefined)?.pagination;

  const createMutation = useMutation({
    mutationFn: (input: CreateTeacherInput) => teachersService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      addToast("Teacher created successfully", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to create teacher", "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateTeacherInput> }) => teachersService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      addToast("Teacher updated successfully", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to update teacher", "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teachersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      addToast("Teacher deleted successfully", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to delete teacher", "error");
    },
  });

  return {
    teachers: data as Teacher[],
    pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    createTeacher: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateTeacher: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteTeacher: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}

export function useTeacher(id: string) {
  const query = useQuery({
    queryKey: ["teachers", "detail", id],
    queryFn: async () => {
      const response = await teachersService.get(id);
      return response.teacher;
    },
    enabled: Boolean(id),
  });

  return {
    teacher: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
