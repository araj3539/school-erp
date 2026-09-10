import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BriefcaseBusiness, RefreshCw, Search, Users } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Table } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import api from "../lib/api";

export default function StaffPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError, refetch, isFetching } = useQuery({ queryKey: ["staff"], queryFn: async () => (await api.get("/staff?page=1&limit=100")).data });
  const staff = data?.data || [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return staff;
    return staff.filter((person: any) => [person.employeeId, person.firstName, person.lastName, person.department, person.designation, person.employmentType, person.status].filter(Boolean).join(" ").toLowerCase().includes(term));
  }, [staff, search]);
  const active = staff.filter((person: any) => String(person.status).toLowerCase() === "active").length;
  const departments = new Set(staff.map((person: any) => person.department).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-slate-950 px-5 py-6 text-white sm:px-7"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200"><BriefcaseBusiness className="h-3.5 w-3.5" />Operations</div><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Staff & HR</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">A clear operational directory for the people who keep the school running.</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"><p className="text-xs text-slate-400">Staff members</p><p className="mt-1 text-xl font-semibold">{staff.length}</p></div><div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"><p className="text-xs text-slate-400">Active</p><p className="mt-1 text-xl font-semibold">{active}</p></div></div></div></section>
      <div className="grid gap-4 sm:grid-cols-3"><Card><CardContent className="flex items-center gap-3"><div className="rounded-xl bg-primary-50 p-3"><Users className="h-5 w-5 text-primary-600" /></div><div><p className="text-sm text-slate-500">Directory</p><p className="text-xl font-semibold text-slate-900">{staff.length}</p></div></CardContent></Card><Card><CardContent className="flex items-center gap-3"><div className="rounded-xl bg-emerald-50 p-3"><Users className="h-5 w-5 text-emerald-600" /></div><div><p className="text-sm text-slate-500">Active staff</p><p className="text-xl font-semibold text-slate-900">{active}</p></div></CardContent></Card><Card><CardContent className="flex items-center gap-3"><div className="rounded-xl bg-slate-100 p-3"><BriefcaseBusiness className="h-5 w-5 text-slate-600" /></div><div><p className="text-sm text-slate-500">Departments</p><p className="text-xl font-semibold text-slate-900">{departments}</p></div></CardContent></Card></div>
      <Card><CardHeader><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-lg font-semibold text-slate-900">Staff directory</h2><p className="mt-1 text-sm text-slate-500">Search the current staff records without changing the underlying HR API.</p></div><div className="flex flex-col gap-2 sm:flex-row"><Input placeholder="Search staff…" value={search} onChange={(event) => setSearch(event.target.value)} leftIcon={<Search className="h-4 w-4" />} className="sm:w-72" /><Button variant="outline" onClick={() => refetch()} disabled={isFetching}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button></div></div></CardHeader><CardContent>{isLoading ? <p role="status" className="py-6 text-sm text-slate-500">Loading staff…</p> : isError ? <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700" role="alert">Unable to load staff. <Button className="ml-2" size="sm" variant="outline" onClick={() => refetch()}>Retry</Button></div> : <Table data={filtered} columns={[{ key: "employeeId", header: "Employee ID" }, { key: "firstName", header: "Name", render: (person: any) => <span className="font-medium text-slate-900">{`${person.firstName || ""} ${person.lastName || ""}`.trim() || "—"}</span> }, { key: "department", header: "Department" }, { key: "designation", header: "Designation" }, { key: "employmentType", header: "Type" }, { key: "status", header: "Status", render: (person: any) => <Badge variant={String(person.status).toLowerCase() === "active" ? "success" : "default"}>{person.status || "Unknown"}</Badge> }]} keyExtractor={(person: any) => person._id} emptyMessage={search ? "No staff match your search." : "No staff records found."} />}</CardContent></Card>
    </div>
  );
}
