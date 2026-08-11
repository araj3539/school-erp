import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Table } from "../components/ui/Table";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/Tabs";
import { Plus, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "../lib/api";
import { formatCurrency } from "../utils";

const classSchema = z.object({ name: z.string().min(1), displayName: z.string().min(1), roomNumber: z.string().optional(), capacity: z.coerce.number().min(1).default(40), classTeacherId: z.string().optional() });
const sectionSchema = z.object({ name: z.string().min(1), classId: z.string().min(1), capacity: z.coerce.number().min(1).default(40) });
const subjectSchema = z.object({ name: z.string().min(1), code: z.string().min(1), classIds: z.array(z.string()).min(1), teacherId: z.string().optional() });

type ClassForm = z.infer<typeof classSchema>;
type SectionForm = z.infer<typeof sectionSchema>;
type SubjectForm = z.infer<typeof subjectSchema>;

export default function ClassesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("classes");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const { data: classesData } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const res = await api.get("/academics/classes");
      return res.data;
    }
  });
  const { data: sectionsData } = useQuery({
    queryKey: ["sections"],
    queryFn: async () => {
      const res = await api.get("/academics/sections");
      return res.data;
    }
  });
  const { data: subjectsData } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const res = await api.get("/academics/subjects");
      return res.data;
    }
  });
  const { data: teachersData } = useQuery({
    queryKey: ["teachers", "all"],
    queryFn: async () => {
      const res = await api.get("/teachers?limit=100");
      return res.data;
    }
  });

  const classForm = useForm<ClassForm>({ resolver: zodResolver(classSchema), defaultValues: { capacity: 40 } });
  const sectionForm = useForm<SectionForm>({ resolver: zodResolver(sectionSchema), defaultValues: { capacity: 40 } });
  const subjectForm = useForm<SubjectForm>({ resolver: zodResolver(subjectSchema) });

  const classCreateMutation = useMutation({
    mutationFn: (data: ClassForm) => api.post("/academics/classes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setIsModalOpen(false);
      classForm.reset({ capacity: 40 });
    }
  });
  const classUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ClassForm> }) => api.put(`/academics/classes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      setIsModalOpen(false);
      setEditingItem(null);
      classForm.reset({ capacity: 40 });
    }
  });
  const classDeleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/academics/classes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["classes"] })
  });

  const sectionCreateMutation = useMutation({
    mutationFn: (data: SectionForm) => api.post("/academics/sections", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections"] });
      setIsModalOpen(false);
      sectionForm.reset({ capacity: 40 });
    }
  });
  const sectionUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SectionForm> }) => api.put(`/academics/sections/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sections"] });
      setIsModalOpen(false);
      setEditingItem(null);
      sectionForm.reset({ capacity: 40 });
    }
  });
  const sectionDeleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/academics/sections/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sections"] })
  });

  const subjectCreateMutation = useMutation({
    mutationFn: (data: SubjectForm) => api.post("/academics/subjects", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setIsModalOpen(false);
      subjectForm.reset();
    }
  });
  const subjectUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SubjectForm> }) => api.put(`/academics/subjects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setIsModalOpen(false);
      setEditingItem(null);
      subjectForm.reset();
    }
  });
  const subjectDeleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/academics/subjects/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subjects"] })
  });

  const handleOpenCreate = (type: string) => {
    setEditingItem(null);
    if (type === "class") classForm.reset({ capacity: 40 });
    else if (type === "section") sectionForm.reset({ capacity: 40 });
    else subjectForm.reset();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    if (item.classId) {
      classForm.setValue("name", item.name);
      classForm.setValue("displayName", item.displayName);
      classForm.setValue("roomNumber", item.roomNumber || "");
      classForm.setValue("capacity", item.capacity);
      classForm.setValue("classTeacherId", item.classTeacherId?._id || "");
    } else if (item.sectionId) {
      sectionForm.setValue("name", item.name);
      sectionForm.setValue("classId", item.classId);
      sectionForm.setValue("capacity", item.capacity);
    } else {
      subjectForm.setValue("name", item.name);
      subjectForm.setValue("code", item.code);
      subjectForm.setValue("classIds", item.classIds?.map((c: any) => c._id) || []);
      subjectForm.setValue("teacherId", item.teacherId?._id || "");
    }
    setIsModalOpen(true);
  };

  const classColumns = [
    { key: "name", header: "Name" },
    { key: "displayName", header: "Display Name" },
    { key: "classTeacherId", header: "Class Teacher", render: (c: any) => c.classTeacherId ? `${c.classTeacherId.firstName} ${c.classTeacherId.lastName}` : "-" },
    { key: "roomNumber", header: "Room" },
    { key: "capacity", header: "Capacity" },
    { key: "sectionIds", header: "Sections", render: (c: any) => c.sectionIds?.map((s: any) => s.name).join(", ") || "-" }
  ];
  const sectionColumns = [
    { key: "name", header: "Name" },
    { key: "classId", header: "Class", render: (s: any) => s.classId?.displayName || "-" },
    { key: "capacity", header: "Capacity" }
  ];
  const subjectColumns = [
    { key: "name", header: "Name" },
    { key: "code", header: "Code" },
    { key: "classIds", header: "Classes", render: (s: any) => s.classIds?.map((c: any) => c.displayName).join(", ") || "-" },
    { key: "teacherId", header: "Teacher", render: (s: any) => s.teacherId ? `${s.teacherId.firstName} ${s.teacherId.lastName}` : "-" }
  ];

  const renderModal = () => {
    if (!isModalOpen) return null;
    const title = editingItem ? "Edit" : "Add";
    if (activeTab === "classes") {
      return (
        <Modal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingItem(null); classForm.reset({ capacity: 40 }); }}
          title={`${title} Class`}
          size="md"
        >
          <form
            onSubmit={classForm.handleSubmit(
              editingItem
                ? (d) => classUpdateMutation.mutate({ id: editingItem._id, data: d })
                : (d) => classCreateMutation.mutate(d)
            )}
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Name" {...classForm.register("name")} error={classForm.formState.errors.name?.message} />
              <Input label="Display Name" {...classForm.register("displayName")} error={classForm.formState.errors.displayName?.message} />
              <Input label="Room Number" {...classForm.register("roomNumber")} />
              <Input label="Capacity" type="number" {...classForm.register("capacity", { valueAsNumber: true })} error={classForm.formState.errors.capacity?.message} />
              <Select label="Class Teacher" {...classForm.register("classTeacherId")}>
                <option value="">None</option>
                {teachersData?.data?.filter((t: any) => t.status === "active").map((t: any) => (
                  <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>
                ))}
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); setEditingItem(null); classForm.reset({ capacity: 40 }); }}>Cancel</Button>
              <Button type="submit" disabled={classCreateMutation.isPending || classUpdateMutation.isPending}>{title}</Button>
            </div>
          </form>
        </Modal>
      );
    }
    if (activeTab === "sections") {
      return (
        <Modal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingItem(null); sectionForm.reset({ capacity: 40 }); }}
          title={`${title} Section`}
          size="md"
        >
          <form
            onSubmit={sectionForm.handleSubmit(
              editingItem
                ? (d) => sectionUpdateMutation.mutate({ id: editingItem._id, data: d })
                : (d) => sectionCreateMutation.mutate(d)
            )}
            className="space-y-4"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Name" {...sectionForm.register("name")} error={sectionForm.formState.errors.name?.message} />
              <Select label="Class" {...sectionForm.register("classId")} error={sectionForm.formState.errors.classId?.message}>
                {classesData?.data?.map((c: any) => <option key={c._id} value={c._id}>{c.displayName}</option>)}
              </Select>
              <Input label="Capacity" type="number" {...sectionForm.register("capacity", { valueAsNumber: true })} error={sectionForm.formState.errors.capacity?.message} />
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); setEditingItem(null); sectionForm.reset({ capacity: 40 }); }}>Cancel</Button>
              <Button type="submit" disabled={sectionCreateMutation.isPending || sectionUpdateMutation.isPending}>{title}</Button>
            </div>
          </form>
        </Modal>
      );
    }
    return (
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); subjectForm.reset(); }}
        title={`${title} Subject`}
        size="md"
      >
        <form
          onSubmit={subjectForm.handleSubmit(
            editingItem
              ? (d) => subjectUpdateMutation.mutate({ id: editingItem._id, data: d })
              : (d) => subjectCreateMutation.mutate(d)
          )}
          className="space-y-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Name" {...subjectForm.register("name")} error={subjectForm.formState.errors.name?.message} />
            <Input label="Code" {...subjectForm.register("code")} error={subjectForm.formState.errors.code?.message} />
            <Select label="Classes" {...subjectForm.register("classIds")} className="md:col-span-2" multiple>
              {classesData?.data?.map((c: any) => <option key={c._id} value={c._id}>{c.displayName}</option>)}
            </Select>
            <Select label="Teacher" {...subjectForm.register("teacherId")}>
              <option value="">None</option>
              {teachersData?.data?.filter((t: any) => t.status === "active").map((t: any) => (
                <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); setEditingItem(null); subjectForm.reset(); }}>Cancel</Button>
            <Button type="submit" disabled={subjectCreateMutation.isPending || subjectUpdateMutation.isPending}>{title}</Button>
          </div>
        </form>
      </Modal>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Classes & Sections</h1>
        <Button onClick={() => handleOpenCreate(activeTab)}>
          <Plus className="w-4 h-4 mr-2" />
          {activeTab === "classes" ? "Add Class" : activeTab === "sections" ? "Add Section" : "Add Subject"}
        </Button>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
        </TabsList>
        <TabsContent value="classes">
          <Card>
            <CardContent>
              <Table
                data={classesData?.data || []}
                columns={classColumns}
                keyExtractor={(c) => c._id}
                onRowClick={handleOpenEdit}
                emptyMessage="No classes found"
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sections">
          <Card>
            <CardContent>
              <Table
                data={sectionsData?.data || []}
                columns={sectionColumns}
                keyExtractor={(s) => s._id}
                onRowClick={handleOpenEdit}
                emptyMessage="No sections found"
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="subjects">
          <Card>
            <CardContent>
              <Table
                data={subjectsData?.data || []}
                columns={subjectColumns}
                keyExtractor={(s) => s._id}
                onRowClick={handleOpenEdit}
                emptyMessage="No subjects found"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {renderModal()}
    </div>
  );
}
