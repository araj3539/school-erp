import { ArrowRight, Calendar, CalendarClock, ClipboardList, DollarSign, Megaphone, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks";

const CONTENT = {
  teacher: {
    eyebrow: "Teacher workspace",
    title: "Your school day, in one place.",
    intro: "Start with today's classes and the work that needs your attention.",
    cards: [
      { label: "Timetable", text: "See your scheduled classes.", path: "/timetable", icon: CalendarClock, permission: "timetable:read:own" },
      { label: "Attendance", text: "Review or mark attendance for your classes.", path: "/attendance", icon: Calendar, permission: "attendance:read" },
      { label: "Homework", text: "Create, review and share class work.", path: "/homework", icon: ClipboardList, permission: "homework:read" },
      { label: "Students", text: "Open students you are authorized to work with.", path: "/students", icon: Users, permission: "students:read" },
      { label: "Exams & results", text: "Review exams and marks you can access.", path: "/exams", icon: ClipboardList, permission: "marks:read" },
      { label: "Notices", text: "Read school announcements.", path: "/notices", icon: Megaphone, permission: "notices:read" },
    ],
  },
  student: {
    eyebrow: "Student workspace",
    title: "Keep track of your school day.",
    intro: "Your timetable, attendance, homework and results are close at hand.",
    cards: [
      { label: "Timetable", text: "Check your classes and schedule.", path: "/timetable", icon: CalendarClock, permission: "timetable:read:own" },
      { label: "Attendance", text: "See your attendance history.", path: "/attendance", icon: Calendar, permission: "attendance:read:own" },
      { label: "Homework", text: "Review work assigned to you.", path: "/homework", icon: ClipboardList, permission: "homework:read:own" },
      { label: "Exams & results", text: "View your exams and published results.", path: "/exams", icon: ClipboardList, permission: "results:read:own" },
      { label: "Fees", text: "Check your current fee status.", path: "/fees", icon: DollarSign, permission: "fees:read:own" },
      { label: "Notices", text: "Read notices relevant to you.", path: "/notices", icon: Megaphone, permission: "notices:read" },
    ],
  },
  parent: {
    eyebrow: "Parent workspace",
    title: "Stay close to your child's school day.",
    intro: "Switch between linked children and review the information that matters most.",
    cards: [
      { label: "Children", text: "Choose a linked child to view their details.", path: "/students", icon: Users, permission: "students:read:child" },
      { label: "Timetable", text: "Check your child's class schedule.", path: "/timetable", icon: CalendarClock, permission: "timetable:read:child" },
      { label: "Attendance", text: "Review attendance for your children.", path: "/attendance", icon: Calendar, permission: "attendance:read:child" },
      { label: "Homework", text: "See homework assigned to your children.", path: "/homework", icon: ClipboardList, permission: "homework:read:child" },
      { label: "Exams & results", text: "Review published results.", path: "/exams", icon: ClipboardList, permission: "results:read:child" },
      { label: "Fees", text: "Check fee balances and payments.", path: "/fees", icon: DollarSign, permission: "fees:read:child" },
      { label: "Notices", text: "Read school announcements.", path: "/notices", icon: Megaphone, permission: "notices:read" },
    ],
  },
} as const;

export default function PortalHomePage() {
  const { user, hasPermission } = useAuth();
  const content = CONTENT[user?.role as keyof typeof CONTENT] ?? CONTENT.student;
  const visibleCards = content.cards.filter((card) => hasPermission(card.permission));

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-8 text-white sm:px-8 sm:py-10">
        <div className="absolute right-[-4rem] top-[-5rem] h-48 w-48 rounded-full border-[32px] border-primary-400/20" aria-hidden="true" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-300">{content.eyebrow}</p>
        <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">{content.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">{content.intro}</p>
      </section>

      <section aria-labelledby="quick-access-heading">
        <div className="mb-4"><h2 id="quick-access-heading" className="text-lg font-semibold text-slate-900">Quick access</h2><p className="mt-1 text-sm text-slate-500">Open a task without navigating through the admin system.</p></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleCards.map((card) => {
            const Icon = card.icon;
            return <Link key={card.path} to={card.path} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2">
              <div className="flex items-start justify-between gap-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><Icon className="h-5 w-5" aria-hidden="true" /></div><ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-primary-600" aria-hidden="true" /></div>
              <h3 className="mt-5 font-semibold text-slate-900">{card.label}</h3><p className="mt-1 text-sm leading-5 text-slate-500">{card.text}</p>
            </Link>;
          })}
        </div>
      </section>
    </div>
  );
}
