import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, BrainCircuit, CheckCircle2, DollarSign, GraduationCap, RefreshCw, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import api from "../lib/api";
import { formatCurrency } from "../utils";

const ranges = [7, 30, 90] as const;

type Range = typeof ranges[number];

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>(30);
  const overview = useQuery({ queryKey: ["analytics", "overview", range], queryFn: async () => (await api.get(`/analytics/overview?range=${range}`)).data });
  const aiStatus = useQuery({ queryKey: ["analytics", "ai", "status"], queryFn: async () => (await api.get("/analytics/ai/status")).data });
  const insights = useQuery({ queryKey: ["analytics", "ai", "insights", range], queryFn: async () => (await api.get(`/analytics/ai/insights?range=${range}`)).data, enabled: false });
  const data = overview.data;
  const snapshot = data?.snapshot;
  const quality = data?.dataQuality;
  const qualityIssues = (quality?.activeStudentsMissingClass ?? 0) + (quality?.activeStudentsMissingSection ?? 0) + (quality?.attendanceRecordsWithDuplicateStudents ?? 0);
  const qualityLabel = qualityIssues === 0 ? "Checks clean" : `${qualityIssues} items to review`;
  const collectionTrend = useMemo(() => data?.trends?.map((item: any) => ({ ...item, label: item.date.slice(5) })) ?? [], [data?.trends]);
  const feeStatus = useMemo(() => data?.feeStatus?.map((item: any) => ({ ...item, label: item.status.replace(/_/g, " ") })) ?? [], [data?.feeStatus]);

  const runInsights = async () => { await insights.refetch(); };

  return (
    <div className="space-y-6 lg:space-y-8">
      <header className="rounded-3xl border border-slate-200/80 bg-white px-5 py-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:px-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-primary-600"><Activity className="h-3.5 w-3.5" aria-hidden="true" />Decision support</div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.035em] text-slate-950 sm:text-3xl">Analytics</h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">Trusted operational signals for attendance, collections, school growth, and data quality. Analytics never changes academic or financial records.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Analytics range">
            {ranges.map((value) => <button key={value} type="button" onClick={() => setRange(value)} className={`min-h-10 rounded-xl px-4 text-xs font-bold transition ${range === value ? "bg-primary-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>{value}d</button>)}
            <button type="button" onClick={() => overview.refetch()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 hover:bg-slate-50"><RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />Refresh</button>
          </div>
        </div>
      </header>

      {overview.isError ? <Card><CardContent className="p-8 text-center"><AlertTriangle className="mx-auto h-6 w-6 text-amber-500" aria-hidden="true" /><p className="mt-3 text-sm font-semibold text-slate-800">Analytics could not be loaded.</p><button type="button" onClick={() => overview.refetch()} className="mt-4 rounded-xl bg-primary-600 px-4 py-2.5 text-xs font-bold text-white">Try again</button></CardContent></Card> : (
        <>
          <section aria-label="Analytics snapshot" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric title="Active students" value={snapshot?.activeStudents ?? 0} icon={<Users className="h-5 w-5" />} loading={overview.isLoading} />
            <Metric title="Attendance rate" value={`${snapshot?.attendanceRate ?? 0}%`} icon={<GraduationCap className="h-5 w-5" />} loading={overview.isLoading} />
            <Metric title="Collection" value={formatCurrency(snapshot?.collection ?? 0)} icon={<DollarSign className="h-5 w-5" />} loading={overview.isLoading} />
            <Metric title="Outstanding" value={formatCurrency(snapshot?.feeOutstanding ?? 0)} icon={<AlertTriangle className="h-5 w-5" />} loading={overview.isLoading} />
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader><h2 className="text-sm font-bold text-slate-900">Attendance trend</h2><p className="mt-1 text-xs text-slate-500">Daily rate for the selected window</p></CardHeader>
              <CardContent><div className="h-72">{overview.isLoading ? <Placeholder /> : <ResponsiveContainer width="100%" height="100%"><LineChart data={collectionTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}><CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} minTickGap={18} /><YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} /><Tooltip /><Line type="monotone" dataKey="attendanceRate" stroke="var(--chart-primary)" strokeWidth={3} dot={false} /></LineChart></ResponsiveContainer>}</div></CardContent>
            </Card>
            <Card>
              <CardHeader><h2 className="text-sm font-bold text-slate-900">Daily collections</h2><p className="mt-1 text-xs text-slate-500">Collected payment value by day</p></CardHeader>
              <CardContent><div className="h-72">{overview.isLoading ? <Placeholder /> : <ResponsiveContainer width="100%" height="100%"><BarChart data={collectionTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}><CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} minTickGap={18} /><YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [formatCurrency(Number(value)), "Collection"]} /><Bar dataKey="collection" fill="var(--chart-success)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>}</div></CardContent>
            </Card>
          </section>

          <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader><div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-bold text-slate-900">Data quality</h2><p className="mt-1 text-xs text-slate-500">Safe aggregate checks before relying on trends</p></div><Badge variant={qualityIssues === 0 ? "success" : "warning"}>{qualityLabel}</Badge></div></CardHeader>
              <CardContent><div className="grid gap-3 sm:grid-cols-3"><QualityItem label="Students without class" value={quality?.activeStudentsMissingClass ?? 0} /><QualityItem label="Students without section" value={quality?.activeStudentsMissingSection ?? 0} /><QualityItem label="Attendance duplicates" value={quality?.attendanceRecordsWithDuplicateStudents ?? 0} /></div></CardContent>
            </Card>
            <Card>
              <CardHeader><h2 className="text-sm font-bold text-slate-900">Fee status</h2><p className="mt-1 text-xs text-slate-500">Current academic-year balance exposure</p></CardHeader>
              <CardContent><div className="space-y-3">{feeStatus.length === 0 ? <Placeholder /> : feeStatus.map((item: any) => <div key={item.status} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5"><span className="text-sm font-semibold capitalize text-slate-700">{item.label}</span><span className="text-xs font-bold tabular-nums text-slate-600">{item.count} · {formatCurrency(item.outstanding)}</span></div>)}</div></CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-primary-600" aria-hidden="true" /><h2 className="text-sm font-bold text-slate-900">AI-assisted review</h2></div><p className="mt-1 text-xs text-slate-500">Optional, non-authoritative suggestions based only on aggregate analytics.</p></div><button type="button" onClick={runInsights} disabled={insights.isFetching || !aiStatus.data?.enabled} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 text-xs font-bold text-white disabled:pointer-events-none disabled:opacity-50"><BrainCircuit className="h-3.5 w-3.5" aria-hidden="true" />{insights.isFetching ? "Reviewing..." : "Review signals"}</button></div></CardHeader>
            <CardContent>{!aiStatus.data?.enabled ? <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-sm text-slate-500">AI assistance is disabled for this environment. Deterministic analytics remain available.</div> : insights.data?.insights?.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{insights.data.insights.map((item: any) => <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><h3 className="text-sm font-bold text-slate-900">{item.title}</h3><Badge variant="secondary">{item.confidence}</Badge></div><p className="mt-2 text-xs leading-5 text-slate-600">{item.summary}</p><ul className="mt-3 space-y-1.5">{item.actions.map((action: string) => <li key={action} className="flex gap-2 text-xs leading-5 text-slate-600"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />{action}</li>)}</ul><p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.11em] text-slate-400">Sources: {item.sources.join(", ")}</p></div>)}</div> : <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5 text-sm text-slate-500">AI review is opt-in. Run it after selecting the analytics window you want to discuss.</div>}</CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Metric({ title, value, icon, loading }: { title: string; value: string | number; icon: React.ReactNode; loading: boolean }) {
  return <Card><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{title}</p>{loading ? <div className="mt-3 h-8 w-24 animate-pulse rounded-lg bg-slate-200" aria-hidden="true" /> : <p className="mt-2 text-2xl font-extrabold tracking-[-0.03em] text-slate-950">{value}</p>}</div><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700" aria-hidden="true">{icon}</div></div></CardContent></Card>;
}

function QualityItem({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-2 text-xl font-extrabold text-slate-900">{value}</p></div>; }
function Placeholder() { return <div className="h-full min-h-52 animate-pulse rounded-xl bg-slate-100" aria-hidden="true" />; }
