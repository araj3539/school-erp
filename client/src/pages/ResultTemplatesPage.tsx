import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Card } from "../components/ui/Card";
import { Table } from "../components/ui/Table";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import { Plus, Trash2, Edit3, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "../lib/api";

type TemplateType = "report_card" | "mark_sheet" | "transcript" | "progress_report";

const templateTypeLabels: Record<TemplateType, string> = {
  report_card: "Report Card",
  mark_sheet: "Mark Sheet",
  transcript: "Transcript",
  progress_report: "Progress Report",
};

const templateTypeBadgeVariant: Record<TemplateType, BadgeVariant> = {
  report_card: "info",
  mark_sheet: "success",
  transcript: "warning",
  progress_report: "default",
};

type BadgeVariant = "success" | "warning" | "danger" | "info" | "default" | "secondary";

const templateSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(["report_card", "mark_sheet", "transcript", "progress_report"]),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  showHeader: z.boolean().default(true),
  showStudentInfo: z.boolean().default(true),
  showRank: z.boolean().default(false),
  showPercentage: z.boolean().default(true),
  showGrade: z.boolean().default(true),
  showRemarks: z.boolean().default(false),
  showAttendance: z.boolean().default(false),
});

export default function ResultTemplatesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [setDefaultId, setSetDefaultId] = useState<string | null>(null);

  const templatesQuery = useQuery({
    queryKey: ["result-templates", search],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "100", search });
      return (await api.get(`/result-templates?${params}`)).data;
    },
  });

  const templates = templatesQuery.data?.data || [];

  const filteredTemplates = templates.filter((t: any) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const columns: any[] = [
    { key: "name", header: "Name", render: (t: any) => <div className="font-medium text-slate-900">{t.name}</div> },
    { key: "type", header: "Type", render: (t: any) => <Badge variant={templateTypeBadgeVariant[t.type as TemplateType] || "default"}>{templateTypeLabels[t.type as TemplateType] || t.type}</Badge> },
    { key: "description", header: "Description", render: (t: any) => <p className="text-sm text-slate-500">{t.description ?? "—"}</p> },
    { key: "isDefault", header: "Default", render: (t: any) => (t.isDefault ? <CheckCircle2 className="h-4 w-4 text-primary-600" /> : <Button size="sm" variant="outline" onClick={() => setSetDefaultId(t._id)}>Set Default</Button>) },
    { key: "isActive", header: "Active", render: (t: any) => <Badge variant={t.isActive ? "success" : "secondary"}>{t.isActive ? "Active" : "Archived"}</Badge> },
    { key: "actions", header: "Actions", render: (t: any) => <div className="flex flex-wrap gap-2"><Button size="sm" variant="ghost" onClick={() => openEdit(t)}><Edit3 className="h-4 w-4" /></Button>{t.isDefault ? null : <Button size="sm" variant="danger" onClick={() => setDeleteId(t._id)}><Trash2 className="h-4 w-4" /></Button>}</div> },
  ];

  const form = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "report_card",
      isDefault: false,
      isActive: true,
      showHeader: true,
      showStudentInfo: true,
      showRank: false,
      showPercentage: true,
      showGrade: true,
      showRemarks: false,
      showAttendance: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof templateSchema>) => {
      const res = await api.post("/result-templates", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["result-templates"] });
      form.reset();
      setIsModalOpen(false);
      setEditingId(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof templateSchema> }) => {
      const res = await api.patch(`/result-templates/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["result-templates"] });
      form.reset();
      setIsModalOpen(false);
      setEditingId(null);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/result-templates/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["result-templates"] });
      setDeleteId(null);
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/result-templates/${id}/set-default`, { isDefault: true });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["result-templates"] });
      setSetDefaultId(null);
    },
  });

  const isEditing = !!editingId;
  const onSubmit = (data: z.infer<typeof templateSchema>) => {
    if (isEditing && editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openCreate = () => { setEditingId(null); form.reset(); setIsModalOpen(true); };
  const openEdit = (t: any) => {
    setEditingId(t._id);
    form.reset({
      ...t,
      showHeader: t.layout?.showHeader ?? true,
      showStudentInfo: t.layout?.showStudentInfo ?? true,
      showRank: t.layout?.showRank ?? false,
      showPercentage: t.layout?.showPercentage ?? true,
      showGrade: t.layout?.showGrade ?? true,
      showRemarks: t.layout?.showRemarks ?? false,
      showAttendance: t.layout?.showAttendance ?? false,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-600">Result Templates</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Result Templates</h1>
          <p className="mt-1 text-sm text-slate-500">Manage reusable report card, mark sheet, transcript, and progress report templates.</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />New Template</Button>
      </header>

      <Card className="p-4">
        <Input placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <Table data={filteredTemplates} columns={columns} keyExtractor={(t: any) => t._id} emptyMessage="No result templates found" />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); form.reset(); setEditingId(null); }}
        title={isEditing ? "Edit Template" : "Create Template"}
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Template Name" placeholder="e.g. Annual Report Card" {...form.register("name")} />
            <Select label="Template Type" {...form.register("type") as any}>
              <option value="report_card">Report Card</option>
              <option value="mark_sheet">Mark Sheet</option>
              <option value="transcript">Transcript</option>
              <option value="progress_report">Progress Report</option>
            </Select>
          </div>
          <Input label="Description" placeholder="e.g. Standard CBSE report card layout" {...form.register("description")} />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input id="isDefault" type="checkbox" checked={form.watch("isDefault")} onChange={() => form.setValue("isDefault", !form.watch("isDefault"))} />
              <label htmlFor="isDefault" className="text-sm text-slate-700">Set as default template</label>
            </div>
            <div className="flex items-center gap-2">
              <input id="isActive" type="checkbox" checked={form.watch("isActive")} onChange={() => form.setValue("isActive", !form.watch("isActive"))} />
              <label htmlFor="isActive" className="text-sm text-slate-700">Active</label>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Layout Options</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <input id="showHeader" type="checkbox" checked={form.watch("showHeader")} onChange={() => form.setValue("showHeader", !form.watch("showHeader"))} />
                <label htmlFor="showHeader" className="text-sm text-slate-700">Show Header</label>
              </div>
              <div className="flex items-center gap-2">
                <input id="showStudentInfo" type="checkbox" checked={form.watch("showStudentInfo")} onChange={() => form.setValue("showStudentInfo", !form.watch("showStudentInfo"))} />
                <label htmlFor="showStudentInfo" className="text-sm text-slate-700">Show Student Info</label>
              </div>
              <div className="flex items-center gap-2">
                <input id="showRank" type="checkbox" checked={form.watch("showRank")} onChange={() => form.setValue("showRank", !form.watch("showRank"))} />
                <label htmlFor="showRank" className="text-sm text-slate-700">Show Rank</label>
              </div>
              <div className="flex items-center gap-2">
                <input id="showPercentage" type="checkbox" checked={form.watch("showPercentage")} onChange={() => form.setValue("showPercentage", !form.watch("showPercentage"))} />
                <label htmlFor="showPercentage" className="text-sm text-slate-700">Show Percentage</label>
              </div>
              <div className="flex items-center gap-2">
                <input id="showGrade" type="checkbox" checked={form.watch("showGrade")} onChange={() => form.setValue("showGrade", !form.watch("showGrade"))} />
                <label htmlFor="showGrade" className="text-sm text-slate-700">Show Grade</label>
              </div>
              <div className="flex items-center gap-2">
                <input id="showRemarks" type="checkbox" checked={form.watch("showRemarks")} onChange={() => form.setValue("showRemarks", !form.watch("showRemarks"))} />
                <label htmlFor="showRemarks" className="text-sm text-slate-700">Show Remarks</label>
              </div>
              <div className="flex items-center gap-2">
                <input id="showAttendance" type="checkbox" checked={form.watch("showAttendance")} onChange={() => form.setValue("showAttendance", !form.watch("showAttendance"))} />
                <label htmlFor="showAttendance" className="text-sm text-slate-700">Show Attendance</label>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); form.reset(); setEditingId(null); }}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{createMutation.isPending || updateMutation.isPending ? "Saving…" : isEditing ? "Update Template" : "Create Template"}</Button>
          </div>
        </form>
      </Modal>

      {deleteId && (
        <Modal isOpen={true} onClose={() => setDeleteId(null)} title="Archive Template">
          <form onSubmit={(e) => { e.preventDefault(); archiveMutation.mutate(deleteId); }} className="space-y-6">
            <p className="text-sm text-slate-600">Are you sure you want to archive this template? Archived templates cannot be used for new results.</p>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
              <Button type="submit" variant="danger" disabled={archiveMutation.isPending}>{archiveMutation.isPending ? "Archiving…" : "Archive"}</Button>
            </div>
          </form>
        </Modal>
      )}

      {setDefaultId && (
        <Modal isOpen={true} onClose={() => setSetDefaultId(null)} title="Set Default Template">
          <form onSubmit={(e) => { e.preventDefault(); setDefaultMutation.mutate(setDefaultId); }} className="space-y-6">
            <p className="text-sm text-slate-600">This template will become the default for new results. The previous default will be unset.</p>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setSetDefaultId(null)}>Cancel</Button>
              <Button type="submit" disabled={setDefaultMutation.isPending}>{setDefaultMutation.isPending ? "Updating…" : "Set Default"}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
