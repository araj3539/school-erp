import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Plus, Save, Search, Sparkles, X } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Card, CardContent, CardHeader } from "../components/ui/Card";
import { Table } from "../components/ui/Table";
import { Modal } from "../components/ui/Modal";
import api from "../lib/api";
import { useAuth } from "../hooks";

export default function NoticesPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("notices:write");
  const [createOpen, setCreateOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");
  const [audience, setAudience] = useState("school");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [publishAt, setPublishAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [category, setCategory] = useState("announcement");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [audienceFilter, setAudienceFilter] = useState("all");

  const { data: classes } = useQuery({
    queryKey: ["classes", "notices"], enabled: canWrite,
    queryFn: async () => (await api.get("/academics/classes?limit=100")).data,
  });
  const { data: sections } = useQuery({
    queryKey: ["sections", "notices", classId], enabled: canWrite && !!classId && audience === "section",
    queryFn: async () => (await api.get(`/academics/sections?classId=${classId}`)).data,
  });
  const { data: noticesData } = useQuery({
    queryKey: ["notices"],
    queryFn: async () => (await api.get("/notices?limit=100&includeUnpublished=true")).data,
  });
  const { data: templatesData } = useQuery({
    queryKey: ["notification-templates"], enabled: canWrite,
    queryFn: async () => (await api.get("/notifications/templates")).data,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post("/notices", payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["notices"] }); resetComposer(); },
  });
  const templateMutation = useMutation({
    mutationFn: (payload: any) => api.put("/notifications/templates", payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["notification-templates"] }); setTemplateOpen(false); setTemplateName(""); },
  });

  const resetComposer = () => {
    setCreateOpen(false); setTitle(""); setMessage(""); setPriority("normal"); setAudience("school");
    setClassId(""); setSectionId(""); setPublishAt(""); setExpiresAt(""); setCategory("announcement");
  };
  const createNotice = () => {
    if (!title.trim() || !message.trim() || (audience !== "school" && !classId) || (audience === "section" && !sectionId)) return;
    const payload: any = { title: title.trim(), message: message.trim(), priority, audience };
    if (audience !== "school") payload.classId = classId;
    if (audience === "section") payload.sectionId = sectionId;
    if (publishAt) payload.publishAt = new Date(publishAt).toISOString();
    if (expiresAt) payload.expiresAt = new Date(expiresAt).toISOString();
    createMutation.mutate(payload);
  };
  const applyTemplate = (id: string) => {
    const template = (templatesData?.templates || []).find((item: any) => item._id === id);
    if (!template) return;
    setTitle(template.subject || template.name);
    setMessage(template.body);
    setCategory(template.category || "announcement");
  };
  const saveTemplate = () => {
    if (!templateName.trim() || !message.trim()) return;
    templateMutation.mutate({ name: templateName.trim(), category, subject: title.trim() || undefined, body: message.trim(), channels: ["in_app"] });
  };

  const notices = useMemo(() => (noticesData?.data || []).filter((item: any) => {
    const haystack = `${item.title} ${item.message}`.toLowerCase();
    return (!search.trim() || haystack.includes(search.toLowerCase()))
      && (priorityFilter === "all" || item.priority === priorityFilter)
      && (audienceFilter === "all" || item.audience === audienceFilter);
  }), [noticesData?.data, search, priorityFilter, audienceFilter]);

  const columns = [
    { key: "title", header: "Message", render: (item: any) => <div><p className="font-medium text-gray-900">{item.title}</p><p className="mt-1 line-clamp-2 text-xs text-gray-500">{item.message}</p></div> },
    { key: "priority", header: "Priority", render: (item: any) => <span className="capitalize">{item.priority}</span> },
    { key: "audience", header: "Audience", render: (item: any) => <span className="capitalize">{item.audience}</span> },
    { key: "publishAt", header: "Publishes", render: (item: any) => new Date(item.publishAt).toLocaleString() },
    { key: "expiresAt", header: "Expires", render: (item: any) => item.expiresAt ? new Date(item.expiresAt).toLocaleString() : "Never" },
  ];

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><div className="flex items-center gap-2"><Megaphone className="h-6 w-6" /><h1 className="text-2xl font-bold text-gray-900">Communication Center</h1></div><p className="mt-1 text-sm text-gray-500">Create targeted school communications, reuse approved templates, and schedule announcements.</p></div>
      {canWrite && <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />New communication</Button>}
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      <Card><CardContent><p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total scheduled</p><p className="mt-2 text-2xl font-semibold">{noticesData?.data?.length ?? 0}</p></CardContent></Card>
      <Card><CardContent><p className="text-xs font-medium uppercase tracking-wide text-gray-500">Reusable templates</p><p className="mt-2 text-2xl font-semibold">{templatesData?.templates?.length ?? 0}</p></CardContent></Card>
      <Card><CardContent><p className="text-xs font-medium uppercase tracking-wide text-gray-500">Visible after publish</p><p className="mt-2 text-sm font-medium text-gray-700">In-app delivery follows recipient permissions and notification preferences.</p></CardContent></Card>
    </div>
    <Card><CardHeader><div className="flex flex-wrap items-center gap-3"><div className="relative min-w-[220px] flex-1"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" /><Input aria-label="Search communications" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search messages..." className="pl-9" /></div><Select aria-label="Filter by priority" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}><option value="all">All priorities</option><option value="urgent">Urgent</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></Select><Select aria-label="Filter by audience" value={audienceFilter} onChange={(event) => setAudienceFilter(event.target.value)}><option value="all">All audiences</option><option value="school">School</option><option value="class">Class</option><option value="section">Section</option></Select>{(search || priorityFilter !== "all" || audienceFilter !== "all") && <Button variant="secondary" onClick={() => { setSearch(""); setPriorityFilter("all"); setAudienceFilter("all"); }}><X className="mr-1 h-4 w-4" />Clear</Button>}</div></CardHeader><CardContent><Table data={notices} columns={columns} keyExtractor={(item: any) => item._id} emptyMessage="No communications match these filters" /></CardContent></Card>
    <Modal isOpen={createOpen} onClose={resetComposer} title="New communication" size="lg">
      <div className="space-y-4">
        <div className="rounded-lg border border-dashed p-3"><div className="mb-2 flex items-center gap-2 text-sm font-medium"><Sparkles className="h-4 w-4" />Use a saved template</div><Select label="Template" value="" onChange={(event) => applyTemplate(event.target.value)}><option value="">Choose a template...</option>{(templatesData?.templates || []).map((item: any) => <option key={item._id} value={item._id}>{item.name} · {item.category}</option>)}</Select></div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Parent meeting on Friday" />
          <Select label="Category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="announcement">Announcement</option><option value="attendance">Attendance</option><option value="homework">Homework</option><option value="result">Result</option><option value="fee">Fee</option></Select>
          <Select label="Priority" value={priority} onChange={(event) => setPriority(event.target.value)}><option value="normal">Normal</option><option value="low">Low</option><option value="high">High</option><option value="urgent">Urgent</option></Select>
          <Select label="Audience" value={audience} onChange={(event) => { setAudience(event.target.value); setClassId(""); setSectionId(""); }}><option value="school">Entire school</option><option value="class">Class</option><option value="section">Section</option></Select>
          {audience !== "school" && <Select label="Class" value={classId} onChange={(event) => { setClassId(event.target.value); setSectionId(""); }}><option value="">Select class</option>{classes?.data?.map((item: any) => <option key={item._id} value={item._id}>{item.displayName}</option>)}</Select>}
          {audience === "section" && <Select label="Section" value={sectionId} onChange={(event) => setSectionId(event.target.value)} disabled={!classId}><option value="">Select section</option>{sections?.data?.map((item: any) => <option key={item._id} value={item._id}>{item.name}</option>)}</Select>}
          <Input label="Publish At (optional)" type="datetime-local" value={publishAt} onChange={(event) => setPublishAt(event.target.value)} />
          <Input label="Expires At (optional)" type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
        </div>
        <Input label="Message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write the announcement..." />
        <div className="flex flex-wrap justify-between gap-2 border-t pt-4"><Button variant="secondary" onClick={() => setTemplateOpen(true)} disabled={!message.trim()}>Save as template</Button><div className="flex gap-2"><Button variant="secondary" onClick={resetComposer}>Cancel</Button><Button onClick={createNotice} disabled={createMutation.isPending || !title.trim() || !message.trim() || (audience !== "school" && !classId) || (audience === "section" && !sectionId)}><Save className="mr-2 h-4 w-4" />{createMutation.isPending ? "Publishing..." : publishAt ? "Schedule communication" : "Publish communication"}</Button></div></div>
      </div>
    </Modal>
    <Modal isOpen={templateOpen} onClose={() => setTemplateOpen(false)} title="Save communication template" size="md"><div className="space-y-4"><Input label="Template name" value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder="Monthly attendance reminder" /><Select label="Category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="announcement">Announcement</option><option value="attendance">Attendance</option><option value="homework">Homework</option><option value="result">Result</option><option value="fee">Fee</option></Select><p className="text-sm text-gray-500">Only the reusable title/body are stored. Existing communications are never changed.</p><div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setTemplateOpen(false)}>Cancel</Button><Button onClick={saveTemplate} disabled={templateMutation.isPending || !templateName.trim() || !message.trim()}>{templateMutation.isPending ? "Saving..." : "Save template"}</Button></div></div></Modal>
  </div>;
}
