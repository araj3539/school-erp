import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import api from "../lib/api";

const stages = ["enquiry", "contacted", "visit", "application", "documents", "assessment", "accepted", "rejected", "converted"];
export default function AdmissionEnquiriesPage() {
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const [form, setForm] = useState({ studentName: "", guardianName: "", phone: "", email: "", source: "", notes: "" });
  const query = useQuery({ queryKey: ["admissions", search, stage], queryFn: async () => (await api.get(`/admissions/enquiries?${new URLSearchParams({ ...(search ? { search } : {}), ...(stage ? { stage } : {}) })}`)).data });
  const create = useMutation({ mutationFn: async (body: any) => (await api.post("/admissions/enquiries", body)).data, onSuccess: () => { setForm({ studentName: "", guardianName: "", phone: "", email: "", source: "", notes: "" }); client.invalidateQueries({ queryKey: ["admissions"] }); } });
  const submit = (event: FormEvent) => { event.preventDefault(); create.mutate(form); };
  return <div className="space-y-6"><header><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Admissions</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Enquiry pipeline</h1><p className="mt-2 text-sm text-slate-600">Track prospective students from first enquiry through assessment and conversion without building a second student record.</p></header>
    <Card><CardHeader><h2 className="font-semibold text-slate-900">New enquiry</h2></CardHeader><CardContent><form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Input required placeholder="Student name" value={form.studentName} onChange={e => setForm({ ...form, studentName: e.target.value })} /><Input required placeholder="Guardian name" value={form.guardianName} onChange={e => setForm({ ...form, guardianName: e.target.value })} /><Input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /><Input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /><Input placeholder="Source" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} /><Input placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /><Button type="submit" disabled={create.isPending}>{create.isPending ? "Saving..." : "Add enquiry"}</Button></form></CardContent></Card>
    <div className="flex flex-col gap-3 sm:flex-row"><Input placeholder="Search student, guardian or phone" value={search} onChange={e => setSearch(e.target.value)} /><select value={stage} onChange={e => setStage(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">All stages</option>{stages.map(item => <option key={item} value={item}>{item}</option>)}</select></div>
    <div className="grid gap-4 lg:grid-cols-2">{(query.data ?? []).map((item: any) => <Card key={item._id}><CardContent className="space-y-3 p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{item.studentName}</p><p className="text-sm text-slate-500">{item.guardianName}{item.phone ? ` · ${item.phone}` : ""}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold capitalize text-slate-700">{item.stage}</span></div><div className="text-xs text-slate-500">{item.source ? `Source: ${item.source}` : "Source not recorded"}{item.followUpAt ? ` · Follow up ${new Date(item.followUpAt).toLocaleDateString()}` : ""}</div><select value={item.stage} onChange={e => client.setQueryData(["admissions", search, stage], (rows: any[]) => rows?.map(row => row._id === item._id ? { ...row, stage: e.target.value } : row))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" aria-label={`Stage for ${item.studentName}`}>{stages.map(value => <option key={value} value={value}>{value}</option>)}</select></CardContent></Card>)}</div>
  </div>;
}
