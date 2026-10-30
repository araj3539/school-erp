import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  examsService,
  type Exam,
  type ExamQueryParams,
  type CreateExamInput,
  type UpdateExamInput,
  type BulkPublishInput,
  type MarksEntry,
  type ExamResult,
} from "../api/services/index.js";
import { useUIStore } from "../store/uiStore.js";

export function useExams(params?: ExamQueryParams) {
  const { addToast } = useUIStore();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["exams", "list", params],
    queryFn: async () => {
      const response = await examsService.list(params);
      return response;
    },
    enabled: Boolean(params?.classId || params?.academicYear || true),
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateExamInput) => examsService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      addToast("Exam created successfully", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to create exam", "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateExamInput }) => examsService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      addToast("Exam updated successfully", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to update exam", "error");
    },
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) => examsService.publish({ examId: id, isPublished }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      queryClient.invalidateQueries({ queryKey: ["results"] });
      addToast("Exam published successfully", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to publish exam", "error");
    },
  });

  const bulkPublishMutation = useMutation({
    mutationFn: (input: BulkPublishInput) => examsService.bulkPublish(input),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      queryClient.invalidateQueries({ queryKey: ["results"] });
      addToast(`Published ${response.data.updated} exams`, "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to publish exams", "error");
    },
  });

  const upsertMarksMutation = useMutation({
    mutationFn: ({ examId, entries }: { examId: string; entries: MarksEntry[] }) => examsService.upsertMarks(examId, entries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["results"] });
      addToast("Marks saved successfully", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to save marks", "error");
    },
  });

  const data = (query.data as { data: Exam[]; pagination: { page: number; limit: number; total: number; totalPages: number } } | undefined)?.data ?? [];
  const pagination = (query.data as { data: Exam[]; pagination: { page: number; limit: number; total: number; totalPages: number } } | undefined)?.pagination;

  return {
    exams: data as Exam[],
    pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    createExam: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateExam: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    publishExam: publishMutation.mutate,
    isPublishing: publishMutation.isPending,
    bulkPublishExams: bulkPublishMutation.mutate,
    isBulkPublishing: bulkPublishMutation.isPending,
    saveMarks: upsertMarksMutation.mutate,
    isSavingMarks: upsertMarksMutation.isPending,
  };
}

export function useExam(id: string) {
  const { addToast } = useUIStore();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["exams", "detail", id],
    queryFn: async () => {
      const response = await examsService.get(id);
      return response.data;
    },
    enabled: Boolean(id),
  });

  const publishMutation = useMutation({
    mutationFn: ({ isPublished }: { isPublished: boolean }) => examsService.publish({ examId: id, isPublished }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      queryClient.invalidateQueries({ queryKey: ["results"] });
      addToast("Exam published successfully", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to publish exam", "error");
    },
  });

  const upsertMarksMutation = useMutation({
    mutationFn: (entries: MarksEntry[]) => examsService.upsertMarks(id, entries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["results"] });
      addToast("Marks saved successfully", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to save marks", "error");
    },
  });

  return {
    exam: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    publishExam: publishMutation.mutate,
    isPublishing: publishMutation.isPending,
    saveMarks: upsertMarksMutation.mutate,
    isSavingMarks: upsertMarksMutation.isPending,
  };
}

export function useExamResults(examId: string) {
  const query = useQuery({
    queryKey: ["results", "list", examId],
    queryFn: async () => {
      const response = await examsService.getResults(examId);
      return response.data;
    },
    enabled: Boolean(examId),
  });

  return {
    results: query.data as ExamResult[],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
