import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Table } from "../components/ui/Table";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import { Plus, Search, Filter, Download, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "../lib/api";
import { formatCurrency, formatDate } from "../utils";
import { StudentStatus, BloodGroup, CreateStudentSchema, type CreateStudent, Gender } from "@school-erp/shared";

type StudentForm = CreateStudent;

const defaultValues: StudentForm = {
  admissionNo: "",
  firstName: "",
  lastName: "",
  dob: new Date().toISOString().split("T")[0],
  gender: "male" as unknown as Gender,
  fatherName: "",
  motherName: "",
  phone: "",
  address: "",
  admissionDate: new Date().toISOString().split("T")[0],
  bloodGroup: undefined,
  religion: "",
  category: "",
  guardianPhone: "",
  previousSchool: "",
  classId: "",
  sectionId: "",
  status: StudentStatus.ACTIVE,
};

const statusBadges: Record<string, "success" | "warning" | "danger" | "info"> = {
  active: "success",
  left: "danger",
  graduated: "info",
  transferred: "warning"
};

export default function StudentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);

const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<StudentForm>({
    resolver: zodResolver(CreateStudentSchema),
    defaultValues,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["students", page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), limit: "20" });
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      const res = await api.get(`/students?${params}`);
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: StudentForm) => api.post("/students", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setIsModalOpen(false);
      reset();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StudentForm> }) => api.put(`/students/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setIsModalOpen(false);
      setEditingStudent(null);
      reset();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/students/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["students"] })
  });

const handleOpenCreate = () => {
    setEditingStudent(null);
    reset();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: any) => {
    setEditingStudent(student);
    setValue("admissionNo", student.admissionNo);
    setValue("firstName", student.firstName);
    setValue("lastName", student.lastName);
    setValue("dob", student.dob?.split("T")[0] || "");
    setValue("gender", student.gender);
    setValue("bloodGroup", student.bloodGroup || "");
    setValue("religion", student.religion || "");
    setValue("category", student.category || "");
    setValue("fatherName", student.fatherName);
    setValue("motherName", student.motherName);
    setValue("phone", student.phone);
    setValue("address", student.address);
    setValue("guardianPhone", student.guardianPhone || "");
    setValue("previousSchool", student.previousSchool || "");
    setValue("admissionDate", student.admissionDate?.split("T")[0] || "");
    setValue("classId", student.classId?._id || "");
    setValue("sectionId", student.sectionId?._id || "");
    setIsModalOpen(true);
  };

  const onSubmit = (data: StudentForm) => {
    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const columns = [
    { key: "admissionNo", header: "Admission No" },
    { key: "firstName", header: "Name", render: (s: any) => `${s.firstName} ${s.lastName}` },
    { key: "classId", header: "Class", render: (s: any) => s.classId?.displayName || "-" },
    { key: "sectionId", header: "Section", render: (s: any) => s.sectionId?.name || "-" },
    { key: "gender", header: "Gender" },
    { key: "phone", header: "Phone" },
    { key: "status", header: "Status", render: (s: any) => <Badge variant={statusBadges[s.status] || "default"}>{s.status}</Badge> },
    { key: "admissionDate", header: "Admission Date", render: (s: any) => formatDate(s.admissionDate) }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <Button onClick={handleOpenCreate}><Plus className="w-4 h-4 mr-2" />Add Student</Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap gap-4">
            <Input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" leftIcon={<Search className="w-4 h-4" />} />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="left">Left</option>
              <option value="graduated">Graduated</option>
              <option value="transferred">Transferred</option>
            </Select>
            <Button variant="outline"><Download className="w-4 h-4 mr-2" />Export</Button>
            <Button variant="outline"><Upload className="w-4 h-4 mr-2" />Import</Button>
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
                keyExtractor={(s) => s._id}
                onRowClick={handleOpenEdit}
              />
              {data && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)
                  </p>
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

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingStudent(null); reset(); }} title={editingStudent ? "Edit Student" : "Add Student"} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Admission No" {...register("admissionNo")} error={errors.admissionNo?.message} disabled={!!editingStudent} />
            <Input label="First Name" {...register("firstName")} error={errors.firstName?.message} />
            <Input label="Last Name" {...register("lastName")} error={errors.lastName?.message} />
            <Input label="Date of Birth" type="date" {...register("dob")} error={errors.dob?.message} />
            <Select label="Gender" {...register("gender")} error={errors.gender?.message}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </Select>
            <Input label="Blood Group" {...register("bloodGroup")} />
            <Input label="Religion" {...register("religion")} />
            <Input label="Category" {...register("category")} />
            <Input label="Father&apos;s Name" {...register("fatherName")} error={errors.fatherName?.message} />
            <Input label="Mother&apos;s Name" {...register("motherName")} error={errors.motherName?.message} />
            <Input label="Phone" type="tel" {...register("phone")} error={errors.phone?.message} />
            <Input label="Guardian Phone" type="tel" {...register("guardianPhone")} />
            <Input label="Previous School" {...register("previousSchool")} />
            <Input label="Address" {...register("address")} error={errors.address?.message} className="md:col-span-2" />
            <Input label="Admission Date" type="date" {...register("admissionDate")} error={errors.admissionDate?.message} />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); setEditingStudent(null); reset(); }}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editingStudent ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
