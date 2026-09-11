import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { SpotlightCard } from "../components/motion/SpotlightCard";
import { SpringNumber } from "../components/motion/SpringNumber";
import api from "../lib/api";
import { formatCurrency } from "../utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, UserCheck, Building2, DollarSign, Calendar, TrendingUp, Cake, UserRound, ArrowUpRight } from "lucide-react";

function MetricCard({ title, value, icon, tone, isLoading, formatter }: { title: string; value: number; icon: React.ReactNode; tone: string; isLoading: boolean; formatter?: (value: number) => string }) {
  return <SpotlightCard className="h-full">
    <Card className="h-full border-0 shadow-none">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{title}</p>
            {isLoading ? <div className="mt-3 h-9 w-24 animate-pulse rounded-lg bg-slate-200" aria-hidden="true" /> : <p className="mt-2 truncate text-2xl font-extrabold tracking-[-0.03em] text-slate-950 sm:text-[28px]"><SpringNumber value={value} formatter={formatter} /></p>}
            {!isLoading && <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400"><ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />Live school snapshot</div>}
          </div>
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset ring-black/[0.03] ${tone}`} aria-hidden="true">{icon}</div>
        </div>
      </CardContent>
    </Card>
  </SpotlightCard>;
}

function ChartEmptyState({ message }: { message: string }) {
  return <div className="flex h-full min-h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 text-center text-sm font-medium text-slate-500">{message}</div>;
}

const feeStatusVariant = (status: string) => status === "paid" ? "success" : status === "overdue" ? "danger" : "warning";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ["dashboard", "stats"], queryFn: async () => (await api.get("/dashboard/stats")).data });
  const { data: charts, isLoading: chartsLoading } = useQuery({ queryKey: ["dashboard", "charts"], queryFn: async () => (await api.get("/dashboard/charts")).data });
  const { data: birthdays, isLoading: birthdaysLoading } = useQuery({ queryKey: ["dashboard", "birthdays"], queryFn: async () => (await api.get("/dashboard/birthdays")).data });
  const attendanceTrend = charts?.attendanceTrend || [];
  const collectionTrend = charts?.collectionTrend || [];
  const feeStatus = charts?.feeStatus || [];
  const recentAdmissions = stats?.recentAdmissions || [];
  const latestAttendance = attendanceTrend.length ? attendanceTrend[attendanceTrend.length - 1]?.rate : null;
  const latestCollection = collectionTrend.length ? collectionTrend[collectionTrend.length - 1]?.total : null;

  return <div className="space-y-6 lg:space-y-8">
    <header className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white px-5 py-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:px-7 sm:py-7">
      <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-primary-100/60 blur-3xl" aria-hidden="true" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary-600"><span className="h-1.5 w-1.5 rounded-full bg-primary-500" />Overview</div><h1 className="mt-2 text-2xl font-extrabold tracking-[-0.035em] text-slate-950 sm:text-3xl">School dashboard</h1><p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-500">The operational signals that deserve attention first, arranged for fast scanning and minimal context switching.</p></div><div className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-semibold text-slate-600"><Calendar className="h-4 w-4 text-primary-600" aria-hidden="true" />{new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</div></div>
    </header>

    <section aria-label="School summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <MetricCard title="Students" value={stats?.stats?.totalStudents || 0} icon={<Users className="h-5 w-5 text-blue-600" />} tone="bg-blue-50" isLoading={statsLoading} />
      <MetricCard title="Teachers" value={stats?.stats?.totalTeachers || 0} icon={<UserCheck className="h-5 w-5 text-emerald-600" />} tone="bg-emerald-50" isLoading={statsLoading} />
      <MetricCard title="Classes" value={stats?.stats?.totalClasses || 0} icon={<Building2 className="h-5 w-5 text-violet-600" />} tone="bg-violet-50" isLoading={statsLoading} />
      <MetricCard title="Today's collection" value={stats?.stats?.todayCollection || 0} formatter={formatCurrency} icon={<DollarSign className="h-5 w-5 text-amber-600" />} tone="bg-amber-50" isLoading={statsLoading} />
      <MetricCard title="Attendance" value={stats?.stats?.attendanceRate || 0} formatter={(value) => `${value.toFixed(1)}%`} icon={<Calendar className="h-5 w-5 text-orange-600" />} tone="bg-orange-50" isLoading={statsLoading} />
      <MetricCard title="Pending fees" value={stats?.stats?.pendingFees || 0} icon={<TrendingUp className="h-5 w-5 text-rose-600" />} tone="bg-rose-50" isLoading={statsLoading} />
    </section>

    <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]" aria-label="Operational overview">
      <SpotlightCard><Card className="border-0 shadow-none"><CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-100/90"><div><div className="flex items-center gap-2"><h2 className="text-sm font-bold text-slate-900">Recent admissions</h2><Badge variant="secondary">{recentAdmissions.length}</Badge></div><p className="mt-1 text-xs text-slate-500">Latest students added to the directory</p></div><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600"><UserRound className="h-4 w-4" /></div></CardHeader><CardContent className="pt-4">{statsLoading ? <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3"><div className="h-14 animate-pulse rounded-xl bg-slate-100" /><div className="h-14 animate-pulse rounded-xl bg-slate-100" /><div className="h-14 animate-pulse rounded-xl bg-slate-100" /></div> : recentAdmissions.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center text-sm font-medium text-slate-500">No admissions recorded yet</div> : <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{recentAdmissions.slice(0, 6).map((student: any) => <div key={student._id} className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-xs font-bold text-primary-700">{student.firstName?.charAt(0)}{student.lastName?.charAt(0)}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{student.firstName} {student.lastName}</p><p className="truncate text-xs text-slate-500">{student.classId?.displayName || "Class not assigned"}</p></div><Badge variant="secondary">{student.admissionNo}</Badge></div>)}</div>}</CardContent></Card></SpotlightCard>
      <SpotlightCard><Card className="h-full border-0 shadow-none"><CardHeader><div><h2 className="text-sm font-bold text-slate-900">Fee status</h2><p className="mt-1 text-xs text-slate-500">Current outstanding picture</p></div></CardHeader><CardContent>{chartsLoading ? <p className="text-sm text-slate-500">Loading fee status...</p> : feeStatus.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center text-sm font-medium text-slate-500">No fee records yet</div> : <ul className="divide-y divide-slate-100">{feeStatus.map((fs: any) => <li key={fs._id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"><span className="text-sm font-semibold capitalize text-slate-700">{String(fs._id).replace(/_/g, " ")}</span><Badge variant={feeStatusVariant(fs._id)}>{fs.count} · {formatCurrency(fs.total || 0)}</Badge></li>)}</ul>}</CardContent></Card></SpotlightCard>
    </section>

    <section className="grid gap-5 lg:grid-cols-2" aria-label="Trends">
      <SpotlightCard><Card className="border-0 shadow-none"><CardHeader className="flex flex-row items-center justify-between gap-3"><div><h2 className="text-sm font-bold text-slate-900">Attendance trend</h2><p className="mt-1 text-xs text-slate-500">Last 7 days</p></div><div className="text-right"><p className="text-sm font-bold tabular-nums text-slate-900">{latestAttendance != null ? `${Number(latestAttendance).toFixed(1)}%` : "—"}</p><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Latest</p></div></CardHeader><CardContent><div className="h-64">{chartsLoading ? <ChartEmptyState message="Loading attendance..." /> : attendanceTrend.length === 0 ? <ChartEmptyState message="No attendance data yet" /> : <ResponsiveContainer width="100%" height="100%"><LineChart data={attendanceTrend} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}><CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" axisLine={false} tickLine={false} tickFormatter={(v) => String(v).split("-").slice(1).join("-")} tick={{ fontSize: 11, fill: "#64748b" }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} /><Tooltip contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0", boxShadow: "0 12px 30px rgba(15,23,42,0.10)" }} /><Line type="monotone" dataKey="rate" stroke="var(--chart-primary)" strokeWidth={3} dot={false} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer>}</div></CardContent></Card></SpotlightCard>
      <SpotlightCard><Card className="border-0 shadow-none"><CardHeader className="flex flex-row items-center justify-between gap-3"><div><h2 className="text-sm font-bold text-slate-900">Collection trend</h2><p className="mt-1 text-xs text-slate-500">Last 30 days</p></div><div className="text-right"><p className="text-sm font-bold tabular-nums text-slate-900">{latestCollection != null ? formatCurrency(latestCollection) : "—"}</p><p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Latest</p></div></CardHeader><CardContent><div className="h-64">{chartsLoading ? <ChartEmptyState message="Loading collection..." /> : collectionTrend.length === 0 ? <ChartEmptyState message="No collection data yet" /> : <ResponsiveContainer width="100%" height="100%"><LineChart data={collectionTrend} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}><CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" axisLine={false} tickLine={false} tickFormatter={(v) => String(v).split("-").slice(1).join("-")} tick={{ fontSize: 11, fill: "#64748b" }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} /><Tooltip contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0", boxShadow: "0 12px 30px rgba(15,23,42,0.10)" }} formatter={(v) => [formatCurrency(v as number), "Collection"]} /><Line type="monotone" dataKey="total" stroke="var(--chart-success)" strokeWidth={3} dot={false} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer>}</div></CardContent></Card></SpotlightCard>
    </section>

    <section className="grid gap-5 lg:grid-cols-2">
      <SpotlightCard><Card className="border-0 shadow-none"><CardHeader className="flex flex-row items-center justify-between gap-3"><div><h2 className="text-sm font-bold text-slate-900">Today's birthdays</h2><p className="mt-1 text-xs text-slate-500">A small moment worth celebrating</p></div><Cake className="h-5 w-5 text-primary-600" aria-hidden="true" /></CardHeader><CardContent>{birthdaysLoading ? <p className="text-sm text-slate-500">Loading birthdays...</p> : birthdays?.birthdays?.length > 0 ? <ul className="divide-y divide-slate-100">{birthdays.birthdays.map((b: any) => <li key={b._id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"><div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-xs font-bold text-primary-700">{b.firstName?.charAt(0)}{b.lastName?.charAt(0)}</div><span className="truncate text-sm font-semibold text-slate-700">{b.firstName} {b.lastName}</span></div><Badge variant="info">{b.admissionNo}</Badge></li>)}</ul> : <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center"><p className="text-sm font-semibold text-slate-700">No birthdays today</p><p className="mt-1 text-xs text-slate-500">You are all caught up.</p></div>}</CardContent></Card></SpotlightCard>
      <SpotlightCard><Card className="h-full border-0 shadow-none"><CardContent className="flex h-full min-h-40 flex-col justify-between p-6"><div><p className="eyebrow text-primary-600">Signal quality</p><h2 className="mt-2 text-lg font-bold text-slate-950">Keep the day moving</h2><p className="mt-1.5 text-sm leading-6 text-slate-500">Use the main navigation for deep workflows. This overview stays intentionally compact so live metrics remain easy to scan.</p></div><div className="mt-6 flex flex-wrap gap-2"><Badge variant="success">Dashboard live</Badge><Badge variant="secondary">Tabular figures</Badge><Badge variant="info">Responsive</Badge></div></CardContent></Card></SpotlightCard>
    </section>
  </div>;
}
