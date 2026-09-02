import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Upload, RefreshCw, FileSpreadsheet } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import api from "../lib/api";

function getErrorMessage(error: any): string {
  const message = error?.response?.data?.message;
  if (message) return message;
  return error instanceof Error ? error.message : "Student import failed.";
}

function downloadBlob(data: Blob, filename: string) {
  const url = URL.createObjectURL(data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function StudentBulkOperationsPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const importMutation = useMutation({
    mutationFn: async (selectedFile: File) => {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const response = await api.post("/students/bulk-import", formData, { headers: { "Content-Type": "multipart/form-data" } });
      return response.data;
    },
    onSuccess: (data) => {
      setError("");
      setMessage(`Import completed: ${data.imported ?? 0} students imported.`);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: async (mutationError: any) => {
      setMessage("");
      if (mutationError?.response?.data instanceof Blob) {
        try {
          const body = JSON.parse(await mutationError.response.data.text());
          const details = body.errors?.slice(0, 5).map((item: any) => `Row ${item.row}: ${item.message}`).join("\n");
          setError(details ? `${body.error ?? "Import failed"}\n${details}` : body.error ?? "Import failed");
          return;
        } catch { /* fall through to generic error */ }
      }
      setError(getErrorMessage(mutationError));
    }
  });

  const handleExport = async () => {
    setError("");
    setMessage("");
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (status) params.set("status", status);
      const response = await api.get(`/students/export?${params.toString()}`, { responseType: "blob" });
      downloadBlob(response.data, "students.xlsx");
      setMessage("Student export downloaded successfully.");
    } catch (exportError) {
      setError(getErrorMessage(exportError));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Import & Export</h1>
        <p className="mt-1 text-sm text-gray-500">Bulk student operations use the same tenant-scoped validation as the API.</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Export students</h2>
          <p className="text-sm text-gray-500">Apply the same search and status filters used for the student list.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input aria-label="Student export search" placeholder="Name, admission no or phone" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:w-96" />
            <Select aria-label="Student export status" value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-44">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="left">Left</option>
              <option value="graduated">Graduated</option>
              <option value="transferred">Transferred</option>
            </Select>
            <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export XLSX</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Import students</h2>
          <p className="text-sm text-gray-500">Upload an XLSX file. All rows are validated before any student is created.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input ref={fileInputRef} type="file" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" aria-label="Student import spreadsheet" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <Button onClick={() => file && importMutation.mutate(file)} disabled={!file || importMutation.isPending}>
              {importMutation.isPending ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {importMutation.isPending ? "Importing..." : "Import XLSX"}
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500"><FileSpreadsheet className="h-4 w-4" />Maximum 5,000 data rows per import.</div>
        </CardContent>
      </Card>

      {message && <div role="status" className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}
      {error && <pre role="alert" className="whitespace-pre-wrap rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</pre>}
    </div>
  );
}
