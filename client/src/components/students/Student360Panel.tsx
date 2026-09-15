import { useEffect, useState } from "react";
import api from "../../lib/api";

type Data = any;

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return <div className="rounded-xl border bg-card p-4"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 text-xl font-semibold">{value}</div>{hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}</div>;
}

export default function Student360Panel({ studentId }: { studentId?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { if (!studentId) return; let active = true; setError(""); api.get(`/students/${studentId}/360`).then((r) => active && setData(r.data)).catch((e) => active && setError(e?.response?.data?.message || "Unable to load Student 360")); return () => { active = false; }; }, [studentId]);
  if (!studentId) return null;
  if (error) return <section className="rounded-xl border p-4 text-sm text-muted-foreground">{error}</section>;
  if (!data) return <section className="rounded-xl border p-4 text-sm text-muted-foreground">Loading Student 360…</section>;
  const a = data.attendance?.summary ?? {};
  return <section className="space-y-4 rounded-2xl border bg-card p-4 md:p-5">
    <div><h2 className="text-lg font-semibold">Student 360</h2><p className="text-sm text-muted-foreground">One operational view over existing student, family, attendance, academic, homework and lifecycle records.</p></div>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><Stat label="Attendance" value={a.percentage == null ? "—" : `${a.percentage}%`} hint={`${a.present ?? 0} present · ${a.absent ?? 0} absent`} /><Stat label="Published results" value={data.academics?.publishedResultCount ?? 0} hint={data.academics?.averagePercentage == null ? "No published results" : `Average ${data.academics.averagePercentage}%`} /><Stat label="Homework" value={data.homework?.items?.length ?? 0} hint={`${data.homework?.upcomingCount ?? 0} upcoming`} /><Stat label="Parents" value={data.parents?.length ?? 0} hint={`${data.siblings?.length ?? 0} sibling(s)`} /></div>
    <div className="grid gap-4 md:grid-cols-2">
      <div><h3 className="mb-2 font-medium">Recent attendance</h3><div className="space-y-1">{(data.attendance?.recent ?? []).slice(0, 8).map((r: any, i: number) => <div key={`${r.date}-${i}`} className="flex justify-between rounded-lg border px-3 py-2 text-sm"><span>{new Date(r.date).toLocaleDateString()}</span><span className="capitalize">{r.status ?? "—"}</span></div>)}{!data.attendance?.recent?.length && <p className="text-sm text-muted-foreground">No attendance records.</p>}</div></div>
      <div><h3 className="mb-2 font-medium">Latest academic results</h3><div className="space-y-1">{(data.academics?.results ?? []).slice(0, 5).map((r: any) => <div key={r._id} className="flex justify-between rounded-lg border px-3 py-2 text-sm"><span>{r.grade} · {r.result}</span><span>{r.percentage}%</span></div>)}{!data.academics?.results?.length && <p className="text-sm text-muted-foreground">No published results.</p>}</div></div>
    </div>
    <div><h3 className="mb-2 font-medium">Parents & family</h3><div className="flex flex-wrap gap-2">{(data.parents ?? []).map((p: any) => <span key={p._id} className="rounded-full border px-3 py-1 text-sm">{[p.firstName, p.lastName].filter(Boolean).join(" ") || p.email}</span>)}{(data.siblings ?? []).map((s: any) => <span key={s._id} className="rounded-full border px-3 py-1 text-sm">Sibling: {s.firstName} {s.lastName}</span>)}{!data.parents?.length && !data.siblings?.length && <span className="text-sm text-muted-foreground">No linked family records.</span>}</div></div>
  </section>;
}
