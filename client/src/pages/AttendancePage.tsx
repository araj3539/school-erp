import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Calendar, Download, Save } from "lucide-react";
import api from "../lib/api";
import { formatDate } from "../utils";

type AttendanceStatus = "present" | "absent" | "late" | "half_day" | "on_leave";

interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  remark?: string;
}

interface AttendanceData {
  date: string;
  classId: string;
  sectionId: string;
  records: AttendanceRecord[];
  markedBy: string;
}

interface StudentData {
  _id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  classId?: { _id: string; displayName: string };
  sectionId?: { _id: string; name: string };
}

const statusOptions = [
  { value: "present", label: "Present", variant: "success" as const },
  { value: "absent", label: "Absent", variant: "danger" as const },
  { value: "late", label: "Late", variant: "warning" as const },
  { value: "half_day", label: "Half Day", variant: "info" as const },
  { value: "on_leave", label: "On Leave", variant: "default" as const }
];

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  const { data: classesData } = useQuery({
    queryKey: ["classes", "all"],
    queryFn: async () => {
      const res = await api.get("/academics/classes");
      return res.data;
    }
  });
  const { data: sectionsData } = useQuery({
    queryKey: ["sections", "by-class", selectedClass],
    queryFn: async () => {
      if (!selectedClass) return { data: [] };
      const res = await api.get("/academics/sections?classId=" + selectedClass);
      return res.data;
    },
    enabled: !!selectedClass
  });
  const { data: studentsData } = useQuery({
    queryKey: ["students", "by-class-section", selectedClass, selectedSection],
    queryFn: async () => {
      if (!selectedClass || !selectedSection) return { data: [] };
      const res = await api.get("/students?classId=" + selectedClass + "&sectionId=" + selectedSection + "&status=active&limit=100");
      return res.data;
    },
    enabled: !!selectedClass && !!selectedSection
  });
  const { data: existingAttendance } = useQuery({
    queryKey: ["attendance", selectedDate, selectedClass, selectedSection],
    queryFn: async () => {
      if (!selectedClass || !selectedSection) return null;
      const res = await api.get("/attendance?date=" + selectedDate + "&classId=" + selectedClass + "&sectionId=" + selectedSection);
      return res.data?.data?.[0] as AttendanceData | null;
    },
    enabled: !!selectedClass && !!selectedSection
  });

  const markAttendanceMutation = useMutation({
    mutationFn: (data: any) => api.post("/attendance", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    }
  });

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    setSelectedSection("");
  };
  const handleSectionChange = (sectionId: string) => {
    setSelectedSection(sectionId);
  };

  const handleMarkAttendance = () => {
    if (!selectedClass || !selectedSection) return;
    const students = studentsData?.data || [];
    const existing = existingAttendance?.records || [];
    const existingMap = new Map(existing.map((r) => [r.studentId, r]));
    const records = students.map((s: StudentData) => {
      const existing = existingMap.get(s._id);
      return { studentId: s._id, status: existing?.status || "present", remark: existing?.remark || "" };
    });
    markAttendanceMutation.mutate({ date: selectedDate, classId: selectedClass, sectionId: selectedSection, records });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <Button onClick={handleMarkAttendance} disabled={!selectedClass || !selectedSection || markAttendanceMutation.isPending}>
          <Save className="w-4 h-4 mr-2" />
          {markAttendanceMutation.isPending ? "Saving..." : "Mark Attendance"}
        </Button>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap gap-4">
            <Input label="Date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-48" />
            <Select label="Class" value={selectedClass} onChange={(e) => handleClassChange(e.target.value)} className="w-56">
              <option value="">Select Class</option>
              {classesData?.data?.map((c: any) => <option key={c._id} value={c._id}>{c.displayName}</option>)}
            </Select>
            <Select label="Section" value={selectedSection} onChange={(e) => handleSectionChange(e.target.value)} className="w-56" disabled={!selectedClass}>
              <option value="">Select Section</option>
              {sectionsData?.data?.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </Select>
            <Button variant="outline"><Download className="w-4 h-4 mr-2" />Export Report</Button>
          </div>
        </CardHeader>
        <CardContent>
          {selectedClass && selectedSection ? (
            studentsData?.data?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admission No</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {studentsData.data.map((student: StudentData) => {
                      const existing = existingAttendance?.records?.find((r) => r.studentId === student._id);
                      return (
                        <tr key={student._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{student.admissionNo}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{student.firstName} {student.lastName}</td>
                          <td className="px-4 py-3">
                            <Select
                              value={existing?.status || "present"}
                              onChange={(e) => {
                                if (existingAttendance) {
                                  const records = existingAttendance.records.map((r) =>
                                    r.studentId === student._id ? { ...r, status: e.target.value as AttendanceStatus } : r
                                  );
                                  existingAttendance.records = records;
                                }
                              }}
                              className="w-32"
                            >
                              {statusOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </Select>
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="text"
                              value={existing?.remark || ""}
                              onChange={(e) => {
                                if (existingAttendance) {
                                  const records = existingAttendance.records.map((r) =>
                                    r.studentId === student._id ? { ...r, remark: e.target.value } : r
                                  );
                                  existingAttendance.records = records;
                                }
                              }}
                              placeholder="Remark"
                              className="w-full"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No students found for this class/section</p>
            )
          ) : (
            <p className="text-center text-gray-500 py-8">Select a class and section to mark attendance</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}