import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Table } from "../components/ui/Table";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import { Plus, Search, Users, UserCheck, UserX, Clock3, RefreshCw } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "../lib/api";
import { formatCurrency } from "../utils";
import { TeacherStatus, CreateTeacherSchema, type CreateTeacher } from "@school-erp/shared";

type TeacherForm = CreateTeacher;
type TeacherRecord = TeacherForm & { _id: string };
type TeacherResponse = {
  data: TeacherRecord[];
  pagination: { page: number; totalPages: number; total: number };
};

const defaultValues: TeacherForm = {
  employeeId: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  qualification: "",
  experience: 0,
  joiningDate: new Date().toISOString().split("T")[0],
  salary: 0,
  subjects: [],
  classTeacherOf: [],
  status: TeacherStatus.ACTIVE,
};

const statusBadges: Record<string, "success" | "warning" | "danger" | "info"> = {
  active: "success",
  inactive: "danger",
  on_leave: "warning",
};

const statusLabel: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  on_leave: "On Leave",
};

export default function TeachersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherRecord | null>(null);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<TeacherForm>({
    resolver: zodResolver(CreateTeacherSchema),
    defaultValues,
  });

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery<TeacherResponse>({
    queryKey: ["teachers", page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), limit: "20" });
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      const res = await api.get("/teachers?" + params);
      return res.data;
    },
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects", "all"],
    queryFn: async () => (await api.get("/academics/subjects")).data,
  });

  const { data: classes } = useQuery({
    queryKey: ["classes", "all"],
    queryFn: async () => (await api.get("/academics/classes")).data,
  });

  const createMutation = useMutation({
    mutationFn: (formData: TeacherForm) => api.post("/teachers", formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      setIsModalOpen(false);
      reset(defaultValues);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: Partial<TeacherForm> }) => api.put("/teachers/" + id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      setIsModalOpen(false);
      setEditingTeacher(null);
      reset(defaultValues);
    },
  });

  const openCreate = () => {
    setEditingTeacher(null);
    reset(defaultValues);
    setIsModalOpen(true);
  };

  const openEdit = (teacher: TeacherRecord) => {
    setEditingTeacher(teacher);
    reset({
      employeeId: teacher.employeeId,
      firstName: teacher.firstName,
      lastName: teacher.lastName || "",
      email: teacher.email,
      phone: teacher.phone || "",
      qualification: teacher.qualification || "",
      experience: teacher.experience || 0,
      joiningDate: teacher.joiningDate?.split("T")[0] || "",
      salary: teacher.salary || 0,
      subjects: teacher.subjects?.map((subject: any) => subject._id) || [],
      classTeacherOf: teacher.classTeacherOf?.map((item: any) => item._id) || [],
      status: teacher.status,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTeacher(null);
    reset(defaultValues);
  };

  const onSubmit = (formData: TeacherForm) => {
    if (editingTeacher) updateMutation.mutate({ id: editingTeacher._id, formData });
    else createMutation.mutate(formData);
  };

  const counts = useMemo(() => {
    const items = data?.data || [];
    return {
      visible: items.length,
      active: items.filter((teacher) => teacher.status === "active").length,
      onLeave: items.filter((teacher) => teacher.status === "on_leave").length,
      inactive: items.filter((teacher) => teacher.status === "inactive").length,
    };
  }, [data]);

  const columns = [
    {
      key: "firstName",
      header: "Teacher",
      render: (teacher: TeacherRecord) => (
        <div className="flex items-center gap-3 min-w-[190px]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-700">
            {(teacher.firstName?.[0] || "T") + (teacher.lastName?.[0] || "")}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">{teacher.firstName} {teacher.lastName}</p>
            <p className="truncate text-xs text-slate-500">{teacher.employeeId}</p>
          </div>
        </div>
      ),
    },
    { key: "email", header: "Contact", render: (teacher: TeacherRecord) => <div><p className="text-sm text-slate-700">{teacher.email}</p><p className="text-xs text-slate-500">{teacher.phone || "No phone"}</p></div> },
    { key: "qualification", header: "Qualification", render: (teacher: TeacherRecord) => teacher.qualification || "—" },
    { key: "experience", header: "Experience", render: (teacher: TeacherRecord) => `${teacher.experience || 0} yrs` },
    { key: "salary", header: "Salary", render: (teacher: TeacherRecord) => formatCurrency(teacher.salary) },
    {
      key: "status",
      header: "Status",
      render: (teacher: TeacherRecord) => (
        <Badge variant={statusBadges[teacher.status] || "info"}>{statusLabel[teacher.status] || teacher.status}</Badge>
      ),
    },
  ];

  const mutationError = createMutation.error || updateMutation.error;
  const formSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">People · Faculty</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Teachers</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">Manage faculty records, assignments and employment status from one focused workspace.</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Teacher</Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Visible</p><p className="mt-1 text-2xl font-semibold text-slate-950">{counts.visible}</p><p className="text-xs text-slate-500">Current page</p></div><Users className="h-5 w-5 text-slate-400" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active</p><p className="mt-1 text-2xl font-semibold text-slate-950">{counts.active}</p><p className="text-xs text-slate-500">Current page</p></div><UserCheck className="h-5 w-5 text-slate-400" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">On leave</p><p className="mt-1 text-2xl font-semibold text-slate-950">{counts.onLeave}</p><p className="text-xs text-slate-500">Current page</p></div><Clock3 className="h-5 w-5 text-slate-400" /></CardContent></Card>
        <Card><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Inactive</p><p className="mt-1 text-2xl font-semibold text-slate-950">{counts.inactive}</p><p className="text-xs text-slate-500">Current page</p></div><UserX className="h-5 w-5 text-slate-400" /></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Faculty directory</h2>
              <p className="text-sm text-slate-500">Search by teacher details or narrow the directory by employment status.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input placeholder="Search teachers..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="w-full sm:w-72" leftIcon={<Search className="h-4 w-4" />} />
              <Select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="w-full sm:w-40">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
              </Select>
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh teachers">
                <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-6" aria-label="Loading teachers">
              {[1, 2, 3, 4].map((row) => <div key={row} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : isError ? (
            <div className="px-6 py-12 text-center">
              <p className="font-medium text-slate-900">Unable to load teachers</p>
              <p className="mt-1 text-sm text-slate-500">{(error as any)?.message || "Try again in a moment."}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>Try again</Button>
            </div>
          ) : !data?.data?.length ? (
            <div className="px-6 py-14 text-center">
              <Users className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 font-medium text-slate-900">{search || statusFilter ? "No teachers match these filters" : "No teachers found"}</p>
              <p className="mt-1 text-sm text-slate-500">{search || statusFilter ? "Adjust the search or status filter to broaden the directory." : "Add the first teacher to start building the faculty directory."}</p>
              {!search && !statusFilter && <Button className="mt-4" size="sm" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Teacher</Button>}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table data={data.data} columns={columns} keyExtractor={(teacher) => teacher._id} onRowClick={openEdit} />
              </div>
              <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.total} teachers</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1 || isFetching}>Previous</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.min(data.pagination.totalPages, current + 1))} disabled={page === data.pagination.totalPages || isFetching}>Next</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingTeacher ? "Edit Teacher" : "Add Teacher"} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {mutationError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Unable to save teacher. {(mutationError as any)?.message || "Please review the form and try again."}</div>}
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Basic information</p>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <Input label="Employee ID" {...register("employeeId")} error={errors.employeeId?.message} disabled={!!editingTeacher} />
              <Input label="First Name" {...register("firstName")} error={errors.firstName?.message} />
              <Input label="Last Name" {...register("lastName")} error={errors.lastName?.message} />
              <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
              <Input label="Phone" type="tel" {...register("phone")} error={errors.phone?.message} />
              <Input label="Joining Date" type="date" {...register("joiningDate")} error={errors.joiningDate?.message} />
            </div>
          </section>
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Employment</p>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <Input label="Qualification" {...register("qualification")} error={errors.qualification?.message} />
              <Input label="Experience (years)" type="number" {...register("experience", { valueAsNumber: true })} error={errors.experience?.message} />
              <Input label="Salary" type="number" {...register("salary", { valueAsNumber: true })} error={errors.salary?.message} />
              <Select label="Status" {...register("status")} error={errors.status?.message}>
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
          </section>
          <section>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Academic assignments</p>
            <p className="mt-1 text-sm text-slate-500">Select the subjects and classes currently assigned to this teacher.</p>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <Select label="Subjects" {...register("subjects")} multiple className="min-h-36" error={errors.subjects?.message}>
                {subjects?.data?.map((subject: any) => <option key={subject._id} value={subject._id}>{subject.name} ({subject.code})</option>)}
              </Select>
              <Select label="Class Teacher Of" {...register("classTeacherOf")} multiple className="min-h-36" error={errors.classTeacherOf?.message}>
                {classes?.data?.map((item: any) => <option key={item._id} value={item._id}>{item.displayName}</option>)}
              </Select>
            </div>
          </section>
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" disabled={formSaving}>{formSaving ? "Saving..." : editingTeacher ? "Update Teacher" : "Create Teacher"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
