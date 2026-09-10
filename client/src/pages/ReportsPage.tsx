import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Table } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/Tabs";
import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock3,
  Download,
  DollarSign,
  FileBarChart,
  Search,
  Users,
  XCircle,
} from "lucide-react";
import api from "../lib/api";
import { formatCurrency, formatDate } from "../utils";

const reportTabs = [
  { value: "students", label: "Students", icon: Users },
  { value: "attendance", label: "Attendance", icon: Activity },
  { value: "fees", label: "Fees", icon: DollarSign },
];

function LoadingState() {
  return <div className="space-y-3" aria-label="Loading report">{[1, 2, 3, 4].map((item) => <div key={item} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}</div>;
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"><p className="font-semibold">We couldn't load this report.</p><p className="mt-1 text-red-700">Refresh the report and try again. Your report filters have been kept.</p><Button className="mt-4" size="sm" variant="outline" onClick={onRetry}>Try again</Button></div>;
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("students");
  const [page, setPage] = useState(1);
  const [studentSearch, setStudentSearch] = useState("");
  const [feeSearch, setFeeSearch] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const studentsQuery = useQuery({ queryKey: ["reports", "students", page, studentSearch], queryFn: async () => { const params = new URLSearchParams({ page: page.toString(), limit: "20" }); if (studentSearch) params.append("search", studentSearch); const res = await api.get(`/reports/students?${params}`); return res.data; } });
  const attendanceQuery = useQuery({ queryKey: ["reports", "attendance", page, dateRange], queryFn: async () => { const params = new URLSearchParams({ page: page.toString(), limit: "20" }); if (dateRange.start) params.append("startDate", dateRange.start); if (dateRange.end) params.append("endDate", dateRange.end); const res = await api.get(`/reports/attendance?${params}`); return res.data; } });
  const feesQuery = useQuery({ queryKey: ["reports", "fees", page, feeSearch], queryFn: async () => { const params = new URLSearchParams({ page: page.toString(), limit: "20" }); if (feeSearch) params.append("search", feeSearch); const res = await api.get(`/reports/fees?${params}`); return res.data; } });

  const students = studentsQuery.data?.data || [];
  const attendance = attendanceQuery.data?.data || [];
  const fees = feesQuery.data?.data || [];
  const attendanceSummary = useMemo(() => { const records = attendance.flatMap((item: any) => item.records || []); const present = records.filter((record: any) => record.status === "present").length; const absent = records.filter((record: any) => record.status === "absent").length; const total = present + absent; return { present, absent, total, rate: total ? Math.round((present / total) * 100) : 0 }; }, [attendance]);
  const feeSummary = useMemo(() => { const totalDue = fees.reduce((sum: number, item: any) => sum + Number(item.totalDue || 0), 0); const paid = fees.reduce((sum: number, item: any) => sum + Number(item.paidAmount || 0), 0); return { totalDue, paid, balance: Math.max(0, totalDue - paid) }; }, [fees]);

  const studentColumns = [
    { key: "admissionNo", header: "Admission No" },
    { key: "firstName", header: "Name", render: (s: any) => <span className="font-medium text-slate-900">{s.firstName} {s.lastName}</span> },
    { key: "classId", header: "Class", render: (s: any) => s.classId?.displayName || "-" },
    { key: "sectionId", header: "Section", render: (s: any) => s.sectionId?.name || "-" },
    { key: "gender", header: "Gender" }, { key: "phone", header: "Phone" },
    { key: "status", header: "Status", render: (s: any) => <Badge variant={s.status === "active" ? "success" : "danger"}>{s.status}</Badge> },
    { key: "admissionDate", header: "Admission Date", render: (s: any) => formatDate(s.admissionDate) },
  ];
  const attendanceColumns = [
    { key: "date", header: "Date", render: (a: any) => formatDate(a.date) }, { key: "classId", header: "Class", render: (a: any) => a.classId?.displayName || "-" },
    { key: "sectionId", header: "Section", render: (a: any) => a.sectionId?.name || "-" }, { key: "total", header: "Total", render: (a: any) => a.records?.length || 0 },
    { key: "present", header: "Present", render: (a: any) => <span className="font-medium text-emerald-700">{a.records?.filter((r: any) => r.status === "present").length || 0}</span> },
    { key: "absent", header: "Absent", render: (a: any) => <span className="font-medium text-red-700">{a.records?.filter((r: any) => r.status === "absent").length || 0}</span> },
  ];
  const feeColumns = [
    { key: "studentId", header: "Student", render: (f: any) => <span className="font-medium text-slate-900">{f.studentId?.firstName} {f.studentId?.lastName}</span> },
    { key: "feeStructureId", header: "Fee Type", render: (f: any) => f.feeStructureId?.feeType || "-" }, { key: "totalDue", header: "Total Due", render: (f: any) => formatCurrency(f.totalDue) },
    { key: "paidAmount", header: "Paid", render: (f: any) => formatCurrency(f.paidAmount) }, { key: "balance", header: "Balance", render: (f: any) => formatCurrency(f.balance) },
    { key: "status", header: "Status", render: (f: any) => <Badge variant={f.status === "paid" ? "success" : f.status === "overdue" ? "danger" : "warning"}>{f.status}</Badge> },
  ];

  const activeQuery = activeTab === "students" ? studentsQuery : activeTab === "attendance" ? attendanceQuery : feesQuery;
  const activeData = activeTab === "students" ? studentsQuery.data : activeTab === "attendance" ? attendanceQuery.data : feesQuery.data;
  const renderPagination = () => { const pagination = activeData?.pagination; if (!pagination || pagination.totalPages <= 1) return null; return <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-slate-500">Page {pagination.page} of {pagination.totalPages} · {pagination.total} total</p><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>Previous</Button><Button variant="outline" size="sm" onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))} disabled={page === pagination.totalPages}>Next</Button></div></div>; };
  const exportReport = (type: string, format: "excel" | "pdf") => { const query = new URLSearchParams({ export: format }); if (type === "attendance") { if (dateRange.start) query.set("startDate", dateRange.start); if (dateRange.end) query.set("endDate", dateRange.end); } window.open(`/api/reports/${type}?${query.toString()}`, "_blank"); };
  const summaryCards = [
    { label: "Students", value: studentsQuery.data?.pagination?.total ?? "—", hint: "Student records", icon: Users },
    { label: "Attendance rate", value: `${attendanceSummary.rate}%`, hint: `${attendanceSummary.present} present · ${attendanceSummary.absent} absent`, icon: CheckCircle2 },
    { label: "Collected", value: formatCurrency(feeSummary.paid), hint: `of ${formatCurrency(feeSummary.totalDue)} due in view`, icon: DollarSign },
    { label: "Outstanding", value: formatCurrency(feeSummary.balance), hint: "Current report view", icon: Clock3 },
  ];

  return <div className="space-y-6">
    <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600"><FileBarChart className="h-5 w-5" aria-hidden="true" /></div><p className="text-sm font-semibold uppercase tracking-wider text-primary-600">Insights & reporting</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Reports</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Turn student, attendance, and fee records into focused operational views. Filter the register you need, then export it for sharing or follow-up.</p></div><div className="flex items-center gap-2 text-xs text-slate-500"><Calendar className="h-4 w-4" aria-hidden="true" /> Live report data</div></div></section>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{summaryCards.map(({ label, value, hint, icon: Icon }) => <Card key={label} className="overflow-hidden"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-500">{hint}</p></div><div className="rounded-xl bg-slate-100 p-2.5 text-slate-600"><Icon className="h-5 w-5" aria-hidden="true" /></div></div></CardContent></Card>)}</div>
    <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setPage(1); }} className="space-y-4"><TabsList className="grid h-auto w-full grid-cols-3 rounded-xl bg-slate-100 p-1 sm:flex sm:w-fit">{reportTabs.map(({ value, label, icon: Icon }) => <TabsTrigger key={value} value={value} className="rounded-lg px-3 py-2.5"><Icon className="mr-2 h-4 w-4" aria-hidden="true" />{label}</TabsTrigger>)}</TabsList>
      <TabsContent value="students"><Card><CardHeader><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><h2 className="font-semibold text-slate-950">Student register</h2><p className="mt-1 text-sm text-slate-500">Search admissions and export the current student register.</p></div><div className="flex flex-wrap gap-2"><Input placeholder="Search students..." value={studentSearch} onChange={(e) => { setStudentSearch(e.target.value); setPage(1); }} className="w-full sm:w-64" leftIcon={<Search className="h-4 w-4" />} /><Button variant="outline" onClick={() => exportReport("students", "excel")}><Download className="mr-2 h-4 w-4" />Excel</Button><Button variant="outline" onClick={() => exportReport("students", "pdf")}><Download className="mr-2 h-4 w-4" />PDF</Button></div></div></CardHeader><CardContent>{studentsQuery.isLoading ? <LoadingState /> : studentsQuery.isError ? <ErrorState onRetry={() => studentsQuery.refetch()} /> : <><Table data={students} columns={studentColumns} keyExtractor={(s) => s._id} emptyMessage="No students found for this search." />{renderPagination()}</>}</CardContent></Card></TabsContent>
      <TabsContent value="attendance"><Card><CardHeader><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><h2 className="font-semibold text-slate-950">Attendance register</h2><p className="mt-1 text-sm text-slate-500">Review daily attendance by class and section, with an optional date range.</p></div><div className="flex flex-wrap gap-2"><Input label="From" type="date" value={dateRange.start} onChange={(e) => { setDateRange((current) => ({ ...current, start: e.target.value })); setPage(1); }} className="w-full sm:w-40" /><Input label="To" type="date" value={dateRange.end} onChange={(e) => { setDateRange((current) => ({ ...current, end: e.target.value })); setPage(1); }} className="w-full sm:w-40" /><Button variant="outline" onClick={() => exportReport("attendance", "excel")}><Download className="mr-2 h-4 w-4" />Excel</Button></div></div></CardHeader><CardContent>{attendanceQuery.isLoading ? <LoadingState /> : attendanceQuery.isError ? <ErrorState onRetry={() => attendanceQuery.refetch()} /> : <><div className="mb-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Records</p><p className="mt-1 text-xl font-bold text-slate-950">{attendanceSummary.total}</p></div><div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Present</p><p className="mt-1 text-xl font-bold text-emerald-800">{attendanceSummary.present}</p></div><div className="rounded-xl bg-red-50 p-4"><p className="text-xs font-medium uppercase tracking-wide text-red-700">Absent</p><p className="mt-1 text-xl font-bold text-red-800">{attendanceSummary.absent}</p></div></div><Table data={attendance} columns={attendanceColumns} keyExtractor={(a) => a._id} emptyMessage="No attendance records found for this range." />{renderPagination()}</>}</CardContent></Card></TabsContent>
      <TabsContent value="fees"><Card><CardHeader><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><h2 className="font-semibold text-slate-950">Fee collection register</h2><p className="mt-1 text-sm text-slate-500">Find fee balances and export collection data for reconciliation.</p></div><div className="flex flex-wrap gap-2"><Input placeholder="Search students or fees..." value={feeSearch} onChange={(e) => { setFeeSearch(e.target.value); setPage(1); }} className="w-full sm:w-64" leftIcon={<Search className="h-4 w-4" />} /><Button variant="outline" onClick={() => exportReport("fees", "excel")}><Download className="mr-2 h-4 w-4" />Excel</Button><Button variant="outline" onClick={() => exportReport("fees", "pdf")}><Download className="mr-2 h-4 w-4" />PDF</Button></div></div></CardHeader><CardContent>{feesQuery.isLoading ? <LoadingState /> : feesQuery.isError ? <ErrorState onRetry={() => feesQuery.refetch()} /> : <><Table data={fees} columns={feeColumns} keyExtractor={(f) => f._id} emptyMessage="No fee records found for this search." />{renderPagination()}</>}</CardContent></Card></TabsContent>
    </Tabs>
    {activeQuery.isFetching && !activeQuery.isLoading ? <p className="text-center text-xs text-slate-400">Updating report…</p> : null}
    {activeTab === "attendance" && attendanceSummary.absent > 0 ? <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><XCircle className="h-4 w-4" aria-hidden="true" />Attendance includes absent records; review exceptions before exporting.</div> : null}
  </div>;
}
