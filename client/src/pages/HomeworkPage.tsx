import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Download, Paperclip, Plus, Save, X } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Table } from "../components/ui/Table";
import { Modal } from "../components/ui/Modal";
import api, { getApiErrorMessage } from "../lib/api";
import { useAuth } from "../hooks";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 10;
const ACCEPTED_FILES = ".pdf,.png,.jpg,.jpeg,.gif,.webp,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx";

export default function HomeworkPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("homework:write");
  const [classId, setClassId] = useState(""); const [sectionId, setSectionId] = useState(""); const [subjectId, setSubjectId] = useState(""); const [academicYearId, setAcademicYearId] = useState("");
  const [createOpen, setCreateOpen] = useState(false); const [title, setTitle] = useState(""); const [description, setDescription] = useState(""); const [assignedDate, setAssignedDate] = useState(""); const [dueDate, setDueDate] = useState(""); const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);

  const { data: classes } = useQuery({ queryKey: ["classes", "homework"], enabled: canWrite, queryFn: async () => (await api.get("/academics/classes?limit=100")).data });
  const { data: years } = useQuery({ queryKey: ["academicYears", "homework"], enabled: canWrite, queryFn: async () => (await api.get("/academic-years")).data });
  const { data: subjects } = useQuery({ queryKey: ["subjects", "homework", classId], enabled: canWrite && !!classId, queryFn: async () => (await api.get(`/academics/subjects?classId=${classId}`)).data });
  const { data: sections } = useQuery({ queryKey: ["sections", "homework", classId], enabled: canWrite && !!classId, queryFn: async () => (await api.get(`/academics/sections?classId=${classId}`)).data });
  const { data: homeworkData } = useQuery({ queryKey: ["homework", classId, sectionId, subjectId, academicYearId], queryFn: async () => { const params = new URLSearchParams({ limit: "100" }); if (classId) params.set("classId", classId); if (sectionId) params.set("sectionId", sectionId); if (subjectId) params.set("subjectId", subjectId); if (academicYearId) params.set("academicYearId", academicYearId); return (await api.get(`/homework?${params}`)).data; } });

  const selectedClass = useMemo(() => classes?.data?.find((item: any) => item._id === classId), [classes, classId]);
  const selectedYear = useMemo(() => years?.data?.find((item: any) => item._id === academicYearId), [years, academicYearId]);

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post("/homework", payload);
      const homework = response.data.homework;
      for (const file of attachmentFiles) {
        const formData = new FormData(); formData.append("file", file);
        await api.post(`/homework/${homework._id}/attachments`, formData);
      }
      return response;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["homework"] }); setCreateOpen(false); setTitle(""); setDescription(""); setAssignedDate(""); setDueDate(""); setAttachmentFiles([]); },
  });

  const createHomework = () => {
    if (!title || !classId || !subjectId || !academicYearId || !assignedDate || !dueDate) return;
    createMutation.mutate({ title, description: description || undefined, classId, sectionId: sectionId || undefined, subjectId, academicYearId, assignedDate, dueDate });
  };

  const chooseFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    if (selected.length + attachmentFiles.length > MAX_FILES) { event.target.value = ""; return; }
    const valid = selected.filter((file) => file.size <= MAX_FILE_SIZE);
    setAttachmentFiles((current) => [...current, ...valid]); event.target.value = "";
  };
  const openAttachment = async (homeworkId: string, attachmentId: string) => { const response = await api.get(`/homework/${homeworkId}/attachments/${attachmentId}/url`); window.open(response.data.url, "_blank", "noopener,noreferrer"); };
  const deleteAttachment = async (homeworkId: string, attachmentId: string) => { await api.delete(`/homework/${homeworkId}/attachments/${attachmentId}`); queryClient.invalidateQueries({ queryKey: ["homework"] }); };

  const columns = [
    { key: "title", header: "Homework", render: (item: any) => <div><p className="font-medium text-gray-900">{item.title}</p>{item.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>}</div> },
    { key: "classId", header: "Class", render: (item: any) => item.classId?.displayName || "-" },
    { key: "sectionId", header: "Section", render: (item: any) => item.sectionId?.name || "All" },
    { key: "subjectId", header: "Subject", render: (item: any) => item.subjectId?.name || "-" },
    { key: "assignedDate", header: "Assigned" }, { key: "dueDate", header: "Due" },
    { key: "attachments", header: "Files", render: (item: any) => <div className="flex flex-wrap gap-2">{(item.attachments || []).map((file: any) => <div key={file._id} className="inline-flex items-center gap-1"><Button variant="secondary" onClick={() => openAttachment(item._id, file._id)} title={`Open ${file.name}`}><Download className="w-3 h-3 mr-1" />{file.name}</Button>{canWrite && <Button variant="ghost" onClick={() => deleteAttachment(item._id, file._id)} aria-label={`Delete ${file.name}`}><X className="w-3 h-3" /></Button>}</div>)}{!item.attachments?.length && <span className="text-gray-400">None</span>}</div> },
  ];

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold text-gray-900">Homework</h1><p className="text-sm text-gray-500 mt-1">Assign and review class homework with private file attachments.</p></div>{canWrite && <Button onClick={() => { setAcademicYearId(years?.data?.find((year: any) => year.isCurrent)?._id || ""); setCreateOpen(true); }}><Plus className="w-4 h-4 mr-2" />Assign Homework</Button>}</div>
    <Card><CardHeader><div className="flex flex-wrap gap-3">
      <Select aria-label="Filter by class" value={classId} onChange={(event) => { setClassId(event.target.value); setSectionId(""); setSubjectId(""); }} className="w-52"><option value="">All Classes</option>{classes?.data?.map((item: any) => <option key={item._id} value={item._id}>{item.displayName}</option>)}</Select>
      <Select aria-label="Filter by section" value={sectionId} onChange={(event) => setSectionId(event.target.value)} disabled={!classId} className="w-40"><option value="">All Sections</option>{sections?.data?.map((item: any) => <option key={item._id} value={item._id}>{item.name}</option>)}</Select>
      <Select aria-label="Filter by subject" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} disabled={!classId} className="w-52"><option value="">All Subjects</option>{subjects?.data?.map((item: any) => <option key={item._id} value={item._id}>{item.name}</option>)}</Select>
      <Select aria-label="Filter by academic year" value={academicYearId} onChange={(event) => setAcademicYearId(event.target.value)} className="w-52"><option value="">All Academic Years</option>{years?.data?.map((item: any) => <option key={item._id} value={item._id}>{item.name}{item.isCurrent ? " (Current)" : ""}</option>)}</Select>
    </div></CardHeader><CardContent><Table data={homeworkData?.data || []} columns={columns} keyExtractor={(item: any) => item._id} emptyMessage="No homework found" /></CardContent></Card>
    <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Assign Homework" size="lg"><div className="space-y-4">
      <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-600"><span className="font-medium">{selectedClass?.displayName || "Select a class"}</span>{selectedYear ? ` · ${selectedYear.name}` : ""}</div>
      <div className="grid gap-4 md:grid-cols-2"><Input label="Title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Chapter 3 exercises" /><Select label="Class" value={classId} onChange={(event) => { setClassId(event.target.value); setSectionId(""); setSubjectId(""); }}><option value="">Select class</option>{classes?.data?.map((item: any) => <option key={item._id} value={item._id}>{item.displayName}</option>)}</Select><Select label="Section (optional)" value={sectionId} onChange={(event) => setSectionId(event.target.value)} disabled={!classId}><option value="">All sections</option>{sections?.data?.map((item: any) => <option key={item._id} value={item._id}>{item.name}</option>)}</Select><Select label="Subject" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} disabled={!classId}><option value="">Select subject</option>{subjects?.data?.map((item: any) => <option key={item._id} value={item._id}>{item.name}</option>)}</Select><Select label="Academic Year" value={academicYearId} onChange={(event) => setAcademicYearId(event.target.value)}><option value="">Select academic year</option>{years?.data?.map((item: any) => <option key={item._id} value={item._id}>{item.name}</option>)}</Select><Input label="Assigned Date" type="date" value={assignedDate} onChange={(event) => setAssignedDate(event.target.value)} /><Input label="Due Date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></div>
      <Input label="Description (optional)" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Instructions for students" />
      <div className="border-t pt-4"><div className="flex items-center justify-between mb-3"><p className="text-sm font-medium text-gray-900"><BookOpen className="inline w-4 h-4 mr-1" />Private attachments</p><span className="text-xs text-gray-500">Max 10 files, 5MB each</span></div><label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 px-4 py-5 text-sm text-gray-600 hover:bg-gray-50"><Paperclip className="w-4 h-4" />Choose files<input type="file" className="sr-only" multiple accept={ACCEPTED_FILES} onChange={chooseFiles} /></label>{attachmentFiles.length > 0 && <div className="mt-3 space-y-2">{attachmentFiles.map((file, index) => <div key={`${file.name}-${file.lastModified}`} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm"><span className="truncate">{file.name}</span><Button variant="ghost" onClick={() => setAttachmentFiles((current) => current.filter((_, i) => i !== index))} aria-label={`Remove ${file.name}`}><X className="w-4 h-4" /></Button></div>)}</div>}</div>
      {createMutation.isError && <p className="text-sm text-red-600">{getApiErrorMessage(createMutation.error)}</p>}
      <div className="flex justify-end gap-2 border-t pt-4"><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={createHomework} disabled={createMutation.isPending || !title || !classId || !subjectId || !academicYearId || !assignedDate || !dueDate}><Save className="w-4 h-4 mr-2" />{createMutation.isPending ? "Saving..." : "Assign Homework"}</Button></div>
    </div></Modal>
  </div>;
}
