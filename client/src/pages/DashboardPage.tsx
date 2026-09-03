import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import api from "../lib/api";
import { cn, formatCurrency } from "../utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, UserCheck, Building2, DollarSign, Calendar, TrendingUp } from "lucide-react";

interface StatCardProps { title: string; value: string | number; icon: React.ReactNode; trend?: string; trendUp?: boolean; color: string; isLoading?: boolean; }
function StatCard({ title, value, icon, trend, trendUp, color, isLoading }: StatCardProps) {
  return <Card><CardContent className="p-6"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-sm font-medium text-gray-500">{title}</p>{isLoading ? <div className="mt-2 h-8 w-20 animate-pulse rounded bg-gray-200" aria-hidden="true" /> : <p className="text-3xl font-bold text-gray-900 mt-1 truncate">{value}</p>}{trend && <p className={cn("text-sm mt-1", trendUp ? "text-green-600" : "text-red-600")}>{trend}</p>}</div><div className={cn("shrink-0 p-3 rounded-full", color)} aria-hidden="true">{icon}</div></div></CardContent></Card>;
}
function ChartEmptyState({ message }: { message: string }) { return <div className="flex h-full items-center justify-center text-sm text-gray-500">{message}</div>; }
const feeStatusVariant = (status: string) => status === "paid" ? "success" : status === "overdue" ? "danger" : "warning";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ["dashboard", "stats"], queryFn: async () => (await api.get("/dashboard/stats")).data });
  const { data: charts, isLoading: chartsLoading } = useQuery({ queryKey: ["dashboard", "charts"], queryFn: async () => (await api.get("/dashboard/charts")).data });
  const { data: birthdays, isLoading: birthdaysLoading } = useQuery({ queryKey: ["dashboard", "birthdays"], queryFn: async () => (await api.get("/dashboard/birthdays")).data });
  const attendanceTrend = charts?.attendanceTrend || [];
  const collectionTrend = charts?.collectionTrend || [];
  const feeStatus = charts?.feeStatus || [];

  return <div className="space-y-6">
    <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-gray-900">Dashboard</h1></div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard title="Total Students" value={stats?.stats?.totalStudents || 0} icon={<Users className="w-6 h-6 text-blue-600" />} color="bg-blue-100" isLoading={statsLoading} />
      <StatCard title="Total Teachers" value={stats?.stats?.totalTeachers || 0} icon={<UserCheck className="w-6 h-6 text-green-600" />} color="bg-green-100" isLoading={statsLoading} />
      <StatCard title="Total Classes" value={stats?.stats?.totalClasses || 0} icon={<Building2 className="w-6 h-6 text-purple-600" />} color="bg-purple-100" isLoading={statsLoading} />
      <StatCard title="Today's Collection" value={formatCurrency(stats?.stats?.todayCollection || 0)} icon={<DollarSign className="w-6 h-6 text-yellow-600" />} color="bg-yellow-100" isLoading={statsLoading} />
      <StatCard title="Attendance Rate" value={stats?.stats?.attendanceRate ? `${stats.stats.attendanceRate}%` : "0%"} icon={<Calendar className="w-6 h-6 text-orange-600" />} color="bg-orange-100" isLoading={statsLoading} />
      <StatCard title="Pending Fees" value={stats?.stats?.pendingFees || 0} icon={<TrendingUp className="w-6 h-6 text-red-600" />} color="bg-red-100" isLoading={statsLoading} />
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader className="pb-2"><h3 className="text-lg font-semibold">Attendance Trend (7 Days)</h3></CardHeader><CardContent><div className="h-64">{chartsLoading ? <ChartEmptyState message="Loading chart..." /> : attendanceTrend.length === 0 ? <ChartEmptyState message="No attendance data yet" /> : <ResponsiveContainer width="100%" height="100%"><LineChart data={attendanceTrend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={(v) => String(v).split("-").slice(1).join("-")} /><YAxis /><Tooltip /><Line type="monotone" dataKey="rate" stroke="#0ea5e9" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer>}</div></CardContent></Card>
      <Card><CardHeader className="pb-2"><h3 className="text-lg font-semibold">Collection Trend (30 Days)</h3></CardHeader><CardContent><div className="h-64">{chartsLoading ? <ChartEmptyState message="Loading chart..." /> : collectionTrend.length === 0 ? <ChartEmptyState message="No collection data yet" /> : <ResponsiveContainer width="100%" height="100%"><LineChart data={collectionTrend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={(v) => String(v).split("-").slice(1).join("-")} /><YAxis /><Tooltip formatter={(v) => [formatCurrency(v as number), "Collection"]} /><Line type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer>}</div></CardContent></Card>
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader className="pb-2"><h3 className="text-lg font-semibold">Fee Status</h3></CardHeader><CardContent>{chartsLoading ? <p className="text-sm text-gray-500">Loading...</p> : feeStatus.length === 0 ? <p className="text-gray-500">No fee records yet</p> : <ul className="space-y-3">{feeStatus.map((fs: any) => <li key={fs._id} className="flex items-center justify-between"><span className="capitalize">{String(fs._id).replace(/_/g, " ")}</span><Badge variant={feeStatusVariant(fs._id)}>{fs.count} ({formatCurrency(fs.total || 0)})</Badge></li>)}</ul>}</CardContent></Card>
      <Card><CardHeader className="pb-2"><h3 className="text-lg font-semibold">Today's Birthdays</h3></CardHeader><CardContent>{birthdaysLoading ? <p className="text-sm text-gray-500">Loading...</p> : birthdays?.birthdays?.length > 0 ? <ul className="space-y-2">{birthdays.birthdays.map((b: any) => <li key={b._id} className="flex items-center justify-between"><span>{b.firstName} {b.lastName}</span><Badge variant="info">{b.admissionNo}</Badge></li>)}</ul> : <p className="text-gray-500">No birthdays today</p>}</CardContent></Card>
    </div>
  </div>;
}
