import { useQuery } from "@tanstack/react-query";
import { CalendarClock, MapPin, UserRound } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import api from "../lib/api";
import { useAuth } from "../hooks";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function PortalTimetablePage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const childId = params.get("childId") || "";
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["portal-timetable", user?.role, childId],
    queryFn: async () => (await api.get(`/portal/timetable${childId && user?.role === "parent" ? `?childId=${encodeURIComponent(childId)}` : ""}`)).data,
    enabled: Boolean(user),
  });
  if (isLoading) return <div className="space-y-4"><div className="h-8 w-48 animate-pulse rounded bg-slate-200" /><div className="h-64 animate-pulse rounded-2xl bg-slate-200" /></div>;
  if (isError) return <Card><CardContent className="py-10 text-center"><p className="font-semibold text-slate-900">Timetable is unavailable right now.</p><p className="mt-1 text-sm text-slate-500">Please try again shortly.</p><Button variant="outline" className="mt-3" onClick={() => refetch()}>Try again</Button></CardContent></Card>;
  const entries = data?.entries ?? [];
  const students = data?.students ?? [];
  const selectedStudentId = childId || data?.selectedStudentId || "";
  return <div className="space-y-6">
    <header className="rounded-3xl bg-slate-950 px-6 py-7 text-white sm:px-8"><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10"><CalendarClock className="h-6 w-6 text-primary-300" aria-hidden="true" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-300">Weekly schedule</p><h1 className="mt-1 text-2xl font-bold">Timetable</h1><p className="mt-1 text-sm text-slate-300">{data?.academicYear?.name || "Current academic year"}</p></div></div></header>
    {user?.role === "parent" && students.length > 1 && <Card><CardHeader><h2 className="font-semibold">Selected child</h2></CardHeader><CardContent><label className="sr-only" htmlFor="timetable-child">Choose a child</label><select id="timetable-child" value={selectedStudentId} onChange={(e) => setParams(e.target.value ? { childId: e.target.value } : {})} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 sm:max-w-md"><option value="">All children</option>{students.map((student: any) => <option key={student._id} value={student._id}>{student.firstName} {student.lastName} · {student.class}{student.section ? ` · ${student.section}` : ""}</option>)}</select></CardContent></Card>}
    {entries.length === 0 ? <Card><CardContent className="py-12 text-center"><CalendarClock className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" /><p className="mt-3 font-semibold text-slate-900">No timetable entries yet</p><p className="mt-1 text-sm text-slate-500">Your current academic-year schedule will appear here.</p></CardContent></Card> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{DAYS.map((day, index) => { const dayEntries = entries.filter((item: any) => item.dayOfWeek === index + 1); return <Card key={day}><CardHeader><h2 className="font-semibold text-slate-900">{day}</h2></CardHeader><CardContent>{dayEntries.length ? <div className="space-y-3">{dayEntries.map((item: any) => <article key={item._id} className="rounded-xl border border-slate-200 p-4"><p className="text-sm font-bold text-slate-900">{item.startTime}–{item.endTime}</p><p className="mt-1 font-semibold text-primary-700">{item.subject}{item.periodLabel ? ` · ${item.periodLabel}` : ""}</p><div className="mt-2 space-y-1 text-xs text-slate-500">{item.teacher && <p className="flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" aria-hidden="true" />{item.teacher}</p>}{item.roomNumber && <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />Room {item.roomNumber}</p>}{user?.role === "parent" && item.class && <p>{item.class}{item.section ? ` · ${item.section}` : ""}</p>}</div></article>)}</div> : <p className="py-3 text-sm text-slate-500">No periods scheduled.</p>}</CardContent></Card>; })}</div>}
  </div>;
}
