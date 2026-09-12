import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, ReceiptText, Loader2 } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Badge } from "../ui/Badge";
import { Modal } from "../ui/Modal";
import api from "../../lib/api";
import { formatCurrency, formatDate } from "../../utils";

const categories = ["tuition", "admission", "exam", "transport", "uniform", "books", "activity", "other"] as const;
type Adjustment = "discount" | "waiver" | "surcharge" | "amount_override";

export default function StudentFeeManagementPanel({ studentId, editable = true }: { studentId?: string; editable?: boolean }) {
  const queryClient = useQueryClient();
  const [itemOpen, setItemOpen] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<any>(null);
  const [form, setForm] = useState({ name: "", code: "", category: "tuition", amount: "", dueDate: "" });
  const [adjustment, setAdjustment] = useState<{ type: Adjustment; amount: string; reason: string }>({ type: "discount", amount: "", reason: "" });
  const [error, setError] = useState("");
  const enabled = Boolean(studentId);
  const headsQuery = useQuery({ queryKey: ["feeHeads"], queryFn: async () => (await api.get("/fees/heads")).data, enabled: editable });
  const itemsQuery = useQuery({ queryKey: ["studentFeeItems", studentId], queryFn: async () => (await api.get(`/fees/student/${studentId}/items`)).data, enabled });
  const heads = headsQuery.data?.data ?? headsQuery.data?.heads ?? [];
  const items = itemsQuery.data?.data ?? itemsQuery.data?.items ?? [];
  const totals = useMemo(() => items.reduce((a: any, i: any) => ({ due: a.due + Number(i.totalDue || 0), paid: a.paid + Number(i.paidAmount || 0), balance: a.balance + Number(i.balance || 0) }), { due: 0, paid: 0, balance: 0 }), [items]);

  const createHead = useMutation({
    mutationFn: () => api.post("/fees/heads", { name: form.name, code: form.code, category: form.category, isActive: true }),
    onSuccess: async () => { setItemOpen(false); setForm({ name: "", code: "", category: "tuition", amount: "", dueDate: "" }); setError(""); await queryClient.invalidateQueries({ queryKey: ["feeHeads"] }); },
    onError: (e: any) => setError(e?.response?.data?.message || "Unable to create fee head."),
  });
  const createItem = useMutation({
    mutationFn: async () => { const head = heads.find((h: any) => h._id === form.code || h.code === form.code); if (!head) throw new Error("Select a fee head first."); return api.post("/fees/items", { studentId, feeHeadId: head._id, label: head.name, amount: Number(form.amount), dueDate: form.dueDate || undefined, academicYear: head.academicYear }); },
    onSuccess: async () => { setItemOpen(false); setError(""); await queryClient.invalidateQueries({ queryKey: ["studentFeeItems", studentId] }); },
    onError: (e: any) => setError(e?.response?.data?.message || e?.message || "Unable to create fee item."),
  });
  const adjustItem = useMutation({
    mutationFn: () => api.patch(`/fees/items/${adjustTarget._id}/adjust`, { type: adjustment.type, amount: Number(adjustment.amount), reason: adjustment.reason }),
    onSuccess: async () => { setAdjustTarget(null); setAdjustment({ type: "discount", amount: "", reason: "" }); setError(""); await queryClient.invalidateQueries({ queryKey: ["studentFeeItems", studentId] }); },
    onError: (e: any) => setError(e?.response?.data?.message || "Unable to adjust this fee item."),
  });

  if (!studentId) return null;
  return <>
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><ReceiptText className="h-4 w-4 text-sky-600" /><h3 className="font-bold text-slate-900">Custom fee breakdown</h3></div><p className="mt-1 text-xs leading-5 text-slate-500">Itemize tuition, exam, admission, uniform and other charges per student.</p></div>{editable && <Button size="sm" onClick={() => { setItemOpen(true); setError(""); }}><Plus className="mr-2 h-4 w-4" />Add fee item</Button>}</div>
      <div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Due</p><p className="mt-1 font-bold text-slate-900">{formatCurrency(totals.due)}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Paid</p><p className="mt-1 font-bold text-emerald-700">{formatCurrency(totals.paid)}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Balance</p><p className="mt-1 font-bold text-amber-700">{formatCurrency(totals.balance)}</p></div></div>
      {itemsQuery.isLoading ? <div className="mt-4 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading fee items…</div> : items.length === 0 ? <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">No itemized fees have been added for this student.</p> : <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-400"><th className="px-2 py-2">Fee head</th><th className="px-2 py-2">Amount</th><th className="px-2 py-2">Discount</th><th className="px-2 py-2">Balance</th><th className="px-2 py-2">Due</th><th className="px-2 py-2">Action</th></tr></thead><tbody>{items.map((item: any) => <tr key={item._id} className="border-b border-slate-100"><td className="px-2 py-3"><p className="font-semibold text-slate-900">{item.label || item.feeHeadId?.name || "Fee"}</p><p className="text-xs text-slate-500">{item.feeHeadId?.category || "other"}</p></td><td className="px-2 py-3">{formatCurrency(item.amount)}</td><td className="px-2 py-3 text-emerald-700">{formatCurrency(item.discount || 0)}</td><td className="px-2 py-3 font-bold">{formatCurrency(item.balance)}</td><td className="px-2 py-3">{item.dueDate ? formatDate(item.dueDate) : "—"}</td><td className="px-2 py-3">{editable && <Button size="sm" variant="ghost" disabled={Number(item.paidAmount) > 0} onClick={() => { setAdjustTarget(item); setError(""); }}><Pencil className="mr-1.5 h-3.5 w-3.5" />Adjust</Button>}{Number(item.paidAmount) > 0 && <Badge variant="secondary">Paid/partial</Badge>}</td></tr>)}</tbody></table></div>}
    </section>

    <Modal isOpen={itemOpen} onClose={() => !createItem.isPending && !createHead.isPending && setItemOpen(false)} title="Add custom fee" size="md">
      <div className="space-y-4"><div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">Create or reuse a fee head, then add an amount for this student. Student-specific changes are audited.</div><Select label="Fee head" value={form.code} onChange={(e) => setForm((v) => ({ ...v, code: e.target.value }))}><option value="">Select fee head</option>{heads.map((h: any) => <option key={h._id} value={h._id}>{h.name} · {h.category}</option>)}</Select><div className="grid gap-3 sm:grid-cols-2"><Input label="Amount" type="number" min="0" value={form.amount} onChange={(e) => setForm((v) => ({ ...v, amount: e.target.value }))} /><Input label="Due date" type="date" value={form.dueDate} onChange={(e) => setForm((v) => ({ ...v, dueDate: e.target.value }))} /></div><div className="border-t border-slate-200 pt-4"><p className="mb-2 text-sm font-bold text-slate-900">Need a new fee head?</p><div className="grid gap-3 sm:grid-cols-2"><Input label="Name" placeholder="e.g. Annual activity" value={form.name} onChange={(e) => setForm((v) => ({ ...v, name: e.target.value }))} /><Input label="Code" placeholder="ACTIVITY" value={form.code} onChange={(e) => setForm((v) => ({ ...v, code: e.target.value.toUpperCase() }))} /><Select label="Category" value={form.category} onChange={(e) => setForm((v) => ({ ...v, category: e.target.value }))}>{categories.map((c) => <option key={c} value={c}>{c}</option>)}</Select><div className="flex items-end"><Button type="button" variant="outline" className="w-full" disabled={!form.name || !form.code || createHead.isPending} onClick={() => createHead.mutate()}>Create head</Button></div></div></div>{error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">{error}</p>}<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setItemOpen(false)}>Cancel</Button><Button disabled={!form.code || !form.amount || createItem.isPending} onClick={() => createItem.mutate()}>{createItem.isPending ? "Adding…" : "Add fee"}</Button></div></div>
    </Modal>
    <Modal isOpen={Boolean(adjustTarget)} onClose={() => !adjustItem.isPending && setAdjustTarget(null)} title="Adjust student fee" size="md"><div className="space-y-4"><p className="text-sm text-slate-500">Changes to an unpaid item are recorded with the actor, reason and before/after values.</p><Select label="Adjustment" value={adjustment.type} onChange={(e) => setAdjustment((v) => ({ ...v, type: e.target.value as Adjustment }))}><option value="discount">Discount</option><option value="waiver">Waiver</option><option value="surcharge">Surcharge</option><option value="amount_override">Amount override</option></Select><Input label="Amount" type="number" min="0" value={adjustment.amount} onChange={(e) => setAdjustment((v) => ({ ...v, amount: e.target.value }))} /><Input label="Reason (required)" value={adjustment.reason} onChange={(e) => setAdjustment((v) => ({ ...v, reason: e.target.value }))} placeholder="e.g. sibling concession" />{error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700" role="alert">{error}</p>}<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setAdjustTarget(null)}>Cancel</Button><Button disabled={!adjustment.amount || !adjustment.reason.trim() || adjustItem.isPending} onClick={() => adjustItem.mutate()}>{adjustItem.isPending ? "Saving…" : "Save adjustment"}</Button></div></div></Modal>
  </>;
}
