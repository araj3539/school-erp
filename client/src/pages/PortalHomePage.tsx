import { ArrowRight, Calendar, CalendarClock, ClipboardList, DollarSign, Megaphone, Users, Clock, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks";
import { SpotlightCard } from "../components/motion/SpotlightCard";

const CONTENT = {
  teacher: {
    eyebrow: "Teacher Workspace",
    title: "Your school day, in one place.",
    intro: "Review today's schedule, take attendance, and manage homework across all assigned classes.",
    cards: [
      { label: "Timetable", text: "See your scheduled classes and periods.", path: "/timetable", icon: CalendarClock, permission: "timetable:read:own", accent: "bg-sky-50 text-sky-700" },
      { label: "Attendance", text: "Record or review attendance rosters.", path: "/attendance", icon: Calendar, permission: "attendance:read", accent: "bg-emerald-50 text-emerald-700" },
      { label: "Homework", text: "Assign, grade, and track student submissions.", path: "/homework", icon: ClipboardList, permission: "homework:read", accent: "bg-indigo-50 text-indigo-700" },
      { label: "Students", text: "Browse authorized student profiles.", path: "/students", icon: Users, permission: "students:read", accent: "bg-violet-50 text-violet-700" },
      { label: "Exams and Results", text: "Publish scores and examine performance.", path: "/exams", icon: ClipboardList, permission: "marks:read", accent: "bg-amber-50 text-amber-700" },
      { label: "Announcements", text: "Read published notices and circulars.", path: "/notices", icon: Megaphone, permission: "notices:read", accent: "bg-rose-50 text-rose-700" },
    ],
  },
  student: {
    eyebrow: "Student Workspace",
    title: "Keep track of your academic journey.",
    intro: "Check your timetable, monitor attendance streaks, review homework assignments, and view published marks.",
    cards: [
      { label: "Timetable", text: "Check your daily timetable and classrooms.", path: "/timetable", icon: CalendarClock, permission: "timetable:read:own", accent: "bg-sky-50 text-sky-700" },
      { label: "Attendance", text: "See your overall attendance percentage.", path: "/attendance", icon: Calendar, permission: "attendance:read:own", accent: "bg-emerald-50 text-emerald-700" },
      { label: "Homework", text: "Review assigned homework and due dates.", path: "/homework", icon: ClipboardList, permission: "homework:read:own", accent: "bg-indigo-50 text-indigo-700" },
      { label: "Exams and Results", text: "View report cards and exam schedules.", path: "/exams", icon: ClipboardList, permission: "results:read:own", accent: "bg-amber-50 text-amber-700" },
      { label: "Fee Details", text: "View paid invoices and pending dues.", path: "/fees", icon: DollarSign, permission: "fees:read:own", accent: "bg-teal-50 text-teal-700" },
      { label: "Announcements", text: "Stay updated with school events.", path: "/notices", icon: Megaphone, permission: "notices:read", accent: "bg-rose-50 text-rose-700" },
    ],
  },
  parent: {
    eyebrow: "Parent Workspace",
    title: "Stay connected with your child's education.",
    intro: "Monitor attendance, review academic progress, verify homework submissions, and manage fee dues securely.",
    cards: [
      { label: "Children Overview", text: "Switch between linked children profiles.", path: "/students", icon: Users, permission: "students:read:child", accent: "bg-violet-50 text-violet-700" },
      { label: "Class Timetable", text: "Review class schedules and subject teachers.", path: "/timetable", icon: CalendarClock, permission: "timetable:read:child", accent: "bg-sky-50 text-sky-700" },
      { label: "Attendance Record", text: "Track monthly presence and absences.", path: "/attendance", icon: Calendar, permission: "attendance:read:child", accent: "bg-emerald-50 text-emerald-700" },
      { label: "Homework", text: "See homework assigned to your children.", path: "/homework", icon: ClipboardList, permission: "homework:read:child", accent: "bg-indigo-50 text-indigo-700" },
      { label: "Exam Results", text: "Inspect term scores and grade sheets.", path: "/exams", icon: ClipboardList, permission: "results:read:child", accent: "bg-amber-50 text-amber-700" },
      { label: "Fee Statements", text: "Review fee receipts and due installments.", path: "/fees", icon: DollarSign, permission: "fees:read:child", accent: "bg-teal-50 text-teal-700" },
      { label: "School Notices", text: "Read administrative updates and circulars.", path: "/notices", icon: Megaphone, permission: "notices:read", accent: "bg-rose-50 text-rose-700" },
    ],
  },
} as const;

export default function PortalHomePage() {
  const { user, hasPermission } = useAuth();
  const content = CONTENT[user?.role as keyof typeof CONTENT] ?? CONTENT.student;
  const visibleCards = content.cards.filter((card) => hasPermission(card.permission));
  const today = new Date();

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-sky-100/70 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-500" aria-hidden="true" />
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-600">{content.eyebrow}</p>
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {content.title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              {content.intro}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-xs font-semibold text-slate-700">
              <Clock className="h-4 w-4 text-sky-600" aria-hidden="true" />
              <span>{today.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              <span>Session Active</span>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="quick-access-heading">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 id="quick-access-heading" className="text-xl font-bold tracking-tight text-slate-950">
              Workspace Modules
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Direct access to your everyday tasks and records.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleCards.map((card) => {
            const Icon = card.icon;
            return (
              <SpotlightCard key={card.path} className="group">
                <Link
                  to={card.path}
                  className="flex h-full flex-col justify-between p-6 transition-transform duration-200 group-hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm ${card.accent}`}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition-colors group-hover:bg-sky-50 group-hover:text-sky-600">
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-base font-bold text-slate-950 group-hover:text-sky-700 transition-colors">
                      {card.label}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                      {card.text}
                    </p>
                  </div>
                </Link>
              </SpotlightCard>
            );
          })}
        </div>
      </section>
    </div>
  );
}
