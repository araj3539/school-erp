import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ClipboardList, Megaphone, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import api from "../lib/api";
import { useAuth } from "../hooks";

export default function PortalDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["portal", "dashboard", user?.role], queryFn: async () => (await api.get("/portal/dashboard")).data, enabled: Boolean(user) });
  if (isLoading) return <div className="rounded-2xl border bg-white p-8 text-center text-sm text-slate-500">Loading your school-day summary...</div>;
  if (isError) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">Unable to load your summary. <button type="button" className="font-semibold underline" onClick={() => refetch()}>Try again</button></div>;
  const role = user?.role;
  const teacher = role === "teacher";
  const student = role === "student";
  const parent = role === "parent";
  return <div className="space-y-6">
    <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">{teacher ? "Teaching today" : student ? "Your school day" : "Family overview"}</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Your dashboard</h1><p className="mt-1 text-sm text-slate-500">{data?.academicYear?.name || "Current academic year"}</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {teacher && <><Stat label="Classes today" value={data?.summary?.classesToday ?? 0} icon={CalendarClock}/><Stat label="Assigned classes" value={data?.summary?.assignedClasses ?? 0} icon={Users}/><Stat label="Subjects" value={data?.summary?.assignedSubjects ?? 0} icon={ClipboardList}/><Stat label="Homework due soon" value={data?.homeworkAttention?.length ?? 0} icon={ClipboardList}/></>}
      {student && <><Stat label="Attendance" value={`${data?.summary?.attendanceRate ?? 0}%`} icon={Users}/><Stat label="Present days" value={data?.summary?.attendancePresent ?? 0} icon={Users}/><Stat label="Homework ahead" value={data?.upcomingHomework?.length ?? 0} icon={ClipboardList}/><Stat label="Published exams" value={data?.upcomingExams?.length ?? 0} icon={CalendarClock}/></>}
      {parent && <><Stat label="Linked children" value={data?.children?.length ?? 0} icon={Users}/><Stat label="Homework ahead" value={data?.upcomingHomework?.length ?? 0} icon={ClipboardList}/><Stat label="Published exams" value={data?.upcomingExams?.length ?? 0} icon={CalendarClock}/><Stat label="Notices" value={data?.notices?.length ?? 0} icon={Megaphone}/></>}
    </div>
    <div className="grid gap-6 xl:grid-cols-2">
      {teacher && <ListCard title="Today's classes" items={(data?.todayClasses ?? []).map((item: any) => `${item.startTime}–${item.endTime} · ${item.subjectId?.name || "Subject"} · ${item.classId?.displayName || "Class"}${item.sectionId?.name ? ` · ${item.sectionId.name}` : ""}`)} empty="No classes are scheduled today." />}
      {student && <ListCard title="Upcoming homework" items={(data?.upcomingHomework ?? []).map((item: any) => `${item.subjectId?.name || "Subject"} · ${item.title}`)} empty="No upcoming homework." />}
      {parent && <ListCard title="Children" items={(data?.children ?? []).map((item: any) => `${item.firstName} ${item.lastName} · ${item.classId?.displayName || "Class not assigned"}${item.sectionId?.name ? ` · ${item.sectionId.name}` : ""}`)} empty="No linked children found." />}
      <ListCard title="Important notices" items={(data?.notices ?? []).map((item: any) => item.title)} empty="No current notices." />
    </div>
  </div>;
}
function Stat({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) { return <Card><CardHeader><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><Icon className="h-4 w-4 text-primary-600" aria-hidden="true" /></div></CardHeader><CardContent><p className="text-3xl font-bold text-slate-900">{value}</p></CardContent></Card>; }
function ListCard({ title, items, empty }: { title: string; items: string[]; empty: string }) { return <Card><CardHeader><h2 className="text-base font-semibold text-slate-900">{title}</h2></CardHeader><CardContent>{items.length ? <ul className="divide-y divide-slate-100">{items.map((item, index) => <li key={`${item}-${index}`} className="py-3 text-sm text-slate-700">{item}</li>)}</ul> : <p className="py-4 text-sm text-slate-500">{empty}</p>}</CardContent></Card>; }
