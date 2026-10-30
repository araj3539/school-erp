import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";

export function useApiQuery<TData>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, Error, TData>, "queryKey" | "queryFn">
) {
  return useQuery<TData, Error, TData>({
    queryKey,
    queryFn: async () => {
      const response = await queryFn();
      if (response && typeof response === "object" && "data" in response) {
        return (response as { data: TData }).data;
      }
      return response;
    },
    ...options,
  });
}

export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Parameters<typeof useMutation<TData, Error, TVariables>>[0]
) {
  return useMutation<TData, Error, TVariables>({
    mutationFn,
    ...options,
  });
}
