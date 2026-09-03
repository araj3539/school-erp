import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Send } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Table } from "../components/ui/Table";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import api from "../lib/api";

const defaultGrades = [
  { grade: "A+", minPercentage: 90, maxPercentage: 100, remark: "Outstanding" },
  { grade: "A", minPercentage: 80, maxPercentage: 89.99, remark: "Excellent" },
  { grade: "B", minPercentage: 70, maxPercentage: 79.99, remark: "Very Good" },
  { grade: "C", minPercentage: 60, maxPercentage: 69.99, remark: "Good" },
  { grade: "D", minPercentage: 50, maxPercentage: 59.99, remark: "Satisfactory" },
  { grade: "E", minPercentage: 40, maxPercentage: 49.99, remark: "Pass" },
  { grade: "F", minPercentage: 0, maxPercentage: 39.99, remark: "Needs Improvement" },
];

export default function ExamsPage() {
  const queryClient = useQueryClient();
  const [classId, setClassId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [examId, setExamId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [marksOpen, setMarksOpen] = useState(false);
  const [name, setName] = useState("");
  const [examType, setExamType] = useState("Term");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, { maxMarks: number; passMarks: number }>>({});
  const [marks, setMarks] = useState<Record<string, { value: number; absent: boolean }>>({});

  const { data: classes } = useQuery({ queryKey: ["classes", "exam"], queryFn: async () => (await api.get("/academics/classes?limit=100")).data });
  const { data: years } = useQuery({ queryKey: ["academicYears", "exam"], queryFn: async () => (await api.get("/academic-years")).data });
  const { data: subjects } = useQuery({ queryKey: ["subjects", "exam", classId], enabled: !!classId, queryFn: async () => (await api.get(`/academics/subjects?classId=${classId}`)).data });
  const { data: exams } = useQuery({ queryKey: ["exams", classId, academicYearId], queryFn: async () => { const params = new URLSearchParams({ limit: "100" }); if (classId) params.set("classId", classId); if (academicYearId) params.set("academicYearId", academicYearId); return (await api.get(`/exams?${params}`)).data; } });
  const { data: students } = useQuery({ queryKey: ["students", "exam", classId], enabled: !!classId, queryFn: async () => (await api.get(`/students?classId=${classId}&limit=100`)).data });
  const { data: resultData } = useQuery({ queryKey: ["results", examId, studentId], enabled: !!examId && !!studentId, queryFn: async () => (await api.get(`/exams/results/list?examId=${examId}&studentId=${studentId}&limit=1`)).data });

  const selectedExam = exams?.data?.find((exam: any) => exam._id === examId);
  const selectedStudent = students?.data?.find((student: any) => student._id === studentId);
  const result = resultData?.data?.[0];
  const subjectRows = subjects?.data || [];
  const displaySubjects = useMemo(() => selectedExam?.subjects || [], [selectedExam]);

  const createMutation = useMutation({ mutationFn: (payload: any) => api.post("/exams", payload), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["exams"] }); setCreateOpen(false); setName(""); setSelectedSubjects({}); } });
  const marksMutation = useMutation({ mutationFn: (payload: any) => api.put(`/exams/${examId}/results`, payload), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["results"] }) });
  const publishMutation = useMutation({ mutationFn: () => api.post(`/exams/${examId}/publish`), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["exams"] }); queryClient.invalidateQueries({ queryKey: ["results"] }); } });

  const createExam = () => {
    const examSubjects = Object.entries(selectedSubjects).map(([subjectId, config]) => ({ subjectId, ...config }));
    if (!name || !classId || !academicYearId || !startDate || !endDate || examSubjects.length === 0) return;
    createMutation.mutate({ name, examType, academicYearId, classId, startDate, endDate, subjects: examSubjects, gradeRules: defaultGrades });
  };

  const saveMarks = () => {
    if (!studentId || !selectedExam) return;
    const entries = selectedExam.subjects.map((subject: any) => {
      const id = subject.subjectId?._id || subject.subjectId;
      return { subjectId: id, value: marks[id]?.value || 0, absent: marks[id]?.absent || false };
    });
    marksMutation.mutate({ studentId, marks: entries });
  };

  const examColumns = [
    { key: "name", header: "Exam" },
    { key: "examType", header: "Type" },
    { key: "classId", header: "Class", render: (exam: any) => exam.classId?.displayName || "-" },
    { key: "startDate", header: "Date", render: (exam: any) => `${exam.startDate} → ${exam.endDate}` },
    { key: "status", header: "Status", render: (exam: any) => <Badge variant={exam.status === "published" ? "success" : "warning"}>{exam.status}</Badge> },
    { key: "actions", header: "Actions", render: (exam: any) => (
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => { setExamId(exam._id); setClassId(exam.classId?._id || exam.classId); setStudentId(""); setMarks({}); setMarksOpen(true); }}>
          <Save className="w-4 h-4 mr-1" />Marks
        </Button>
        {exam.status === "draft" && <Button size="sm" onClick={() => { setExamId(exam._id); if (window.confirm("Publish this exam and all entered results?")) publishMutation.mutate(); }} disabled={publishMutation.isPending}><Send className="w-4 h-4 mr-1" />Publish</Button>}
      </div>
    ) },
  ];

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold text-gray-900">Exams & Academic Results</h1><p className="text-sm text-gray-500 mt-1">Create exams, enter marks, publish results and review report cards.</p></div>
      <Button onClick={() => { setAcademicYearId(years?.data?.find((year: any) => year.isCurrent)?._id || ""); setCreateOpen(true); }}><Plus className="w-4 h-4 mr-2" />Create Exam</Button>
    </div>
    <Card><CardHeader><div className="flex flex-wrap gap-3"><Select value={classId} onChange={(event) => { setClassId(event.target.value); setExamId(""); }} className="w-56"><option value="">All Classes</option>{classes?.data?.map((c: any) => <option key={c._id} value={c._id}>{c.displayName}</option>)}</Select><Select value={academicYearId} onChange={(event) => setAcademicYearId(event.target.value)} className="w-56"><option value="">All Academic Years</option>{years?.data?.map((year: any) => <option key={year._id} value={year._id}>{year.name}{year.isCurrent ? " (Current)" : ""}</option>)}</Select></div></CardHeader><CardContent><Table data={exams?.data || []} columns={examColumns} keyExtractor={(exam: any) => exam._id} emptyMessage="No exams found" /></CardContent></Card>
    <Card><CardHeader><h2 className="font-semibold">Published Result Lookup</h2></CardHeader><CardContent><div className="flex flex-wrap gap-3"><Select value={examId} onChange={(event) => setExamId(event.target.value)} className="w-64"><option value="">Select Exam</option>{exams?.data?.filter((exam: any) => exam.status === "published").map((exam: any) => <option key={exam._id} value={exam._id}>{exam.name} — {exam.classId?.displayName}</option>)}</Select><Select value={studentId} onChange={(event) => setStudentId(event.target.value)} disabled={!classId} className="w-64"><option value="">Select Student</option>{students?.data?.map((student: any) => <option key={student._id} value={student._id}>{student.firstName} {student.lastName} ({student.admissionNo})</option>)}</Select></div>{result && <div className="mt-4 border rounded-lg p-4"><div className="flex items-center justify-between"><div><p className="font-semibold">{selectedStudent?.firstName} {selectedStudent?.lastName}</p><p className="text-sm text-gray-500">{selectedExam?.name}</p></div><Badge variant={result.result === "pass" ? "success" : "danger"}>{result.result} · {result.grade} · {result.percentage}%</Badge></div><div className="grid gap-2 mt-4 md:grid-cols-2">{result.marks?.map((mark: any) => <div key={mark.subjectId?._id || mark.subjectId} className="flex justify-between border-b py-2"><span>{mark.subjectId?.name || "Subject"}</span><span>{mark.absent ? "Absent" : mark.value}</span></div>)}</div></div>}{examId && studentId && !result && <p className="text-sm text-gray-500 mt-4">No published result found for this student.</p>}</CardContent></Card>
    <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Exam" size="lg"><div className="space-y-4"><div className="grid md:grid-cols-2 gap-4"><Input label="Exam Name" value={name} onChange={(event) => setName(event.target.value)} placeholder="First Term Examination" /><Input label="Exam Type" value={examType} onChange={(event) => setExamType(event.target.value)} placeholder="Term" /><Select label="Class" value={classId} onChange={(event) => setClassId(event.target.value)}><option value="">Select class</option>{classes?.data?.map((c: any) => <option key={c._id} value={c._id}>{c.displayName}</option>)}</Select><Select label="Academic Year" value={academicYearId} onChange={(event) => setAcademicYearId(event.target.value)}><option value="">Select year</option>{years?.data?.map((year: any) => <option key={year._id} value={year._id}>{year.name}</option>)}</Select><Input label="Start Date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /><Input label="End Date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></div><div><p className="text-sm font-medium mb-2">Subjects</p><div className="space-y-2">{subjectRows.map((subject: any) => <div key={subject._id} className="flex flex-wrap items-center gap-3 border rounded p-2"><label className="flex items-center gap-2 flex-1"><input type="checkbox" checked={!!selectedSubjects[subject._id]} onChange={(event) => setSelectedSubjects((previous) => { const next = { ...previous }; if (event.target.checked) next[subject._id] = { maxMarks: 100, passMarks: 40 }; else delete next[subject._id]; return next; })} />{subject.name} ({subject.code})</label>{selectedSubjects[subject._id] && <><Input type="number" className="w-28" value={selectedSubjects[subject._id].maxMarks} onChange={(event) => setSelectedSubjects((previous) => ({ ...previous, [subject._id]: { ...previous[subject._id], maxMarks: Number(event.target.value) } }))} placeholder="Max" /><Input type="number" className="w-28" value={selectedSubjects[subject._id].passMarks} onChange={(event) => setSelectedSubjects((previous) => ({ ...previous, [subject._id]: { ...previous[subject._id], passMarks: Number(event.target.value) } }))} placeholder="Pass" /></>}</div>)}</div></div><div className="flex justify-end gap-2 border-t pt-4"><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={createExam} disabled={createMutation.isPending}>Create Draft</Button></div></div></Modal>
    <Modal isOpen={marksOpen} onClose={() => setMarksOpen(false)} title={`Marks Entry${selectedExam ? ` — ${selectedExam.name}` : ""}`} size="lg"><div className="space-y-4"><Select label="Student" value={studentId} onChange={(event) => { setStudentId(event.target.value); setMarks({}); }}><option value="">Select student</option>{students?.data?.map((student: any) => <option key={student._id} value={student._id}>{student.firstName} {student.lastName} ({student.admissionNo})</option>)}</Select>{selectedExam?.status === "published" && <div className="rounded bg-yellow-50 p-3 text-sm text-yellow-800">This exam is published. Normal marks entry is locked; authorized corrections are audited.</div>}{studentId && selectedExam?.status === "draft" && <div className="space-y-2">{displaySubjects.map((subject: any) => { const id = subject.subjectId?._id || subject.subjectId; return <div key={id} className="grid grid-cols-[1fr_120px_auto] items-end gap-3"><div><p className="font-medium">{subject.subjectId?.name || "Subject"}</p><p className="text-xs text-gray-500">Max {subject.maxMarks} · Pass {subject.passMarks}</p></div><Input type="number" min="0" max={subject.maxMarks} label="Marks" value={marks[id]?.value ?? ""} onChange={(event) => setMarks((previous) => ({ ...previous, [id]: { value: Number(event.target.value), absent: previous[id]?.absent || false } }))} /><label className="flex gap-2 items-center pb-2 text-sm"><input type="checkbox" checked={marks[id]?.absent || false} onChange={(event) => setMarks((previous) => ({ ...previous, [id]: { value: 0, absent: event.target.checked } }))} />Absent</label></div>; })}<div className="flex justify-end border-t pt-4"><Button onClick={saveMarks} disabled={marksMutation.isPending}><Save className="w-4 h-4 mr-2" />Save Marks</Button></div></div>}</div></Modal>
  </div>;
}
