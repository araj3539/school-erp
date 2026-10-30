import { useMemo, useState, useRef } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { PremiumCard, PremiumCardHeader, PremiumCardContent, PremiumCardFooter } from "../components/ui/PremiumCard.js";
import { Table } from "../components/ui/Table";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import { Plus, Search, RefreshCw, Download, Upload, UserRound, Pencil, Eye, RotateCcw, Phone, Receipt, Printer } from "lucide-react";
import { useStudents } from "../hooks/useStudents.js";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { StudentStatus, Gender, BloodGroup } from "@school-erp/shared";
import { GlassPanel, GlowOrb } from "../components/ui/GlassPanel.js";

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date").refine((value) => { const [year, month, day] = value.split("-").map(Number); const date = new Date(Date.UTC(year, month - 1, day)); return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day; }, "Enter a valid date");
const optionalObjectId = z.preprocess((value) => value === "" ? undefined : value, z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid selection").optional());
const optionalBloodGroup = z.preprocess((value) => value === "" ? undefined : value, z.nativeEnum(BloodGroup).optional());
const studentFormSchema = z.object({
  admissionNo: z.string().trim().min(1, "Admission No is required").max(20),
  firstName: z.string().trim().min(1, "First Name is required").max(50),
  lastName: z.string().trim().min(1, "Last Name is required").max(50),
  dob: dateOnlySchema,
  gender: z.nativeEnum(Gender),
  bloodGroup: optionalBloodGroup,
  religion: z.string().trim().max(50).optional(),
  category: z.string().trim().max(50).optional(),
  fatherName: z.string().trim().min(1, "Father's Name is required").max(100),
  motherName: z.string().trim().min(1, "Mother's Name is required").max(100),
  phone: z.string().trim().min(1, "Phone is required").max(20),
  address: z.string().trim().min(1, "Address is required").max(500),
  guardianPhone: z.string().trim().max(20).optional(),
  previousSchool: z.string().trim().max(100).optional(),
  classId: optionalObjectId,
  sectionId: optionalObjectId,
  status: z.string().min(1, "Status is required"),
  admissionDate: dateOnlySchema,
});
type StudentForm = z.infer<typeof studentFormSchema>;
const today = () => new Date().toISOString().split("T")[0];
const defaultValues: StudentForm = {
  admissionNo: "", firstName: "", lastName: "", dob: today(), gender: Gender.MALE,
  fatherName: "", motherName: "", phone: "", address: "", admissionDate: today(),
  bloodGroup: undefined, religion: "", category: "", guardianPhone: "", previousSchool: "",
  classId: undefined, sectionId: undefined, status: StudentStatus.ACTIVE,
};
const statusBadges: Record<string, "success" | "warning" | "danger" | "info"> = { active: "success", left: "danger", graduated: "info", transferred: "warning" };
const statusColors: Record<string, string> = { active: "bg-emerald-50 text-emerald-600", left: "bg-rose-50 text-rose-600", graduated: "bg-blue-50 text-blue-600", transferred: "bg-amber-50 text-amber-600" };

export default function StudentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [inspectedStudent, setInspectedStudent] = useState<any>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StudentForm>({
    resolver: zodResolver(studentFormSchema),
    defaultValues,
  });

  const { students, pagination, isLoading, isError, refetch, createStudent, updateStudent, deleteStudent, isCreating, isUpdating } = useStudents({ limit: 20, search, status: statusFilter || undefined });
  const totalPages = pagination?.totalPages || 1;
  const total = pagination?.total || 0;

  const clearPhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoError("");
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    reset(defaultValues);
    clearPhoto();
  };

  const handleOpenCreate = () => {
    setEditingStudent(null);
    reset(defaultValues);
    clearPhoto();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: any) => {
    setEditingStudent(student._id);
    reset({
      admissionNo: student.admissionNo || "", firstName: student.firstName || "", lastName: student.lastName || "",
      dob: student.dob?.split("T")[0] || "", gender: student.gender, bloodGroup: student.bloodGroup || undefined,
      religion: student.religion || "", category: student.category || "", fatherName: student.fatherName || "",
      motherName: student.motherName || "", phone: student.phone || "", address: student.address || "",
      guardianPhone: student.guardianPhone || "", previousSchool: student.previousSchool || "",
      classId: student.classId?._id || undefined, sectionId: student.sectionId?._id || undefined,
      status: student.status || StudentStatus.ACTIVE, admissionDate: student.admissionDate?.split("T")[0] || "",
    });
    setIsModalOpen(true);
  };

  const onSubmit = (form: StudentForm) => {
    const input = { ...form, status: form.status as "active" | "inactive" | "graduated" };
    if (editingStudent) {
      updateStudent({ id: editingStudent, input });
    } else {
      createStudent(input);
    }
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      clearPhoto();
      setPhotoError("Please select a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      clearPhoto();
      setPhotoError("Photo must be 5 MB or smaller.");
      return;
    }
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoError("");
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const columns = useMemo(() => [
    {
      key: "student",
      header: "Student",
      render: (s: any) => (
        <div className="flex min-w-[220px] items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-slate-500">
            <UserRound className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold text-slate-900">{s.firstName} {s.lastName}</p>
            <p className="mt-0.5 font-mono text-[11px] font-medium text-slate-400">{s.admissionNo}</p>
          </div>
        </div>
      ),
    },
    { key: "classId", header: "Class", render: (s: any) => <span className="font-medium text-slate-700">{s.classId?.displayName || "Unassigned"}</span> },
    { key: "sectionId", header: "Section", render: (s: any) => <span className="font-medium text-slate-600">{s.sectionId?.name || "Unassigned"}</span> },
    { key: "gender", header: "Gender", render: (s: any) => <span className="capitalize text-slate-600">{s.gender || "—"}</span> },
    { key: "phone", header: "Phone", render: (s: any) => <span className="whitespace-nowrap text-slate-600">{s.phone || "—"}</span> },
    { key: "status", header: "Status", render: (s: any) => <Badge variant={statusBadges[s.status] || "default"} className={statusColors[s.status]}>{s.status || "—"}</Badge> },
    {
      key: "actions",
      header: "Actions",
      render: (s: any) => (
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" className="text-slate-500 hover:text-primary-600 hover:bg-primary-50" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setInspectedStudent(s); }}>
            <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Inspect
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleOpenEdit(s); }}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Edit
          </Button>
          <Button type="button" variant="danger" size="sm" onClick={(e: React.MouseEvent) => { e.stopPropagation(); if (window.confirm(`Delete ${s.firstName} ${s.lastName}?`)) deleteStudent(s._id); }}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Delete
          </Button>
        </div>
      ),
    },
  ], []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100/50 relative overflow-x-hidden pb-12">
      {/* Background orbs */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <GlowOrb color="primary" size="xl" className="top-[-5%] left-[-10%] animate-pulse-slow" />
        <GlowOrb color="violet" size="lg" className="bottom-[-10%] right-[-10%] animate-pulse-slow" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Header */}
        <GlassPanel className="mb-8">
          <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-lg shadow-primary-600/30">
                    <UserRound className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Student Directory</h1>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">Manage, inspect, and maintain student records with precision and care.</p>
              </div>
              <div className="flex items-center justify-end gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Directory Size</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">{total}</p>
                </div>
                <Button onClick={handleOpenCreate} className="bg-primary-600 text-white shadow-lg shadow-primary-600/25 hover:bg-primary-700 hover:shadow-primary-600/40 px-6 py-3 text-sm font-semibold rounded-2xl transition-all">
                  <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Add Student
                </Button>
              </div>
            </div>
          </div>
        </GlassPanel>

        {/* Stats Bar */}
        <div className="grid gap-4 sm:grid-cols-4 mb-8">
          {[["Active", "text-emerald-600", "bg-emerald-50"], ["Left", "text-rose-600", "bg-rose-50"], ["Graduated", "text-blue-600", "bg-blue-50"], ["Transferred", "text-amber-600", "bg-amber-50"]].map(([label], i) => (
            <PremiumCard key={i} className="p-5">
              <p className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-1">{label}</p>
              <p className="text-2xl font-black text-slate-900">{isLoading ? "—" : students.filter(s => s.status === label.toLowerCase()).length}</p>
            </PremiumCard>
          ))}
        </div>

        {/* Student Table Card */}
        <PremiumCard hover className="overflow-hidden">
          <PremiumCardHeader className="border-b border-slate-100/60 bg-white/80 pb-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="grid min-w-0 flex-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
                <div className="relative min-w-0">
                  <Input aria-label="Search students" placeholder="Search by name, admission number or phone…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} leftIcon={<Search className="h-4 w-4" />} className="w-full" />
                </div>
                <Select aria-label="Filter by student status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-full md:w-48 md:shrink-0">
                  <option value="">All statuses</option>
                  <option value="active">Active</option>
                  <option value="left">Left</option>
                  <option value="graduated">Graduated</option>
                  <option value="transferred">Transferred</option>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => refetch()} disabled={isLoading} className="text-slate-600 hover:text-primary-600 hover:border-primary-200">
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" /> Refresh
                </Button>
                <Button variant="outline"><Download className="mr-2 h-4 w-4" aria-hidden="true" /> Export</Button>
                <Button variant="outline"><Upload className="mr-2 h-4 w-4" aria-hidden="true" /> Import</Button>
              </div>
            </div>
          </PremiumCardHeader>
          <PremiumCardContent className="p-0">
            {isError ? (
              <div className="px-6 py-16 text-center">
                <div className="flex justify-center mb-4">
                  <RotateCcw className="h-12 w-12 text-red-500 animate-spin" aria-hidden="true" />
                </div>
                <p className="mt-3 font-medium text-slate-900">Unable to load students</p>
                <p className="mt-1 text-sm text-slate-500">Please check your permissions or connection and try again.</p>
                <Button className="mt-6" variant="outline" onClick={() => refetch()}>Try again</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table data={students} columns={columns as any} keyExtractor={(s: any) => s._id} emptyMessage="No students found" isLoading={isLoading} />
              </div>
            )}
            {(total > 0 && !isLoading) && (
              <PremiumCardFooter className="border-t border-slate-100/60 bg-white/80">
                <div className="flex items-center justify-between px-0">
                  <span className="text-sm text-slate-600">Page {page} of {totalPages}</span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>Next</Button>
                  </div>
                </div>
              </PremiumCardFooter>
            )}
          </PremiumCardContent>
        </PremiumCard>

        {/* Add Student Modal */}
        <Modal isOpen={isModalOpen} onClose={() => { if (!isCreating && !isUpdating) closeModal(); }} title={editingStudent ? "Edit Student" : "Add New Student"} size="lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  {photoPreview ? <img src={photoPreview} alt="Student preview" className="h-full w-full object-cover" /> : <UserRound className="h-10 w-10 text-slate-300" aria-hidden="true" />}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900">Student Photo</p>
                  <p className="mt-1 text-sm text-slate-500">JPG, PNG or WebP · maximum 5 MB</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="block max-w-full text-xs text-slate-600" />
                    {photoFile && <Button type="button" variant="outline" size="sm" onClick={clearPhoto}><span>×</span> Remove</Button>}
                  </div>
                  {photoError && <p className="mt-2 text-sm font-medium text-red-600" role="alert">{photoError}</p>}
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-base font-extrabold tracking-tight text-slate-900 mb-3">Basic Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Admission No" {...register("admissionNo")} error={errors.admissionNo?.message} disabled={!!editingStudent} />
                  <Input label="First Name" {...register("firstName")} error={errors.firstName?.message} />
                  <Input label="Last Name" {...register("lastName")} error={errors.lastName?.message} />
                  <Input type="date" label="Date of Birth" {...register("dob")} error={errors.dob?.message} />
                  <Select label="Gender" {...register("gender")} error={errors.gender?.message}>
                    <option value={Gender.MALE}>Male</option>
                    <option value={Gender.FEMALE}>Female</option>
                    <option value={Gender.OTHER}>Other</option>
                  </Select>
                  <Select label="Blood Group" {...register("bloodGroup")} error={errors.bloodGroup?.message}>
                    <option value="">None</option>
                    <option value={BloodGroup.A_POS}>A+</option>
                    <option value={BloodGroup.A_NEG}>A-</option>
                    <option value={BloodGroup.B_POS}>B+</option>
                    <option value={BloodGroup.B_NEG}>B-</option>
                    <option value={BloodGroup.AB_POS}>AB+</option>
                    <option value={BloodGroup.AB_NEG}>AB-</option>
                    <option value={BloodGroup.O_POS}>O+</option>
                    <option value={BloodGroup.O_NEG}>O-</option>
                  </Select>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Father's Name" {...register("fatherName")} error={errors.fatherName?.message} />
                  <Input label="Mother's Name" {...register("motherName")} error={errors.motherName?.message} />
                  <Input label="Phone" {...register("phone")} error={errors.phone?.message} />
                  <Input label="Address" {...register("address")} error={errors.address?.message} />
                  <Input label="Guardian Phone" {...register("guardianPhone")} error={errors.guardianPhone?.message} />
                  <Input label="Previous School" {...register("previousSchool")} error={errors.previousSchool?.message} />
                  <Select label="Class" {...register("classId")} error={errors.classId?.message}>
                    <option value="">Unassigned</option>
                  </Select>
                  <Select label="Section" {...register("sectionId")} error={errors.sectionId?.message}>
                    <option value="">Unassigned</option>
                  </Select>
                  <Select label="Status" {...register("status")} error={errors.status?.message}>
                    <option value={StudentStatus.ACTIVE}>Active</option>
                    <option value={StudentStatus.LEFT}>Left</option>
                    <option value={StudentStatus.GRADUATED}>Graduated</option>
                    <option value={StudentStatus.TRANSFERRED}>Transferred</option>
                  </Select>
                  <Input type="date" label="Admission Date" {...register("admissionDate")} error={errors.admissionDate?.message} />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-6">
              <Button type="button" variant="outline" onClick={closeModal} disabled={isCreating || isUpdating}>Cancel</Button>
              <Button type="submit" disabled={isCreating || isUpdating} className="bg-primary-600 text-white shadow-lg shadow-primary-600/25 hover:bg-primary-700 hover:shadow-primary-600/40">
                {isCreating || isUpdating ? "Saving…" : editingStudent ? "Update Student" : "Add Student"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Student Inspect Modal */}
        {inspectedStudent && (
          <Modal isOpen={true} onClose={() => setInspectedStudent(null)} title={`${inspectedStudent.firstName} ${inspectedStudent.lastName}`} size="lg">
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 font-extrabold text-xl">
                    {inspectedStudent.firstName?.charAt(0)}{inspectedStudent.lastName?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-900">{inspectedStudent.firstName} {inspectedStudent.lastName}</p>
                    <p className="text-sm text-slate-500">{inspectedStudent.classId?.displayName || "Class not assigned"} · {inspectedStudent.sectionId?.name || "No section"}</p>
                  </div>
                  <Badge variant="secondary" className={statusColors[inspectedStudent.status]}>{inspectedStudent.status}</Badge>
                </div>
              </div>
              <dl className="grid gap-4 sm:grid-cols-2">
                {[["Admission No", inspectedStudent.admissionNo], ["Phone", inspectedStudent.phone], ["Guardian", inspectedStudent.guardianPhone], ["Gender", inspectedStudent.gender], ["Status", inspectedStudent.status], ["Blood Group", inspectedStudent.bloodGroup]].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-slate-200 p-4">
                    <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</dt>
                    <dd className="mt-1 text-sm font-semibold capitalize text-slate-800">{value || "—"}</dd>
                  </div>
                ))}
              </dl>
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-sm font-bold text-slate-900 mb-4">Quick Actions</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button variant="outline" size="sm" disabled={!inspectedStudent.guardianPhone} onClick={() => inspectedStudent.guardianPhone && (window.location.href = `tel:${inspectedStudent.guardianPhone}`)}>
                    <Phone className="mr-2 h-4 w-4" />Call Guardian
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setInspectedStudent(null)}>
                    <Receipt className="mr-2 h-4 w-4" />Fee History
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.print()}>
                    <Printer className="mr-2 h-4 w-4" />Print ID Card
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.confirm("Transfer student?") && null}>
                    <RotateCcw className="mr-2 h-4 w-4" />Transfer
                  </Button>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button variant="outline" size="sm" onClick={() => handleOpenEdit(inspectedStudent)}>Edit Record</Button>
                <Button variant="outline" size="sm" onClick={() => setInspectedStudent(null)}>Close</Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
