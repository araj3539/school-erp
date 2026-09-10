import { useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/Tabs";
import { Table } from "../components/ui/Table";
import { ArrowLeft, Calendar, Camera, Download, FileText, GraduationCap, Trash2, Upload, User, Wallet, Eye, Pencil, X, Phone, MapPin, ShieldCheck, ClipboardList } from "lucide-react";
import api from "../lib/api";
import { formatCurrency, formatDate } from "../utils";

const DOCUMENT_TYPES = [["birth_certificate", "Birth Certificate"], ["aadhar", "Aadhaar"], ["transfer_certificate", "Transfer Certificate"], ["marksheet", "Marksheet"], ["signature", "Signature"], ["other", "Other"]] as const;
const ACCEPTED_FILE_TYPES = "image/jpeg,image/png,image/webp,application/pdf";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const statusBadges: Record<string, "success" | "warning" | "danger" | "info"> = { active: "success", left: "danger", graduated: "info", transferred: "warning" };

function labelForType(type: string) {
  if (type === "photo") return "Photo";
  return DOCUMENT_TYPES.find(([value]) => value === type)?.[1] || type.split("_").join(" ");
}

function calculateAge(value: string | Date) {
  const dob = new Date(value);
  if (Number.isNaN(dob.getTime())) return "-";
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const beforeBirthday = now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

function DetailItem({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: typeof User }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </div>
      <div className="mt-1.5 break-words text-sm font-semibold text-slate-800">{value || "-"}</div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sky-600">{eyebrow}</p>
      <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">{title}</h2>
      {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [documentType, setDocumentType] = useState("birth_certificate");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const { data: studentData, isLoading, isError } = useQuery({ queryKey: ["student", id], queryFn: async () => (await api.get(`/students/${id}`)).data, enabled: !!id });
  const student = studentData?.student;
  const photoDocument = useMemo(() => student?.documents?.find((doc: any) => doc.type === "photo"), [student]);
  useQuery({ queryKey: ["student-photo-url", id, photoDocument?._id, photoDocument?.url], queryFn: async () => { const res = await api.get(`/students/${id}/documents/${photoDocument._id}/url`); setPhotoUrl(res.data.url); return res.data.url; }, enabled: !!id && !!photoDocument?._id });
  const { data: feesData } = useQuery({ queryKey: ["fees", "student", id], queryFn: async () => (await api.get(`/fees/student/${id}`)).data, enabled: !!id && activeTab === "fees" });
  const { data: attendanceData } = useQuery({ queryKey: ["attendance", "student", id], queryFn: async () => (await api.get(`/attendance/student/${id}`)).data, enabled: !!id && activeTab === "attendance" });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!id || !selectedFile) throw new Error("Select a file first");
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("type", documentType);
      return (await api.post(`/students/${id}/documents`, formData)).data;
    },
    onSuccess: () => {
      setSelectedFile(null);
      setUploadError("");
      if (inputRef.current) inputRef.current.value = "";
      setPhotoUrl(null);
      queryClient.invalidateQueries({ queryKey: ["student", id] });
    },
    onError: (error: any) => setUploadError(error?.response?.data?.message || "Document upload failed. Please try again."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => (await api.delete(`/students/${id}/documents/${documentId}`)).data,
    onSuccess: () => {
      setPhotoUrl(null);
      queryClient.invalidateQueries({ queryKey: ["student", id] });
    },
  });

  const openDocument = async (documentId: string) => {
    const res = await api.get(`/students/${id}/documents/${documentId}/url`);
    window.open(res.data.url, "_blank", "noopener,noreferrer");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setUploadError("");
    if (!file) return;
    if (!ACCEPTED_FILE_TYPES.split(",").includes(file.type)) {
      setSelectedFile(null);
      setUploadError("Only JPG, PNG, WebP and PDF files are supported.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setSelectedFile(null);
      setUploadError("File must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }
    setSelectedFile(file);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-5 w-40 rounded bg-slate-200" />
        <div className="h-56 rounded-3xl bg-slate-200" />
        <div className="h-12 rounded-2xl bg-slate-200" />
        <div className="grid gap-6 lg:grid-cols-2"><div className="h-72 rounded-2xl bg-slate-200" /><div className="h-72 rounded-2xl bg-slate-200" /></div>
      </div>
    );
  }

  if (isError || !student) {
    return (
      <div className="space-y-5">
        <Link to="/students" className="inline-flex items-center text-sm font-semibold text-slate-600 transition hover:text-slate-950"><ArrowLeft className="mr-2 h-4 w-4" />Back to Students</Link>
        <Card><CardContent className="py-16 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600"><User className="h-6 w-6" /></div><h2 className="mt-4 text-lg font-bold text-slate-950">Student record unavailable</h2><p className="mt-1 text-sm text-slate-500">We could not load this student. Try again or return to the directory.</p></CardContent></Card>
      </div>
    );
  }

  const s = student;
  const documents = s.documents || [];
  const fullName = `${s.firstName} ${s.lastName}`.trim();
  const attendanceSummary = attendanceData?.summary || {};
  const feeSummary = feesData?.summary || {};

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/students" className="inline-flex items-center rounded-lg py-1 text-sm font-semibold text-slate-600 transition hover:text-slate-950"><ArrowLeft className="mr-2 h-4 w-4" />Students directory</Link>
        <Button variant="outline" onClick={() => navigate(`/students?edit=${id}`)}><Pencil className="mr-2 h-4 w-4" />Edit Student</Button>
      </div>

      <section className="relative overflow-hidden rounded-[28px] bg-slate-950 px-5 py-6 text-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.55)] sm:px-7 sm:py-8">
        <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-sky-400/15 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-indigo-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-3xl border border-white/15 bg-white/10 shadow-xl">
              {photoUrl ? <img src={photoUrl} alt={fullName} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center"><User className="h-14 w-14 text-slate-400" /></div>}
              <button type="button" onClick={() => setActiveTab("documents")} className="absolute bottom-2 right-2 rounded-xl border border-white/20 bg-slate-950/80 p-2 text-white backdrop-blur transition hover:bg-slate-800" title="Manage photo" aria-label="Manage student photo"><Camera className="h-4 w-4" /></button>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{fullName}</h1>
                <Badge variant={statusBadges[s.status] || "default"}>{s.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-400">Admission No. <span className="font-semibold text-slate-200">{s.admissionNo}</span></p>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
                <span className="inline-flex items-center gap-1.5"><GraduationCap className="h-4 w-4 text-sky-300" />{s.classId?.displayName || "Not assigned"}{s.sectionId?.name ? ` · ${s.sectionId.name}` : ""}</span>
                <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4 text-sky-300" />{formatDate(s.dob)} · {calculateAge(s.dob)} yrs</span>
                <span className="inline-flex items-center gap-1.5"><Phone className="h-4 w-4 text-sky-300" />{s.phone || "Not provided"}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[390px]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</p><p className="mt-1 text-sm font-bold capitalize text-white">{s.status}</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Class</p><p className="mt-1 truncate text-sm font-bold text-white">{s.classId?.displayName || "—"}</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Documents</p><p className="mt-1 text-sm font-bold text-white">{documents.length}</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Age</p><p className="mt-1 text-sm font-bold text-white">{calculateAge(s.dob)} years</p></div>
          </div>
        </div>
      </section>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <TabsList className="flex min-w-max flex-nowrap bg-transparent">
            <TabsTrigger value="overview"><User className="mr-2 h-4 w-4" />Overview</TabsTrigger>
            <TabsTrigger value="academic"><GraduationCap className="mr-2 h-4 w-4" />Academic</TabsTrigger>
            <TabsTrigger value="documents"><FileText className="mr-2 h-4 w-4" />Documents</TabsTrigger>
            <TabsTrigger value="fees"><Wallet className="mr-2 h-4 w-4" />Fees</TabsTrigger>
            <TabsTrigger value="attendance"><Calendar className="mr-2 h-4 w-4" />Attendance</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card><CardHeader><SectionHeading eyebrow="Profile" title="Personal information" description="Core contact and demographic details." /></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">
              <DetailItem label="Father's name" value={s.fatherName} icon={User} /><DetailItem label="Mother's name" value={s.motherName} icon={User} /><DetailItem label="Guardian phone" value={s.guardianPhone} icon={Phone} /><DetailItem label="Blood group" value={s.bloodGroup} /><DetailItem label="Religion" value={s.religion} /><DetailItem label="Category" value={s.category} /><div className="sm:col-span-2"><DetailItem label="Address" value={s.address} icon={MapPin} /></div>
            </CardContent></Card>
            <Card><CardHeader><SectionHeading eyebrow="Enrollment" title="Admission information" description="Record provenance and enrollment context." /></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">
              <DetailItem label="Admission date" value={formatDate(s.admissionDate)} icon={Calendar} /><DetailItem label="Previous school" value={s.previousSchool} icon={GraduationCap} /><DetailItem label="Student ID" value={<span className="font-mono text-xs">{s._id}</span>} icon={ShieldCheck} /><DetailItem label="Stored documents" value={`${documents.length} file${documents.length === 1 ? "" : "s"}`} icon={FileText} />
            </CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="academic">
          <Card><CardHeader><SectionHeading eyebrow="Academic profile" title="Current placement" description="The student's current academic assignment." /></CardHeader><CardContent className="grid gap-3 md:grid-cols-3">
            <DetailItem label="Class" value={s.classId?.displayName || "Not assigned"} icon={GraduationCap} /><DetailItem label="Section" value={s.sectionId?.name || "Not assigned"} icon={ClipboardList} /><DetailItem label="Previous school" value={s.previousSchool} icon={GraduationCap} />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="documents">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <Card><CardHeader><div className="flex items-start justify-between gap-4"><SectionHeading eyebrow="Records" title="Student documents" description="Securely stored files associated with this student." /><Badge variant="info">{documents.length} file{documents.length === 1 ? "" : "s"}</Badge></div></CardHeader><CardContent>
              {documents.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-10 text-center"><FileText className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 font-semibold text-slate-800">No documents uploaded</p><p className="mt-1 text-sm text-slate-500">Upload a photo, certificate, Aadhaar, marksheet or PDF.</p></div> : <div className="space-y-2">{documents.map((doc: any) => <div key={doc._id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm">{doc.type === "photo" ? <Camera className="h-5 w-5" /> : <FileText className="h-5 w-5" />}</div><div className="min-w-0"><p className="font-semibold capitalize text-slate-800">{labelForType(doc.type)}</p><p className="truncate text-xs text-slate-500">{doc.originalName || labelForType(doc.type)} · {formatDate(doc.uploadedAt)}</p></div></div><div className="flex shrink-0 gap-2"><Button type="button" variant="outline" size="sm" onClick={() => openDocument(doc._id)}><Eye className="mr-1 h-4 w-4" />View</Button><Button type="button" variant="outline" size="sm" onClick={() => openDocument(doc._id)}><Download className="mr-1 h-4 w-4" />Open</Button><Button type="button" variant="outline" size="sm" disabled={deleteMutation.isPending} onClick={() => { if (window.confirm(`Delete ${labelForType(doc.type)}? The current R2 file will be deleted, while your B2 backup remains available for recovery.`)) deleteMutation.mutate(doc._id); }} aria-label={`Delete ${labelForType(doc.type)}`}><Trash2 className="h-4 w-4 text-red-500" /></Button></div></div>)}</div>}
            </CardContent></Card>
            <Card><CardHeader><SectionHeading eyebrow="Document intake" title="Upload document" description="JPG, PNG, WebP or PDF · maximum 5 MB." /></CardHeader><CardContent className="space-y-4">
              <div><label htmlFor="document-type" className="mb-1.5 block text-sm font-semibold text-slate-700">Document type</label><select id="document-type" value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"><option value="photo">Photo</option>{DOCUMENT_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <div><label htmlFor="document-file" className="mb-1.5 block text-sm font-semibold text-slate-700">File</label><input id="document-file" ref={inputRef} type="file" accept={ACCEPTED_FILE_TYPES} onChange={handleFileChange} className="block w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white" /></div>
              {selectedFile ? <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold text-slate-700">{selectedFile.name}</span><button type="button" onClick={() => { setSelectedFile(null); if (inputRef.current) inputRef.current.value = ""; }} className="rounded-lg p-1 text-slate-400 transition hover:bg-white hover:text-slate-700" aria-label="Remove selected file"><X className="h-4 w-4" /></button></div><p className="mt-1 text-xs text-slate-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p></div> : null}
              {uploadError ? <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{uploadError}</p> : null}
              <Button type="button" className="w-full" disabled={!selectedFile || uploadMutation.isPending} onClick={() => uploadMutation.mutate()}><Upload className="mr-2 h-4 w-4" />{uploadMutation.isPending ? "Uploading..." : "Upload document"}</Button>
              <p className="text-xs leading-5 text-slate-400">Uploading the same document type replaces the current R2 file. The previous object remains in B2 as backup.</p>
            </CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="fees">
          <Card><CardHeader><div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><SectionHeading eyebrow="Finance" title="Fee records" description="Student-level fee obligations and payment status." /><div className="grid grid-cols-3 gap-2"><div className="rounded-xl bg-amber-50 px-3 py-2"><p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Due</p><p className="mt-0.5 text-sm font-bold text-amber-900">{formatCurrency(feeSummary.totalDue || 0)}</p></div><div className="rounded-xl bg-emerald-50 px-3 py-2"><p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Paid</p><p className="mt-0.5 text-sm font-bold text-emerald-900">{formatCurrency(feeSummary.paid || 0)}</p></div><div className="rounded-xl bg-red-50 px-3 py-2"><p className="text-[10px] font-bold uppercase tracking-wider text-red-600">Balance</p><p className="mt-0.5 text-sm font-bold text-red-900">{formatCurrency(feeSummary.balance || 0)}</p></div></div></div></CardHeader><CardContent>{feesData?.fees?.length ? <Table data={feesData.fees} columns={[{ key: "feeStructureId", header: "Fee Type", render: (f: any) => f.feeStructureId?.feeType || "-" }, { key: "totalDue", header: "Total Due", render: (f: any) => formatCurrency(f.totalDue) }, { key: "paidAmount", header: "Paid", render: (f: any) => formatCurrency(f.paidAmount) }, { key: "balance", header: "Balance", render: (f: any) => formatCurrency(f.balance) }, { key: "status", header: "Status", render: (f: any) => <Badge variant={f.status === "paid" ? "success" : f.status === "overdue" ? "danger" : "warning"}>{f.status}</Badge> }]} keyExtractor={(f) => f._id} /> : <div className="py-12 text-center"><Wallet className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 font-semibold text-slate-700">No fee records found</p><p className="mt-1 text-sm text-slate-500">Fee data will appear here when records exist.</p></div>}</CardContent></Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card><CardHeader><div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><SectionHeading eyebrow="Attendance" title="Attendance history" description="Daily attendance records for this student." /><div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><div className="rounded-xl bg-emerald-50 px-3 py-2"><p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Present</p><p className="text-sm font-bold text-emerald-900">{attendanceSummary.present || 0}</p></div><div className="rounded-xl bg-red-50 px-3 py-2"><p className="text-[10px] font-bold uppercase tracking-wider text-red-600">Absent</p><p className="text-sm font-bold text-red-900">{attendanceSummary.absent || 0}</p></div><div className="rounded-xl bg-amber-50 px-3 py-2"><p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Late</p><p className="text-sm font-bold text-amber-900">{attendanceSummary.late || 0}</p></div><div className="rounded-xl bg-sky-50 px-3 py-2"><p className="text-[10px] font-bold uppercase tracking-wider text-sky-600">Half day</p><p className="text-sm font-bold text-sky-900">{attendanceSummary.halfDay || 0}</p></div></div></div></CardHeader><CardContent>{attendanceData?.attendance?.length ? <Table data={attendanceData.attendance} columns={[{ key: "date", header: "Date", render: (a: any) => formatDate(a.date) }, { key: "status", header: "Status", render: (a: any) => { const record = a.records?.find((r: any) => r.studentId === id); return record ? <Badge variant={record.status === "present" ? "success" : record.status === "absent" ? "danger" : record.status === "late" ? "warning" : "info"}>{record.status}</Badge> : "-"; } }, { key: "remark", header: "Remark", render: (a: any) => a.records?.find((r: any) => r.studentId === id)?.remark || "-" }]} keyExtractor={(a) => a._id} /> : <div className="py-12 text-center"><Calendar className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 font-semibold text-slate-700">No attendance records found</p><p className="mt-1 text-sm text-slate-500">Attendance history will appear here when records exist.</p></div>}</CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
