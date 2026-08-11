import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import api from "../lib/api";
import { formatCurrency } from "../utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, UserCheck, Building2, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { cn } from "../utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color: string;
}

function StatCard({ title, value, icon, trend, trendUp, color }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            {trend && (
              <p className={cn("text-sm mt-1", trendUp ? "text-green-600" : "text-red-600")}>
                {trend}
              </p>
            )}
          </div>
          <div className={cn("p-3 rounded-full", color)}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const res = await api.get("/dashboard/stats");
      return res.data;
    }
  });

  const { data: charts } = useQuery({
    queryKey: ["dashboard", "charts"],
    queryFn: async () => {
      const res = await api.get("/dashboard/charts");
      return res.data;
    }
  });

  const { data: birthdays } = useQuery({
    queryKey: ["dashboard", "birthdays"],
    queryFn: async () => {
      const res = await api.get("/dashboard/birthdays");
      return res.data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Total Students"
          value={stats?.stats?.totalStudents || 0}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          color="bg-blue-100"
        />
        <StatCard
          title="Total Teachers"
          value={stats?.stats?.totalTeachers || 0}
          icon={<UserCheck className="w-6 h-6 text-green-600" />}
          color="bg-green-100"
        />
        <StatCard
          title="Total Classes"
          value={stats?.stats?.totalClasses || 0}
          icon={<Building2 className="w-6 h-6 text-purple-600" />}
          color="bg-purple-100"
        />
        <StatCard
          title="Today&apos;s Collection"
          value={formatCurrency(stats?.stats?.todayCollection || 0)}
          icon={<DollarSign className="w-6 h-6 text-yellow-600" />}
          color="bg-yellow-100"
        />
        <StatCard
          title="Attendance Rate"
          value={stats?.stats?.attendanceRate ? `${stats.stats.attendanceRate}%` : "0%"}
          icon={<Calendar className="w-6 h-6 text-orange-600" />}
          color="bg-orange-100"
        />
        <StatCard
          title="Pending Fees"
          value={stats?.stats?.pendingFees || 0}
          icon={<TrendingUp className="w-6 h-6 text-red-600" />}
          color="bg-red-100"
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-lg font-semibold">Attendance Trend (7 Days)</h3>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts?.attendanceTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(v) => v.split("-").slice(1).join("-")} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="rate" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-lg font-semibold">Collection Trend (30 Days)</h3>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts?.collectionTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={(v) => v.split("-").slice(1).join("-")} />
                  <YAxis />
                  <Tooltip formatter={(v) => [formatCurrency(v as number), "Collection"]} />
                  <Line type="monotone" dataKey="total" stroke="#22c55e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-lg font-semibold">Fee Status</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {charts?.feeStatus?.map((fs: any) => (
                <div key={fs._id} className="flex items-center justify-between">
                  <span className="capitalize">{fs._id}</span>
                  <Badge variant={fs._id === "paid" ? "success" : fs._id === "overdue" ? "danger" : "warning"}>
                    {fs.count} (${formatCurrency(fs.total)})
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-lg font-semibold">Today&apos;s Birthdays</h3>
          </CardHeader>
          <CardContent>
            {birthdays?.birthdays?.length > 0 ? (
              <ul className="space-y-2">
                {birthdays.birthdays.map((b: any) => (
                  <li key={b._id} className="flex items-center justify-between">
                    <span>{b.firstName} {b.lastName}</span>
                    <Badge variant="info">{b.admissionNo}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No birthdays today</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
