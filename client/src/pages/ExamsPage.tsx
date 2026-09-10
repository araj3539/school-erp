import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, BookOpen, CalendarDays, CheckCircle2, ClipboardList, Plus, Save, Send, Users } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Table } from "../components/ui/Table";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/Tabs";
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

type SubjectSelection = Record<string, { maxMarks: number; passMarks: number }>;
type MarksState = Record<string, { value: number; absent: boolean }>;

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
  const [selectedSubjects, setSelectedSubjects] = useState<SubjectSelection>({});
  const [marks, setMarks] = useState<MarksState>({});

  const classesQuery = useQuery({ queryKey: ["classes", "exam"], queryFn: async () => (await api.get("/academics/classes?limit=100")).data });
  const yearsQuery = useQuery({ queryKey: ["academicYears", "exam"], queryFn: async () => (await api.get("/academic-years")).data });
  const subjectsQuery = useQuery({ queryKey: ["subjects", "exam", classId], enabled: !!classId && createOpen, queryFn: async () => (await api.get(`/academics/subjects?classId=${classId}`)).data });
  const examsQuery = useQuery({
    queryKey: ["exams", classId, academicYearId],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "100" });
      if (classId) params.set("classId", classId);
      if (academicYearId) params.set("academicYearId", academicYearId);
      return (await api.get(`/exams?${params}`)).data;
    },
  });
  const studentsQuery = useQuery({ queryKey: ["students", "exam", classId], enabled: !!classId, queryFn: async () => (await api.get(`/students?classId=${classId}&limit=100`)).data });
  const resultQuery = useQuery({ queryKey: ["results", examId, studentId], enabled: !!examId && !!studentId, queryFn: async () => (await api.get(`/exams/results/list?examId=${examId}&studentId=${studentId}&limit=1`)).data });

  const classes = classesQuery.data?.data || [];
  const years = yearsQuery.data?.data || [];
  const subjects = subjectsQuery.data?.data || [];
  const exams = examsQuery.data?.data || [];
  const students = studentsQuery.data?.data || [];
  const selectedExam = exams.find((exam: any) => exam._id === examId);
  const selectedStudent = students.find((student: any) => student._id === studentId);
  const result = resultQuery.data?.data?.[0];
  const publishedExams = useMemo(() => exams.filter((exam: any) => exam.status === "published"), [exams]);
  const draftCount = exams.filter((exam: any) => exam.status === "draft").length;
  const publishedCount = publishedExams.length;
  const totalSubjects = new Set(exams.flatMap((exam: any) => exam.subjects || []).map((subject: any) => subject.subjectId?._id || subject.subjectId)).size;

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post("/exams", payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["exams"] });
      setCreateOpen(false);
      setName("");
      setSelectedSubjects({});
    },
  });
  const marksMutation = useMutation({
    mutationFn: (payload: any) => api.put(`/exams/${examId}/results`, payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["results"] }),
  });
  const publishMutation = useMutation({
    mutationFn: () => api.post(`/exams/${examId}/publish`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["exams"] });
      void queryClient.invalidateQueries({ queryKey: ["results"] });
    },
  });

  const resetCreate = () => {
    setName("");
    setExamType("Term");
    setStartDate("");
    setEndDate("");
    setSelectedSubjects({});
  };

  const createExam = () => {
    const examSubjects = Object.entries(selectedSubjects).map(([subjectId, config]) => ({ subjectId, ...config }));
    if (!name || !classId || !academicYearId || !startDate || !endDate || !examSubjects.length) return;
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

  const openMarks = (exam: any) => {
    setExamId(exam._id);
    setClassId(exam.classId?._id || exam.classId);
    setStudentId("");
    setMarks({});
    setMarksOpen(true);
  };

  const examColumns = [
    { key: "name", header: "Exam", render: (exam: any) => <div><p className="font-semibold text-slate-900">{exam.name}</p><p className="text-xs text-slate-500">{exam.examType || "Assessment"}</p></div> },
    { key: "classId", header: "Class", render: (exam: any) => exam.classId?.displayName || "—" },
    { key: "subjects", header: "Subjects", render: (exam: any) => exam.subjects?.length || 0 },
    { key: "dates", header: "Schedule", render: (exam: any) => <div className="whitespace-nowrap text-sm"><span>{exam.startDate}</span><span className="mx-1 text-slate-400">→</span><span>{exam.endDate}</span></div> },
    { key: "status", header: "Status", render: (exam: any) => <Badge variant={exam.status === "published" ? "success" : "warning"}>{exam.status}</Badge> },
    { key: "actions", header: "Actions", render: (exam: any) => <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => openMarks(exam)}><Save className="mr-1.5 h-4 w-4" />Marks</Button>{exam.status === "draft" && <Button size="sm" onClick={() => { setExamId(exam._id); if (window.confirm("Publish this exam and all entered results?")) publishMutation.mutate(); }} disabled={publishMutation.isPending}><Send className="mr-1.5 h-4 w-4" />Publish</Button>}</div> },
  ];

  const createDisabled = createMutation.isPending || !name || !classId || !academicYearId || !startDate || !endDate || Object.keys(selectedSubjects).length === 0;

  return <div className="space-y-6">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">Academics · Assessment</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Exams & results</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">Plan assessments, capture marks and publish trusted academic results from one workspace.</p>
      </div>
      <Button onClick={() => { setAcademicYearId(years.find((year: any) => year.isCurrent)?._id || academicYearId); resetCreate(); setCreateOpen(true); }}><Plus className="mr-2 h-4 w-4" />Create exam</Button>
    </header>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[{ label: "Total exams", value: exams.length, note: "Across selected filters", icon: ClipboardList }, { label: "Drafts", value: draftCount, note: "Awaiting publication", icon: CalendarDays }, { label: "Published", value: publishedCount, note: "Available for lookup", icon: CheckCircle2 }, { label: "Subjects used", value: totalSubjects, note: "In selected exams", icon: BookOpen }].map(({ label, value, note, icon: Icon }) => <Card key={label}><CardContent className="flex items-start justify-between p-5"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-500">{note}</p></div><Icon className="h-5 w-5 text-slate-400" /></CardContent></Card>)}
    </div>

    <Tabs value="manage" onValueChange={() => undefined}>
      <TabsList>
        <TabsTrigger value="manage">Exam workspace</TabsTrigger>
        <TabsTrigger value="lookup">Result lookup</TabsTrigger>
      </TabsList>
      <TabsContent value="manage">
        <Card>
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div><h2 className="text-base font-semibold text-slate-900">Assessment register</h2><p className="text-sm text-slate-500">Filter the register by class or academic year, then manage marks and publication.</p></div>
              <div className="flex flex-col gap-2 sm:flex-row"><Select value={classId} onChange={(event) => { setClassId(event.target.value); setExamId(""); setStudentId(""); }} className="w-full sm:w-52"><option value="">All classes</option>{classes.map((item: any) => <option key={item._id} value={item._id}>{item.displayName}</option>)}</Select><Select value={academicYearId} onChange={(event) => setAcademicYearId(event.target.value)} className="w-full sm:w-60"><option value="">All academic years</option>{years.map((year: any) => <option key={year._id} value={year._id}>{year.name}{year.isCurrent ? " (Current)" : ""}</option>)}</Select></div>
            </div>
          </CardHeader>
          <CardContent className="p-0">{examsQuery.isLoading ? <div className="space-y-3 p-6">{[1,2,3,4].map((row) => <div key={row} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div> : examsQuery.isError ? <div className="px-6 py-14 text-center"><ClipboardList className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 font-medium text-slate-900">Unable to load exams</p><p className="mt-1 text-sm text-slate-500">Please check your permissions or connection and try again.</p><Button className="mt-4" variant="outline" onClick={() => examsQuery.refetch()}>Try again</Button></div> : <div className="overflow-x-auto"><Table data={exams} columns={examColumns} keyExtractor={(exam: any) => exam._id} emptyMessage="No exams match the selected filters" /></div>}</CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="lookup">
        <Card>
          <CardHeader><div><h2 className="text-base font-semibold text-slate-900">Published result lookup</h2><p className="text-sm text-slate-500">Select a published exam and student to review the calculated result.</p></div></CardHeader>
          <CardContent><div className="grid gap-3 md:grid-cols-2"><Select label="Published exam" value={examId} onChange={(event) => { setExamId(event.target.value); const exam = publishedExams.find((item: any) => item._id === event.target.value); if (exam) setClassId(exam.classId?._id || exam.classId); setStudentId(""); }}><option value="">Select exam</option>{publishedExams.map((exam: any) => <option key={exam._id} value={exam._id}>{exam.name} — {exam.classId?.displayName || "Class"}</option>)}</Select><Select label="Student" value={studentId} onChange={(event) => setStudentId(event.target.value)} disabled={!classId}><option value="">Select student</option>{students.map((student: any) => <option key={student._id} value={student._id}>{student.firstName} {student.lastName} ({student.admissionNo})</option>)}</Select></div>{result && <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-slate-950">{selectedStudent?.firstName} {selectedStudent?.lastName}</p><p className="mt-1 text-sm text-slate-500">{selectedExam?.name} · {selectedExam?.classId?.displayName}</p></div><div className="flex items-center gap-2"><Award className="h-5 w-5 text-slate-500" /><Badge variant={result.result === "pass" ? "success" : "danger"}>{result.result} · {result.grade} · {result.percentage}%</Badge></div></div><div className="mt-5 grid gap-2 md:grid-cols-2">{result.marks?.map((mark: any) => <div key={mark.subjectId?._id || mark.subjectId} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5"><span className="text-sm text-slate-700">{mark.subjectId?.name || "Subject"}</span><span className="text-sm font-semibold text-slate-900">{mark.absent ? "Absent" : mark.value}</span></div>)}</div></div>}{examId && studentId && !result && !resultQuery.isLoading && <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center"><Users className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-2 font-medium text-slate-900">No published result found</p><p className="mt-1 text-sm text-slate-500">This student may not have a published result for the selected exam.</p></div>}</CardContent>
        </Card>
      </TabsContent>
    </Tabs>

    <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create exam" size="lg"><div className="space-y-5"><div className="rounded-xl bg-slate-50 p-4"><p className="text-sm font-semibold text-slate-900">Assessment details</p><p className="mt-1 text-xs text-slate-500">Create a draft first. Results remain editable until the exam is published.</p></div><div className="grid gap-4 md:grid-cols-2"><Input label="Exam name" value={name} onChange={(event) => setName(event.target.value)} placeholder="First Term Examination" /><Input label="Exam type" value={examType} onChange={(event) => setExamType(event.target.value)} placeholder="Term" /><Select label="Class" value={classId} onChange={(event) => { setClassId(event.target.value); setSelectedSubjects({}); }}><option value="">Select class</option>{classes.map((item: any) => <option key={item._id} value={item._id}>{item.displayName}</option>)}</Select><Select label="Academic year" value={academicYearId} onChange={(event) => setAcademicYearId(event.target.value)}><option value="">Select academic year</option>{years.map((year: any) => <option key={year._id} value={year._id}>{year.name}{year.isCurrent ? " (Current)" : ""}</option>)}</Select><Input label="Start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /><Input label="End date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></div><div><div className="mb-2 flex items-center justify-between"><div><p className="text-sm font-semibold text-slate-900">Subjects</p><p className="text-xs text-slate-500">Choose subjects and configure maximum/pass marks.</p></div><Badge variant="info">{Object.keys(selectedSubjects).length} selected</Badge></div>{!classId ? <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">Select a class to load its subjects.</div> : subjectsQuery.isLoading ? <div className="space-y-2">{[1,2,3].map((row) => <div key={row} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}</div> : subjectsQuery.isError ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Unable to load subjects for this class.</div> : !subjects.length ? <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No subjects are assigned to this class.</div> : <div className="max-h-72 space-y-2 overflow-y-auto pr-1">{subjects.map((subject: any) => <div key={subject._id} className="rounded-xl border border-slate-200 p-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><label className="flex min-w-0 flex-1 items-center gap-3"><input type="checkbox" className="h-4 w-4" checked={!!selectedSubjects[subject._id]} onChange={(event) => setSelectedSubjects((previous) => { const next = { ...previous }; if (event.target.checked) next[subject._id] = { maxMarks: 100, passMarks: 40 }; else delete next[subject._id]; return next; })} /><span className="min-w-0"><span className="block truncate text-sm font-medium text-slate-900">{subject.name}</span><span className="block text-xs text-slate-500">{subject.code}</span></span></label>{selectedSubjects[subject._id] && <div className="grid grid-cols-2 gap-2 sm:w-64"><Input type="number" label="Max" value={selectedSubjects[subject._id].maxMarks} onChange={(event) => setSelectedSubjects((previous) => ({ ...previous, [subject._id]: { ...previous[subject._id], maxMarks: Number(event.target.value) } }))} /><Input type="number" label="Pass" value={selectedSubjects[subject._id].passMarks} onChange={(event) => setSelectedSubjects((previous) => ({ ...previous, [subject._id]: { ...previous[subject._id], passMarks: Number(event.target.value) } }))} /></div>}</div></div>)}</div>}</div>{createMutation.isError && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{(createMutation.error as any)?.response?.data?.message || "Unable to create the exam."}</div>}<div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={createExam} disabled={createDisabled}>{createMutation.isPending ? "Creating…" : "Create draft"}</Button></div></div></Modal>

    <Modal isOpen={marksOpen} onClose={() => setMarksOpen(false)} title={`Marks entry${selectedExam ? ` — ${selectedExam.name}` : ""}`} size="lg"><div className="space-y-4"><Select label="Student" value={studentId} onChange={(event) => { setStudentId(event.target.value); setMarks({}); }}><option value="">Select student</option>{students.map((student: any) => <option key={student._id} value={student._id}>{student.firstName} {student.lastName} ({student.admissionNo})</option>)}</Select>{selectedExam?.status === "published" && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">This exam is published. Normal marks entry is locked; authorized corrections remain audited.</div>}{studentId && selectedExam?.status === "draft" && <div className="space-y-2">{selectedExam.subjects.map((subject: any) => { const id = subject.subjectId?._id || subject.subjectId; return <div key={id} className="grid gap-3 rounded-xl border border-slate-200 p-3 sm:grid-cols-[1fr_120px_auto] sm:items-end"><div><p className="font-medium text-slate-900">{subject.subjectId?.name || "Subject"}</p><p className="text-xs text-slate-500">Max {subject.maxMarks} · Pass {subject.passMarks}</p></div><Input type="number" min="0" max={subject.maxMarks} label="Marks" value={marks[id]?.value ?? ""} onChange={(event) => setMarks((previous) => ({ ...previous, [id]: { value: Number(event.target.value), absent: previous[id]?.absent || false } }))} /><label className="flex items-center gap-2 pb-2 text-sm text-slate-700"><input type="checkbox" checked={marks[id]?.absent || false} onChange={(event) => setMarks((previous) => ({ ...previous, [id]: { value: 0, absent: event.target.checked } }))} />Absent</label></div>; })}<div className="flex justify-end border-t border-slate-100 pt-4"><Button onClick={saveMarks} disabled={marksMutation.isPending}>{marksMutation.isPending ? "Saving…" : "Save marks"}</Button></div></div>}{marksMutation.isError && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{(marksMutation.error as any)?.response?.data?.message || "Unable to save marks."}</div>}</div></Modal>
  </div>;
}
