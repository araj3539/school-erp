import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Table } from "../components/ui/Table";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import { Plus, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "../lib/api";
import { formatCurrency, formatDate } from "../utils";
import { TeacherStatus, CreateTeacherSchema, type CreateTeacher } from "@school-erp/shared";

type TeacherForm = CreateTeacher;

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
  on_leave: "warning"
};

const getError = (error: any) => error?.message;

export default function TeachersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);

const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<TeacherForm>({
    resolver: zodResolver(CreateTeacherSchema),
    defaultValues,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["teachers", page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), limit: "20" });
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      const res = await api.get("/teachers?" + params);
      return res.data;
    }
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects", "all"],
    queryFn: async () => {
      const res = await api.get("/academics/subjects");
      return res.data;
    }
  });

  const { data: classes } = useQuery({
    queryKey: ["classes", "all"],
    queryFn: async () => {
      const res = await api.get("/academics/classes");
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: TeacherForm) => api.post("/teachers", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["teachers"] }); setIsModalOpen(false); reset(); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TeacherForm> }) => api.put("/teachers/" + id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["teachers"] }); setIsModalOpen(false); setEditingTeacher(null); reset(); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete("/teachers/" + id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["teachers"] })
  });

const handleOpenCreate = () => {
    setEditingTeacher(null);
    reset();
    setIsModalOpen(true);
  };

const handleOpenEdit = (teacher: any) => {
    setEditingTeacher(teacher);
    setValue("employeeId", teacher.employeeId);
    setValue("firstName", teacher.firstName);
    setValue("lastName", teacher.lastName);
    setValue("email", teacher.email);
    setValue("phone", teacher.phone);
    setValue("qualification", teacher.qualification);
    setValue("experience", teacher.experience);
    setValue("joiningDate", teacher.joiningDate?.split("T")[0] || "");
    setValue("salary", teacher.salary);
    setValue("subjects", teacher.subjects?.map((s: any) => s._id) || []);
    setValue("classTeacherOf", teacher.classTeacherOf?.map((c: any) => c._id) || []);
    setIsModalOpen(true);
  };

  const onSubmit = (data: TeacherForm) => {
    if (editingTeacher) {
      updateMutation.mutate({ id: editingTeacher._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    { key: "employeeId", header: "Employee ID" },
    { key: "firstName", header: "Name", render: (t: any) => t.firstName + " " + t.lastName },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },
    { key: "qualification", header: "Qualification" },
    { key: "experience", header: "Exp (yrs)" },
    { key: "salary", header: "Salary", render: (t: any) => formatCurrency(t.salary) },
    { key: "status", header: "Status", render: (t: any) => <Badge variant={statusBadges[t.status] || "default"}>{t.status}</Badge> }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
        <Button onClick={handleOpenCreate}><Plus className="w-4 h-4 mr-2" />Add Teacher</Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap gap-4">
            <Input placeholder="Search teachers..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" leftIcon={<Search className="w-4 h-4" />} />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <>
              <Table
                data={data?.data || []}
                columns={columns}
                keyExtractor={(t) => t._id}
                onRowClick={handleOpenEdit}
              />
              {data && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))} disabled={page === data.pagination.totalPages}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingTeacher(null); reset(); }} title={editingTeacher ? "Edit Teacher" : "Add Teacher"} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Employee ID" {...register("employeeId")} error={getError(errors.employeeId)} disabled={!!editingTeacher} />
            <Input label="First Name" {...register("firstName")} error={getError(errors.firstName)} />
            <Input label="Last Name" {...register("lastName")} error={getError(errors.lastName)} />
            <Input label="Email" type="email" {...register("email")} error={getError(errors.email)} />
            <Input label="Phone" type="tel" {...register("phone")} error={getError(errors.phone)} />
            <Input label="Qualification" {...register("qualification")} error={getError(errors.qualification)} />
            <Input label="Experience (years)" type="number" {...register("experience", { valueAsNumber: true })} error={getError(errors.experience)} />
            <Input label="Joining Date" type="date" {...register("joiningDate")} error={getError(errors.joiningDate)} />
            <Input label="Salary" type="number" {...register("salary", { valueAsNumber: true })} error={getError(errors.salary)} />
<Select label="Subjects" {...register("subjects")} className="md:col-span-2" multiple>
              {subjects?.data?.map((s: any) => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
            </Select>
            <Select label="Class Teacher Of" {...register("classTeacherOf")} className="md:col-span-2" multiple>
              {classes?.data?.map((c: any) => <option key={c._id} value={c._id}>{c.displayName}</option>)}
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); setEditingTeacher(null); reset(); }}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editingTeacher ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
