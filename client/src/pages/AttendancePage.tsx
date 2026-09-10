import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { CalendarDays, CheckCircle2, Download, Save, Upload, Users, ClipboardCheck } from "lucide-react";
import api from "../lib/api";

type AttendanceStatus = "present" | "absent" | "late" | "half_day" | "on_leave";
interface AttendanceRecord { studentId: string; status: AttendanceStatus; remark?: string; }
interface AttendanceData { date: string; classId: string; sectionId: string; records: AttendanceRecord[]; markedBy: string; }
interface StudentData { _id: string; admissionNo: string; firstName: string; lastName: string; classId?: { _id: string; displayName: string }; sectionId?: { _id: string; name: string }; }
interface AttendanceDraftRecord { status: AttendanceStatus; remark: string; }
type AttendanceDraft = Record<string, AttendanceDraftRecord>;

const statusOptions = [
  { value: "present", label: "Present" }, { value: "absent", label: "Absent" }, { value: "late", label: "Late" },
  { value: "half_day", label: "Half Day" }, { value: "on_leave", label: "On Leave" },
] as const;
const statusTone: Record<AttendanceStatus, "success" | "danger" | "warning" | "info"> = { present: "success", absent: "danger", late: "warning", half_day: "info", on_leave: "info" };

function getTodayDate() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}
function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string; errors?: { row: number; message: string }[] } } }).response;
    if (response?.data?.errors?.length) return response.data.errors.map((item) => `Row ${item.row}: ${item.message}`).join("; ");
    if (response?.data?.message) return response.data.message;
  }
  if (error instanceof Error) return error.message;
  return "Unable to complete the attendance spreadsheet operation. Please try again.";
}
function buildDraft(students: StudentData[], existingAttendance?: AttendanceData | null): AttendanceDraft {
  const existingMap = new Map((existingAttendance?.records ?? []).map((record) => [record.studentId, record]));
  return Object.fromEntries(students.map((student) => {
    const existing = existingMap.get(student._id);
    return [student._id, { status: existing?.status ?? "present", remark: existing?.remark ?? "" }];
  }));
}

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [selectedDate, setSelectedDate] = useState(getTodayDate);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [draft, setDraft] = useState<AttendanceDraft>({});
  const [spreadsheetMessage, setSpreadsheetMessage] = useState("");
  const [spreadsheetError, setSpreadsheetError] = useState("");

  const { data: classesData, isLoading: classesLoading } = useQuery({ queryKey: ["classes", "all"], queryFn: async () => (await api.get("/academics/classes")).data });
  const { data: sectionsData, isLoading: sectionsLoading } = useQuery({ queryKey: ["sections", "by-class", selectedClass], queryFn: async () => { if (!selectedClass) return { data: [] }; return (await api.get("/academics/sections?classId=" + selectedClass)).data; }, enabled: !!selectedClass });
  const { data: studentsData, isLoading: studentsLoading } = useQuery({ queryKey: ["students", "by-class-section", selectedClass, selectedSection], queryFn: async () => { if (!selectedClass || !selectedSection) return { data: [] }; return (await api.get(`/students?classId=${selectedClass}&sectionId=${selectedSection}&status=active&limit=100`)).data; }, enabled: !!selectedClass && !!selectedSection });
  const { data: existingAttendance, isLoading: attendanceLoading } = useQuery({ queryKey: ["attendance", selectedDate, selectedClass, selectedSection], queryFn: async () => { if (!selectedClass || !selectedSection) return null; const res = await api.get(`/attendance?date=${selectedDate}&classId=${selectedClass}&sectionId=${selectedSection}`); return (res.data?.data?.[0] as AttendanceData | undefined) ?? null; }, enabled: !!selectedClass && !!selectedSection });

  const students: StudentData[] = studentsData?.data ?? [];
  const hasExistingAttendance = Boolean(existingAttendance);
  const isLoadingTable = studentsLoading || attendanceLoading;

  useEffect(() => {
    if (!selectedClass || !selectedSection || studentsLoading || attendanceLoading) return;
    setDraft(buildDraft(students, existingAttendance));
  }, [selectedDate, selectedClass, selectedSection, studentsLoading, attendanceLoading, studentsData, existingAttendance]);

  const markAttendanceMutation = useMutation({ mutationFn: (data: { date: string; classId: string; sectionId: string; records: AttendanceRecord[] }) => api.post("/attendance", data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance", selectedDate, selectedClass, selectedSection] }) });
  const exportMutation = useMutation({ mutationFn: async () => api.get(`/attendance/export?date=${selectedDate}&classId=${selectedClass}&sectionId=${selectedSection}`, { responseType: "blob" }), onSuccess: (response) => { const url = URL.createObjectURL(response.data); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `attendance-${selectedDate}.xlsx`; anchor.click(); URL.revokeObjectURL(url); setSpreadsheetError(""); setSpreadsheetMessage("Attendance spreadsheet exported successfully."); }, onError: (error) => { setSpreadsheetMessage(""); setSpreadsheetError(getErrorMessage(error)); } });
  const importMutation = useMutation({ mutationFn: async (file: File) => { const formData = new FormData(); formData.append("file", file); return api.post("/attendance/import", formData); }, onSuccess: (response) => { setSpreadsheetError(""); setSpreadsheetMessage(`${response.data?.imported ?? 0} attendance group(s) imported successfully.`); queryClient.invalidateQueries({ queryKey: ["attendance"] }); }, onError: (error) => { setSpreadsheetMessage(""); setSpreadsheetError(getErrorMessage(error)); } });

  const draftRecords = useMemo(() => students.map((student) => ({ studentId: student._id, status: draft[student._id]?.status ?? "present", remark: draft[student._id]?.remark ?? "" })), [students, draft]);
  const counts = useMemo(() => draftRecords.reduce((acc, record) => ({ ...acc, [record.status]: (acc[record.status] || 0) + 1 }), {} as Record<string, number>), [draftRecords]);
  const updateDraft = (studentId: string, changes: Partial<AttendanceDraftRecord>) => { setDraft((current) => ({ ...current, [studentId]: { ...current[studentId], ...changes } })); markAttendanceMutation.reset(); };
  const resetContext = () => { setDraft({}); markAttendanceMutation.reset(); setSpreadsheetMessage(""); setSpreadsheetError(""); };
  const handleClassChange = (classId: string) => { setSelectedClass(classId); setSelectedSection(""); resetContext(); };
  const handleSectionChange = (sectionId: string) => { setSelectedSection(sectionId); resetContext(); };
  const handleDateChange = (date: string) => { setSelectedDate(date); resetContext(); };
  const handleSaveAttendance = () => { if (!selectedClass || !selectedSection || draftRecords.length === 0) return; markAttendanceMutation.mutate({ date: selectedDate, classId: selectedClass, sectionId: selectedSection, records: draftRecords }); };
  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) importMutation.mutate(file); };

  return (
    <div className="space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-[28px] bg-slate-950 px-5 py-6 text-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.55)] sm:px-7 sm:py-8">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-sky-400/15 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-300"><ClipboardCheck className="h-3.5 w-3.5 text-sky-300" />Daily operations</div><h1 className="text-3xl font-black tracking-tight sm:text-4xl">Attendance</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Mark, correct and move attendance through one focused workspace. Select a class and section to begin.</p></div>
          <Button onClick={handleSaveAttendance} disabled={!selectedClass || !selectedSection || draftRecords.length === 0 || markAttendanceMutation.isPending || isLoadingTable} className="shrink-0 bg-white text-slate-950 hover:bg-slate-100 focus-visible:ring-white"><Save className="mr-2 h-4 w-4" />{markAttendanceMutation.isPending ? "Saving..." : hasExistingAttendance ? "Save correction" : "Mark attendance"}</Button>
        </div>
        <div className="relative mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">Students</p><p className="mt-1 text-xl font-extrabold">{students.length}</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">Present</p><p className="mt-1 text-xl font-extrabold text-emerald-300">{counts.present || 0}</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">Absent</p><p className="mt-1 text-xl font-extrabold text-rose-300">{counts.absent || 0}</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">Late</p><p className="mt-1 text-xl font-extrabold text-amber-300">{counts.late || 0}</p></div>
        </div>
      </section>

      <Card>
        <CardHeader><div className="flex flex-col gap-1"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sky-600">Attendance context</p><h2 className="text-lg font-bold tracking-tight text-slate-950">Choose the register</h2><p className="text-sm text-slate-500">Attendance is loaded for the selected date, class and section.</p></div></CardHeader>
        <CardContent><div className="grid gap-4 md:grid-cols-3">
          <Input label="Date" type="date" value={selectedDate} onChange={(e) => handleDateChange(e.target.value)} />
          <Select label="Class" value={selectedClass} onChange={(e) => handleClassChange(e.target.value)} disabled={classesLoading}><option value="">Select class</option>{classesData?.data?.map((c: { _id: string; displayName: string }) => <option key={c._id} value={c._id}>{c.displayName}</option>)}</Select>
          <Select label="Section" value={selectedSection} onChange={(e) => handleSectionChange(e.target.value)} disabled={!selectedClass || sectionsLoading}><option value="">Select section</option>{sectionsData?.data?.map((s: { _id: string; name: string }) => <option key={s._id} value={s._id}>{s.name}</option>)}</Select>
        </div></CardContent>
      </Card>

      {(spreadsheetError || spreadsheetMessage || markAttendanceMutation.isError || markAttendanceMutation.isSuccess) && <div className="space-y-2">{spreadsheetError && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"><strong>Spreadsheet failed:</strong> {spreadsheetError}</div>}{spreadsheetMessage && <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{spreadsheetMessage}</div>}{markAttendanceMutation.isError && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"><strong>Save failed:</strong> {getErrorMessage(markAttendanceMutation.error)}</div>}{markAttendanceMutation.isSuccess && <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"><CheckCircle2 className="mr-2 inline h-4 w-4" />Attendance {hasExistingAttendance ? "correction" : "marking"} saved successfully.</div>}</div>}

      <Card>
        <CardHeader><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sky-600">Register</p><div className="mt-1 flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-slate-950">Student attendance</h2>{hasExistingAttendance ? <Badge variant="warning">Existing record</Badge> : selectedClass && selectedSection ? <Badge variant="success">Ready to mark</Badge> : null}</div></div><div className="flex flex-wrap gap-2"><input ref={importInputRef} type="file" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" onChange={handleImportFile} className="hidden" /><Button variant="outline" onClick={() => { setSpreadsheetMessage(""); setSpreadsheetError(""); importInputRef.current?.click(); }} disabled={importMutation.isPending}><Upload className="mr-2 h-4 w-4" />{importMutation.isPending ? "Importing..." : "Import"}</Button><Button variant="outline" onClick={() => exportMutation.mutate()} disabled={!selectedClass || !selectedSection || exportMutation.isPending}><Download className="mr-2 h-4 w-4" />{exportMutation.isPending ? "Exporting..." : "Export"}</Button></div></div></CardHeader>
        <CardContent>
          {!selectedClass || !selectedSection ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 py-14 text-center"><Users className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 font-semibold text-slate-800">Select a class and section</p><p className="mt-1 text-sm text-slate-500">The student register will appear here once the attendance context is complete.</p></div> : isLoadingTable ? <div className="space-y-3 py-4">{[1,2,3,4,5].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div> : students.length === 0 ? <div className="py-14 text-center"><Users className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 font-semibold text-slate-700">No active students found</p><p className="mt-1 text-sm text-slate-500">Try another class or section.</p></div> : <div className="overflow-x-auto rounded-2xl border border-slate-200"><table className="w-full min-w-[760px]"><thead><tr className="bg-slate-50 text-left"><th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Student</th><th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Admission No.</th><th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th><th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Remark</th></tr></thead><tbody className="divide-y divide-slate-200 bg-white">{students.map((student) => { const studentDraft = draft[student._id] ?? { status: "present" as AttendanceStatus, remark: "" }; return <tr key={student._id} className="transition hover:bg-slate-50/80"><td className="px-4 py-3"><div className="font-semibold text-slate-800">{student.firstName} {student.lastName}</div><div className="text-xs text-slate-400">{student.classId?.displayName || ""}{student.sectionId?.name ? ` · ${student.sectionId.name}` : ""}</div></td><td className="px-4 py-3 text-sm font-medium text-slate-600">{student.admissionNo}</td><td className="px-4 py-3"><div className="flex items-center gap-2"><Select aria-label={`Attendance status for ${student.firstName} ${student.lastName}`} value={studentDraft.status} onChange={(e) => updateDraft(student._id, { status: e.target.value as AttendanceStatus })} disabled={markAttendanceMutation.isPending}>{statusOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</Select><Badge variant={statusTone[studentDraft.status]}>{studentDraft.status.replace("_", " ")}</Badge></div></td><td className="px-4 py-3"><Input aria-label={`Remark for ${student.firstName} ${student.lastName}`} type="text" value={studentDraft.remark} onChange={(e) => updateDraft(student._id, { remark: e.target.value })} placeholder="Optional remark" disabled={markAttendanceMutation.isPending} /></td></tr>; })}</tbody></table></div>}
        </CardContent>
      </Card>
    </div>
  );
}
