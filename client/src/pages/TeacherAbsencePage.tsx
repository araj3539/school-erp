import { useEffect, useState } from "react";
import api from "../lib/api";

type Absence = { _id: string; date: string; status: string; teacherId: { firstName: string; lastName: string; employeeId: string }; affectedTimetableIds: string[]; assignments: Array<{ timetableId: string; substituteTeacherId: { firstName: string; lastName: string } }> };
type Period = { _id: string; periodLabel?: string; startTime: string; endTime: string; classId?: { name: string }; sectionId?: { name: string }; subjectId?: { name: string } };
type Teacher = { _id: string; firstName: string; lastName: string; employeeId: string };

export default function TeacherAbsencePage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selected, setSelected] = useState<{ absence: Absence; periods: Period[] } | null>(null);
  const [eligible, setEligible] = useState<Record<string, Teacher[]>>({});
  const [teacherId, setTeacherId] = useState("");
  const [loading, setLoading] = useState(false);
  const load = async () => { setLoading(true); try { const [a, t] = await Promise.all([api.get(`/teacher-absences?date=${date}`), api.get("/teachers?status=active&limit=100")]); setAbsences(a.data.data || []); setTeachers(t.data.data || []); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [date]);
  const open = async (absence: Absence) => { const r = await api.get(`/teacher-absences/${absence._id}`); setEligible({}); setSelected(r.data); };
  const report = async () => { if (!teacherId) return; await api.post("/teacher-absences", { teacherId, date }); setTeacherId(""); await load(); };
  const loadEligible = async (periodId: string) => { const r = await api.get(`/teacher-absences/${selected!.absence._id}/eligible-substitutes?timetableId=${periodId}`); setEligible((x) => ({ ...x, [periodId]: r.data.data || [] })); };
  const assign = async (periodId: string, substituteTeacherId: string) => { await api.post(`/teacher-absences/${selected!.absence._id}/assign`, { timetableId: periodId, substituteTeacherId }); await open(selected!.absence); await load(); };
  return <div className="space-y-6 p-4 md:p-6">
    <header><h1 className="text-2xl font-semibold">Teacher Absence & Substitutions</h1><p className="text-sm text-muted-foreground">Record absences, see affected periods, and assign conflict-free substitutes.</p></header>
    <section className="rounded-xl border p-4 space-y-3"><div className="flex flex-col gap-2 sm:flex-row"><input className="rounded border px-3 py-2" type="date" value={date} onChange={e => setDate(e.target.value)} /><select className="rounded border px-3 py-2 flex-1" value={teacherId} onChange={e => setTeacherId(e.target.value)}><option value="">Select absent teacher</option>{teachers.map(t => <option key={t._id} value={t._id}>{t.firstName} {t.lastName} ({t.employeeId})</option>)}</select><button className="rounded bg-primary px-4 py-2 text-primary-foreground" onClick={report} disabled={!teacherId}>Report absence</button></div></section>
    {loading ? <p>Loading…</p> : <section className="space-y-2">{absences.length === 0 ? <p className="text-sm text-muted-foreground">No absences recorded for this date.</p> : absences.map(a => <button key={a._id} onClick={() => open(a)} className="w-full rounded-xl border p-4 text-left hover:bg-muted/40"><div className="flex justify-between gap-3"><span className="font-medium">{a.teacherId.firstName} {a.teacherId.lastName}</span><span className="text-sm">{a.status}</span></div><p className="text-sm text-muted-foreground">{a.affectedTimetableIds.length} affected period(s) · {a.assignments.length} assigned</p></button>)}</section>}
    {selected && <section className="rounded-xl border p-4 space-y-4"><div className="flex justify-between"><h2 className="font-semibold">Affected periods</h2><button onClick={() => setSelected(null)}>Close</button></div>{selected.periods.length === 0 ? <p className="text-sm text-muted-foreground">No timetable periods found.</p> : selected.periods.map(p => <div key={p._id} className="rounded-lg border p-3"><div className="font-medium">{p.periodLabel || "Period"} · {p.startTime}–{p.endTime}</div><div className="text-sm text-muted-foreground">{p.subjectId?.name || "Subject"} · {p.classId?.name || "Class"}{p.sectionId?.name ? ` · ${p.sectionId.name}` : ""}</div>{!selected.absence.assignments.some(a => a.timetableId === p._id) ? <div className="mt-2 flex flex-wrap gap-2">{!eligible[p._id] ? <button className="rounded border px-3 py-1" onClick={() => loadEligible(p._id)}>Find available teachers</button> : eligible[p._id].length ? eligible[p._id].map(t => <button key={t._id} className="rounded border px-3 py-1" onClick={() => assign(p._id, t._id)}>{t.firstName} {t.lastName}</button>) : <span className="text-sm text-muted-foreground">No conflict-free teacher available.</span>}</div> : <p className="mt-2 text-sm">Substitute assigned.</p>}</div>)}</section>}
  </div>;
}
