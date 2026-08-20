import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArchiveRestore, Clock3, Search, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import api from "../lib/api";

export default function DocumentRecoveryPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["students", "document-recovery"],
    queryFn: async () => (await api.get("/students?limit=100")).data
  });

  const students: any[] = useMemo(() => {
    const candidates = [data?.students, data?.data?.students, data?.data, data?.results];
    return candidates.find(Array.isArray) || [];
  }, [data]);

  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return students;
    return students.filter((student) => [student.firstName, student.lastName, student.admissionNo, student.phone]
      .filter(Boolean)
      .some((item) => String(item).toLowerCase().includes(value)));
  }, [students, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-primary-50 p-3 text-primary-700"><ArchiveRestore className="h-7 w-7" /></div>
          <div>
            <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold text-gray-900">Document Recovery</h1><Badge variant="info"><ShieldCheck className="mr-1 h-4 w-4" />Admin recovery center</Badge></div>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Select a student to review deleted and archived document versions. Available recovery copies expire automatically after 60 days.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500"><Clock3 className="h-4 w-4" />60-day recovery window</div>
      </div>

      <Card>
        <CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-semibold">Select Student</h2><p className="text-sm text-gray-500">Open a student's document history and restore the exact version you need.</p></div><div className="relative w-full sm:w-80"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or admission no." className="w-full rounded-md border py-2 pl-9 pr-3 text-sm outline-none focus:border-primary-500" /></div></div></CardHeader>
        <CardContent>
          {isLoading ? <div className="py-12 text-center text-sm text-gray-500">Loading students...</div> : isError ? <div className="py-12 text-center text-sm text-red-600">Unable to load students for recovery.</div> : filtered.length === 0 ? <div className="py-12 text-center"><UserRound className="mx-auto h-10 w-10 text-gray-300" /><p className="mt-3 font-medium">No matching students</p><p className="mt-1 text-sm text-gray-500">Try a different name or admission number.</p></div> : <div className="divide-y">{filtered.map((student) => <div key={student._id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-medium text-gray-900">{student.firstName} {student.lastName}</p><p className="mt-1 text-sm text-gray-500">Admission No. {student.admissionNo || "-"}{student.classId?.displayName ? ` · ${student.classId.displayName}` : ""}</p></div><Button type="button" variant="outline" onClick={() => navigate(`/students/${student._id}/document-recovery`)}><ArchiveRestore className="mr-2 h-4 w-4" />Open Recovery History</Button></div>)}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
