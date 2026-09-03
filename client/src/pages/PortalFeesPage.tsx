import { useQuery } from "@tanstack/react-query";
import { CreditCard, IndianRupee, Receipt } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import api from "../lib/api";
import { formatCurrency, formatDate } from "../utils";
import { useAuth } from "../hooks";

const statusVariant: Record<string, "success" | "warning" | "danger" | "info" | "secondary"> = { paid: "success", partial: "warning", overdue: "danger", pending: "info", waived: "secondary" };

export default function PortalFeesPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const childId = params.get("childId") || "";
  const isParent = user?.role === "parent";
  const { data, isLoading, isError } = useQuery({ queryKey: ["portal-fees", user?.role, childId], queryFn: async () => (await api.get(`/portal/fees${isParent && childId ? `?childId=${encodeURIComponent(childId)}` : ""}`)).data });
  if (isLoading) return <div className="space-y-4"><div className="h-8 w-40 animate-pulse rounded bg-slate-200" /><div className="h-32 animate-pulse rounded-2xl bg-slate-200" /><div className="h-64 animate-pulse rounded-2xl bg-slate-200" /></div>;
  if (isError) return <Card><CardContent className="py-10 text-center"><p className="font-semibold">Fees are unavailable right now.</p><p className="mt-1 text-sm text-slate-500">Please try again shortly.</p></CardContent></Card>;
  const student = data?.students?.[0]; const fees = data?.fees || []; const summary = data?.summary || { totalDue: 0, paid: 0, balance: 0, overdue: 0 };
  return <div className="space-y-6">
    <header><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-600">Payments</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Fees</h1><p className="mt-1 text-sm text-slate-500">View current fee dues and payment history.</p>{student && <p className="mt-3 text-sm font-medium text-slate-700">{student.firstName} {student.lastName} · {student.class}{student.section ? ` · ${student.section}` : ""}</p>}</header>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Total due", summary.totalDue, IndianRupee], ["Paid", summary.paid, Receipt], ["Balance", summary.balance, CreditCard], ["Overdue", summary.overdue, CreditCard]].map(([label, value, Icon]: any) => <Card key={label as string}><CardContent className="flex items-center gap-3 p-5"><div className="rounded-xl bg-slate-100 p-2.5"><Icon className="h-5 w-5 text-slate-600" aria-hidden="true" /></div><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-slate-950">{formatCurrency(value)}</p></div></CardContent></Card>)}</div>
    {fees.length === 0 ? <Card><CardContent className="py-12 text-center"><CreditCard className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 font-semibold">No fee records yet</p><p className="mt-1 text-sm text-slate-500">Fee records will appear here when the school publishes them.</p></CardContent></Card> : <Card><CardHeader><h2 className="font-semibold">Fee records</h2></CardHeader><CardContent><div className="divide-y divide-slate-100">{fees.map((fee: any) => <div key={fee._id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-900 capitalize">{fee.feeStructureId?.feeType || "Fee"}</p><Badge variant={statusVariant[fee.status] || "secondary"}>{fee.status}</Badge></div><p className="mt-1 text-sm text-slate-500">{fee.academicYear?.name || "Academic year"}{fee.feeStructureId?.dueDate ? ` · Due ${formatDate(fee.feeStructureId.dueDate)}` : ""}</p></div><div className="text-left sm:text-right"><p className="font-bold text-slate-900">{formatCurrency(fee.balance)}</p><p className="text-xs text-slate-500">of {formatCurrency(fee.totalDue)} remaining</p></div></div>)}</div></CardContent></Card>}
    <p className="text-xs text-slate-400">Payments are collected by the school. This portal is read-only.</p>
  </div>;
}
