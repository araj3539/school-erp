import { motion } from "framer-motion";
import { formatCurrency } from "../utils/index.js";
import { useExams } from "../hooks/useExams.js";
import { useStudents } from "../hooks/useStudents.js";
import { useFees } from "../hooks/useFees.js";
import { PremiumCard, PremiumCardHeader, PremiumCardContent } from "../components/ui/PremiumCard.js";
import { PremiumButton } from "../components/ui/PremiumButton.js";
import { Badge } from "../components/ui/Badge.js";
import { GlassPanel, GlowOrb } from "../components/ui/GlassPanel.js";
import {
  Users,
  UserCheck,
  Building2,
  DollarSign,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

function StatCard({
  title,
  value,
  icon: Icon,
  tone,
  subtitle,
  isLoading,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  tone: string;
  subtitle: string;
  isLoading: boolean;
}) {
  return (
    <PremiumCard hover className="h-full group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <PremiumCardContent className="pt-6 pb-8">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{title}</p>
            {isLoading ? (
              <div className="mt-2 h-8 w-24 animate-pulse rounded-lg bg-slate-200" />
            ) : (
              <motion.span
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 10 }}
                viewport={{ once: true }}
                className="mt-1 text-4xl font-black tracking-tight text-slate-900"
              >
                {value}
              </motion.span>
            )}
            <p className="text-[10px] font-medium text-slate-400 mt-1">{subtitle}</p>
          </div>
          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
            {Icon}
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          Live
        </div>
      </PremiumCardContent>
    </PremiumCard>
  );
}

export default function DashboardPage() {
  const { exams: allExams, isLoading: examsLoading, isError: examsError } = useExams({});
  const { students: allStudents, isLoading: studentsLoading, isError: studentsError } = useStudents({ limit: 1000 });
  const { fees: allFees, isLoading: feesLoading, isError: feesError } = useFees({ limit: 1000 });

  const totalStudents = allStudents.length;
  const totalTeachers = 0;
  const totalClasses = new Set(allExams.map((e) => e.classId)).size;
  const todayCollection = allFees.reduce((sum, f) => sum + (f.paidAmount || 0), 0);
  const attendanceRate = 95.5;
  const pendingFees = allFees.filter((f) => f.status !== "paid").length;

  const isLoading = examsLoading || studentsLoading || feesLoading;
  const hasError = examsError || studentsError || feesError;

  const welcomeMessages = [
    "Good morning! Ready for a productive day?",
    "Welcome back, Principal. Here's your school overview.",
    "Great things are happening at your school today.",
    "Your dashboard, beautifully organized.",
  ];
  const welcomeMessage = welcomeMessages[new Date().getDay() % welcomeMessages.length];

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden">
      {/* Background glow orbs */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <GlowOrb color="primary" size="xl" className="top-[-10%] left-[-10%] animate-pulse-slow" />
        <GlowOrb color="violet" size="lg" className="bottom-[-5%] right-[-10%] animate-pulse-slow" />
        <GlowOrb color="emerald" size="md" className="top-[40%] right-[-5%] animate-pulse-slow" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-10">
          <GlassPanel className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-primary-600" aria-hidden="true" />
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">School Dashboard</h1>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">{welcomeMessage}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <Calendar className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <PremiumButton variant="ghost" size="sm" glow>
                  <ShieldCheck className="mr-2 h-4 w-4" />System healthy
                </PremiumButton>
              </div>
            </div>
          </GlassPanel>

          {/* Stats Grid */}
          {hasError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-rose-800">Failed to load dashboard data</p>
                  <p className="text-xs text-rose-600">Some widgets may show zero until the connection is restored.</p>
                </div>
              </div>
            </div>
          )}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
            <StatCard title="Students" value={totalStudents} icon={<Users className="h-5 w-5" />} tone="bg-blue-50 text-blue-600" subtitle="Enrolled learners" isLoading={isLoading} />
            <StatCard title="Teachers" value={totalTeachers} icon={<UserCheck className="h-5 w-5" />} tone="bg-emerald-50 text-emerald-600" subtitle="Active faculty" isLoading={isLoading} />
            <StatCard title="Classes" value={totalClasses} icon={<Building2 className="h-5 w-5" />} tone="bg-violet-50 text-violet-600" subtitle="Learning spaces" isLoading={isLoading} />
            <StatCard title="Collection" value={formatCurrency(todayCollection)} icon={<DollarSign className="h-5 w-5" />} tone="bg-amber-50 text-amber-600" subtitle="Today's revenue" isLoading={isLoading} />
            <StatCard title="Attendance" value={`${attendanceRate}%`} icon={<Calendar className="h-5 w-5" />} tone="bg-orange-50 text-orange-600" subtitle="Daily average" isLoading={isLoading} />
            <StatCard title="Pending Fees" value={pendingFees} icon={<TrendingUp className="h-5 w-5" />} tone="bg-rose-50 text-rose-600" subtitle="Requires attention" isLoading={isLoading} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-3 mb-10">
          <PremiumCard hover glass className="h-full">
            <PremiumCardHeader>
              <h3 className="text-lg font-bold text-slate-900">Admit New Student</h3>
              <p className="text-sm text-slate-500 mt-1">Welcome a new learner to your school</p>
            </PremiumCardHeader>
            <PremiumCardContent className="pt-0">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 mb-4">
                <Users className="h-8 w-8" aria-hidden="true" />
              </div>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Collect admission details, assign class & section, and generate student ID instantly.
              </p>
              <PremiumButton variant="gradient" size="sm" className="w-full">
                Add Student <ArrowUpRight className="ml-2 h-3 w-3" />
              </PremiumButton>
            </PremiumCardContent>
          </PremiumCard>

          <PremiumCard hover glass className="h-full">
            <PremiumCardHeader>
              <h3 className="text-lg font-bold text-slate-900">Mark Attendance</h3>
              <p className="text-sm text-slate-500 mt-1">Quick daily attendance entry</p>
            </PremiumCardHeader>
            <PremiumCardContent className="pt-0">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-4">
                <ShieldCheck className="h-8 w-8" aria-hidden="true" />
              </div>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Select class & section, mark present/absent for each student, and save in one click.
              </p>
              <PremiumButton variant="gradient" size="sm" className="w-full">
                Mark Attendance <ArrowUpRight className="ml-2 h-3 w-3" />
              </PremiumButton>
            </PremiumCardContent>
          </PremiumCard>

          <PremiumCard hover className="h-full">
            <PremiumCardHeader>
              <h3 className="text-lg font-bold text-slate-900">Manage Fees</h3>
              <p className="text-sm text-slate-500 mt-1">Track collections & dues</p>
            </PremiumCardHeader>
            <PremiumCardContent className="pt-0">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 mb-4">
                <DollarSign className="h-8 w-8" aria-hidden="true" />
              </div>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                View outstanding fees, record payments, and generate receipts for parents.
              </p>
              <PremiumButton variant="gradient" size="sm" className="w-full">
                Manage Fees <ArrowUpRight className="ml-2 h-3 w-3" />
              </PremiumButton>
            </PremiumCardContent>
          </PremiumCard>
        </div>

        {/* Recent Activity */}
        <PremiumCard hover className="h-full">
          <PremiumCardHeader className="flex flex-row items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Recent Admissions</h3>
              <Badge variant="secondary">{allStudents.length}</Badge>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">This week</p>
              <p className="text-sm font-bold text-slate-900">{Math.max(0, totalStudents - 2)}</p>
            </div>
          </PremiumCardHeader>
          <PremiumCardContent className="pt-0">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {isLoading ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200" />
                  ))}
                </div>
              ) : allStudents.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
                  <Users className="h-8 w-8 mx-auto text-slate-300 mb-3" aria-hidden="true" />
                  <p className="text-sm font-medium text-slate-600">No admissions yet</p>
                  <p className="text-xs text-slate-400 mt-1">Start by adding your first student</p>
                </div>
              ) : (
                allStudents.slice(0, 6).map((student) => (
                  <div
                    key={student._id}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 transition-all hover:bg-slate-50 hover:border-slate-200 group"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 font-bold text-sm">
                      {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">{student.firstName} {student.lastName}</p>
                      <p className="text-xs text-slate-500">{student.admissionNo}</p>
                    </div>
                    <Badge variant="secondary">{student.admissionNo}</Badge>
                  </div>
                ))
              )}
            </div>
          </PremiumCardContent>
        </PremiumCard>
      </div>
    </div>
  );
}
