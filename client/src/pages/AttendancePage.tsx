import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Download, Save, Upload } from "lucide-react";
import api from "../lib/api";

type AttendanceStatus = "present" | "absent" | "late" | "half_day" | "on_leave";
interface AttendanceRecord { studentId: string; status: AttendanceStatus; remark?: string; }
interface AttendanceData { date: string; classId: string; sectionId: string; records: AttendanceRecord[]; markedBy: string; }
interface StudentData { _id: string; admissionNo: string; firstName: string; lastName: string; classId?: { _id: string; displayName: string }; sectionId?: { _id: string; name: string }; }
interface AttendanceDraftRecord { status: AttendanceStatus; remark: string; }
type AttendanceDraft = Record<string, AttendanceDraftRecord>;

const statusOptions = [
  { value: "present", label: "Present" }, { value: "absent", label: "Absent" }, { value: "late", label: "Late" },
  { value: "half_day", label: "Half Day" }, { value: "on_leave", label: "On Leave" }
] as const;

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
  const { data: sectionsData, isLoading: sectionsLoading } = useQuery({
    queryKey: ["sections", "by-class", selectedClass],
    queryFn: async () => { if (!selectedClass) return { data: [] }; return (await api.get("/academics/sections?classId=" + selectedClass)).data; },
    enabled: !!selectedClass
  });
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ["students", "by-class-section", selectedClass, selectedSection],
    queryFn: async () => { if (!selectedClass || !selectedSection) return { data: [] }; return (await api.get(`/students?classId=${selectedClass}&sectionId=${selectedSection}&status=active&limit=100`)).data; },
    enabled: !!selectedClass && !!selectedSection
  });
  const { data: existingAttendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ["attendance", selectedDate, selectedClass, selectedSection],
    queryFn: async () => {
      if (!selectedClass || !selectedSection) return null;
      const res = await api.get(`/attendance?date=${selectedDate}&classId=${selectedClass}&sectionId=${selectedSection}`);
      return (res.data?.data?.[0] as AttendanceData | undefined) ?? null;
    },
    enabled: !!selectedClass && !!selectedSection
  });

  const students: StudentData[] = studentsData?.data ?? [];
  const hasExistingAttendance = Boolean(existingAttendance);
  const isLoadingTable = studentsLoading || attendanceLoading;

  useEffect(() => {
    if (!selectedClass || !selectedSection || studentsLoading || attendanceLoading) return;
    setDraft(buildDraft(students, existingAttendance));
  }, [selectedDate, selectedClass, selectedSection, studentsLoading, attendanceLoading, studentsData, existingAttendance]);

  const markAttendanceMutation = useMutation({
    mutationFn: (data: { date: string; classId: string; sectionId: string; records: AttendanceRecord[] }) => api.post("/attendance", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance", selectedDate, selectedClass, selectedSection] })
  });
  const exportMutation = useMutation({
    mutationFn: async () => api.get(`/attendance/export?date=${selectedDate}&classId=${selectedClass}&sectionId=${selectedSection}`, { responseType: "blob" }),
    onSuccess: (response) => {
      const url = URL.createObjectURL(response.data);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `attendance-${selectedDate}.xlsx`; anchor.click(); URL.revokeObjectURL(url);
      setSpreadsheetError(""); setSpreadsheetMessage("Attendance spreadsheet exported successfully.");
    },
    onError: (error) => { setSpreadsheetMessage(""); setSpreadsheetError(getErrorMessage(error)); }
  });
  const importMutation = useMutation({
    mutationFn: async (file: File) => { const formData = new FormData(); formData.append("file", file); return api.post("/attendance/import", formData); },
    onSuccess: (response) => {
      setSpreadsheetError(""); setSpreadsheetMessage(`${response.data?.imported ?? 0} attendance group(s) imported successfully.`);
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (error) => { setSpreadsheetMessage(""); setSpreadsheetError(getErrorMessage(error)); }
  });

  const draftRecords = useMemo(() => students.map((student) => ({ studentId: student._id, status: draft[student._id]?.status ?? "present", remark: draft[student._id]?.remark ?? "" })), [students, draft]);
  const updateDraft = (studentId: string, changes: Partial<AttendanceDraftRecord>) => { setDraft((current) => ({ ...current, [studentId]: { ...current[studentId], ...changes } })); markAttendanceMutation.reset(); };
  const handleClassChange = (classId: string) => { setSelectedClass(classId); setSelectedSection(""); setDraft({}); markAttendanceMutation.reset(); setSpreadsheetMessage(""); setSpreadsheetError(""); };
  const handleSectionChange = (sectionId: string) => { setSelectedSection(sectionId); setDraft({}); markAttendanceMutation.reset(); setSpreadsheetMessage(""); setSpreadsheetError(""); };
  const handleDateChange = (date: string) => { setSelectedDate(date); setDraft({}); markAttendanceMutation.reset(); setSpreadsheetMessage(""); setSpreadsheetError(""); };
  const handleSaveAttendance = () => {
    if (!selectedClass || !selectedSection || draftRecords.length === 0) return;
    markAttendanceMutation.mutate({ date: selectedDate, classId: selectedClass, sectionId: selectedSection, records: draftRecords });
  };
  const handleImportClick = () => { setSpreadsheetMessage(""); setSpreadsheetError(""); importInputRef.current?.click(); };
  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; importMutation.mutate(file); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Attendance</h1><p className="text-sm text-gray-500 mt-1">{hasExistingAttendance ? "Existing attendance — changes require school management authorization." : "New attendance — ready to be marked."}</p></div>
        <Button onClick={handleSaveAttendance} disabled={!selectedClass || !selectedSection || draftRecords.length === 0 || markAttendanceMutation.isPending || isLoadingTable}>
          <Save className="w-4 h-4 mr-2" />{markAttendanceMutation.isPending ? "Saving..." : hasExistingAttendance ? "Save Correction" : "Mark Attendance"}
        </Button>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap gap-4 items-end">
            <Input label="Date" type="date" value={selectedDate} onChange={(e) => handleDateChange(e.target.value)} className="w-48" />
            <Select label="Class" value={selectedClass} onChange={(e) => handleClassChange(e.target.value)} className="w-56" disabled={classesLoading}><option value="">Select Class</option>{classesData?.data?.map((c: { _id: string; displayName: string }) => <option key={c._id} value={c._id}>{c.displayName}</option>)}</Select>
            <Select label="Section" value={selectedSection} onChange={(e) => handleSectionChange(e.target.value)} className="w-56" disabled={!selectedClass || sectionsLoading}><option value="">Select Section</option>{sectionsData?.data?.map((s: { _id: string; name: string }) => <option key={s._id} value={s._id}>{s.name}</option>)}</Select>
            <div className="flex gap-2">
              <input ref={importInputRef} type="file" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" onChange={handleImportFile} className="hidden" />
              <Button variant="outline" onClick={handleImportClick} disabled={importMutation.isPending}><Upload className="w-4 h-4 mr-2" />{importMutation.isPending ? "Importing..." : "Import Spreadsheet"}</Button>
              <Button variant="outline" onClick={() => exportMutation.mutate()} disabled={!selectedClass || !selectedSection || exportMutation.isPending}><Download className="w-4 h-4 mr-2" />{exportMutation.isPending ? "Exporting..." : "Export Spreadsheet"}</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {spreadsheetError && <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><strong>Spreadsheet failed:</strong> {spreadsheetError}</div>}
          {spreadsheetMessage && <div role="status" className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{spreadsheetMessage}</div>}
          {markAttendanceMutation.isError && <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><strong>Save failed:</strong> {getErrorMessage(markAttendanceMutation.error)}</div>}
          {markAttendanceMutation.isSuccess && <div role="status" className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">Attendance {hasExistingAttendance ? "correction" : "marking"} saved successfully.</div>}
          {selectedClass && selectedSection ? isLoadingTable ? <p className="text-center text-gray-500 py-8">Loading attendance...</p> : students.length > 0 ? (
            <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-gray-200 bg-gray-50"><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admission No</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remark</th></tr></thead>
              <tbody className="divide-y divide-gray-200">{students.map((student) => { const studentDraft = draft[student._id] ?? { status: "present" as AttendanceStatus, remark: "" }; return <tr key={student._id} className="hover:bg-gray-50"><td className="px-4 py-3 text-sm text-gray-900">{student.admissionNo}</td><td className="px-4 py-3 text-sm text-gray-900">{student.firstName} {student.lastName}</td><td className="px-4 py-3"><Select aria-label={`Attendance status for ${student.firstName} ${student.lastName}`} value={studentDraft.status} onChange={(e) => updateDraft(student._id, { status: e.target.value as AttendanceStatus })} className="w-32" disabled={markAttendanceMutation.isPending}>{statusOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</Select></td><td className="px-4 py-3"><Input aria-label={`Remark for ${student.firstName} ${student.lastName}`} type="text" value={studentDraft.remark} onChange={(e) => updateDraft(student._id, { remark: e.target.value })} placeholder="Remark" className="w-full" disabled={markAttendanceMutation.isPending} /></td></tr>; })}</tbody>
            </table></div>
          ) : <p className="text-center text-gray-500 py-8">No students found for this class/section</p> : <p className="text-center text-gray-500 py-8">Select a class and section to mark attendance</p>}
        </CardContent>
      </Card>
    </div>
  );
}
