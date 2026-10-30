import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reportsService, type ReportExportParams } from "../api/services/index.js";
import { useUIStore } from "../store/uiStore.js";

export function useReportExport() {
  const { addToast } = useUIStore();
  const queryClient = useQueryClient();

  const exportMutation = useMutation({
    mutationFn: (params: ReportExportParams) => reportsService.export(params),
    onSuccess: (response) => {
      const { url: downloadUrl, filename } = response.data;
      // Trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      addToast(`Report exported: ${filename}`, "success");
    },
    onError: (error: Error) => {
      addToast(error.message || "Failed to export report", "error");
    },
  });

  return {
    exportReport: exportMutation.mutate,
    isExporting: exportMutation.isPending,
  };
}
