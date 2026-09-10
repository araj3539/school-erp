import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, CalendarDays, ImageUp, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/Tabs";
import { Badge } from "../components/ui/Badge";
import { Table } from "../components/ui/Table";
import api from "../lib/api";
import { formatDate } from "../utils";

const schoolSchema = z.object({
  name: z.string().min(2, "School name must be at least 2 characters"),
  address: z.string().min(10, "Please enter the complete address"),
  phone: z.string().min(10, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email address"),
  session: z.string().min(1, "Session is required"),
});
const yearSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  isCurrent: z.boolean().default(false),
});
type YearForm = z.infer<typeof yearSchema>;

const errorMessage = (error: unknown) => {
  const value = error as { response?: { data?: { message?: string } }; message?: string } | undefined;
  return value?.response?.data?.message || value?.message || "Something went wrong. Please try again.";
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");
  const [yearMode, setYearMode] = useState<"create" | "edit">("create");
  const [editingYearId, setEditingYearId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const schoolQuery = useQuery({ queryKey: ["school"], queryFn: async () => (await api.get("/settings/school")).data });
  const yearsQuery = useQuery({ queryKey: ["academicYears"], queryFn: async () => (await api.get("/academic-years")).data });
  const school = schoolQuery.data?.school || schoolQuery.data?.data || {};
  const years = yearsQuery.data?.data || [];

  const schoolForm = useForm({ resolver: zodResolver(schoolSchema), defaultValues: { name: "", address: "", phone: "", email: "", session: "" } });
  const yearForm = useForm<YearForm>({ resolver: zodResolver(yearSchema), defaultValues: { name: "", startDate: "", endDate: "", isCurrent: false } });

  useEffect(() => {
    if (school) schoolForm.reset({ name: school.name || "", address: school.address || "", phone: school.phone || "", email: school.email || "", session: school.session || "" });
  }, [school]);

  const currentYear = useMemo(() => years.find((year: any) => year.isCurrent), [years]);
  const schoolMutation = useMutation({ mutationFn: (data: any) => api.put("/settings/school", data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["school"] }); setNotice("School information saved successfully."); } });
  const createYearMutation = useMutation({ mutationFn: (data: YearForm) => api.post("/academic-years", data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["academicYears"] }); resetYearForm(); setNotice("Academic year created successfully."); } });
  const updateYearMutation = useMutation({ mutationFn: ({ id, data }: { id: string; data: YearForm }) => api.put(`/academic-years/${id}`, data), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["academicYears"] }); resetYearForm(); setNotice("Academic year updated successfully."); } });
  const deleteYearMutation = useMutation({ mutationFn: (id: string) => api.delete(`/academic-years/${id}`), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["academicYears"] }); setNotice("Academic year deleted successfully."); } });

  function resetYearForm() { setYearMode("create"); setEditingYearId(null); yearForm.reset({ name: "", startDate: "", endDate: "", isCurrent: false }); }
  function editYear(year: any) { setYearMode("edit"); setEditingYearId(year._id); yearForm.reset({ name: year.name || "", startDate: year.startDate?.slice(0, 10) || "", endDate: year.endDate?.slice(0, 10) || "", isCurrent: Boolean(year.isCurrent) }); setActiveTab("academic-years"); }
  function submitYear(data: YearForm) { if (yearMode === "edit" && editingYearId) updateYearMutation.mutate({ id: editingYearId, data }); else createYearMutation.mutate(data); }
  async function uploadLogo(event: React.ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file) return; try { const formData = new FormData(); formData.append("logo", file); await api.post("/settings/logo", formData, { headers: { "Content-Type": "multipart/form-data" } }); await queryClient.invalidateQueries({ queryKey: ["school"] }); setNotice("School logo updated successfully."); } catch (error) { setNotice(errorMessage(error)); } finally { event.target.value = ""; } }
  const busy = schoolMutation.isPending || createYearMutation.isPending || updateYearMutation.isPending || deleteYearMutation.isPending;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-slate-950 px-5 py-6 text-white sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200"><Building2 className="h-3.5 w-3.5" />Administration</div><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Settings & school configuration</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Keep the school profile and academic calendar authoritative for every workspace.</p></div>
          <div className="grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"><p className="text-xs text-slate-400">Academic years</p><p className="mt-1 text-xl font-semibold">{years.length}</p></div><div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"><p className="text-xs text-slate-400">Current session</p><p className="mt-1 text-xl font-semibold">{currentYear?.name || school.session || "—"}</p></div></div>
        </div>
      </section>
      {notice && <div className="rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-800" role="status">{notice}</div>}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="w-full justify-start overflow-x-auto"><TabsTrigger value="general"><Building2 className="mr-2 h-4 w-4" />School profile</TabsTrigger><TabsTrigger value="academic-years"><CalendarDays className="mr-2 h-4 w-4" />Academic years</TabsTrigger></TabsList>
        <TabsContent value="general">
          <Card><CardHeader><div><h2 className="text-lg font-semibold text-slate-900">School profile</h2><p className="mt-1 text-sm text-slate-500">These details appear across the school experience.</p></div></CardHeader><CardContent>
            {schoolQuery.isLoading ? <p role="status" className="text-sm text-slate-500">Loading school information…</p> : schoolQuery.isError ? <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700" role="alert">{errorMessage(schoolQuery.error)} <Button className="ml-3" size="sm" variant="outline" onClick={() => schoolQuery.refetch()}>Retry</Button></div> :
            <form onSubmit={schoolForm.handleSubmit((data) => schoolMutation.mutate(data))} className="space-y-6">
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4">{school.logo ? <img src={school.logo} alt="School logo" className="h-16 w-16 rounded-xl border border-slate-200 bg-white object-contain" /> : <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white text-slate-400"><Building2 className="h-7 w-7" /></div>}<div><p className="font-medium text-slate-900">School logo</p><p className="text-sm text-slate-500">PNG, JPG or other supported image format.</p></div></div><label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><ImageUp className="mr-2 h-4 w-4" />Upload logo<input type="file" accept="image/*" onChange={uploadLogo} className="sr-only" /></label></div></div>
              <div className="grid gap-4 md:grid-cols-2"><Input label="School name" {...schoolForm.register("name")} error={schoolForm.formState.errors.name?.message} /><Input label="Phone" type="tel" {...schoolForm.register("phone")} error={schoolForm.formState.errors.phone?.message} /><Input label="Email" type="email" {...schoolForm.register("email")} error={schoolForm.formState.errors.email?.message} /><Input label="Current session" {...schoolForm.register("session")} error={schoolForm.formState.errors.session?.message} /><Input label="Address" {...schoolForm.register("address")} error={schoolForm.formState.errors.address?.message} className="md:col-span-2" /></div>
              <div className="flex justify-end border-t border-slate-100 pt-4"><Button type="submit" disabled={schoolMutation.isPending}><Save className="mr-2 h-4 w-4" />{schoolMutation.isPending ? "Saving…" : "Save changes"}</Button></div>
              {schoolMutation.isError && <p className="text-sm text-red-600" role="alert">{errorMessage(schoolMutation.error)}</p>}
            </form>}
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="academic-years">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)]">
            <Card><CardHeader><div><h2 className="text-lg font-semibold text-slate-900">{yearMode === "edit" ? "Edit academic year" : "Add academic year"}</h2><p className="mt-1 text-sm text-slate-500">Define the dates used by academic workflows.</p></div></CardHeader><CardContent><form onSubmit={yearForm.handleSubmit(submitYear)} className="space-y-4"><Input label="Year name" placeholder="2026–27" {...yearForm.register("name")} error={yearForm.formState.errors.name?.message} /><Input label="Start date" type="date" {...yearForm.register("startDate")} error={yearForm.formState.errors.startDate?.message} /><Input label="End date" type="date" {...yearForm.register("endDate")} error={yearForm.formState.errors.endDate?.message} /><label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700"><input type="checkbox" {...yearForm.register("isCurrent")} className="h-4 w-4 rounded border-slate-300" />Set as current academic year</label><div className="flex gap-2 pt-2"><Button type="submit" disabled={busy}><Save className="mr-2 h-4 w-4" />{yearMode === "edit" ? "Update year" : "Create year"}</Button>{yearMode === "edit" && <Button type="button" variant="outline" onClick={resetYearForm}>Cancel</Button>}</div>{(createYearMutation.isError || updateYearMutation.isError) && <p className="text-sm text-red-600" role="alert">{errorMessage(createYearMutation.error || updateYearMutation.error)}</p>}</form></CardContent></Card>
            <Card><CardHeader><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-900">Academic calendar</h2><p className="mt-1 text-sm text-slate-500">{years.length} configured academic year{years.length === 1 ? "" : "s"}.</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => yearsQuery.refetch()} disabled={yearsQuery.isFetching}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button><Button size="sm" onClick={resetYearForm}><Plus className="mr-2 h-4 w-4" />Add</Button></div></div></CardHeader><CardContent className="p-0">{yearsQuery.isLoading ? <p role="status" className="p-6 text-sm text-slate-500">Loading academic years…</p> : yearsQuery.isError ? <div className="p-6 text-sm text-red-600" role="alert">{errorMessage(yearsQuery.error)}</div> : <Table data={years} keyExtractor={(year: any) => year._id} emptyMessage="No academic years configured yet." columns={[{ key: "name", header: "Academic year", render: (year: any) => <span className="font-medium text-slate-900">{year.name}</span> }, { key: "startDate", header: "Starts", render: (year: any) => formatDate(year.startDate) }, { key: "endDate", header: "Ends", render: (year: any) => formatDate(year.endDate) }, { key: "isCurrent", header: "Status", render: (year: any) => <Badge variant={year.isCurrent ? "success" : "default"}>{year.isCurrent ? "Current" : "Archived"}</Badge> }, { key: "actions", header: "Actions", render: (year: any) => <div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => editYear(year)}>Edit</Button><Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => { if (window.confirm(`Delete academic year ${year.name}?`)) deleteYearMutation.mutate(year._id); }} disabled={deleteYearMutation.isPending}><Trash2 className="mr-1 h-4 w-4" />Delete</Button></div> }]} />}</CardContent></Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
