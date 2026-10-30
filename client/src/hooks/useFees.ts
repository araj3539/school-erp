import { useQuery } from "@tanstack/react-query";
import { feesService, type Fee, type FeeQueryParams } from "../api/services/index.js";

export function useFees(params?: FeeQueryParams) {
  const query = useQuery({
    queryKey: ["fees", "list", params],
    queryFn: async () => {
      const response = await feesService.list(params);
      return response;
    },
  });

  const data = (query.data as { data: Fee[]; pagination: { page: number; limit: number; total: number; totalPages: number } } | undefined)?.data ?? [];
  const pagination = (query.data as { data: Fee[]; pagination: { page: number; limit: number; total: number; totalPages: number } } | undefined)?.pagination;

  return {
    fees: data as Fee[],
    pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useFee(id: string) {
  const query = useQuery({
    queryKey: ["fees", "detail", id],
    queryFn: async () => {
      const response = await feesService.get(id);
      return response.data;
    },
    enabled: Boolean(id),
  });

  return {
    fee: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
