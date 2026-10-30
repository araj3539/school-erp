import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { PremiumCard, PremiumCardContent, PremiumCardFooter } from "../components/ui/PremiumCard.js";
import { CalendarDays, Users, Clock, RefreshCw } from "lucide-react";
import api from "../lib/api";
import { GlassPanel, GlowOrb } from "../components/ui/GlassPanel.js";

type AttendanceStatus = "present" | "absent" | "late" | "half_day" | "on_leave";
interface AttendanceRecord { studentId: string; status: AttendanceStatus; remark?: string; }
interface AttendanceData { date: string; classId: string; sectionId: string; records: AttendanceRecord[]; markedBy: string; }
interface StudentData { _id: string; admissionNo: string; firstName: string; lastName: string; classId?: { _id: string; displayName: string }; sectionId?: { _id: string; name: string }; }
interface AttendanceDraftRecord { status: AttendanceStatus; remark: string; }
type AttendanceDraft = Record<string, AttendanceDraftRecord>;

const statusOptions = [
  { value: "present", label: "Present", color: "bg-emerald-500/10 text-emerald-600" },
  { value: "absent", label: "Absent", color: "bg-rose-500/10 text-rose-600" },
  { value: "late", label: "Late", color: "bg-amber-500/10 text-amber-600" },
  { value: "half_day", label: "Half Day", color: "bg-blue-500/10 text-blue-600" },
  { value: "on_leave", label: "On Leave", color: "bg-slate-500/10 text-slate-600" },
] as const;

function getTodayDate() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}
function buildDraft(students: StudentData[], existingAttendance?: AttendanceData | null): AttendanceDraft {
  const existingMap = new Map((existingAttendance?.records ?? []).map((record) => [record.studentId, record]));
  return Object.fromEntries(students.map((student) => {
    const existing = existingMap.get(student._id);
    return [student._id, { status: existing?.status ?? "present", remark: existing?.remark ?? "" }];
  }));
}

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDate);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [draft, setDraft] = useState<AttendanceDraft>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const classesQuery = useQuery({ queryKey: ["attendance", "classes"], queryFn: async () => (await api.get("/academics/classes?limit=100")).data });
  const sectionsQuery = useQuery({ queryKey: ["attendance", "sections", selectedClass], enabled: !!selectedClass, queryFn: async () => (await api.get(`/academics/sections?classId=${selectedClass}`)).data });
  const studentsQuery = useQuery({ queryKey: ["attendance", "students", selectedClass, selectedSection], enabled: !!selectedClass && !!selectedSection, queryFn: async () => (await api.get(`/students?classId=${selectedClass}&sectionId=${selectedSection}&limit=100`)).data });
  const existingQuery = useQuery({ queryKey: ["attendance", "record", selectedDate, selectedClass, selectedSection], enabled: !!selectedDate && !!selectedClass && !!selectedSection, queryFn: async () => { const res = await api.get(`/attendance?date=${selectedDate}&classId=${selectedClass}&sectionId=${selectedSection}&limit=1`); return res.data.data?.[0] || null; } });

  const classes = classesQuery.data?.data || [];
  const sections = sectionsQuery.data?.data || [];
  const students = studentsQuery.data?.data || [];
  const existingAttendance = existingQuery.data;

  useEffect(() => {
    if (students.length && Object.keys(draft).length === 0 && existingAttendance) {
      setDraft(buildDraft(students, existingAttendance));
    }
  }, [students, existingAttendance, draft]);

  useEffect(() => {
    if (students.length && Object.keys(draft).length === 0 && !existingAttendance) {
      setDraft(buildDraft(students));
    }
  }, [students, existingAttendance]);

  const presentCount = Object.values(draft).filter(r => r.status === "present").length;
  const absentCount = Object.values(draft).filter(r => r.status === "absent").length;

  const saveAttendance = async () => {
    if (!selectedClass || !selectedSection || !selectedDate) return;
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const records = Object.entries(draft).map(([studentId, record]) => ({ studentId, status: record.status, remark: record.remark }));
      await api.post("/attendance", { classId: selectedClass, sectionId: selectedSection, date: selectedDate, records });
      setDraft(buildDraft(students, { ...existingAttendance!, records: records as any[] }));
    } catch (error: any) {
      setSubmitError(error?.response?.data?.message || "Unable to save attendance. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100/50 relative overflow-x-hidden pb-12">
      {/* Background orbs */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <GlowOrb color="cyan" size="xl" className="top-[-5%] left-[-10%] animate-pulse-slow" />
        <GlowOrb color="primary" size="lg" className="bottom-[-10%] right-[-10%] animate-pulse-slow" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Header */}
        <GlassPanel className="mb-8">
          <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-700 text-white shadow-lg shadow-cyan-500/30">
                    <CalendarDays className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Attendance</h1>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">Mark daily attendance for students by class and section. All entries are audited and timestamped.</p>
              </div>
              <div className="flex items-center justify-end gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</p>
                  <p className="text-sm font-semibold text-slate-900">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
                <Button onClick={saveAttendance} disabled={isSubmitting || !selectedClass || !selectedSection || !students.length} className="bg-primary-600 text-white shadow-lg shadow-primary-600/25 hover:bg-primary-700 hover:shadow-primary-600/40 px-6 py-3 text-sm font-semibold rounded-2xl transition-all">
                  <Clock className="mr-2 h-4 w-4" aria-hidden="true" />Save Attendance
                </Button>
              </div>
            </div>
          </div>
        </GlassPanel>

        {/* Controls */}
        <PremiumCard hover className="overflow-hidden">
          <PremiumCardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-[auto_auto_auto_1fr] items-end">
              <div className="relative min-w-0">
                <Input type="date" label="Date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full md:w-64" />
              </div>
              <Select label="Class" value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(""); setDraft({}); }} className="w-full md:w-72">
                <option value="">Select Class</option>{classes.map((c: any) => <option key={c._id} value={c._id}>{c.displayName}</option>)}
              </Select>
              <Select label="Section" value={selectedSection} onChange={(e) => { setSelectedSection(e.target.value); setDraft({}); }} disabled={!selectedClass} className="w-full md:w-64">
                <option value="">Select Section</option>{sections.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </Select>
              {submitError && <div className="col-span-full p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm">{submitError}</div>}
            </div>
          </PremiumCardContent>
        </PremiumCard>

        {/* Quick Stats */}
        {(selectedClass && selectedSection) && (
          <div className="grid gap-4 sm:grid-cols-4 mb-6">
            <PremiumCard className="p-5 text-center">
              <p className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-1">Total Students</p>
              <p className="text-2xl font-black text-slate-900">{students.length}</p>
            </PremiumCard>
            <PremiumCard className="p-5 text-center">
              <p className="text-xs font-semibold tracking-wider uppercase text-emerald-600 mb-1">Present</p>
              <p className="text-2xl font-black text-emerald-600">{presentCount}</p>
            </PremiumCard>
            <PremiumCard className="p-5 text-center">
              <p className="text-xs font-semibold tracking-wider uppercase text-rose-600 mb-1">Absent</p>
              <p className="text-2xl font-black text-rose-600">{absentCount}</p>
            </PremiumCard>
            <PremiumCard className="p-5 text-center">
              <p className="text-xs font-semibold tracking-wider uppercase text-slate-600 mb-1">Coverage</p>
              <p className="text-2xl font-black text-slate-900">{students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0}%</p>
            </PremiumCard>
          </div>
        )}

        {/* Attendance Table */}
        <PremiumCard hover className="overflow-hidden">
          <PremiumCardContent className="p-0">
            {!selectedClass || !selectedSection ? (
              <div className="px-6 py-20 text-center">
                <div className="flex justify-center mb-6">
                  <Users className="h-16 w-16 text-slate-300" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Select Class & Section</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">Choose a class and section to view and mark student attendance.</p>
              </div>
            ) : students.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <div className="flex justify-center mb-6">
                  <Users className="h-16 w-16 text-slate-300" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No Students Found</h3>
                <p className="text-sm text-slate-500">No students are assigned to this class and section.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Student</th>
                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Admission No</th>
                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">Status</th>
                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((student: StudentData) => {
                      const id = student._id;
                      const current = draft[id] || { status: "present", remark: "" };
                      return (
                        <tr key={id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-slate-500">
                                {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900">{student.firstName} {student.lastName}</p>
                                <p className="text-xs text-slate-500">{student.admissionNo}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-[11px] text-slate-400">{student.admissionNo}</td>
                          <td className="px-6 py-4 text-center">
                            <Select value={current.status} onChange={(e) => setDraft({ ...draft, [id]: { ...current, status: e.target.value as AttendanceStatus } })} className="w-32 text-xs bg-transparent border-none focus:ring-0">
                              {statusOptions.map((o) => (
                                <option key={o.value} value={o.value} className={o.color}>{o.label}</option>
                              ))}
                            </Select>
                          </td>
                          <td className="px-6 py-4">
                            <Input value={current.remark} onChange={(e) => setDraft({ ...draft, [id]: { ...current, remark: e.target.value } })} placeholder="Remark…" className="text-xs bg-transparent border-none focus:ring-0" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </PremiumCardContent>
          {(selectedClass && selectedSection && students.length > 0) && (
            <PremiumCardFooter className="border-t border-slate-100/60 bg-white/80 px-6 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{students.length} students · {selectedDate}</span>
                <Button onClick={saveAttendance} disabled={isSubmitting} className="bg-primary-600 text-white shadow-lg shadow-primary-600/25 hover:bg-primary-700 hover:shadow-primary-600/40">
                  {isSubmitting ? (<><RefreshCw className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Saving…</>) : "Save Attendance"}
                </Button>
              </div>
            </PremiumCardFooter>
          )}
        </PremiumCard>
      </div>
    </div>
  );
}
