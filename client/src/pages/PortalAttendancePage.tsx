import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock3, CalendarDays, CircleAlert, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";

const labels: Record<string, string> = { present: "Present", absent: "Absent", late: "Late", halfDay: "Half day", onLeave: "On leave", not_recorded: "Not recorded" };

export default function PortalAttendancePage() {
  const { user } = useAuthStore();
  const [params] = useSearchParams();
  const childId = params.get("childId") || "";
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["portal", "attendance", childId], queryFn: async () => (await api.get(`/portal/attendance?days=30${childId ? `&childId=${encodeURIComponent(childId)}` : ""}`)).data });

  if (isLoading) return <p className="py-12 text-center text-sm text-slate-500">Loading attendance...</p>;
  if (isError || !data) return <div className="py-12 text-center"><p className="font-medium text-red-600">Unable to load attendance.</p><button className="mt-3 rounded-lg border px-3 py-2 text-sm font-semibold" onClick={() => refetch()}>Try again</button></div>;

  const { student, counts, attendanceRate, records } = data;
  const statusIcon = (status: string) => status === "present" ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : status === "late" ? <Clock3 className="h-4 w-4" aria-hidden="true" /> : <CircleAlert className="h-4 w-4" aria-hidden="true" />;

  return <div className="space-y-6">
    <header className="rounded-3xl bg-slate-950 px-6 py-7 text-white sm:px-8"><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10"><UserRound className="h-6 w-6 text-primary-300" aria-hidden="true" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-300">Attendance</p><h1 className="mt-1 text-2xl font-bold">{student.firstName} {student.lastName}</h1><p className="mt-1 text-sm text-slate-300">{student.class}{student.section ? ` · ${student.section}` : ""}</p></div></div></header>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card><CardContent className="pt-5"><p className="text-sm text-slate-500">Attendance rate</p><p className="mt-1 text-3xl font-bold">{attendanceRate === null ? "—" : `${attendanceRate}%`}</p><p className="mt-1 text-xs text-slate-500">Last 30 days</p></CardContent></Card>
      <Card><CardContent className="pt-5"><p className="text-sm text-slate-500">Present</p><p className="mt-1 text-2xl font-bold">{counts.present}</p></CardContent></Card>
      <Card><CardContent className="pt-5"><p className="text-sm text-slate-500">Absent</p><p className="mt-1 text-2xl font-bold">{counts.absent}</p></CardContent></Card>
      <Card><CardContent className="pt-5"><p className="text-sm text-slate-500">Late / half day</p><p className="mt-1 text-2xl font-bold">{counts.late + counts.halfDay}</p></CardContent></Card>
    </div>
    <Card><CardHeader><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary-600" aria-hidden="true"/><h2 className="text-base font-semibold">Daily record</h2></div></CardHeader><CardContent>{records.length ? <div className="divide-y divide-slate-100">{records.map((item: any) => <div key={item.date} className="flex items-center justify-between gap-4 py-3"><div><p className="text-sm font-semibold text-slate-800">{new Date(item.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</p>{item.remark && <p className="mt-0.5 text-xs text-slate-500">{item.remark}</p>}</div><Badge variant={item.status === "present" ? "success" : item.status === "not_recorded" ? "default" : "warning"}><span className="mr-1 inline-flex">{statusIcon(item.status)}</span>{labels[item.status] || item.status}</Badge></div>)}</div> : <p className="py-6 text-center text-sm text-slate-500">No attendance has been recorded in the last 30 days.</p>}</CardContent></Card>
  </div>;
}
