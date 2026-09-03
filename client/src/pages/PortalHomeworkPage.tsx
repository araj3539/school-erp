import { useQuery } from "@tanstack/react-query";
import { BookOpen, Download, Paperclip } from "lucide-react";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import api from "../lib/api";
import { useAuth } from "../hooks";

export default function PortalHomeworkPage() {
  const { user } = useAuth();
  const isParent = user?.role === "parent";
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["portal", "homework", user?.role],
    queryFn: async () => (await api.get("/homework?page=1&limit=50")).data,
    enabled: Boolean(user),
  });
  const homework = data?.data ?? [];

  const openAttachment = async (homeworkId: string, attachmentId: string) => {
    const response = await api.get(`/homework/${homeworkId}/attachments/${attachmentId}/url`);
    window.open(response.data.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">{isParent ? "Family" : "Learning"}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Homework</h1>
        <p className="mt-1 text-sm text-slate-500">{isParent ? "Homework currently assigned to your linked children." : "Homework currently assigned to your class."}</p>
      </header>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary-600" aria-hidden="true" />
            <h2 className="text-base font-semibold text-slate-900">Assignments</h2>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="py-10 text-center text-sm text-slate-500">Loading homework...</p> : isError ? (
            <div className="py-10 text-center"><p className="text-sm font-medium text-red-600">Unable to load homework.</p><Button variant="outline" className="mt-3" onClick={() => refetch()}>Try again</Button></div>
          ) : homework.length === 0 ? (
            <div className="py-10 text-center"><BookOpen className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" /><p className="mt-3 font-medium text-slate-800">No homework right now</p><p className="mt-1 text-sm text-slate-500">New assignments will appear here when they are published.</p></div>
          ) : (
            <div className="space-y-3">
              {homework.map((item: any) => <article key={item._id} className="rounded-xl border border-slate-200 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">{item.subjectId?.name || "Subject"} · {item.classId?.displayName || "Class"}{item.sectionId?.name ? ` · ${item.sectionId.name}` : " · All sections"}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">Due {formatDate(item.dueDate)}</span>
                </div>
                {item.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.description}</p>}
                {(item.attachments ?? []).length > 0 && <div className="mt-4 flex flex-wrap gap-2" aria-label="Homework attachments">{item.attachments.map((file: any) => <Button key={file._id} variant="secondary" onClick={() => openAttachment(item._id, file._id)} title={`Open ${file.name}`}><Paperclip className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />{file.name}<Download className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" /></Button>)}</div>}
              </article>)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}
