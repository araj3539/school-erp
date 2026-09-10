import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Table } from "../components/ui/Table";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/Tabs";
import { BookOpen, Building2, GraduationCap, Plus, RefreshCw, Search, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "../lib/api";

type ClassForm = z.infer<typeof classSchema>;
type SectionForm = z.infer<typeof sectionSchema>;
type SubjectForm = z.infer<typeof subjectSchema>;

const classSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  roomNumber: z.string().optional(),
  capacity: z.coerce.number().min(1).default(40),
  classTeacherId: z.string().optional(),
});
const sectionSchema = z.object({
  name: z.string().min(1),
  classId: z.string().min(1),
  capacity: z.coerce.number().min(1).default(40),
});
const subjectSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  classIds: z.array(z.string()).min(1),
  teacherId: z.string().optional(),
});

const tabs = [
  { value: "classes", label: "Classes", singular: "Class" },
  { value: "sections", label: "Sections", singular: "Section" },
  { value: "subjects", label: "Subjects", singular: "Subject" },
] as const;

export default function ClassesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["value"]>("classes");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const classesQuery = useQuery({
    queryKey: ["classes"],
    queryFn: async () => (await api.get("/academics/classes")).data,
  });
  const sectionsQuery = useQuery({
    queryKey: ["sections"],
    queryFn: async () => (await api.get("/academics/sections")).data,
  });
  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => (await api.get("/academics/subjects")).data,
  });
  const teachersQuery = useQuery({
    queryKey: ["teachers", "all"],
    queryFn: async () => (await api.get("/teachers?limit=100")).data,
  });

  const classForm = useForm<ClassForm>({ resolver: zodResolver(classSchema), defaultValues: { capacity: 40 } });
  const sectionForm = useForm<SectionForm>({ resolver: zodResolver(sectionSchema), defaultValues: { capacity: 40 } });
  const subjectForm = useForm<SubjectForm>({ resolver: zodResolver(subjectSchema) });

  const classCreateMutation = useMutation({
    mutationFn: (data: ClassForm) => api.post("/academics/classes", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["classes"] }); closeModal(); },
  });
  const classUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClassForm> }) => api.put(`/academics/classes/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["classes"] }); closeModal(); },
  });
  const sectionCreateMutation = useMutation({
    mutationFn: (data: SectionForm) => api.post("/academics/sections", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sections"] }); closeModal(); },
  });
  const sectionUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SectionForm> }) => api.put(`/academics/sections/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sections"] }); closeModal(); },
  });
  const subjectCreateMutation = useMutation({
    mutationFn: (data: SubjectForm) => api.post("/academics/subjects", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["subjects"] }); closeModal(); },
  });
  const subjectUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SubjectForm> }) => api.put(`/academics/subjects/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["subjects"] }); closeModal(); },
  });

  function closeModal() {
    setIsModalOpen(false);
    setEditingItem(null);
    classForm.reset({ capacity: 40 });
    sectionForm.reset({ capacity: 40 });
    subjectForm.reset();
  }

  const openCreate = () => {
    setEditingItem(null);
    if (activeTab === "classes") classForm.reset({ capacity: 40 });
    if (activeTab === "sections") sectionForm.reset({ capacity: 40 });
    if (activeTab === "subjects") subjectForm.reset();
    setIsModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    if (activeTab === "classes") {
      classForm.reset({ name: item.name, displayName: item.displayName, roomNumber: item.roomNumber || "", capacity: item.capacity || 40, classTeacherId: item.classTeacherId?._id || "" });
    } else if (activeTab === "sections") {
      sectionForm.reset({ name: item.name, classId: item.classId?._id || item.classId || "", capacity: item.capacity || 40 });
    } else {
      subjectForm.reset({ name: item.name, code: item.code, classIds: item.classIds?.map((c: any) => c._id) || [], teacherId: item.teacherId?._id || "" });
    }
    setIsModalOpen(true);
  };

  const records = useMemo(() => {
    const source = activeTab === "classes" ? classesQuery.data?.data : activeTab === "sections" ? sectionsQuery.data?.data : subjectsQuery.data?.data;
    const query = search.trim().toLowerCase();
    if (!query) return source || [];
    return (source || []).filter((item: any) => JSON.stringify(item).toLowerCase().includes(query));
  }, [activeTab, classesQuery.data, sectionsQuery.data, subjectsQuery.data, search]);

  const counts = {
    classes: classesQuery.data?.data?.length || 0,
    sections: sectionsQuery.data?.data?.length || 0,
    subjects: subjectsQuery.data?.data?.length || 0,
  };
  const isLoading = activeTab === "classes" ? classesQuery.isLoading : activeTab === "sections" ? sectionsQuery.isLoading : subjectsQuery.isLoading;
  const query = activeTab === "classes" ? classesQuery : activeTab === "sections" ? sectionsQuery : subjectsQuery;
  const mutationError = classCreateMutation.error || classUpdateMutation.error || sectionCreateMutation.error || sectionUpdateMutation.error || subjectCreateMutation.error || subjectUpdateMutation.error;
  const isSaving = classCreateMutation.isPending || classUpdateMutation.isPending || sectionCreateMutation.isPending || sectionUpdateMutation.isPending || subjectCreateMutation.isPending || subjectUpdateMutation.isPending;
  const currentTab = tabs.find((tab) => tab.value === activeTab)!;

  const classColumns = [
    { key: "name", header: "Class", render: (item: any) => <div><p className="font-medium text-slate-900">{item.displayName}</p><p className="text-xs text-slate-500">{item.name}</p></div> },
    { key: "classTeacherId", header: "Class Teacher", render: (item: any) => item.classTeacherId ? `${item.classTeacherId.firstName} ${item.classTeacherId.lastName}` : "Unassigned" },
    { key: "roomNumber", header: "Room", render: (item: any) => item.roomNumber || "—" },
    { key: "capacity", header: "Capacity", render: (item: any) => <Badge variant="info">{item.capacity || 0} seats</Badge> },
    { key: "sectionIds", header: "Sections", render: (item: any) => item.sectionIds?.length || 0 },
  ];
  const sectionColumns = [
    { key: "name", header: "Section", render: (item: any) => <span className="font-medium text-slate-900">{item.name}</span> },
    { key: "classId", header: "Class", render: (item: any) => item.classId?.displayName || "Unassigned" },
    { key: "capacity", header: "Capacity", render: (item: any) => <Badge variant="info">{item.capacity || 0} seats</Badge> },
  ];
  const subjectColumns = [
    { key: "name", header: "Subject", render: (item: any) => <div><p className="font-medium text-slate-900">{item.name}</p><p className="text-xs text-slate-500">{item.code}</p></div> },
    { key: "classIds", header: "Classes", render: (item: any) => item.classIds?.map((c: any) => c.displayName).join(", ") || "Unassigned" },
    { key: "teacherId", header: "Teacher", render: (item: any) => item.teacherId ? `${item.teacherId.firstName} ${item.teacherId.lastName}` : "Unassigned" },
  ];
  const columns = activeTab === "classes" ? classColumns : activeTab === "sections" ? sectionColumns : subjectColumns;

  const submitClass = classForm.handleSubmit((data) => editingItem ? classUpdateMutation.mutate({ id: editingItem._id, data }) : classCreateMutation.mutate(data));
  const submitSection = sectionForm.handleSubmit((data) => editingItem ? sectionUpdateMutation.mutate({ id: editingItem._id, data }) : sectionCreateMutation.mutate(data));
  const submitSubject = subjectForm.handleSubmit((data) => editingItem ? subjectUpdateMutation.mutate({ id: editingItem._id, data }) : subjectCreateMutation.mutate(data));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">Academics · Structure</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Classes & academics</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">Organize classes, sections and subjects in one focused workspace for the academic team.</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add {currentTab.singular}</Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Classes</p><p className="mt-1 text-2xl font-semibold text-slate-950">{counts.classes}</p><p className="text-xs text-slate-500">Academic grades</p></div><GraduationCap className="h-5 w-5 text-slate-400" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sections</p><p className="mt-1 text-2xl font-semibold text-slate-950">{counts.sections}</p><p className="text-xs text-slate-500">Class groupings</p></div><Users className="h-5 w-5 text-slate-400" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Subjects</p><p className="mt-1 text-2xl font-semibold text-slate-950">{counts.subjects}</p><p className="text-xs text-slate-500">Curriculum subjects</p></div><BookOpen className="h-5 w-5 text-slate-400" /></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Academic directory</h2>
              <p className="text-sm text-slate-500">Switch between academic structures without leaving the workspace.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input placeholder={`Search ${currentTab.label.toLowerCase()}...`} value={search} onChange={(event) => setSearch(event.target.value)} className="w-full sm:w-72" leftIcon={<Search className="h-4 w-4" />} />
              <Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching} aria-label={`Refresh ${currentTab.label.toLowerCase()}`}>
                <RefreshCw className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
          <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value as typeof activeTab); setSearch(""); closeModal(); }} className="mt-4">
            <TabsList>
              {tabs.map((tab) => <TabsTrigger key={tab.value} value={tab.value}>{tab.label} <span className="ml-1 text-xs text-slate-400">{counts[tab.value]}</span></TabsTrigger>)}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6" aria-label={`Loading ${currentTab.label.toLowerCase()}`}>
              {[1, 2, 3, 4].map((row) => <div key={row} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : query.isError ? (
            <div className="px-6 py-14 text-center">
              <Building2 className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 font-medium text-slate-900">Unable to load {currentTab.label.toLowerCase()}</p>
              <p className="mt-1 text-sm text-slate-500">{(query.error as any)?.message || "Try again in a moment."}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => query.refetch()}>Try again</Button>
            </div>
          ) : !records.length ? (
            <div className="px-6 py-14 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 font-medium text-slate-900">{search ? `No ${currentTab.label.toLowerCase()} match your search` : `No ${currentTab.label.toLowerCase()} found`}</p>
              <p className="mt-1 text-sm text-slate-500">{search ? "Try a broader search term." : `Add the first ${currentTab.singular.toLowerCase()} to start building the academic directory.`}</p>
              {!search && <Button className="mt-4" size="sm" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add {currentTab.singular}</Button>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table data={records} columns={columns} keyExtractor={(item) => item._id} onRowClick={openEdit} />
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={`${editingItem ? "Edit" : "Add"} ${currentTab.singular}`} size="lg">
        {mutationError && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Unable to save {currentTab.singular.toLowerCase()}. {(mutationError as any)?.message || "Please review the form and try again."}</div>}
        {activeTab === "classes" && (
          <form onSubmit={submitClass} className="space-y-6">
            <section><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Class details</p><div className="mt-3 grid gap-4 md:grid-cols-2">
              <Input label="Name" {...classForm.register("name")} error={classForm.formState.errors.name?.message} />
              <Input label="Display Name" {...classForm.register("displayName")} error={classForm.formState.errors.displayName?.message} />
              <Input label="Room Number" {...classForm.register("roomNumber")} />
              <Input label="Capacity" type="number" {...classForm.register("capacity", { valueAsNumber: true })} error={classForm.formState.errors.capacity?.message} />
              <Select label="Class Teacher" {...classForm.register("classTeacherId")}><option value="">None</option>{teachersQuery.data?.data?.filter((t: any) => t.status === "active").map((t: any) => <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>)}</Select>
            </div></section>
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button><Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : editingItem ? "Update Class" : "Create Class"}</Button></div>
          </form>
        )}
        {activeTab === "sections" && (
          <form onSubmit={submitSection} className="space-y-6">
            <section><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Section details</p><div className="mt-3 grid gap-4 md:grid-cols-2">
              <Input label="Name" {...sectionForm.register("name")} error={sectionForm.formState.errors.name?.message} />
              <Select label="Class" {...sectionForm.register("classId")} error={sectionForm.formState.errors.classId?.message}>{classesQuery.data?.data?.map((item: any) => <option key={item._id} value={item._id}>{item.displayName}</option>)}</Select>
              <Input label="Capacity" type="number" {...sectionForm.register("capacity", { valueAsNumber: true })} error={sectionForm.formState.errors.capacity?.message} />
            </div></section>
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button><Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : editingItem ? "Update Section" : "Create Section"}</Button></div>
          </form>
        )}
        {activeTab === "subjects" && (
          <form onSubmit={submitSubject} className="space-y-6">
            <section><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Subject details</p><div className="mt-3 grid gap-4 md:grid-cols-2">
              <Input label="Name" {...subjectForm.register("name")} error={subjectForm.formState.errors.name?.message} />
              <Input label="Code" {...subjectForm.register("code")} error={subjectForm.formState.errors.code?.message} />
              <Select label="Classes" {...subjectForm.register("classIds")} className="min-h-36 md:col-span-2" multiple error={subjectForm.formState.errors.classIds?.message}>{classesQuery.data?.data?.map((item: any) => <option key={item._id} value={item._id}>{item.displayName}</option>)}</Select>
              <Select label="Teacher" {...subjectForm.register("teacherId")}><option value="">None</option>{teachersQuery.data?.data?.filter((t: any) => t.status === "active").map((t: any) => <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>)}</Select>
            </div></section>
            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button><Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : editingItem ? "Update Subject" : "Create Subject"}</Button></div>
          </form>
        )}
      </Modal>
    </div>
  );
}
