import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { UserRound } from "lucide-react";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import api from "../lib/api";
import { useAuth } from "../hooks";

export default function PortalStudentsPage() {
  const { user } = useAuth();
  const isParent = user?.role === "parent";
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["portal", "students", user?.role],
    queryFn: async () => (await api.get("/students?page=1&limit=50")).data,
  });
  const students = data?.data ?? [];

  return <div className="space-y-6">
    <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">{isParent ? "Family" : "My students"}</p><h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{isParent ? "Linked children" : "Students you work with"}</h1><p className="mt-1 text-sm text-slate-500">{isParent ? "Only children linked to your account are shown." : "Only students within your authorized school assignment are shown."}</p></div>
    <Card><CardHeader><h2 className="text-base font-semibold text-slate-900">{isParent ? "Children" : "Students"}</h2></CardHeader><CardContent>{isLoading ? <p className="py-10 text-center text-sm text-slate-500">Loading students...</p> : isError ? <div className="py-10 text-center"><p className="text-sm font-medium text-red-600">Unable to load students.</p><Button variant="outline" className="mt-3" onClick={() => refetch()}>Try again</Button></div> : students.length === 0 ? <div className="py-10 text-center"><UserRound className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 font-medium text-slate-800">No students found</p><p className="mt-1 text-sm text-slate-500">There are no students available for this account yet.</p></div> : <div className="divide-y divide-slate-100">{students.map((student: any) => <div key={student._id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700"><UserRound className="h-5 w-5" aria-hidden="true" /></div><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{student.firstName} {student.lastName}</p><p className="text-sm text-slate-500">{student.admissionNo} · {student.classId?.displayName || "Class not assigned"}{student.sectionId?.name ? ` · ${student.sectionId.name}` : ""}</p></div></div><div className="flex items-center gap-3"><Badge variant={student.status === "active" ? "success" : "warning"}>{student.status}</Badge><Link to={`/students/${student._id}`} className="text-sm font-semibold text-primary-700 hover:text-primary-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2">View</Link></div></div>)}</div>}</CardContent></Card>
  </div>;
}
