import { useQuery } from "@tanstack/react-query";
import { Bell, CalendarDays } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import api from "../lib/api";
import { formatDate } from "../utils";
import { useAuth } from "../hooks";

const priorityVariant: Record<string, "danger" | "warning" | "info" | "secondary"> = { urgent: "danger", high: "warning", normal: "info", low: "secondary" };

export default function PortalNoticesPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const childId = params.get("childId") || "";
  const isParent = user?.role === "parent";
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["portal-notices", user?.role, childId],
    queryFn: async () => (await api.get(`/portal/notices${isParent && childId ? `?childId=${encodeURIComponent(childId)}` : ""}`)).data,
    enabled: Boolean(user),
  });
  if (isLoading) return <div className="space-y-4"><div className="h-8 w-40 animate-pulse rounded bg-slate-200" /><div className="h-28 animate-pulse rounded-2xl bg-slate-200" /><div className="h-48 animate-pulse rounded-2xl bg-slate-200" /></div>;
  if (isError) return <Card><CardContent className="py-10 text-center"><p className="font-semibold text-slate-900">Notices are unavailable right now.</p><p className="mt-1 text-sm text-slate-500">Please try again shortly.</p><Button variant="outline" className="mt-3" onClick={() => refetch()}>Try again</Button></CardContent></Card>;
  const students = data?.students || [];
  const selectedStudentId = data?.selectedStudentId || childId || (students.length === 1 ? students[0]?._id : "");
  const notices = data?.data || [];
  return <div className="space-y-6">
    <header><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-600">School updates</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Notices</h1><p className="mt-1 text-sm text-slate-500">Current announcements relevant to you.</p></header>
    {isParent && students.length > 1 && <Card><CardHeader><h2 className="font-semibold">Show notices for</h2></CardHeader><CardContent><label className="sr-only" htmlFor="notices-child">Choose a child</label><select id="notices-child" value={selectedStudentId} onChange={(e) => setParams(e.target.value ? { childId: e.target.value } : {})} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 sm:max-w-md">{students.map((student: any) => <option key={student._id} value={student._id}>{student.firstName} {student.lastName} · {student.class}{student.section ? ` · ${student.section}` : ""}</option>)}</select></CardContent></Card>}
    {notices.length === 0 ? <Card><CardContent className="py-12 text-center"><Bell className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" /><p className="mt-3 font-semibold text-slate-900">No current notices</p><p className="mt-1 text-sm text-slate-500">New school announcements will appear here.</p></CardContent></Card> : <div className="space-y-4">{notices.map((notice: any) => <Card key={notice._id}><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-950">{notice.title}</h2><div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500"><span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />Published {formatDate(notice.publishAt)}</span>{notice.class && <span>{notice.class}{notice.section ? ` · ${notice.section}` : ""}</span>}</div></div><Badge variant={priorityVariant[notice.priority] || "secondary"}>{notice.priority || "normal"}</Badge></div></CardHeader><CardContent><p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{notice.content}</p>{notice.expiresAt && <p className="mt-4 text-xs text-slate-400">Available until {formatDate(notice.expiresAt)}</p>}</CardContent></Card>)}</div>}
  </div>;
}
