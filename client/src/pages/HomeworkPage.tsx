import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, Save } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Table } from "../components/ui/Table";
import { Modal } from "../components/ui/Modal";
import api from "../lib/api";
import { useAuth } from "../hooks";

export default function HomeworkPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("homework:write");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedDate, setAssignedDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");

  const { data: classes } = useQuery({ queryKey: ["classes", "homework"], queryFn: async () => (await api.get("/academics/classes?limit=100")).data });
  const { data: years } = useQuery({ queryKey: ["academicYears", "homework"], queryFn: async () => (await api.get("/academic-years")).data });
  const { data: subjects } = useQuery({ queryKey: ["subjects", "homework", classId], enabled: !!classId, queryFn: async () => (await api.get(`/academics/subjects?classId=${classId}`)).data });
  const { data: sections } = useQuery({ queryKey: ["sections", "homework", classId], enabled: !!classId, queryFn: async () => (await api.get(`/academics/sections?classId=${classId}`)).data });
  const { data: homeworkData } = useQuery({
    queryKey: ["homework", classId, sectionId, subjectId, academicYearId],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "100" });
      if (classId) params.set("classId", classId);
      if (sectionId) params.set("sectionId", sectionId);
      if (subjectId) params.set("subjectId", subjectId);
      if (academicYearId) params.set("academicYearId", academicYearId);
      return (await api.get(`/homework?${params}`)).data;
    },
  });

  const selectedClass = useMemo(() => classes?.data?.find((item: any) => item._id === classId), [classes, classId]);
  const selectedYear = useMemo(() => years?.data?.find((item: any) => item._id === academicYearId), [years, academicYearId]);

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post("/homework", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework"] });
      setCreateOpen(false);
      setTitle(""); setDescription(""); setAssignedDate(""); setDueDate(""); setAttachmentName(""); setAttachmentUrl("");
    },
  });

  const createHomework = () => {
    if (!title || !classId || !subjectId || !academicYearId || !assignedDate || !dueDate) return;
    const attachments = attachmentName && attachmentUrl ? [{ name: attachmentName, url: attachmentUrl }] : [];
    createMutation.mutate({ title, description: description || undefined, classId, sectionId: sectionId || undefined, subjectId, academicYearId, assignedDate, dueDate, attachments });
  };

  const columns = [
    { key: "title", header: "Homework", render: (item: any) => <div><p className="font-medium text-gray-900">{item.title}</p>{item.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>}</div> },
    { key: "classId", header: "Class", render: (item: any) => item.classId?.displayName || "-" },
    { key: "sectionId", header: "Section", render: (item: any) => item.sectionId?.name || "All" },
    { key: "subjectId", header: "Subject", render: (item: any) => item.subjectId?.name || "-" },
    { key: "assignedDate", header: "Assigned" },
    { key: "dueDate", header: "Due" },
    { key: "attachments", header: "Files", render: (item: any) => item.attachments?.length || 0 },
  ];

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold text-gray-900">Homework</h1><p className="text-sm text-gray-500 mt-1">Assign and review class homework with due dates and attachments.</p></div>
      {canWrite && <Button onClick={() => { setAcademicYearId(years?.data?.find((year: any) => year.isCurrent)?._id || ""); setCreateOpen(true); }}><Plus className="w-4 h-4 mr-2" />Assign Homework</Button>}
    </div>
    <Card>
      <CardHeader><div className="flex flex-wrap gap-3">
        <Select aria-label="Filter by class" value={classId} onChange={(event) => { setClassId(event.target.value); setSectionId(""); setSubjectId(""); }} className="w-52"><option value="">All Classes</option>{classes?.data?.map((item: any) => <option key={item._id} value={item._id}>{item.displayName}</option>)}</Select>
        <Select aria-label="Filter by section" value={sectionId} onChange={(event) => setSectionId(event.target.value)} disabled={!classId} className="w-40"><option value="">All Sections</option>{sections?.data?.map((item: any) => <option key={item._id} value={item._id}>{item.name}</option>)}</Select>
        <Select aria-label="Filter by subject" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} disabled={!classId} className="w-52"><option value="">All Subjects</option>{subjects?.data?.map((item: any) => <option key={item._id} value={item._id}>{item.name}</option>)}</Select>
        <Select aria-label="Filter by academic year" value={academicYearId} onChange={(event) => setAcademicYearId(event.target.value)} className="w-52"><option value="">All Academic Years</option>{years?.data?.map((item: any) => <option key={item._id} value={item._id}>{item.name}{item.isCurrent ? " (Current)" : ""}</option>)}</Select>
      </div></CardHeader>
      <CardContent><Table data={homeworkData?.data || []} columns={columns} keyExtractor={(item: any) => item._id} emptyMessage="No homework found" /></CardContent>
    </Card>
    <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Assign Homework" size="lg">
      <div className="space-y-4">
        <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-600"><span className="font-medium">{selectedClass?.displayName || "Select a class"}</span>{selectedYear ? ` · ${selectedYear.name}` : ""}</div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Chapter 3 exercises" />
          <Select label="Class" value={classId} onChange={(event) => { setClassId(event.target.value); setSectionId(""); setSubjectId(""); }}><option value="">Select class</option>{classes?.data?.map((item: any) => <option key={item._id} value={item._id}>{item.displayName}</option>)}</Select>
          <Select label="Section (optional)" value={sectionId} onChange={(event) => setSectionId(event.target.value)} disabled={!classId}><option value="">All sections</option>{sections?.data?.map((item: any) => <option key={item._id} value={item._id}>{item.name}</option>)}</Select>
          <Select label="Subject" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} disabled={!classId}><option value="">Select subject</option>{subjects?.data?.map((item: any) => <option key={item._id} value={item._id}>{item.name}</option>)}</Select>
          <Select label="Academic Year" value={academicYearId} onChange={(event) => setAcademicYearId(event.target.value)}><option value="">Select academic year</option>{years?.data?.map((item: any) => <option key={item._id} value={item._id}>{item.name}</option>)}</Select>
          <Input label="Assigned Date" type="date" value={assignedDate} onChange={(event) => setAssignedDate(event.target.value)} />
          <Input label="Due Date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        </div>
        <Input label="Description (optional)" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Instructions for students" />
        <div className="border-t pt-4"><p className="text-sm font-medium text-gray-900 mb-3"><BookOpen className="inline w-4 h-4 mr-1" />Attachment link (optional)</p><div className="grid gap-4 md:grid-cols-2"><Input label="File name" value={attachmentName} onChange={(event) => setAttachmentName(event.target.value)} placeholder="worksheet.pdf" /><Input label="File URL" type="url" value={attachmentUrl} onChange={(event) => setAttachmentUrl(event.target.value)} placeholder="https://..." /></div></div>
        <div className="flex justify-end gap-2 border-t pt-4"><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={createHomework} disabled={createMutation.isPending}><Save className="w-4 h-4 mr-2" />{createMutation.isPending ? "Saving..." : "Assign Homework"}</Button></div>
      </div>
    </Modal>
  </div>;
}
