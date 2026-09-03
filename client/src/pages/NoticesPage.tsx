import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Plus, Save } from "lucide-react";
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
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");
  const [audience, setAudience] = useState("school");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [publishAt, setPublishAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

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

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post("/notices", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      setCreateOpen(false); setTitle(""); setMessage(""); setPriority("normal"); setAudience("school"); setClassId(""); setSectionId(""); setPublishAt(""); setExpiresAt("");
    },
  });

  const createNotice = () => {
    if (!title || !message) return;
    const payload: any = { title, message, priority, audience };
    if (audience !== "school") payload.classId = classId;
    if (audience === "section") payload.sectionId = sectionId;
    if (publishAt) payload.publishAt = new Date(publishAt).toISOString();
    if (expiresAt) payload.expiresAt = new Date(expiresAt).toISOString();
    createMutation.mutate(payload);
  };

  const columns = [
    { key: "title", header: "Notice", render: (item: any) => <div><p className="font-medium text-gray-900">{item.title}</p><p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.message}</p></div> },
    { key: "priority", header: "Priority", render: (item: any) => <span className="capitalize">{item.priority}</span> },
    { key: "audience", header: "Audience", render: (item: any) => <span className="capitalize">{item.audience}</span> },
    { key: "publishAt", header: "Publishes", render: (item: any) => new Date(item.publishAt).toLocaleString() },
    { key: "expiresAt", header: "Expires", render: (item: any) => item.expiresAt ? new Date(item.expiresAt).toLocaleString() : "Never" },
  ];

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold text-gray-900">Notices</h1><p className="text-sm text-gray-500 mt-1">Publish school, class, and section announcements with scheduling.</p></div>
      {canWrite && <Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 mr-2" />Create Notice</Button>}
    </div>
    <Card><CardHeader><div className="flex items-center gap-2 text-sm text-gray-600"><Megaphone className="w-4 h-4" />Scheduled notices are hidden from recipients until their publication time.</div></CardHeader><CardContent><Table data={noticesData?.data || []} columns={columns} keyExtractor={(item: any) => item._id} emptyMessage="No notices found" /></CardContent></Card>
    <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Notice" size="lg">
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Parent meeting on Friday" />
          <Select label="Priority" value={priority} onChange={(event) => setPriority(event.target.value)}><option value="normal">Normal</option><option value="low">Low</option><option value="high">High</option><option value="urgent">Urgent</option></Select>
          <Select label="Audience" value={audience} onChange={(event) => { setAudience(event.target.value); setClassId(""); setSectionId(""); }}><option value="school">Entire School</option><option value="class">Class</option><option value="section">Section</option></Select>
          {audience !== "school" && <Select label="Class" value={classId} onChange={(event) => { setClassId(event.target.value); setSectionId(""); }}><option value="">Select class</option>{classes?.data?.map((item: any) => <option key={item._id} value={item._id}>{item.displayName}</option>)}</Select>}
          {audience === "section" && <Select label="Section" value={sectionId} onChange={(event) => setSectionId(event.target.value)} disabled={!classId}><option value="">Select section</option>{sections?.data?.map((item: any) => <option key={item._id} value={item._id}>{item.name}</option>)}</Select>}
          <Input label="Publish At (optional)" type="datetime-local" value={publishAt} onChange={(event) => setPublishAt(event.target.value)} />
          <Input label="Expires At (optional)" type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
        </div>
        <Input label="Message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write the announcement..." />
        <div className="flex justify-end gap-2 border-t pt-4"><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={createNotice} disabled={createMutation.isPending || !title || !message}><Save className="w-4 h-4 mr-2" />{createMutation.isPending ? "Publishing..." : "Create Notice"}</Button></div>
      </div>
    </Modal>
  </div>;
}
