import { useQuery } from "@tanstack/react-query";
import { Award, Download, FileText } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import api from "../lib/api";
import { useAuth } from "../hooks";

export default function PortalResultsPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const childId = params.get("childId") || "";
  const isParent = user?.role === "parent";
  const { data, isLoading, isError } = useQuery({ queryKey: ["portal-results", user?.role, childId], queryFn: async () => (await api.get(`/portal/results${isParent && childId ? `?childId=${encodeURIComponent(childId)}` : ""}`)).data });
  const results = data?.results || [];
  const students = data?.students || [];
  const selectedStudentId = data?.selectedStudentId || childId || students[0]?._id || "";
  const downloadReport = async (id: string) => {
    const response = await api.get(`/exams/results/${id}/report-card`, { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a"); link.href = url; link.download = "report-card.pdf"; link.click(); URL.revokeObjectURL(url);
  };
  if (isLoading) return <div className="space-y-4"><div className="h-8 w-48 animate-pulse rounded bg-slate-200" /><div className="h-48 animate-pulse rounded-2xl bg-slate-200" /></div>;
  if (isError) return <Card><CardContent className="py-10 text-center"><p className="font-semibold text-slate-900">Results are unavailable right now.</p><p className="mt-1 text-sm text-slate-500">Please try again shortly.</p></CardContent></Card>;
  return <div className="space-y-6">
    <header><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-600">Academic record</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Results</h1><p className="mt-1 text-sm text-slate-500">Published exam results and report cards.</p></header>
    {isParent && students.length > 1 && <Card><CardHeader><h2 className="font-semibold">Selected child</h2></CardHeader><CardContent><label className="sr-only" htmlFor="results-child">Choose a child</label><select id="results-child" value={selectedStudentId} onChange={(e) => setParams(e.target.value ? { childId: e.target.value } : {})} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 sm:max-w-md">{students.map((student: any) => <option key={student._id} value={student._id}>{student.firstName} {student.lastName} · {student.class}{student.section ? ` · ${student.section}` : ""}</option>)}</select></CardContent></Card>}
    {results.length === 0 ? <Card><CardContent className="py-12 text-center"><Award className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 font-semibold text-slate-900">No published results yet</p><p className="mt-1 text-sm text-slate-500">Published results will appear here when they are released.</p></CardContent></Card> : <div className="grid gap-4 lg:grid-cols-2">{results.map((result: any) => <Card key={result._id} className="overflow-hidden"><CardHeader><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{result.examType || "Examination"}</p><h2 className="mt-1 text-lg font-bold text-slate-950">{result.examName}</h2><p className="text-sm text-slate-500">{result.studentName} · {result.class}{result.section ? ` · ${result.section}` : ""}</p></div><Badge variant={result.outcome === "pass" ? "success" : "danger"}>{result.grade} · {result.percentage}%</Badge></div></CardHeader><CardContent><div className="divide-y divide-slate-100 rounded-xl border border-slate-100">{result.marks.map((mark: any) => <div key={mark.subject} className="flex items-center justify-between gap-4 px-4 py-3 text-sm"><span className="text-slate-600">{mark.subject}</span><span className="font-semibold text-slate-900">{mark.absent ? "Absent" : mark.value}</span></div>)}</div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-500"><strong className="text-slate-900">{result.obtainedMarks}</strong> / {result.totalMarks} marks</p><Button size="sm" variant="outline" onClick={() => downloadReport(result._id)}><Download className="mr-2 h-4 w-4" />Report card</Button></div></CardContent></Card>)}</div>}
    <div className="flex items-center gap-2 text-xs text-slate-400"><FileText className="h-4 w-4" />Only published academic results are shown.</div>
  </div>;
}
