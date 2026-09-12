import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, UserPlus, Unlink, Loader2 } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Badge } from "../ui/Badge";
import api from "../../lib/api";

export type StudentSibling = {
  _id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  classId?: { _id: string; displayName?: string } | string;
  sectionId?: { _id: string; name?: string } | string;
  status?: string;
};

export default function StudentSiblingsPanel({ studentId, editable = true }: { studentId?: string; editable?: boolean }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [relationship, setRelationship] = useState<"sibling" | "half_sibling">("sibling");
  const [error, setError] = useState("");
  const enabled = Boolean(studentId);

  const siblingsQuery = useQuery({
    queryKey: ["student", studentId, "siblings"],
    queryFn: async () => (await api.get(`/students/${studentId}/siblings`)).data,
    enabled,
  });

  const studentsQuery = useQuery({
    queryKey: ["students", "sibling-picker", search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: "1", limit: "10" });
      if (search.trim()) params.set("search", search.trim());
      return (await api.get(`/students?${params}`)).data;
    },
    enabled: enabled && editable && search.trim().length >= 2,
  });

  const linkMutation = useMutation({
    mutationFn: async (siblingId: string) => (await api.post(`/students/${studentId}/siblings`, { siblingId, relationship })).data,
    onSuccess: async () => {
      setSearch("");
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["student", studentId, "siblings"] });
    },
    onError: (err: any) => setError(err?.response?.data?.message || "Unable to link this sibling."),
  });

  const unlinkMutation = useMutation({
    mutationFn: async (siblingId: string) => (await api.delete(`/students/${studentId}/siblings/${siblingId}`)).data,
    onSuccess: async () => {
      setError("");
      await queryClient.invalidateQueries({ queryKey: ["student", studentId, "siblings"] });
    },
    onError: (err: any) => setError(err?.response?.data?.message || "Unable to unlink this sibling."),
  });

  const siblings: StudentSibling[] = siblingsQuery.data?.siblings ?? siblingsQuery.data?.data ?? [];
  const linkedIds = useMemo(() => new Set(siblings.map((s) => s._id)), [siblings]);
  const candidates: StudentSibling[] = (studentsQuery.data?.data ?? []).filter((s: StudentSibling) => s._id !== studentId && !linkedIds.has(s._id));

  if (!studentId) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
        Save the student first to manage sibling relationships.
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><Users className="h-4 w-4 text-sky-600" /><h3 className="font-bold text-slate-900">Siblings</h3></div>
          <p className="mt-1 text-xs leading-5 text-slate-500">Link students from the same school family. This relationship is school-scoped and audited.</p>
        </div>
        <Badge variant="info">{siblings.length}</Badge>
      </div>

      {editable && (
        <div className="mt-4 grid gap-2 md:grid-cols-[1fr_160px_auto]">
          <Input aria-label="Search student to link as sibling" placeholder="Search student by name or admission no…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select aria-label="Sibling relationship" value={relationship} onChange={(e) => setRelationship(e.target.value as typeof relationship)}>
            <option value="sibling">Sibling</option>
            <option value="half_sibling">Half sibling</option>
          </Select>
          <Button type="button" variant="outline" disabled={!candidates[0] || linkMutation.isPending} onClick={() => candidates[0] && linkMutation.mutate(candidates[0]._id)}>
            {linkMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}Link
          </Button>
        </div>
      )}

      {search.trim().length >= 2 && editable && candidates.length > 0 && (
        <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {candidates.map((candidate) => <button key={candidate._id} type="button" className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-white" onClick={() => linkMutation.mutate(candidate._id)}>
            <span><span className="font-semibold text-slate-900">{candidate.firstName} {candidate.lastName}</span><span className="ml-2 text-xs text-slate-500">{candidate.admissionNo}</span></span>
            <UserPlus className="h-4 w-4 text-sky-600" />
          </button>)}
        </div>
      )}

      {error && <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{error}</p>}
      {siblingsQuery.isLoading ? <div className="mt-4 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading siblings…</div> : siblings.length === 0 ? <p className="mt-4 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-500">No siblings linked yet.</p> : <div className="mt-4 space-y-2">{siblings.map((sibling) => <div key={sibling._id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{sibling.firstName} {sibling.lastName}</p><p className="mt-0.5 text-xs text-slate-500">{sibling.admissionNo} · {typeof sibling.classId === "object" ? sibling.classId?.displayName || "Class" : "Class"}{typeof sibling.sectionId === "object" && sibling.sectionId?.name ? ` · ${sibling.sectionId.name}` : ""}</p></div>{editable && <Button type="button" variant="ghost" size="sm" disabled={unlinkMutation.isPending} onClick={() => unlinkMutation.mutate(sibling._id)} aria-label={`Unlink ${sibling.firstName} ${sibling.lastName}`}><Unlink className="h-4 w-4" /></Button>}</div>)}</div>}
    </section>
  );
}
