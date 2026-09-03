import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck2, CheckCircle2, Clock3, Users } from "lucide-react";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import api from "../lib/api";

const statuses = [
  ["present", "Present"], ["absent", "Absent"], ["late", "Late"], ["half_day", "Half day"], ["on_leave", "On leave"],
] as const;
type Status = typeof statuses[number][0];
type Student = { _id: string; admissionNo: string; firstName: string; lastName: string; classId: string | { _id: string; displayName: string }; sectionId?: string | { _id: string; name: string } };
type Section = { _id: string; name: string; classId: string };
type WorkspaceData = { date: string; assignedClasses: { _id: string; displayName: string; sectionIds: string[] }[]; assignedSections: Section[]; assignedStudents: Student[]; todayTimetable: any[]; attendance: any[]; };

function today() { return new Date().toISOString().slice(0, 10); }
function id(value: unknown) { return typeof value === "string" ? value : (value as { _id?: string })?._id ?? ""; }
function label(value: unknown, fallback: string) { return typeof value === "object" && value !== null ? (value as { displayName?: string; name?: string }).displayName ?? (value as { name?: string }).name ?? fallback : fallback; }
function errorMessage(error: unknown) { const response = (error as any)?.response?.data; return response?.message || response?.error || (error instanceof Error ? error.message : "Unable to save attendance."); }

export default function TeacherWorkspacePage() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(today);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [draft, setDraft] = useState<Record<string, { status: Status; remark: string }>>({});

  const { data, isLoading, isError, refetch } = useQuery<WorkspaceData>({
    queryKey: ["teacher", "workspace", date],
    queryFn: async () => (await api.get(`/portal/teacher/workspace?date=${date}`)).data,
  });

  const sections = useMemo(() => (data?.assignedSections ?? []).filter((section) => id(section.classId) === selectedClass), [data, selectedClass]);
  const students = useMemo(() => (data?.assignedStudents ?? []).filter((student) => id(student.classId) === selectedClass && id(student.sectionId) === selectedSection), [data, selectedClass, selectedSection]);
  const existingAttendance = useMemo(() => (data?.attendance ?? []).find((item) => id(item.classId) === selectedClass && id(item.sectionId) === selectedSection) ?? null, [data, selectedClass, selectedSection]);
  const hasExistingAttendance = Boolean(existingAttendance);

  useEffect(() => {
    if (!selectedClass && data?.assignedClasses?.length) setSelectedClass(data.assignedClasses[0]._id);
  }, [data, selectedClass]);
  useEffect(() => {
    if (!selectedClass) return;
    setSelectedSection((current) => sections.some((item) => item._id === current) ? current : sections[0]?._id ?? "");
  }, [selectedClass, sections]);
  useEffect(() => {
    const existing = new Map((existingAttendance?.records ?? []).map((record: any) => [id(record.studentId), record]));
    setDraft(Object.fromEntries(students.map((student) => { const record = existing.get(student._id); return [student._id, { status: record?.status ?? "present", remark: record?.remark ?? "" }]; })));
  }, [students, existingAttendance, date]);

  const saveMutation = useMutation({
    mutationFn: () => api.post("/attendance", { date, classId: selectedClass, sectionId: selectedSection, records: students.map((student) => ({ studentId: student._id, status: draft[student._id]?.status ?? "present", remark: draft[student._id]?.remark ?? "" })) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teacher", "workspace"] }),
  });

  if (isLoading) return <div className="rounded-2xl border bg-white p-8 text-center text-sm text-slate-500">Loading your teaching workspace...</div>;
  if (isError || !data) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">Unable to load your teaching workspace. <button type="button" className="font-semibold underline" onClick={() => refetch()}>Try again</button></div>;

  return <div className="space-y-6">
    <section className="overflow-hidden rounded-2xl bg-slate-950 px-5 py-6 text-white sm:px-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-300">Teacher workspace</p><h1 className="mt-2 text-2xl font-bold tracking-tight">Good day, {data.teacher?.firstName ?? "Teacher"}</h1><p className="mt-1 max-w-2xl text-sm text-slate-300">See your assigned classes, today’s periods and attendance tasks in one place.</p></div>
        <Input label="Working date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-full sm:w-48" />
      </div>
    </section>

    <div className="grid gap-4 sm:grid-cols-3">
      <Summary icon={Clock3} label="Periods today" value={data.todayTimetable.length} />
      <Summary icon={Users} label="Assigned classes" value={data.assignedClasses.length} />
      <Summary icon={CalendarCheck2} label="Attendance groups" value={data.attendance.length} />
    </div>

    <div className="grid gap-6 xl:grid-cols-[1fr_1.35fr]">
      <Card><CardHeader><h2 className="text-base font-semibold text-slate-900">Today’s timetable</h2><p className="text-sm text-slate-500">Periods assigned to you for {date}.</p></CardHeader><CardContent>{data.todayTimetable.length ? <div className="space-y-3">{data.todayTimetable.map((item: any) => <div key={item._id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{item.subjectId?.name ?? "Subject"}</p><p className="mt-1 text-sm text-slate-500">{label(item.classId, "Class")}{item.sectionId?.name ? ` · ${item.sectionId.name}` : ""}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{item.startTime}–{item.endTime}</span></div>{item.roomNumber && <p className="mt-3 text-xs text-slate-500">Room {item.roomNumber}</p>}</div>)}</div> : <p className="py-4 text-sm text-slate-500">No periods are assigned to you for this date.</p>}</CardContent></Card>

      <Card><CardHeader><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-base font-semibold text-slate-900">Attendance</h2><p className="text-sm text-slate-500">Only classes assigned to you as class teacher are available here.</p></div><div className="flex w-full gap-2 sm:w-auto"><Select aria-label="Attendance class" value={selectedClass} onChange={(event) => { setSelectedClass(event.target.value); setSelectedSection(""); saveMutation.reset(); }} className="min-w-0 flex-1 sm:w-44"><option value="">Select class</option>{data.assignedClasses.map((item) => <option key={item._id} value={item._id}>{item.displayName}</option>)}</Select><Select aria-label="Attendance section" value={selectedSection} onChange={(event) => { setSelectedSection(event.target.value); saveMutation.reset(); }} disabled={!selectedClass} className="min-w-0 flex-1 sm:w-32"><option value="">Section</option>{sections.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</Select></div></div></CardHeader><CardContent>
        {saveMutation.isError && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage(saveMutation.error)}</div>}
        {saveMutation.isSuccess && <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Attendance marked successfully.</div>}
        {hasExistingAttendance && <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Attendance has already been recorded for this group. Corrections require school management authorization.</div>}
        {!selectedClass || !selectedSection ? <p className="py-8 text-center text-sm text-slate-500">Choose a class and section to mark attendance.</p> : students.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No active students are assigned to this section.</p> : <>
          <div className="space-y-2 md:hidden">{students.map((student) => <div key={student._id} className="rounded-xl border border-slate-200 p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold text-slate-900">{student.firstName} {student.lastName}</p><p className="text-xs text-slate-500">{student.admissionNo}</p></div><Select aria-label={`Attendance status for ${student.firstName} ${student.lastName}`} value={draft[student._id]?.status ?? "present"} disabled={hasExistingAttendance || saveMutation.isPending} onChange={(event) => setDraft((current) => ({ ...current, [student._id]: { ...(current[student._id] ?? { status: "present", remark: "" }), status: event.target.value as Status } }))} className="w-32">{statuses.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</Select></div><Input aria-label={`Remark for ${student.firstName} ${student.lastName}`} value={draft[student._id]?.remark ?? ""} disabled={hasExistingAttendance || saveMutation.isPending} onChange={(event) => setDraft((current) => ({ ...current, [student._id]: { ...(current[student._id] ?? { status: "present", remark: "" }), remark: event.target.value } }))} placeholder="Optional remark" className="mt-2" /></div>)}</div>
          <div className="hidden overflow-x-auto md:block"><table className="w-full"><thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500"><th className="px-3 py-3">Student</th><th className="px-3 py-3">Admission</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Remark</th></tr></thead><tbody className="divide-y divide-slate-100">{students.map((student) => <tr key={student._id}><td className="px-3 py-3 text-sm font-medium text-slate-900">{student.firstName} {student.lastName}</td><td className="px-3 py-3 text-sm text-slate-500">{student.admissionNo}</td><td className="px-3 py-3"><Select aria-label={`Attendance status for ${student.firstName} ${student.lastName}`} value={draft[student._id]?.status ?? "present"} disabled={hasExistingAttendance || saveMutation.isPending} onChange={(event) => setDraft((current) => ({ ...current, [student._id]: { ...(current[student._id] ?? { status: "present", remark: "" }), status: event.target.value as Status } }))} className="w-32">{statuses.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</Select></td><td className="px-3 py-3"><Input aria-label={`Remark for ${student.firstName} ${student.lastName}`} value={draft[student._id]?.remark ?? ""} disabled={hasExistingAttendance || saveMutation.isPending} onChange={(event) => setDraft((current) => ({ ...current, [student._id]: { ...(current[student._id] ?? { status: "present", remark: "" }), remark: event.target.value } }))} placeholder="Optional remark" /></td></tr>)}</tbody></table></div>
          <div className="mt-4 flex justify-end"><Button onClick={() => saveMutation.mutate()} disabled={hasExistingAttendance || saveMutation.isPending}>{saveMutation.isPending ? "Saving..." : <><CheckCircle2 className="mr-2 h-4 w-4" />Mark attendance</>}</Button></div>
        </>}
      </CardContent></Card>
    </div>
  </div>;
}
function Summary({ icon: Icon, label: text, value }: { icon: any; label: string; value: number }) { return <Card><CardContent className="flex items-center gap-4 py-5"><div className="rounded-xl bg-primary-50 p-3 text-primary-700"><Icon className="h-5 w-5" aria-hidden="true" /></div><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{text}</p><p className="mt-1 text-2xl font-bold text-slate-900">{value}</p></div></CardContent></Card>; }
