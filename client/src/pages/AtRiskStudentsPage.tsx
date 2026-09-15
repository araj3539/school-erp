import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, TrendingDown, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import api from "../lib/api";

export default function AtRiskStudentsPage() {
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["students", "at-risk"], queryFn: async () => (await api.get("/students/at-risk")).data });
  if (isLoading) return <p className="py-12 text-center text-sm text-slate-500">Calculating student support signals...</p>;
  if (isError) return <Card><CardContent className="py-10 text-center"><p className="font-medium text-red-600">Unable to load student support signals.</p><button className="mt-3 rounded-lg border px-3 py-2 text-sm font-semibold" onClick={() => refetch()}>Try again</button></CardContent></Card>;
  const students = data?.students ?? [];
  return <div className="space-y-6">
    <header><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Student success</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Students needing attention</h1><p className="mt-2 max-w-2xl text-sm text-slate-600">Explainable support signals from recent attendance, published results and open behaviour incidents. This is a review aid, not an automated decision.</p></header>
    {!students.length ? <Card><CardContent className="flex items-center gap-3 py-10"><ShieldCheck className="h-6 w-6 text-emerald-600" /><div><p className="font-semibold text-slate-900">No current risk signals</p><p className="text-sm text-slate-500">No active student crossed the configured review threshold.</p></div></CardContent></Card> : <div className="grid gap-4 lg:grid-cols-2">{students.map((item: any) => <Card key={item.student._id}><CardHeader><div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-slate-900">{item.student.firstName} {item.student.lastName}</p><p className="text-xs text-slate-500">{item.student.admissionNo} · {item.student.classId?.displayName || "Class not assigned"}{item.student.sectionId?.name ? ` · ${item.student.sectionId.name}` : ""}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.level === "intervention" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{item.level === "intervention" ? "Intervention" : "Watch"} · {item.score}</span></div></CardHeader><CardContent><div className="space-y-2">{item.factors.map((factor: string) => <div key={factor} className="flex items-start gap-2 text-sm text-slate-700"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />{factor}</div>)}</div><div className="mt-4 flex items-center gap-2 border-t pt-3 text-xs text-slate-500"><TrendingDown className="h-4 w-4" />Review the underlying records before taking action.</div></CardContent></Card>)}</div>}
  </div>;
}
