import { ArrowRight, Calendar, CalendarClock, ClipboardList, CreditCard, Megaphone, Users, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks";

const ROLE_CONFIG = {
  teacher: {
    portalName: "Faculty Workspace",
    headline: "Classroom and student operations",
    primaryAction: { label: "Mark Attendance", path: "/attendance" },
    modules: [
      { label: "Class Timetable", desc: "View scheduled periods and room allocations", path: "/timetable", icon: CalendarClock },
      { label: "Attendance Rosters", desc: "Record and review student attendance", path: "/attendance", icon: Calendar },
      { label: "Homework and Assignments", desc: "Create, distribute, and grade assignments", path: "/homework", icon: ClipboardList },
      { label: "Student Records", desc: "Access student profiles and contact information", path: "/students", icon: Users },
      { label: "Exams and Results", desc: "Record marks and submit evaluation reports", path: "/exams", icon: BookOpen },
      { label: "School Notices", desc: "Read and publish institutional announcements", path: "/notices", icon: Megaphone },
    ],
  },
  student: {
    portalName: "Student Portal",
    headline: "Your daily academic schedule and progress",
    primaryAction: { label: "View Timetable", path: "/timetable" },
    modules: [
      { label: "Daily Schedule", desc: "Check class periods, subjects, and teachers", path: "/timetable", icon: CalendarClock },
      { label: "Attendance Summary", desc: "Monitor your monthly attendance status", path: "/attendance", icon: Calendar },
      { label: "Active Homework", desc: "Review upcoming assignments and due dates", path: "/homework", icon: ClipboardList },
      { label: "Exam Results", desc: "Inspect published report cards and test grades", path: "/exams", icon: BookOpen },
      { label: "Fee Statements", desc: "Check payment history and pending receipts", path: "/fees", icon: CreditCard },
      { label: "Announcements", desc: "Stay informed on school circulars and events", path: "/notices", icon: Megaphone },
    ],
  },
  parent: {
    portalName: "Family Portal",
    headline: "Academic progress and school communications",
    primaryAction: { label: "Review Attendance", path: "/attendance" },
    modules: [
      { label: "Children Overview", desc: "View records for each registered child", path: "/students", icon: Users },
      { label: "Class Schedule", desc: "View daily timetable and subject teachers", path: "/timetable", icon: CalendarClock },
      { label: "Attendance Logs", desc: "Review verified attendance reports", path: "/attendance", icon: Calendar },
      { label: "Homework Tracking", desc: "Check daily assignments and completion", path: "/homework", icon: ClipboardList },
      { label: "Report Cards", desc: "Access term examination and assessment results", path: "/exams", icon: BookOpen },
      { label: "Fee Payments", desc: "View due balances and download payment receipts", path: "/fees", icon: CreditCard },
    ],
  },
} as const;

export default function PortalHomePage() {
  const { user } = useAuth();
  const config = ROLE_CONFIG[user?.role as keyof typeof ROLE_CONFIG] ?? ROLE_CONFIG.student;
  const today = new Date();

  return (
    <div className="space-y-8">
      {/* Top Workspace Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {config.portalName}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 mt-1 sm:text-3xl">
            {config.headline}
          </h1>
        </div>
        <div className="text-xs text-slate-500 font-medium">
          {today.toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {/* Dominant Quick-Start Tile (Spans 2 columns on desktop) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md">
              Current Session
            </span>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-4">
              Welcome, {user?.email}
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed max-w-xl">
              All your daily tasks, rosters, and updates are synchronized. Select a module below or use the quick action to begin.
            </p>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <Link
              to={config.primaryAction.path}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors active:scale-[0.98]"
            >
              <span>{config.primaryAction.label}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <Link
              to="/notices"
              className="inline-flex items-center px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors active:scale-[0.98]"
            >
              View Notices
            </Link>
          </div>
        </div>

        {/* Notices Summary Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Noticeboard
              </span>
              <Megaphone className="h-4 w-4 text-slate-400" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-3">
              Announcements
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Official school notices, holiday circulars, and administrative updates for this term.
            </p>
          </div>
          <Link
            to="/notices"
            className="mt-6 text-xs font-semibold text-sky-600 hover:text-sky-700 inline-flex items-center gap-1"
          >
            <span>Open noticeboard</span>
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>

        {/* Module Cards */}
        {config.modules.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path + item.label}
              to={item.path}
              className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all hover:border-slate-300 hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-sky-50 group-hover:text-sky-700 transition-colors">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-4 group-hover:text-sky-700 transition-colors">
                  {item.label}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
