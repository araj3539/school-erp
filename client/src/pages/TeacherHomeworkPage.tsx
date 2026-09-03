import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, ClipboardList, Plus } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";
import api, { getApiErrorMessage } from "../lib/api";

type OptionData = {
  academicYear: { _id: string; name: string };
  classes: { _id: string; displayName: string; sectionIds: string[] }[];
  sections: { _id: string; name: string; classId: string }[];
  subjects: { _id: string; name: string; code: string; classIds: string[] }[];
};
type Homework = { _id: string; title: string; description?: string; classId?: { _id: string; displayName: string }; sectionId?: { _id: string; name: string }; subjectId?: { _id: string; name: string }; assignedDate: string; dueDate: string; attachments: unknown[] };

function today() { return new Date().toISOString().slice(0, 10); }
function errorText(error: unknown) { return getApiErrorMessage(error, "Unable to save homework. Please try again."); }

export default function TeacherHomeworkPage() {
  const queryClient = useQueryClient();
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedDate, setAssignedDate] = useState(today());
  const [dueDate, setDueDate] = useState(today());

  const optionsQuery = useQuery<OptionData>({ queryKey: ["teacher", "homework", "options"], queryFn: async () => (await api.get("/portal/teacher/homework/options")).data });
  const homeworkQuery = useQuery<{ data: Homework[] }>({ queryKey: ["teacher", "homework", classId, sectionId, subjectId], queryFn: async () => { const params = new URLSearchParams({ limit: "50" }); if (classId) params.set("classId", classId); if (sectionId) params.set("sectionId", sectionId); if (subjectId) params.set("subjectId", subjectId); return (await api.get(`/portal/teacher/homework?${params}`)).data; }, enabled: optionsQuery.isSuccess });
  const options = optionsQuery.data;
  const sections = useMemo(() => (options?.sections ?? []).filter((item) => item.classId === classId), [options, classId]);
  const subjects = useMemo(() => (options?.subjects ?? []).filter((item) => item.classIds.includes(classId)), [options, classId]);
  const selectedClass = options?.classes.find((item) => item._id === classId);

  const createMutation = useMutation({
    mutationFn: async () => api.post("/portal/teacher/homework", { title, description: description || undefined, classId, sectionId: sectionId || undefined, subjectId, academicYearId: options!.academicYear._id, assignedDate, dueDate }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["teacher", "homework"] }); setOpen(false); setTitle(""); setDescription(""); setAssignedDate(today()); setDueDate(today()); },
  });

  if (optionsQuery.isLoading) return <div className="rounded-2xl border bg-white p-8 text-center text-sm text-slate-500">Loading your homework workspace...</div>;
  if (optionsQuery.isError || !options) return <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">Unable to load your assigned homework options. <button type="button" className="font-semibold underline" onClick={() => optionsQuery.refetch()}>Try again</button></div>;

  return <div className="space-y-6">
    <section className="rounded-2xl bg-slate-950 px-5 py-6 text-white sm:px-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-300">Teacher workspace</p><h1 className="mt-2 text-2xl font-bold tracking-tight">Homework</h1><p className="mt-1 max-w-2xl text-sm text-slate-300">Assign work only to classes and subjects connected to your teaching assignments.</p></div><Button onClick={() => { setClassId(options.classes[0]?._id ?? ""); setSectionId(""); setSubjectId(""); setOpen(true); }}><Plus className="mr-2 h-4 w-4" />Assign homework</Button></div></section>

    <Card><CardHeader><div className="flex flex-wrap gap-3"><Select aria-label="Filter by class" value={classId} onChange={(event) => { setClassId(event.target.value); setSectionId(""); setSubjectId(""); }} className="w-52"><option value="">All assigned classes</option>{options.classes.map((item) => <option key={item._id} value={item._id}>{item.displayName}</option>)}</Select><Select aria-label="Filter by section" value={sectionId} onChange={(event) => setSectionId(event.target.value)} disabled={!classId} className="w-40"><option value="">All sections</option>{sections.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</Select><Select aria-label="Filter by subject" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} disabled={!classId} className="w-52"><option value="">All assigned subjects</option>{subjects.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</Select></div></CardHeader><CardContent>
      {homeworkQuery.isLoading ? <p className="py-8 text-center text-sm text-slate-500">Loading homework...</p> : homeworkQuery.isError ? <p className="py-8 text-center text-sm text-red-600">Unable to load homework. <button className="font-semibold underline" type="button" onClick={() => homeworkQuery.refetch()}>Try again</button></p> : homeworkQuery.data?.data?.length ? <div className="space-y-3">{homeworkQuery.data.data.map((item) => <article key={item._id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex items-center gap-2"><BookOpen className="h-4 w-4 shrink-0 text-primary-600" aria-hidden="true" /><h2 className="font-semibold text-slate-900">{item.title}</h2></div>{item.description && <p className="mt-2 text-sm text-slate-600">{item.description}</p>}<p className="mt-2 text-xs text-slate-500">{item.classId?.displayName ?? "Class"}{item.sectionId?.name ? ` · ${item.sectionId.name}` : " · All sections"} · {item.subjectId?.name ?? "Subject"}</p></div><div className="shrink-0 text-left text-sm sm:text-right"><p className="font-semibold text-slate-900">Due {item.dueDate}</p><p className="text-xs text-slate-500">Assigned {item.assignedDate}</p></div></div><p className="mt-3 text-xs font-medium text-slate-500">{item.attachments?.length ?? 0} private attachment{item.attachments?.length === 1 ? "" : "s"}</p></article>)}</div> : <div className="py-10 text-center"><ClipboardList className="mx-auto h-8 w-8 text-slate-300" aria-hidden="true" /><p className="mt-3 text-sm font-medium text-slate-700">No homework in this view</p><p className="mt-1 text-sm text-slate-500">Create an assignment for one of your authorized classes or subjects.</p></div>}
    </CardContent></Card>

    <Modal isOpen={open} onClose={() => { if (!createMutation.isPending) setOpen(false); }} title="Assign homework" size="lg"><div className="space-y-5"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Teaching scope</p><p className="mt-1 text-sm text-slate-700">Only classes and subjects returned by your teacher assignment are selectable.</p></div><div className="grid gap-4 sm:grid-cols-2"><Input label="Title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Chapter 3 exercises" /><Select label="Class" value={classId} onChange={(event) => { setClassId(event.target.value); setSectionId(""); setSubjectId(""); }}><option value="">Select class</option>{options.classes.map((item) => <option key={item._id} value={item._id}>{item.displayName}</option>)}</Select><Select label="Section (optional)" value={sectionId} onChange={(event) => setSectionId(event.target.value)} disabled={!classId}><option value="">All sections</option>{sections.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</Select><Select label="Subject" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} disabled={!classId}><option value="">Select subject</option>{subjects.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</Select><Input label="Assigned date" type="date" value={assignedDate} onChange={(event) => setAssignedDate(event.target.value)} /><Input label="Due date" type="date" value={dueDate} min={assignedDate} onChange={(event) => setDueDate(event.target.value)} /></div><Input label="Description (optional)" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Instructions for students" /><p className="text-xs text-slate-500">{selectedClass?.displayName ?? "Select a class"} · {options.academicYear.name}</p>{createMutation.isError && <p role="alert" className="text-sm text-red-600">{errorText(createMutation.error)}</p>}<div className="flex justify-end gap-2 border-t pt-4"><Button variant="secondary" onClick={() => setOpen(false)} disabled={createMutation.isPending}>Cancel</Button><Button onClick={() => createMutation.mutate()} loading={createMutation.isPending} disabled={!title.trim() || !classId || !subjectId || !assignedDate || !dueDate || dueDate < assignedDate}>Assign homework</Button></div></div></Modal>
  </div>;
}
