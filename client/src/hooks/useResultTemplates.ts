import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  resultTemplatesService,
  type ResultTemplate,
  type ResultTemplateQueryParams,
  type CreateResultTemplateInput,
  type UpdateResultTemplateInput,
} from "../api/services/index.js";
import { useUIStore } from "../store/uiStore.js";

export function useResultTemplates(params?: ResultTemplateQueryParams) {
  const { addToast } = useUIStore();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["result-templates", "list", params],
    queryFn: async () => {
      const response = await resultTemplatesService.list(params);
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateResultTemplateInput) => resultTemplatesService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["result-templates"] });
      addToast("Result template created successfully", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to create template", "error");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateResultTemplateInput }) => resultTemplatesService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["result-templates"] });
      addToast("Result template updated successfully", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to update template", "error");
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => resultTemplatesService.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["result-templates"] });
      addToast("Result template archived successfully", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to archive template", "error");
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => resultTemplatesService.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["result-templates"] });
      addToast("Default template updated successfully", "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to set default template", "error");
    },
  });

  const data = query.data?.data ?? [];
  const pagination = query.data?.pagination;

  return {
    templates: data as ResultTemplate[],
    pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    createTemplate: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateTemplate: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    archiveTemplate: archiveMutation.mutate,
    isArchiving: archiveMutation.isPending,
    setDefaultTemplate: setDefaultMutation.mutate,
    isSettingDefault: setDefaultMutation.isPending,
  };
}

export function useResultTemplate(id: string) {
  const query = useQuery({
    queryKey: ["result-templates", "detail", id],
    queryFn: async () => {
      const response = await resultTemplatesService.get(id);
      return response.data;
    },
    enabled: Boolean(id),
  });

  return {
    template: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
