import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, FileText, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import api from "../lib/api";

export default function PortalStudentDetailPage() {
  const { id } = useParams();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["portal", "student", id], queryFn: async () => (await api.get(`/students/${id}`)).data, enabled: Boolean(id) });
  const student = data?.student;

  const openDocument = async (documentId: string) => {
    const response = await api.get(`/students/${id}/documents/${documentId}/url`);
    window.open(response.data.url, "_blank", "noopener,noreferrer");
  };

  if (isLoading) return <p className="py-12 text-center text-sm text-slate-500">Loading student...</p>;
  if (isError || !student) return <div className="py-12 text-center"><p className="font-medium text-red-600">Unable to load this student.</p><Button variant="outline" className="mt-3" onClick={() => refetch()}>Try again</Button></div>;

  return <div className="space-y-6">
    <Link to="/students" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700 hover:text-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back to students</Link>
    <section className="rounded-3xl bg-slate-950 px-6 py-7 text-white sm:px-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10"><UserRound className="h-8 w-8 text-primary-300" aria-hidden="true" /></div><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-300">Student profile</p><h1 className="mt-1 text-2xl font-bold">{student.firstName} {student.lastName}</h1><p className="mt-1 text-sm text-slate-300">{student.admissionNo} · {student.classId?.displayName || "Class not assigned"}{student.sectionId?.name ? ` · ${student.sectionId.name}` : ""}</p></div><Badge variant={student.status === "active" ? "success" : "warning"}>{student.status}</Badge></div></section>
    <div className="grid gap-4 md:grid-cols-2">
      <Card><CardHeader><h2 className="text-base font-semibold">Basic information</h2></CardHeader><CardContent className="space-y-3 text-sm"><p><span className="text-slate-500">Date of birth:</span> {student.dob ? new Date(student.dob).toLocaleDateString("en-IN") : "-"}</p><p><span className="text-slate-500">Gender:</span> <span className="capitalize">{student.gender || "-"}</span></p><p><span className="text-slate-500">Blood group:</span> {student.bloodGroup || "-"}</p></CardContent></Card>
      <Card><CardHeader><h2 className="text-base font-semibold">Contact</h2></CardHeader><CardContent className="space-y-3 text-sm"><p><span className="text-slate-500">Phone:</span> {student.phone || "-"}</p><p><span className="text-slate-500">Address:</span> {student.address || "-"}</p><p><span className="text-slate-500">Father:</span> {student.fatherName || "-"}</p><p><span className="text-slate-500">Mother:</span> {student.motherName || "-"}</p></CardContent></Card>
      <Card className="md:col-span-2"><CardHeader><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary-600" aria-hidden="true"/><h2 className="text-base font-semibold">Documents</h2></div></CardHeader><CardContent>{student.documents?.length ? <div className="grid gap-3 sm:grid-cols-2">{student.documents.map((document: any) => <div key={document._id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{document.originalName || document.type}</p><p className="text-xs capitalize text-slate-500">{String(document.type || "document").replace(/_/g, " ")}{document.uploadedAt ? ` · ${new Date(document.uploadedAt).toLocaleDateString("en-IN")}` : ""}</p></div><Button variant="secondary" onClick={() => openDocument(document._id)}><ExternalLink className="mr-1 h-3.5 w-3.5" aria-hidden="true" />Open</Button></div>)}</div> : <p className="text-sm text-slate-500">No documents are available for this student.</p>}</CardContent></Card>
    </div>
  </div>;
}
