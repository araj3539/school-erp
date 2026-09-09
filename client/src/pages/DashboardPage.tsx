import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import api from "../lib/api";
import { cn, formatCurrency } from "../utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, UserCheck, Building2, DollarSign, Calendar, TrendingUp, ArrowUpRight, Cake } from "lucide-react";

interface StatCardProps { title: string; value: string | number; icon: React.ReactNode; trend?: string; trendUp?: boolean; tone: string; isLoading?: boolean; }
function StatCard({ title, value, icon, trend, trendUp, tone, isLoading }: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{title}</p>
            {isLoading ? <div className="mt-3 h-8 w-24 animate-pulse rounded-lg bg-slate-200" aria-hidden="true" /> : <p className="mt-2 truncate text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">{value}</p>}
            {trend && <p className={cn("mt-2 text-xs font-semibold", trendUp ? "text-emerald-600" : "text-red-600")}>{trend}</p>}
          </div>
          <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", tone)} aria-hidden="true">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartEmptyState({ message }: { message: string }) {
  return <div className="flex h-full min-h-48 items-center justify-center rounded-xl bg-slate-50 text-sm font-medium text-slate-500">{message}</div>;
}
const feeStatusVariant = (status: string) => status === "paid" ? "success" : status === "overdue" ? "danger" : "warning";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ["dashboard", "stats"], queryFn: async () => (await api.get("/dashboard/stats")).data });
  const { data: charts, isLoading: chartsLoading } = useQuery({ queryKey: ["dashboard", "charts"], queryFn: async () => (await api.get("/dashboard/charts")).data });
  const { data: birthdays, isLoading: birthdaysLoading } = useQuery({ queryKey: ["dashboard", "birthdays"], queryFn: async () => (await api.get("/dashboard/birthdays")).data });
  const attendanceTrend = charts?.attendanceTrend || [];
  const collectionTrend = charts?.collectionTrend || [];
  const feeStatus = charts?.feeStatus || [];

  return (
    <div className="space-y-6 lg:space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-600">Overview</p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">School dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">A clear view of what needs your attention today.</p>
        </div>
        <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm sm:flex">
          <Calendar className="h-4 w-4 text-primary-600" aria-hidden="true" />
          {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
        </div>
      </header>

      <section aria-label="School summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Students" value={stats?.stats?.totalStudents || 0} icon={<Users className="h-5 w-5 text-blue-600" />} tone="bg-blue-50" isLoading={statsLoading} />
        <StatCard title="Teachers" value={stats?.stats?.totalTeachers || 0} icon={<UserCheck className="h-5 w-5 text-emerald-600" />} tone="bg-emerald-50" isLoading={statsLoading} />
        <StatCard title="Classes" value={stats?.stats?.totalClasses || 0} icon={<Building2 className="h-5 w-5 text-violet-600" />} tone="bg-violet-50" isLoading={statsLoading} />
        <StatCard title="Today's collection" value={formatCurrency(stats?.stats?.todayCollection || 0)} icon={<DollarSign className="h-5 w-5 text-amber-600" />} tone="bg-amber-50" isLoading={statsLoading} />
        <StatCard title="Attendance" value={stats?.stats?.attendanceRate ? `${stats.stats.attendanceRate}%` : "0%"} icon={<Calendar className="h-5 w-5 text-orange-600" />} tone="bg-orange-50" isLoading={statsLoading} />
        <StatCard title="Pending fees" value={stats?.stats?.pendingFees || 0} icon={<TrendingUp className="h-5 w-5 text-rose-600" />} tone="bg-rose-50" isLoading={statsLoading} />
      </section>

      <section className="grid gap-5 lg:grid-cols-2" aria-label="Trends">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div><h2 className="text-sm font-bold text-slate-900">Attendance trend</h2><p className="mt-1 text-xs text-slate-500">Last 7 days</p></div>
            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">Live view</span>
          </CardHeader>
          <CardContent><div className="h-64">{chartsLoading ? <ChartEmptyState message="Loading attendance..." /> : attendanceTrend.length === 0 ? <ChartEmptyState message="No attendance data yet" /> : <ResponsiveContainer width="100%" height="100%"><LineChart data={attendanceTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" axisLine={false} tickLine={false} tickFormatter={(v) => String(v).split("-").slice(1).join("-")} tick={{ fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} /><Tooltip /><Line type="monotone" dataKey="rate" stroke="#0ea5e9" strokeWidth={3} dot={false} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer>}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div><h2 className="text-sm font-bold text-slate-900">Collection trend</h2><p className="mt-1 text-xs text-slate-500">Last 30 days</p></div>
            <span className="rounded-lg bg-primary-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-700">Revenue</span>
          </CardHeader>
          <CardContent><div className="h-64">{chartsLoading ? <ChartEmptyState message="Loading collection..." /> : collectionTrend.length === 0 ? <ChartEmptyState message="No collection data yet" /> : <ResponsiveContainer width="100%" height="100%"><LineChart data={collectionTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" axisLine={false} tickLine={false} tickFormatter={(v) => String(v).split("-").slice(1).join("-")} tick={{ fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} /><Tooltip formatter={(v) => [formatCurrency(v as number), "Collection"]} /><Line type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={3} dot={false} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer>}</div></CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3"><div><h2 className="text-sm font-bold text-slate-900">Fee status</h2><p className="mt-1 text-xs text-slate-500">Current outstanding picture</p></div><DollarSign className="h-5 w-5 text-slate-400" aria-hidden="true" /></CardHeader>
          <CardContent>{chartsLoading ? <p className="text-sm text-slate-500">Loading fee status...</p> : feeStatus.length === 0 ? <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm font-medium text-slate-500">No fee records yet</div> : <ul className="divide-y divide-slate-100">{feeStatus.map((fs: any) => <li key={fs._id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"><span className="text-sm font-semibold capitalize text-slate-700">{String(fs._id).replace(/_/g, " ")}</span><Badge variant={feeStatusVariant(fs._id)}>{fs.count} · {formatCurrency(fs.total || 0)}</Badge></li>)}</ul>}</CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3"><div><h2 className="text-sm font-bold text-slate-900">Today's birthdays</h2><p className="mt-1 text-xs text-slate-500">A small moment worth celebrating</p></div><Cake className="h-5 w-5 text-primary-600" aria-hidden="true" /></CardHeader>
          <CardContent>{birthdaysLoading ? <p className="text-sm text-slate-500">Loading birthdays...</p> : birthdays?.birthdays?.length > 0 ? <ul className="divide-y divide-slate-100">{birthdays.birthdays.map((b: any) => <li key={b._id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"><div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-xs font-bold text-primary-700" aria-hidden="true">{b.firstName?.charAt(0)}{b.lastName?.charAt(0)}</div><span className="truncate text-sm font-semibold text-slate-700">{b.firstName} {b.lastName}</span></div><Badge variant="info">{b.admissionNo}</Badge></li>)}</ul> : <div className="rounded-xl bg-slate-50 px-4 py-8 text-center"><p className="text-sm font-semibold text-slate-700">No birthdays today</p><p className="mt-1 text-xs text-slate-500">You are all caught up.</p></div>}</CardContent>
        </Card>
      </section>
    </div>
  );
}
