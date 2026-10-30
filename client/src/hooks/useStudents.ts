import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  studentsService,
  type Student,
  type StudentQueryParams,
  type CreateStudentInput,
} from "../api/services/index.js";
import { useUIStore } from "../store/uiStore.js";

export function useStudents(params?: StudentQueryParams) {
  const { addToast } = useUIStore();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["students", "list", params],
    queryFn: async () => {
      const response = await studentsService.list(params);
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateStudentInput) => studentsService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      addToast("Student created successfully", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to create student", "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateStudentInput> }) => studentsService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      addToast("Student updated successfully", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to update student", "error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => studentsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      addToast("Student deleted successfully", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to delete student", "error");
    },
  });

  const data = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  return {
    students: data as Student[],
    pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    createStudent: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateStudent: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteStudent: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}

export function useStudent(id: string) {
  const query = useQuery({
    queryKey: ["students", "detail", id],
    queryFn: async () => {
      const response = await studentsService.get(id);
      return response.data.student;
    },
    enabled: Boolean(id),
  });

  return {
    student: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
