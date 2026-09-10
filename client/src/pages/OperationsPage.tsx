import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Bus, Package, Users } from "lucide-react";
import { Card, CardContent } from "../components/ui/Card";

const modules = [
  { name: "Staff & HR", description: "People, roles and employment foundation", path: "/staff", icon: Users, meta: "Directory" },
  { name: "Library", description: "Catalog, copies and circulation", path: "/library", icon: BookOpen, meta: "Circulation" },
  { name: "Transport", description: "Routes, vehicles and allocations", path: "/transport", icon: Bus, meta: "Mobility" },
  { name: "Inventory", description: "Stock, movements and reorder levels", path: "/inventory", icon: Package, meta: "Stock control" },
];

export default function OperationsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-slate-950 px-5 py-7 text-white sm:px-7"><div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Operations hub</p><h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Keep the school moving</h1><p className="mt-2 text-sm leading-6 text-slate-300">One focused launchpad for the operational systems that support teaching, administration and day-to-day delivery.</p></div></section>
      <div className="grid gap-4 sm:grid-cols-2">{modules.map(({ name, description, path, icon: Icon, meta }) => <Link key={path} to={path} className="group rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"><Card className="h-full transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg"><CardContent className="flex h-full items-start gap-4 p-5 sm:p-6"><div className="rounded-xl bg-primary-50 p-3"><Icon className="h-6 w-6 text-primary-600" aria-hidden="true" /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-wide text-slate-400">{meta}</p><h2 className="mt-1 font-semibold text-slate-900">{name}</h2></div><ArrowRight className="mt-1 h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-primary-600" /></div><p className="mt-2 text-sm leading-5 text-slate-500">{description}</p></div></CardContent></Card></Link>)}</div>
    </div>
  );
}
